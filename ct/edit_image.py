from PIL import Image, ImageDraw, ImageFont
import io
import math
import base64
import os
from pathlib import Path
from dotenv import load_dotenv
import warnings
from stability_sdk import client
import stability_sdk.interfaces.gooseai.generation.generation_pb2 as generation
from torchvision.transforms import GaussianBlur

load_dotenv(Path(__file__).parent.parent.joinpath(".env"))
API_KEY =os.environ["API_KEY"]# 自身の API キーを指定
os.environ['STABILITY_HOST'] = 'grpc.stability.ai:443'

def create_outlined_text(text: str, font_path: str, background_color: tuple, text_color: tuple, outline_color: tuple):
    font_size = 100
    script_dir = os.path.dirname(os.path.abspath(__file__))
    font_path = os.path.join(script_dir, "fonts", font_path)
    font = ImageFont.truetype(font_path, font_size)
    text_width, text_height = font.getsize(text)

    # Calculate dimensions that are multiples of 64
    image_width = math.ceil((text_width + 10) / 64) * 64
    image_height = math.ceil((text_height + 10) / 64) * 64

    image = Image.new('RGBA', (image_width, image_height), background_color)
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


def create_text(img, mask_i):

    # Set up our connection to the API.
    stability_api = client.StabilityInference(
        key=API_KEY, # API Key reference.
        verbose=True, # Print debug messages.
        engine="stable-diffusion-xl-1024-v1-0", # Set the engine to use for generation.
        # Check out the following link for a list of available engines: https://platform.stability.ai/docs/features/api-parameters#engine
    )

    # Feathering the edges of our mask generally helps provide a better result. Alternately, you can feather the mask in a suite like Photoshop or GIMP.
    # blur = GaussianBlur(11,20)
    # mask = blur(mask_i)
    mask = mask_i.convert("L")

    answers = stability_api.generate(
        prompt="clear ocean",
        init_image=img,
        mask_image=mask,
        start_schedule=1,
        seed=44332211, # If attempting to transform an image that was previously generated with our API,
                    # initial images benefit from having their own distinct seed rather than using the seed of the original image generation.
        steps=30, # Amount of inference steps performed on image generation. Defaults to 30.
        cfg_scale=8.0, # Influences how strongly your generation is guided to match your prompt.
                    # Setting this value higher increases the strength in which it tries to match your prompt.
                    # Defaults to 7.0 if not specified.
        width=1024, # Generation width, if not included defaults to 512 or 1024 depending on the engine.
        height=1024, # Generation height, if not included defaults to 512 or 1024 depending on the engine.
        sampler=generation.SAMPLER_K_DPMPP_2M # Choose which sampler we want to denoise our generation with.
                                                    # Defaults to k_lms if not specified. Clip Guidance only supports ancestral samplers.
                                                    # (Available Samplers: ddim, plms, k_euler, k_euler_ancestral, k_heun, k_dpm_2, k_dpm_2_ancestral, k_dpmpp_2s_ancestral, k_lms, k_dpmpp_2m, k_dpmpp_sde)
    )

    # Set up our warning to print to the console if the adult content classifier is tripped.
    # If adult content classifier is not tripped, save generated image.
    for resp in answers:
        for artifact in resp.artifacts:
            if artifact.finish_reason == generation.FILTER:
                warnings.warn(
                    "Your request activated the API's safety filters and could not be processed."
                    "Please modify the prompt and try again.")
            if artifact.type == generation.ARTIFACT_IMAGE:
                global img2
                img2 = Image.open(io.BytesIO(artifact.binary))
                return img2 # Save our completed image with its seed number as the filename.


def base64_to_image(b64_string: str) -> Image:
    decoded = base64.b64decode(b64_string)
    buffered = io.BytesIO(decoded)
    img = Image.open(buffered)
    return img
