from __future__ import absolute_import, unicode_literals
import os
import io
import base64
import warnings
import time
from PIL import Image
import openai
import requests
from stability_sdk import client
import stability_sdk.interfaces.gooseai.generation.generation_pb2 as generation
from torchvision.transforms import GaussianBlur
from celery import Celery, shared_task
from dotenv import load_dotenv
from pathlib import Path
from ..edit_image import image_to_base64, base64_to_image


load_dotenv(Path(__file__).parent.parent.parent.joinpath(".env"))
ST_API_KEY =os.environ["ST_API_KEY"]# set your api_key
os.environ['STABILITY_HOST'] = 'grpc.stability.ai:443'

API_KEY = os.environ["OPENAI_API_KEY"]
openai.api_key  = API_KEY


@shared_task
def create_text(img, mask_i, prompt):

    # Set up our connection to the API.
    print("画像生成始まっていますよ")
    stability_api = client.StabilityInference(
        key=ST_API_KEY, # API Key reference.
        verbose=True, # Print debug messages.
        engine="stable-diffusion-xl-1024-v1-0", # Set the engine to use for generation.
        # Check out the following link for a list of available engines: https://platform.stability.ai/docs/features/api-parameters#engine
    )

    # Feathering the edges of our mask generally helps provide a better result. Alternately, you can feather the mask in a suite like Photoshop or GIMP.
    img = base64_to_image(img)
    mask_i = base64_to_image(mask_i)
    mask = mask_i.convert("L")
    blur = GaussianBlur(11,20)
    mask = blur(mask_i)


    answers = stability_api.generate(
        prompt=prompt,
        init_image=img,
        mask_image=mask,
        start_schedule=1,
        seed=44332211, # If attempting to transform an image that was previously generated with our API,
                    # initial images benefit from having their own distinct seed rather than using the seed of the original image generation.
        steps=10, # Amount of inference steps performed on image generation. Defaults to 30.
        cfg_scale=8.0, # Influences how strongly your generation is guided to match your prompt.
                    # Setting this value higher increases the strength in which it tries to match your prompt.
                    # Defaults to 7.0 if not specified.
        width=512, # Generation width, if not included defaults to 512 or 1024 depending on the engine.
        height=512, # Generation height, if not included defaults to 512 or 1024 depending on the engine.
        sampler=generation.SAMPLER_K_DPMPP_2M # Choose which sampler we want to denoise our generation with.
                                                    # Defaults to k_lms if not specified. Clip Guidance only supports ancestral samplers.
                                                    # (Available Samplers: ddim, plms, k_euler, k_euler_ancestral, k_heun, k_dpm_2, k_dpm_2_ancestral, k_dpmpp_2s_ancestral, k_lms, k_dpmpp_2m, k_dpmpp_sde)
    )

    # Set up our warning to print to the console if the adult content classifier is tripped.
    # If adult content classifier is not tripped, save generated image.
    for resp in answers:
        for artifact in resp.artifacts:
            if artifact.finish_reason == generation.FILTER:
                print("画像ができていません-----------------")
                mask = image_to_base64(mask)
                mask.show()
                return mask
            if artifact.type == generation.ARTIFACT_IMAGE:
                img2 = Image.open(io.BytesIO(artifact.binary))
                img2 = image_to_base64(img2)
                print("画像ができました------------------------------")
                return img2 # Save our completed image with its seed number as the filename.

# export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
# celery -A ct_api worker --concurrency=1 -l info

# @shared_task
# def create_text(img, mask_i, prompt):

#     time.sleep(20)
#     img = base64_to_image(img)
#     mask_i = base64_to_image(mask_i)
#     img = image_to_base64(img)
#     return img

# @shared_task
# def create_text(img, mask_i, prompt):

#     image_data = base64.b64decode(img)
#     mask_data = base64.b64decode(mask_i)


#     # バイトデータをBytesIOオブジェクトに変換
#     image = io.BytesIO(image_data)
#     mask = io.BytesIO(mask_data)

#     image = Image.open(image)
#     mask = Image.open(mask)

#     # 必要であればPNGに変換
#     image = image.convert("RGBA")
#     mask = mask.convert("L")

#     # 再びBytesIOオブジェクトに変換
#     image_io = io.BytesIO()
#     mask_io = io.BytesIO()
#     image.save(image_io, format="PNG")
#     mask.save(mask_io, format="PNG")
#     image_io.seek(0)
#     mask_io.seek(0)

#     response = openai.Image.create_edit(
#         image=image_io,
#         mask=mask_io,
#         prompt=prompt,
#         n=1,
#         size="512x512"
#         )
    
#     image_url = response['data'][0]['url']

#     # URLから画像データをダウンロード
#     response = requests.get(image_url)
#     image_data = response.content

#     # 画像データをbase64にエンコード
#     encoded_image_data = base64.b64encode(image_data)

#     # base64エンコードされたデータを文字列として取得
#     base64_image_str = encoded_image_data.decode('utf-8')

#     return base64_image_str
