from django.urls import path
from . import views

urlpatterns = [
    path('api/create_image/', views.Start.as_view(), name='creative_text'),
    path('api/check_state/', views.Poll.as_view(), name='check_state'),
]