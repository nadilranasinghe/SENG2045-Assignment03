from django.shortcuts import render
from .models import Post
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404

def home(request):
    posts = Post.objects.select_related(
        "author", "category"
    ).order_by("-created_at")

    context = {
        "posts": posts
    }

    return render(request, "home.html", context)

def get_posts(request):
    try:
        page = max(1, int(request.GET.get("page", 1)))
    except (ValueError, TypeError):
        return JsonResponse(
            {"error": "Invalid page number"},
            status=400
        )

    page_size = 2
    offset = (page - 1) * page_size

    posts = Post.objects.select_related(
        "author", "category"
    ).order_by("-created_at", "-id")

    total_posts = posts.count()
    selected_posts = posts[offset:offset + page_size]

    post_data = []

    for post in selected_posts:
        post_data.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "author": post.author.username,
            "category": post.category.name,
            "created_at": post.created_at.strftime(
                "%Y-%m-%d %H:%M"
            ),
            "likes_count": post.likes.count(),
            "liked": (
                request.user.is_authenticated
                and post.likes.filter(id=request.user.id).exists()
            ),
        })

    return JsonResponse({
        "posts": post_data,
        "page": page,
        "has_next": offset + page_size < total_posts
    })
    
    
@login_required
@require_POST

def toggle_like(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    user = request.user

    if post.likes.filter(id=user.id).exists():
        post.likes.remove(user)
        liked = False
    else:
        post.likes.add(user)
        liked = True

    return JsonResponse({
        "post_id": post.id,
        "liked": liked,
        "likes_count": post.likes.count()
    })