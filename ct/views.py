from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .edit_image import create_outlined_text, image_to_base64

# Create your views here.


class Textframe(APIView):
    def get(self, request, *args, **kwargs):
        input_data = request.GET.get('input', None)
        font_style = request.GET.get('fontstyle', None) 
        if input_data is not None:
            image = create_outlined_text(input_data, font_style, (0, 0, 0, 0), (255, 0, 0, 255), (0, 0, 0, 255))
            mask_image = create_outlined_text(input_data, font_style, (255, 255, 255, 255), (0, 0, 0, 255), (255, 255, 255, 255))
            image_base64 = image_to_base64(image)
            mask_image_base64 = image_to_base64(mask_image)
            return Response({"image": image_base64, "mask_image": mask_image_base64}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid input"}, status=status.HTTP_400_BAD_REQUEST)
        



