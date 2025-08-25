import pandas as pd
import os

# Dosya yolu
input_path = r'C:/Users/enesi/Desktop/lawoes/backend/data/raw/turkish_law_dataset.csv'
output_dir = r'C:/Users/enesi/Desktop/lawoes/backend/data/processed'
output_path = os.path.join(output_dir, 'cases.csv')

# Gerekli klasörü oluştur
os.makedirs(output_dir, exist_ok=True)

# CSV yükle
df = pd.read_csv(input_path)

# Küçük alt küme (ilk 100 satır)
subset_df = df.head(100)

# Sadece gerekli sütunları seçelim: soru/cevap/context
subset_df = subset_df[['soru', 'cevap', 'context']]

# Kaydet
subset_df.to_csv(output_path, index=False)
print(f"Küçük veri seti '{output_path}' olarak kaydedildi!")
