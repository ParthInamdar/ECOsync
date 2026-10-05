from PIL import Image

def make_transparent(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if near white
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((255, 255, 255, 0)) # Fully transparent
            else:
                newData.append(item)

        img.putdata(newData)
        # Also crop the image to remove empty transparent space around the logo if needed
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
            
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path} and saved to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

make_transparent(r"C:\Users\HP\.gemini\antigravity-ide\brain\dee1a2e3-0560-44dc-ae3b-d24a58a5a7d0\.user_uploaded\media_1791168405572.jpg", r"C:\Users\HP\Desktop\PARTH\5th sem\ECO sync\frontend\public\logo.png")
