from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("api/posts/", views.get_posts, name="get_posts"),
]