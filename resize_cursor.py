from PIL import Image
import os

try:
    img = Image.open('cursor.png')
    print(f"Original size: {img.size}")
    
    # Resize to standard cursor size (32x32 is safest, 128x128 is max for some)
    # We'll go with 32x32 for maximum compatibility
    img = img.resize((32, 32), Image.Resampling.LANCZOS)
    img.save('cursor_small.png')
    print("Resized to 32x32 as cursor_small.png")
except Exception as e:
    print(f"Error: {e}")
