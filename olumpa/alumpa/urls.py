from django.urls import path
from .views import subjects_list, topics_list, analyze

urlpatterns = [
    path('subjects/', subjects_list),
    path('topics/', topics_list),
    path('analyze/', analyze),
]