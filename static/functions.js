
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


            // Display uploaded images for this post.
            if (post.images && post.images.length > 0) {

                const imageContainer = document.createElement("div");
                imageContainer.className = "d-flex flex-wrap gap-2 mt-3";

                post.images.forEach(function (image) {

                    const img = document.createElement("img");

                    img.src = image.url;
                    img.alt = "Uploaded image for " + post.title;

                    img.className = "img-thumbnail";

                    img.style.width = "120px";
                    img.style.height = "120px";
                    img.style.objectFit = "cover";

                    // Add the image to the container.
                    imageContainer.appendChild(img);
                });

                // Add images to the post card.
                body.appendChild(imageContainer);
            }


            // Create an Edit button for posts owned by the current user.

            // Show Edit and Delete buttons only to the post owner.
            if (post.is_owner) {

                // Create Edit Post button.
                const editButton = document.createElement("button");
                editButton.className = "btn btn-warning btn-sm mt-3 ms-2";
                editButton.textContent = "Edit Post";
                editButton.type = "button";

                editButton.addEventListener("click", function () {

                    // Fill the Edit Post form with existing post data.
                    document.getElementById("editPostId").value = post.id;
                    document.getElementById("editPostTitle").value = post.title;
                    document.getElementById("editPostContent").value = post.content;
                    document.getElementById("editPostCategory").value = post.category_id;

                    // Clear previous validation errors.
                    const editError = document.getElementById("editPostError");
                    editError.classList.add("d-none");
                    editError.textContent = "";

                    // Open the Edit Post modal.
                    const modalElement = document.getElementById("editPostModal");
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                });

                body.appendChild(editButton);


                // Create Delete Post button.
                const deleteButton = document.createElement("button");
                deleteButton.className = "btn btn-danger btn-sm mt-3 ms-2";
                deleteButton.textContent = "Delete Post";
                deleteButton.type = "button";

                deleteButton.addEventListener("click", function () {

                    // Store the ID of the post selected for deletion.
                    document.getElementById("deletePostId").value = post.id;

                    // Clear previous error messages.
                    const deleteError = document.getElementById("deletePostError");
                    deleteError.classList.add("d-none");
                    deleteError.textContent = "";

                    // Open the Delete Post confirmation modal.
                    const modalElement = document.getElementById("deletePostModal");
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                });

                body.appendChild(deleteButton);


                // Create Upload Images button.
                const uploadButton = document.createElement("button");

                uploadButton.className = "btn btn-success btn-sm mt-3 ms-2";
                uploadButton.textContent = "Upload Images";
                uploadButton.type = "button";

                uploadButton.addEventListener("click", function () {

                    // Store the ID of the post receiving images.
                    document.getElementById("uploadImagePostId").value = post.id;

                    // Clear previous upload errors.
                    const uploadError = document.getElementById("uploadImageError");
                    uploadError.classList.add("d-none");
                    uploadError.textContent = "";

                    // Open the Upload Images modal.
                    const modalElement = document.getElementById("uploadImageModal");
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                });

                // Add the Upload Images button to the post card.
                body.appendChild(uploadButton);

            }


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


/**
 * Handles AJAX submission of the Edit Post modal.
 * Updates an existing post without refreshing the page.
 */
document.addEventListener("DOMContentLoaded", () => {
    const editPostForm = document.getElementById("editPostForm");
    const editPostError = document.getElementById("editPostError");

    if (!editPostForm) {
        return;
    }

    editPostForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const postId = document.getElementById("editPostId").value;
        const submitButton = editPostForm.querySelector(
            'button[type="submit"]'
        );

        const csrfToken = editPostForm.querySelector(
            '[name="csrfmiddlewaretoken"]'
        ).value;

        editPostError.classList.add("d-none");
        submitButton.disabled = true;

        try {
            const response = await fetch(
                `/api/posts/${postId}/update/`,
                {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken
                    },
                    body: new FormData(editPostForm),
                    credentials: "same-origin"
                }
            );

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
                    : data.error || "Unable to update post.";

                throw new Error(errors);
            }

            // Close the Edit Post modal.
            const modalElement = document.getElementById(
                "editPostModal"
            );

            const modal = bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }

            // Reset pagination and refresh posts through AJAX.
            currentPage = 1;

            document.getElementById(
                "posts-container"
            ).replaceChildren();

            await loadPosts();

        } catch (error) {
            editPostError.textContent = error.message;
            editPostError.classList.remove("d-none");
        } finally {
            submitButton.disabled = false;
        }
    });
});


/**
 * Handles AJAX deletion of forum posts.
 * Only the post owner can delete a post.
 * Refreshes the post list without reloading the page.
 */
