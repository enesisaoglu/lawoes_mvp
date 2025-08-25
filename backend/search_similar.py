from fastapi import FastAPI, UploadFile, File
from sentence_transformers import SentenceTransformer, util
import pandas as pd
import numpy as np
import os
import pytesseract
from PIL import Image
import io
import fitz  # PyMuPDF, PDF desteği için

app = FastAPI()

# Model ve verileri yükle (başlatmada bir kez)
try:
    model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
    input_path = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed/cleaned_cases.csv'
    embeddings_path = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed/case_embeddings.npy'

    if not os.path.exists(input_path) or not os.path.exists(embeddings_path):
        raise FileNotFoundError("Gerekli veri dosyaları bulunamadı.")

    df = pd.read_csv(input_path, encoding='utf-8')
    print("DataFrame columns:", df.columns.tolist())  # Sütun isimlerini yazdır
    embeddings = np.load(embeddings_path)

    if len(df) != embeddings.shape[0]:
        raise ValueError("DataFrame ve embedding boyutları uyuşmuyor.")
    print("API başlatıldı, veri ve model yüklendi. Row count:", len(df), "Embeddings shape:", embeddings.shape)
except Exception as e:
    print(f"Hata: {str(e)}")
    raise

@app.post("/search_case")
async def search_case(query: str):
    try:
        query_embedding = model.encode(query, convert_to_numpy=True)
        similarities = util.cos_sim(query_embedding, embeddings)
        top_k = min(3, len(df), len(similarities[0]))
        if top_k == 0:
            return {"error": "Hiçbir veri bulunamadı."}
        sorted_indices = similarities[0].argsort().numpy()
        top_indices = sorted_indices[-top_k:][::-1]
        results = []
        for idx in top_indices:
            results.append({
                "soru": str(df.iloc[idx]["soru"]) if "soru" in df.columns else "N/A",
                "context": str(df.iloc[idx]["context"]) if "context" in df.columns else "N/A",
                "similarity": float(similarities[0][idx])
            })
        return {"results": results}
    except Exception as e:
        return {"error": f"Arama işlemi başarısız: {str(e)}"}

@app.post("/ocr_upload")
async def ocr_upload(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_extension = os.path.splitext(file.filename)[1].lower()

        if file_extension in ['.jpg', '.jpeg', '.png']:
            image = Image.open(io.BytesIO(contents))
            text = pytesseract.image_to_string(image, lang='tur', config='--psm 6')
        elif file_extension == '.pdf':
            pdf_document = fitz.open(stream=io.BytesIO(contents), filetype="pdf")
            text = ""
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                text += page.get_text()
        else:
            return {"error": "Desteklenmeyen dosya formatı. Lütfen JPG, PNG veya PDF yükleyin."}

        text = text.strip()
        return {"filename": file.filename, "extracted_text": text if text else "Metin çıkarılamadı."}
    except Exception as e:
        return {"error": f"OCR işlemi başarısız: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)