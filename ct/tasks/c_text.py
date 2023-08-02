from __future__ import absolute_import, unicode_literals
import os
import io
import warnings
import time
from PIL import Image
from stability_sdk import client
import stability_sdk.interfaces.gooseai.generation.generation_pb2 as generation
from torchvision.transforms import GaussianBlur
from celery import Celery, shared_task
from dotenv import load_dotenv
from pathlib import Path
from ..edit_image import image_to_base64, base64_to_image


load_dotenv(Path(__file__).parent.parent.parent.joinpath(".env"))
API_KEY =os.environ["API_KEY"]# set your api_key
os.environ['STABILITY_HOST'] = 'grpc.stability.ai:443'


@shared_task
def create_text(img, mask_i, prompt):

    # Set up our connection to the API.
    print("画像生成始まっていますよ")
    stability_api = client.StabilityInference(
        key=API_KEY, # API Key reference.
        verbose=True, # Print debug messages.
        engine="stable-diffusion-xl-1024-v1-0", # Set the engine to use for generation.
        # Check out the following link for a list of available engines: https://platform.stability.ai/docs/features/api-parameters#engine
    )

    # Feathering the edges of our mask generally helps provide a better result. Alternately, you can feather the mask in a suite like Photoshop or GIMP.
    # blur = GaussianBlur(11,20)
    # mask = blur(mask_i)
    img = base64_to_image(img)
    mask_i = base64_to_image(mask_i)
    mask = mask_i.convert("L")

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
        width=128, # Generation width, if not included defaults to 512 or 1024 depending on the engine.
        height=128, # Generation height, if not included defaults to 512 or 1024 depending on the engine.
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
                warning_message = (
                    "Your request activated the API's safety filters and could not be processed."
                    "Please modify the prompt and try again."
                )
                return warning_message
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
#     print(prompt)
#     return img
