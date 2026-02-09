from PIL import Image
import os

try:
    img = Image.open('cursor.png')
    print(f"Original size: {img.size}")
    
    # Resize to 64x64 (Maximum safe size for most browsers)
    img = img.resize((64, 64), Image.Resampling.LANCZOS)
    img.save('cursor_medium.png')
    print("Resized to 64x64 as cursor_medium.png")
except Exception as e:
    print(f"Error: {e}")