document.addEventListener("DOMContentLoaded", function () {

    const confirmDeleteButton = document.getElementById("confirmDeletePost");
    const deletePostError = document.getElementById("deletePostError");

    if (!confirmDeleteButton) {
        return;
    }

    confirmDeleteButton.addEventListener("click", async function () {

        // Get the ID of the selected post.
        const postId = document.getElementById("deletePostId").value;

        // Get Django's CSRF token from the existing form.
        const csrfToken = document.querySelector(
            "#csrf-form input[name='csrfmiddlewaretoken']"
        ).value;

        // Hide previous errors and prevent duplicate submissions.
        deletePostError.classList.add("d-none");
        deletePostError.textContent = "";
        confirmDeleteButton.disabled = true;

        try {
            // Send the delete request to Django.
            const response = await fetch(
                `/api/posts/${postId}/delete/`,
                {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken
                    },
                    credentials: "same-origin"
                }
            );

            // Redirect to login if the session has expired.
            if (response.redirected) {
                window.location.href = response.url;
                return;
            }

            const data = await response.json();

            // Handle permission errors and unsuccessful requests.
            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Unable to delete this post."
                );
            }

            // Close the confirmation modal.
            const modalElement = document.getElementById("deletePostModal");
            const modal = bootstrap.Modal.getInstance(modalElement);

            if (modal) {
                modal.hide();
            }

            // Reset pagination and refresh posts using AJAX.
            currentPage = 1;

            document.getElementById(
                "posts-container"
            ).replaceChildren();

            await loadPosts();

        } catch (error) {
            // Display errors inside the confirmation modal.
            deletePostError.textContent = error.message;
            deletePostError.classList.remove("d-none");

        } finally {
            confirmDeleteButton.disabled = false;
        }
    });
});


/**
 * Configures Dropzone.js to upload images to existing forum posts.
 * Uses Django CSRF protection and the selected post ID.
 */
document.addEventListener("DOMContentLoaded", function () {

    const dropzoneForm = document.getElementById("postImageDropzone");
    const uploadError = document.getElementById("uploadImageError");

    if (!dropzoneForm) {
        return;
    }

    // Prevent Dropzone from automatically attaching twice.
    Dropzone.autoDiscover = false;

    const imageDropzone = new Dropzone("#postImageDropzone", {

        // The URL is set dynamically when an image is uploaded.
        url: "/api/posts/0/upload-image/",

        method: "post",
        paramName: "file",

        // Upload one image per request.
        uploadMultiple: false,
        parallelUploads: 1,

        // Limit each image to 5 MB.
        maxFilesize: 5,

        // Accept supported image formats.
        acceptedFiles: "image/jpeg,image/png,image/gif,image/webp",

        addRemoveLinks: true,

        // Do not upload until the post ID has been selected.
        autoProcessQueue: false,

        init: function () {

            const dz = this;

            // Start uploading when an image is added.
            dz.on("addedfile", function (file) {

                uploadError.classList.add("d-none");
                uploadError.textContent = "";

                const postId = document.getElementById(
                    "uploadImagePostId"
                ).value;

                if (!postId) {
                    uploadError.textContent = "Please select a post first.";
                    uploadError.classList.remove("d-none");
                    dz.removeFile(file);
                    return;
                }

                dz.processQueue();
            });

            // Set the correct post URL and CSRF token before each upload.
            dz.on("processing", function () {

                const postId = document.getElementById(
                    "uploadImagePostId"
                ).value;

                dz.options.url = `/api/posts/${postId}/upload-image/`;
            });

            dz.on("sending", function (file, xhr, formData) {

                const csrfToken = dropzoneForm.querySelector(
                    '[name="csrfmiddlewaretoken"]'
                ).value;

                xhr.setRequestHeader("X-CSRFToken", csrfToken);
            });

            // Handle successful uploads.
            dz.on("success", function (file, response) {

                if (response.success) {
                    console.log("Image uploaded:", response.image_url);
                }
            });

            // Display upload errors.
            dz.on("error", function (file, errorMessage) {

                const message = typeof errorMessage === "string"
                    ? errorMessage
                    : errorMessage.error || "Image upload failed.";

                uploadError.textContent = message;
                uploadError.classList.remove("d-none");
            });
        }
    });

    // Clear previous uploads when the modal closes.
    const uploadModal = document.getElementById("uploadImageModal");

    uploadModal.addEventListener("hidden.bs.modal", function () {
        imageDropzone.removeAllFiles(true);
        document.getElementById("uploadImagePostId").value = "";
        uploadError.classList.add("d-none");
        uploadError.textContent = "";
    });
});
