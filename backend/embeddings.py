import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
import os

# Modeli yükle (çok dilli, Türkçe destekli)
model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

# Dosya yolları
input_path = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed/cleaned_cases.csv'
output_dir = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed'
embeddings_path = os.path.join(output_dir, 'case_embeddings.npy')

# Gerekli klasörü oluştur
os.makedirs(output_dir, exist_ok=True)

# Veri yükle
df = pd.read_csv(input_path)

# Embedding çıkar (context sütununu kullan; soru veya cevap da kullanılabilir)
texts = df['context'].tolist()  # Veya 'soru' ya da 'cevap' deneyebilirsin
embeddings = model.encode(texts, convert_to_numpy=True)

# Embedding'leri kaydet (numpy array olarak)
np.save(embeddings_path, embeddings)
print(f"Embedding'ler '{embeddings_path}' dosyasına kaydedildi!")