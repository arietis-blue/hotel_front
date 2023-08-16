from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from celery.result import AsyncResult
from .tasks.c_text import create_text
from .edit_image import create_outlined_text, image_to_base64, base64_to_image
from rest_framework import permissions

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
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        image = request.data.get('image', None)  
        mask = request.data.get('mask', None)    
        prompt = request.data.get('prompt', None)
        # img = base64_to_image(mask)
        # img.show()
        if image is not None and prompt is not None:
            print("タスクスタートはできてる")
            task = create_text.delay(image, mask, prompt)
            return Response({'task_id': task.id}, status=202)
        elif image is None:
            return Response({"error": "create text frame"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": "input prompt"}, status=status.HTTP_400_BAD_REQUEST)
    

class Poll(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        task_id = request.data.get('task_id', None)
        print("タスクチェック中")
        if task_id is None:
            return Response({'error': 'Missing task_id parameter'}, status=400)
        task = AsyncResult(task_id)
        if task.ready():
            print("タスクはできてるけどおかしいよ")
            return Response({'state': 'READY', 'result': task.result})
        else:
            return Response({'state': 'PENDING'})

