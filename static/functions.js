
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

            const title = document.createElement("h5");
            title.className = "card-title";
            title.textContent = post.title;

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

            body.append(title, content, author, category, date);
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
