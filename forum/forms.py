
from django import forms
from .models import Post


class PostForm(forms.ModelForm):
    """
    Form used to create and update forum posts.
    """

    class Meta:
        model = Post

        fields = ["title", "content", "category"]

        widgets = {
            "title": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Enter post title"
                }
            ),

            "content": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "placeholder": "Write your post here...",
                    "rows": 4
                }
            ),

            "category": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),
        }
