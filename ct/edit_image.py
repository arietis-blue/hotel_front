from PIL import Image, ImageDraw, ImageFont
import io
import base64
import os

"./fonts/SourceHanSerifJP-Regular.otf"

def create_outlined_text(text: str, font_path: str, background_color: tuple, text_color: tuple, outline_color: tuple):
    font_size = 100
    script_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(script_dir, "fonts", font_path)
    font = ImageFont.truetype(font_path, font_size)
    text_width, text_height = font.getsize(text)
    image = Image.new('RGBA', (text_width + 10, text_height + 10),  background_color)
    draw = ImageDraw.Draw(image)

    for adj in [-2, -1, 0, 1, 2]:
        draw.text((5+adj, 5), text, outline_color, font=font)  
        draw.text((5, 5+adj), text, outline_color, font=font)  

    draw.text((5, 5), text, text_color, font=font)

    return image


def image_to_base64(image: Image) -> str:
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue())
    return img_str.decode('utf-8')


def change_color(image: Image, color_to_change: tuple, new_color: tuple) -> Image:
    image = image.convert("RGBA")
    datas = image.getdata()

    new_data = []
    for item in datas:
        if item[0] == color_to_change[0] and item[1] == color_to_change[1] and item[2] == color_to_change[2]:
            new_data.append((new_color[0], new_color[1], new_color[2], item[3]))
        else:
            new_data.append(item)

    image.putdata(new_data)
    return image


# new_image = change_color(image, (255, 255, 255), (0, 0, 0))  # Change white to black
