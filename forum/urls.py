from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("api/posts/", views.get_posts, name="get_posts"),
    path(
        "api/posts/<int:post_id>/like/",
        views.toggle_like,
        name="toggle_like"
    ),
    path("api/posts/create/", views.create_post, name="create_post"),
    path("posts/<int:post_id>/", views.post_detail, name="post_detail"),
    path("api/posts/<int:post_id>/update/", views.update_post, name="update_post"),
    path("api/posts/<int:post_id>/delete/", views.delete_post, name="delete_post"),
    path(
    "api/posts/<int:post_id>/upload-image/",
    views.upload_post_image,
    name="upload_post_image"),
    path("profile/<str:username>/", views.user_profile, name="user_profile"),
]