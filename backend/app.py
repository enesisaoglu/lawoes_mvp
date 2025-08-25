# C:/Users/enesi/Desktop/lawoes/backend/App.py
# --- ÖNEMLİ DÜZELTME ---

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import pandas as pd
import numpy as np
import os
import pytesseract
from PIL import Image
import io
import fitz

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchQuery(BaseModel):
    query: str

# --- Model ve Veri Yükleme ---
try:
    model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    input_path = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed/cleaned_cases.csv'
    embeddings_path = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed/case_embeddings.npy'
    df = pd.read_csv(input_path, encoding='utf-8')
    embeddings = np.load(embeddings_path)
    print("API başlatıldı, veri ve model yüklendi.")
except Exception as e:
    print(f"Hata: {str(e)}")
    raise

def perform_search(query_text: str):
    if not query_text or not query_text.strip():
        raise HTTPException(status_code=422, detail="Arama metni boş olamaz.")
    
    query_embedding = model.encode(query_text, convert_to_numpy=True)
    similarities = util.cos_sim(query_embedding, embeddings)
    top_k = min(3, len(df))
    
    if top_k == 0:
        return {"error": "Veritabanında hiç kayıt bulunamadı."}

    # Benzerlik skorlarına göre en iyi k indeksi al
    top_indices = np.argsort(-similarities[0])[:top_k]
    
    results = []
    for idx in top_indices:
        # --- HATA DÜZELTMESİ BURADA ---
        # idx'i standart Python int'e çevirerek "non-integer key" hatasını önlüyoruz.
        row_index = int(idx) 
        
        results.append({
            "soru": str(df.iloc[row_index].get("soru", "N/A")),
            "context": str(df.iloc[row_index].get("context", "N/A")),
            "similarity": float(similarities[0][row_index])
        })
    return {"results": results}

@app.post("/search_case")
async def search_case(search_query: SearchQuery):
    try:
        return perform_search(search_query.query)
    except Exception as e:
        return {"error": f"Metin arama işlemi başarısız: {str(e)}"}

@app.post("/search_document")
async def search_document(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        text = ""
        if file_extension in ['.jpg', '.jpeg', '.png']:
            image = Image.open(io.BytesIO(contents))
            text = pytesseract.image_to_string(image, lang='tur')
        elif file_extension == '.pdf':
            pdf_document = fitz.open(stream=io.BytesIO(contents), filetype="pdf")
            for page in pdf_document:
                text += page.get_text()
        else:
            raise HTTPException(status_code=400, detail="Desteklenmeyen dosya formatı.")
        
        text = text.strip()
        if not text:
            return {"error": "Dosyadan metin çıkarılamadı."}

        return perform_search(text)
    except Exception as e:
        return {"error": f"Dosya işleme ve arama işlemi başarısız: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)