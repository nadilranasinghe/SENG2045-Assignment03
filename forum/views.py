from django.shortcuts import render
from .models import Post, Category
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404
from .forms import PostForm
from django.core.exceptions import ValidationError
from django.core.validators import validate_image_file_extension
from .models import PostImage


def home(request):
    posts = Post.objects.select_related(
        "author", "category"
    ).order_by("-created_at")

    categories = Category.objects.all()

    context = {
        "posts": posts,
        "categories": categories
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
            "images": [
            {
                "id": image.id,
                "url": image.image.url
            }
            for image in post.images.all()
            ],

            "author": post.author.username,
            "is_owner": (
                request.user.is_authenticated
                and post.author_id == request.user.id
            ),
            "category_id": post.category_id,
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
    
@login_required
@require_POST

def create_post(request):
    form = PostForm(request.POST)

    if form.is_valid():
        post = form.save(commit=False)
        post.author = request.user
        post.save()

        return JsonResponse({
            "success": True,
            "post_id": post.id,
            "message": "Post created successfully"
        }, status=201)

    return JsonResponse({
        "success": False,
        "errors": form.errors.get_json_data()
    }, status=400)


def post_detail(request, post_id):
    """
    Displays the details of an individual forum post.
    """

    post = get_object_or_404(
        Post.objects.select_related("author", "category"),
        id=post_id
    )

    context = {
        "post": post
    }

    return render(request, "post_detail.html", context)


@login_required
@require_POST

def update_post(request, post_id):
    """
    Updates an existing forum post using AJAX.
    Only the post author can update their post.
    """

    post = get_object_or_404(Post, id=post_id)

    # Prevent users from editing someone else's posts.
    if post.author != request.user:
        return JsonResponse({
            "success": False,
            "error": "You do not have permission to edit this post."
        }, status=403)

    # Validate submitted data against the existing post.
    form = PostForm(request.POST, instance=post)

    if form.is_valid():
        updated_post = form.save()

        return JsonResponse({
            "success": True,
            "post_id": updated_post.id,
            "title": updated_post.title,
            "content": updated_post.content,
            "category": updated_post.category.name,
            "message": "Post updated successfully."
        })

    return JsonResponse({
        "success": False,
        "errors": form.errors.get_json_data()
    }, status=400)


@login_required
@require_POST

def delete_post(request, post_id):
    """
    Deletes an existing forum post using AJAX.
    Only the original author can delete the post.
    """

    post = get_object_or_404(Post, id=post_id)

    # Check whether the logged-in user owns this post.
    if post.author_id != request.user.id:
        return JsonResponse({
            "success": False,
            "error": "You do not have permission to delete this post."
        }, status=403)

    # Delete the post from the database.
    post.delete()

    return JsonResponse({
        "success": True,
        "post_id": post_id,
        "message": "Post deleted successfully."
    }, status=200)



@login_required
@require_POST
def upload_post_image(request, post_id):
    """
    Upload an image to a forum post using AJAX.
    Only the post author can upload images.
    """

    post = get_object_or_404(Post, id=post_id)

    # Verify ownership of the post.
    if post.author_id != request.user.id:
        return JsonResponse({
            "success": False,
            "error": "You cannot upload images to this post."
        }, status=403)

    # Check whether a file was provided.
    image_file = request.FILES.get("file")

    if not image_file:
        return JsonResponse({
            "success": False,
            "error": "No image file was uploaded."
        }, status=400)

    # Restrict the maximum file size to 5 MB.
    if image_file.size > 5 * 1024 * 1024:
        return JsonResponse({
            "success": False,
            "error": "Image must be smaller than 5 MB."
        }, status=400)

    # Validate the image file extension and contents.
    try:
        validate_image_file_extension(image_file)

        from django.forms import ImageField
        ImageField().clean(image_file)

    except ValidationError:
        return JsonResponse({
            "success": False,
            "error": "Please upload a valid JPEG, PNG, GIF, or WebP image."
        }, status=400)

    # Restrict accepted image formats.
    if image_file.image.format not in ("JPEG", "PNG", "GIF", "WEBP"):
        return JsonResponse({
            "success": False,
            "error": "Unsupported image format."
        }, status=400)

    # Save the uploaded image.
    post_image = PostImage.objects.create(
        post=post,
        image=image_file
    )

    return JsonResponse({
        "success": True,
        "image_id": post_image.id,
        "image_url": post_image.image.url,
        "message": "Image uploaded successfully."
    }, status=201)
