from django.test import TestCase
from django.urls import reverse


class ForumHomeTests(TestCase):

    def test_homepage_loads_successfully(self):
        """Verify that the forum homepage returns HTTP 200."""
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)
        
class ForumAuthenticationTests(TestCase):

    def test_unauthenticated_user_cannot_create_post(self):
        """Verify that anonymous users are redirected to login."""
        response = self.client.post(
            reverse("create_post"),
            {
                "title": "Unauthorized Post",
                "content": "This post should not be created."
            }
        )

        self.assertEqual(response.status_code, 302)
        self.assertIn("/accounts/login/", response.url)

from django.contrib.auth.models import User
from forum.models import Post


class ForumPostValidationTests(TestCase):

    def test_empty_post_is_rejected(self):
        """Verify that empty posts cannot be created."""

        # Create a temporary user in the test database.
        user = User.objects.create_user(
            username="testuser",
            password="TestPassword123!"
        )

        # Log in as the test user.
        self.client.force_login(user)

        # Attempt to create a post with empty fields.
        response = self.client.post(
            reverse("create_post"),
            {
                "title": "",
                "content": "",
                "category": ""
            }
        )

        # Django should reject the invalid post.
        self.assertEqual(response.status_code, 400)

        # Verify that no post was created.
        self.assertEqual(Post.objects.count(), 0)
        
        
        
class ForumPostPermissionTests(TestCase):

    def test_non_owner_cannot_edit_post(self):
        """Verify users cannot edit posts belonging to others."""

        from forum.models import Category

        owner = User.objects.create_user(
            username="postowner",
            password="TestPassword123!"
        )

        other_user = User.objects.create_user(
            username="otheruser",
            password="TestPassword123!"
        )

        category = Category.objects.create(
            name="Test Category"
        )

        post = Post.objects.create(
            title="Original Post",
            content="Original content",
            author=owner,
            category=category
        )

        self.client.force_login(other_user)

        response = self.client.post(
            reverse("update_post", args=[post.id]),
            {
                "title": "Unauthorized Edit",
                "content": "Modified content",
                "category": category.id
            }
        )

        self.assertEqual(response.status_code, 403)

        post.refresh_from_db()
        self.assertEqual(post.title, "Original Post")
        self.assertEqual(post.content, "Original content")

    def test_non_owner_cannot_delete_post(self):
        """Verify users cannot delete posts belonging to others."""

        from forum.models import Category

        owner = User.objects.create_user(
            username="postowner",
            password="TestPassword123!"
        )

        other_user = User.objects.create_user(
            username="otheruser",
            password="TestPassword123!"
        )

        category = Category.objects.create(
            name="Test Category"
        )

        post = Post.objects.create(
            title="Protected Post",
            content="This post must not be deleted.",
            author=owner,
            category=category
        )

        self.client.force_login(other_user)

        response = self.client.post(
            reverse("delete_post", args=[post.id])
        )

        self.assertEqual(response.status_code, 403)

        self.assertTrue(
            Post.objects.filter(id=post.id).exists()
        )
        
        
class ForumCommentValidationTests(TestCase):

    def test_empty_comment_is_rejected(self):
        """Verify that empty comments cannot be submitted."""

        from forum.models import Category, Comment

        # Create a test user.
        user = User.objects.create_user(
            username="commenttester",
            password="TestPassword123!"
        )

        # Create a category.
        category = Category.objects.create(
            name="Test Category"
        )

        # Create a post to receive comments.
        post = Post.objects.create(
            title="Comment Test Post",
            content="Testing comment validation.",
            author=user,
            category=category
        )

        # Log in as the test user.
        self.client.force_login(user)

        # Attempt to submit an empty comment.
        response = self.client.post(
            reverse("create_comment", args=[post.id]),
            {"content": ""}
        )

        # Django should reject the empty comment.
        self.assertEqual(response.status_code, 400)

        # Verify that no comment was saved.
        self.assertEqual(Comment.objects.count(), 0)

class ForumLikeTests(TestCase):

    def test_user_can_like_and_unlike_post(self):
        """Verify that liking and unliking a post works."""

        from forum.models import Category

        # Create a test user.
        user = User.objects.create_user(
            username="liketester",
            password="TestPassword123!"
        )

        # Create a test category.
        category = Category.objects.create(
            name="Test Category"
        )

        # Create a test post.
        post = Post.objects.create(
            title="Like Test Post",
            content="Testing AJAX likes.",
            author=user,
            category=category
        )

        # Log in as the test user.
        self.client.force_login(user)

        # Like the post.
        response = self.client.post(
            reverse("toggle_like", args=[post.id])
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["liked"])
        self.assertEqual(data["likes_count"], 1)

        # Unlike the same post.
        response = self.client.post(
            reverse("toggle_like", args=[post.id])
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertFalse(data["liked"])
        self.assertEqual(data["likes_count"], 0)
        
class ForumPaginationTests(TestCase):

    def test_posts_are_paginated_correctly(self):
        """Verify that the API returns two posts per page."""

        from forum.models import Category

        # Create a test user.
        user = User.objects.create_user(
            username="paginationtester",
            password="TestPassword123!"
        )

        # Create a test category.
        category = Category.objects.create(
            name="Test Category"
        )

        # Create five test posts.
        for i in range(5):
            Post.objects.create(
                title=f"Test Post {i + 1}",
                content=f"Content for post {i + 1}",
                author=user,
                category=category
            )

        # Request the first page.
        response = self.client.get(
            reverse("get_posts"),
            {"page": 1}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        # Page 1 should contain two posts.
        self.assertEqual(len(data["posts"]), 2)
        self.assertTrue(data["has_next"])

        # Request the second page.
        response = self.client.get(
            reverse("get_posts"),
            {"page": 2}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        # Page 2 should also contain two posts.
        self.assertEqual(len(data["posts"]), 2)
        self.assertTrue(data["has_next"])

        # Request the third page.
        response = self.client.get(
            reverse("get_posts"),
            {"page": 3}
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        # Page 3 should contain the final post.
        self.assertEqual(len(data["posts"]), 1)
        self.assertFalse(data["has_next"])