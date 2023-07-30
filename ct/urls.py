from django.urls import path
from . import views

urlpatterns = [
    # path('', views.Home.as_view()), 
    # path('<str:edit>', views.Textframe.as_view()),
    path('api/', views.Textframe.as_view(), name='my_api'),
]