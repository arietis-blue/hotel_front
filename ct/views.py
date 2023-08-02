from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from celery.result import AsyncResult
from .tasks.c_text import create_text
from .edit_image import create_outlined_text, image_to_base64, base64_to_image

# Create your views here.


class Textframe(APIView):
    def get(self, request, *args, **kwargs):
        input_data = request.GET.get('input', None)
        font_style = request.GET.get('fontstyle', None) 
        if input_data is not None:
            image = create_outlined_text(input_data, font_style, (0, 0, 0, 0), (255, 0, 0, 255), (0, 0, 0, 255))
            mask_image = create_outlined_text(input_data, font_style, (255, 255, 255, 255), (0, 0, 0, 255), (255, 255, 255, 255))
            # created_image = create_text(image, mask_image)
            # image_base64 = image_to_base64(created_image)
            image_base64 = image_to_base64(image)
            mask_image_base64 = image_to_base64(mask_image)
            return Response({"image": image_base64, "mask_image": mask_image_base64}, status=status.HTTP_200_OK)
            # return Response({"image": image_base64}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid input"}, status=status.HTTP_400_BAD_REQUEST)
        

class Start(APIView):
    def get(self, request):
        image = request.GET.get('image', None)
        mask = request.GET.get('mask', None)
        prompt = request.GET.get('prompt', None)
        if mask is not None:
            print("画像はok")
        print(prompt)
        if image is not None and prompt is not None:
            task = create_text.delay(image, mask, prompt)
            print("タスクが触れたぞ！！！")
            print(task.id)
            return Response({'task_id': task.id}, status=202)
        elif image is None:
            return Response({"error": "create text frame"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": "input prompt"}, status=status.HTTP_400_BAD_REQUEST)
    

class Poll(APIView):
    def get(self, request):
        task_id = request.GET.get('task_id', None)
        print("タスク来てる")
        print(task_id)
        if task_id is None:
            return Response({'error': 'Missing task_id parameter'}, status=400)

        task = AsyncResult(task_id)
        if task.ready():
            print("完成")
            # print(task.result)
            return Response({'state': 'READY', 'result': task.result})
        else:
            print(" 準備中")
            return Response({'state': 'PENDING'})

