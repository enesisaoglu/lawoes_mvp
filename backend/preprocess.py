import pandas as pd
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import os

# NLTK indirmeleri (ilk seferde çalıştır)
nltk.download('punkt')
nltk.download('stopwords')

# Türkçe stopwords
stop_words = set(stopwords.words('turkish'))

# Dosya yolları
input_path = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed/cases.csv'
output_dir = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed'
output_path = os.path.join(output_dir, 'cleaned_cases.csv')

# Gerekli klasörü oluştur
os.makedirs(output_dir, exist_ok=True)

# CSV yükle
df = pd.read_csv(input_path)

def preprocess_text(text):
    if pd.isna(text):  # Boş değerler için kontrol
        return ""
    # Lowercasing
    text = text.lower()
    # Tokenizasyon ve stopwords temizleme
    words = word_tokenize(text)
    words = [word for word in words if word.isalnum() and word not in stop_words]  # Sadece alfanümerik kelimeler
    # Temizlenmiş metni birleştir
    cleaned_text = ' '.join(words)
    return cleaned_text

# Tüm sütunları temizle (soru, cevap, context)
df['soru'] = df['soru'].apply(preprocess_text)
df['cevap'] = df['cevap'].apply(preprocess_text)
df['context'] = df['context'].apply(preprocess_text)

# Kaydet
df.to_csv(output_path, index=False)
print(f"Temizlenmiş veri seti '{output_path}' olarak kaydedildi!")