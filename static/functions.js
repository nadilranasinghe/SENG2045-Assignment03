
let currentPage = 1;
let isLoading = false;

document.addEventListener("DOMContentLoaded", function () {
    const loadMoreButton = document.getElementById("load-more-btn");

    loadMoreButton.addEventListener("click", function () {
        loadPosts();
    });

    loadPosts();
});

async function loadPosts() {
    if (isLoading) return;

    isLoading = true;

    const container = document.getElementById("posts-container");
    const spinner = document.getElementById("loading-spinner");
    const error = document.getElementById("posts-error");
    const loadMoreButton = document.getElementById("load-more-btn");

    spinner.classList.remove("d-none");
    error.classList.add("d-none");
    loadMoreButton.classList.add("d-none");

    try {
        const response = await fetch(`/api/posts/?page=${currentPage}`);

        if (!response.ok) {
            throw new Error("Failed to fetch posts");
        }

        const data = await response.json();

        if (currentPage === 1 && data.posts.length === 0) {
            const message = document.createElement("p");
            message.textContent = "No posts available yet.";
            container.appendChild(message);
        }

        data.posts.forEach(function (post) {
            const column = document.createElement("div");
            column.className = "col-md-6 mb-4";

            const card = document.createElement("div");
            card.className = "card h-100";

            const body = document.createElement("div");
            body.className = "card-body";


            // Create a clickable post title.
            const title = document.createElement("h5");
            title.className = "card-title";

            const titleLink = document.createElement("a");
            titleLink.href = `/posts/${post.id}/`;
            titleLink.textContent = post.title;
            titleLink.className = "text-decoration-none";

            title.appendChild(titleLink);


            const content = document.createElement("p");
            content.className = "card-text";
            content.textContent = post.content;

            const author = document.createElement("p");
            author.className = "text-muted";
            author.textContent = "Author: " + post.author;

            const category = document.createElement("p");
            category.className = "text-muted";
            category.textContent = "Category: " + post.category;

            const date = document.createElement("small");
            date.className = "text-muted";
            date.textContent = post.created_at;

            // Create Like/Unlike button
            const likeButton = document.createElement("button");
            likeButton.className = "btn btn-outline-primary btn-sm mt-3";

            function updateLikeButton(liked, count) {
                likeButton.textContent =
                    `${liked ? "Unlike" : "Like"} (${count})`;
            }

            updateLikeButton(post.liked, post.likes_count);

            likeButton.addEventListener("click", async function () {
                likeButton.disabled = true;

                try {
                    const csrfToken = document.querySelector(
                        "#csrf-form input[name='csrfmiddlewaretoken']"
                    ).value;

                    const response = await fetch(
                        `/api/posts/${post.id}/like/`,
                        {
                            method: "POST",
                            headers: {
                                "X-CSRFToken": csrfToken
                            },
                            credentials: "same-origin"
                        }
                    );

                    if (response.redirected) {
                        alert("Please log in to like posts.");
                        return;
                    }

                    if (!response.ok) {
                        throw new Error("Unable to update like");
                    }

                    const result = await response.json();

                    updateLikeButton(
                        result.liked,
                        result.likes_count
                    );

                } catch (error) {
                    console.error("Like error:", error);
                    alert("Unable to update like. Please try again.");

                } finally {
                    likeButton.disabled = false;
                }
            });

            body.append(
                title,
                content,
                author,
                category,
                date,
                likeButton
            );
            card.appendChild(body);
            column.appendChild(card);
            container.appendChild(column);
        });

        currentPage++;

        if (data.has_next) {
            loadMoreButton.classList.remove("d-none");
        }

    } catch (err) {
        console.error("Error loading posts:", err);
        error.classList.remove("d-none");
        loadMoreButton.classList.remove("d-none");

    } finally {
        spinner.classList.add("d-none");
        isLoading = false;
    }
}


/**
 * Handles AJAX submission of the Create Post modal.
 * Validates the form through Django and refreshes the post list.
 */
document.addEventListener("DOMContentLoaded", () => {
    const createPostForm = document.getElementById("createPostForm");
    const createPostError = document.getElementById("createPostError");

    if (!createPostForm) {
        return;
    }

    createPostForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = createPostForm.querySelector(
            'button[type="submit"]'
        );

        const csrfToken = createPostForm.querySelector(
            '[name="csrfmiddlewaretoken"]'
        ).value;

        createPostError.classList.add("d-none");
        submitButton.disabled = true;

        try {
            const response = await fetch("/api/posts/create/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken
                },
                body: new FormData(createPostForm),
                credentials: "same-origin"
            });

            if (response.redirected) {
                window.location.href = response.url;
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                const errors = data.errors
                    ? Object.values(data.errors)
                        .flat()
                        .map(error => error.message)
                        .join(" ")
                    : "Unable to create post.";

                throw new Error(errors);
            }

            // Clear the form after successful submission.
            createPostForm.reset();

            // Close the Bootstrap modal.
            const modalElement = document.getElementById(
                "createPostModal"
            );

            const modal = bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }


            // Reset pagination and reload the first page using AJAX.
            currentPage = 1;

            const postsContainer = document.getElementById(
                "posts-container"
            );

            postsContainer.replaceChildren();

            // Load the updated posts without refreshing the browser.
            await loadPosts();

        } catch (error) {
            createPostError.textContent = error.message;
            createPostError.classList.remove("d-none");
        } finally {
            submitButton.disabled = false;
        }
    });
});
