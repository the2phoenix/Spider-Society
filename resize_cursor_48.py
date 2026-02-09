from PIL import Image
import os

try:
    img = Image.open('cursor.png')
    print(f"Original size: {img.size}")
    
    # Resize to 48x48 (The perfect middle ground)
    img = img.resize((48, 48), Image.Resampling.LANCZOS)
    img.save('cursor_48.png')
    print("Resized to 48x48 as cursor_48.png")
except Exception as e:
    print(f"Error: {e}")
