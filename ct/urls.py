from django.urls import path
from . import views

urlpatterns = [
    # path('', views.Home.as_view()), 
    # path('<str:edit>', views.Textframe.as_view()),
    path('api/empty_text/', views.Textframe.as_view(), name='empty_text'),
    path('api/create_image/', views.Start.as_view(), name='creative_text'),
    path('api/check_state/', views.Poll.as_view(), name='check_state'),
]