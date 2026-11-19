/* =====================================
   CLG CONNECT - HOME JAVASCRIPT
   ACCOUNT-SPECIFIC VERSION
===================================== */

// =====================================
// LOGIN AND ACCOUNT
// =====================================

function checkLogin() {
    if (!sessionStorage.getItem("token")) {
        window.location.replace("../login/login.html");
    }
}

checkLogin();
window.addEventListener("pageshow", checkLogin);

const API = "/api";
const token = sessionStorage.getItem("token");

let currentUserId = null;
let loggedInUser = null;
let loadedPosts = [];
let savedPostIds = new Set();

async function loadCurrentUser() {
    try {
        const response = await fetch(`${API}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.user) {
            throw new Error(data.message || "Unable to identify account.");
        }

        loggedInUser = data.user;
        currentUserId = String(data.user.id);

        window.clgCurrentUserId = currentUserId;

        return data.user;
    } catch (error) {
        console.error("Account loading error:", error);
        sessionStorage.removeItem("token");
        window.location.replace("../login/login.html");
        return null;
    }
}

const currentUserPromise = loadCurrentUser();

function accountKey(key) {
    if (!currentUserId) {
        throw new Error("Account has not loaded yet.");
    }

    return `${key}_${currentUserId}`;
}


// =====================================
// ELEMENTS
// =====================================

const searchBtn = document.getElementById("searchBtn");
const createBtn = document.getElementById("createBtn");
const communitiesBtn = document.getElementById("communitiesBtn");

const searchPanel = document.getElementById("searchPanel");
const createPanel = document.getElementById("createPanel");

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const dialog = document.getElementById("messageDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogBody = document.getElementById("dialogBody");
const closeDialog = document.getElementById("closeDialog");

const recentPosts = document.getElementById("recentPosts");


// =====================================
// LOCAL STORAGE HELPERS
// =====================================

function readStorage(key, fallback = []) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "null");
        return value === null ? fallback : value;
    } catch (error) {
        console.error("Storage read error:", error);
        return fallback;
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function readAccountStorage(key, fallback = []) {
    if (!currentUserId) return fallback;
    return readStorage(accountKey(key), fallback);
}

function writeAccountStorage(key, value) {
    if (!currentUserId) {
        throw new Error("Account has not loaded yet.");
    }

    writeStorage(accountKey(key), value);
}

async function authenticatedFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${sessionStorage.getItem("token")}`
        }
    });

    return response;
}


// =====================================
// SEARCH CONTENT
// =====================================

const searchableContent = [
    {
        title: "Exam preparation tips",
        type: "Post",
        keywords: "exam study notes academics"
    },
    {
        title: "College festival ideas",
        type: "Trending topic",
        keywords: "festival event campus"
    },
    {
        title: "Campus Talk",
        type: "Community",
        keywords: "discussion campus chat"
    },
    {
        title: "Study Group",
        type: "Community",
        keywords: "study exam learning"
    },
    {
        title: "Campus Events",
        type: "Community",
        keywords: "college events activities"
    },
    {
        title: "Campus Life Discussions",
        type: "Trending topic",
        keywords: "campus life discussion"
    }
];


// =====================================
// PANEL CONTROLS
// =====================================

function togglePanel(panel) {
    const shouldOpen = panel.hidden;

    searchPanel.hidden = true;
    createPanel.hidden = true;

    panel.hidden = !shouldOpen;
}

searchBtn.addEventListener("click", () => {
    togglePanel(searchPanel);

    if (!searchPanel.hidden) {
        searchInput.focus();
    }
});

createBtn.addEventListener("click", () => {
    togglePanel(createPanel);
});


// =====================================
// SEARCH
// =====================================

searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim().toLowerCase();

    searchResults.replaceChildren();

    if (!query) {
        searchResults.textContent =
            "Search posts, communities, videos and topics.";
        return;
    }

    const posts = Array.isArray(loadedPosts) ? loadedPosts : [];

    const allContent = [
        ...searchableContent,
        ...posts.map(post => ({
            title: post.title || post.content,
            type: "Post",
            keywords: post.content || ""
        }))
    ];

    const results = allContent.filter(item =>
        `${item.title} ${item.type} ${item.keywords}`
            .toLowerCase()
            .includes(query)
    );

    if (results.length === 0) {
        searchResults.textContent = "No matching content found.";
        return;
    }

    results.forEach(item => {
        const result = document.createElement("button");
        result.type = "button";
        result.textContent = `${item.title} · ${item.type}`;

        result.addEventListener("click", () => {
            openDialog(
                item.title,
                `<p>${escapeHTML(item.title)}</p>`
            );

            searchPanel.hidden = true;
        });

        searchResults.appendChild(result);
    });
});


// =====================================
// DIALOG HELPERS
// =====================================

function openDialog(title, content) {
    dialogTitle.textContent = title;
    dialogBody.replaceChildren();

    if (typeof content === "string") {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = content;
        dialogBody.appendChild(wrapper);
    } else {
        dialogBody.appendChild(content);
    }

    if (!dialog.open) {
        dialog.showModal();
    }
}

closeDialog.addEventListener("click", () => dialog.close());


// =====================================
// ESCAPE HTML
// =====================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


// =====================================
// CREATE POST / COMMUNITY / VIDEO
// =====================================

function showCreateForm(type) {
    const settings = {
        post: {
            title: "Create a Post",
            placeholder: "What would you like to share?"
        },
        community: {
            title: "Create a Community",
            placeholder: "Describe the community and what members can share..."
        },
        video: {
            title: "Share a Video",
            placeholder: "Paste a video link or describe it..."
        },
        suggestion: {
            title: "Share a Suggestion",
            placeholder: "Share your idea..."
        }
    };

    const config = settings[type];
    if (!config) return;

    const form = document.createElement("form");
    form.className = "create-post-form";

    const error = document.createElement("p");
    error.className = "dialog-error";
    error.hidden = true;

    let titleInput = null;
    let communityNameInput = null;
    let mediaInput = null;
    let preview = null;
    let mediaURL = "";

    if (type === "post") {
        const titleLabel = document.createElement("label");
        titleLabel.textContent = "Post Title";

        titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.placeholder = "Give your post a catchy title...";
        titleInput.maxLength = 100;
        titleInput.required = true;
        titleInput.className = "create-title-input";
        titleInput.id = "newPostTitle";

        titleLabel.htmlFor = "newPostTitle";
        form.append(titleLabel, titleInput);
    }

    if (type === "community") {
        const nameLabel = document.createElement("label");
        nameLabel.textContent = "Community name";
        communityNameInput = document.createElement("input");
        communityNameInput.type = "text";
        communityNameInput.maxLength = 100;
        communityNameInput.required = true;
        communityNameInput.placeholder = "Give your community a name";
        communityNameInput.className = "create-title-input";
        form.append(nameLabel, communityNameInput);
    }

    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent =
        type === "post" ? "Description" :
        type === "community" ? "About this community (optional)" :
        "Your content";

    const textarea = document.createElement("textarea");
    textarea.placeholder = config.placeholder;
    textarea.required = type !== "community";
    textarea.maxLength = type === "community" ? 500 : 2000;
    textarea.className = "create-description-input";

    form.append(descriptionLabel, textarea);

    if (type === "post") {
        const tools = document.createElement("div");
        tools.className = "create-post-tools";

        const emojiButton = document.createElement("button");
        emojiButton.type = "button";
        emojiButton.className = "create-tool-button icon-only";
        emojiButton.textContent = "😊";
        emojiButton.title = "Add emoji";

        const emojiBox = document.createElement("div");
        emojiBox.className = "create-emoji-box";
        emojiBox.hidden = true;

        ["😊", "😂", "❤️", "🔥", "🎉", "✨", "📚", "🎓", "👏", "💡"]
            .forEach(emoji => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "create-emoji";
                button.textContent = emoji;

                button.addEventListener("click", () => {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;

                    textarea.value =
                        textarea.value.slice(0, start) +
                        emoji +
                        textarea.value.slice(end);

                    textarea.focus();
                    textarea.setSelectionRange(
                        start + emoji.length,
                        start + emoji.length
                    );
                });

                emojiBox.appendChild(button);
            });

        emojiButton.addEventListener("click", () => {
            emojiBox.hidden = !emojiBox.hidden;
        });

        const mediaLabel = document.createElement("label");
        mediaLabel.className = "create-tool-button icon-only";
        mediaLabel.textContent = "🖼️";
        mediaLabel.title = "Add photo or video";

        mediaInput = document.createElement("input");
        mediaInput.type = "file";
        mediaInput.accept = "image/*,video/*";
        mediaInput.hidden = true;

        preview = document.createElement("div");
        preview.className = "create-media-preview";
        preview.hidden = true;

        mediaInput.addEventListener("change", () => {
            const file = mediaInput.files[0];

            if (mediaURL) {
                URL.revokeObjectURL(mediaURL);
                mediaURL = "";
            }

            preview.replaceChildren();
            preview.hidden = true;
            error.hidden = true;

            if (!file) return;

            if (!file.type.startsWith("image/") &&
                !file.type.startsWith("video/")) {
                error.textContent = "Please choose an image or video.";
                error.hidden = false;
                mediaInput.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                error.textContent = "Please choose a file smaller than 5 MB.";
                error.hidden = false;
                mediaInput.value = "";
                return;
            }

            mediaURL = URL.createObjectURL(file);

            const media = document.createElement(
                file.type.startsWith("image/") ? "img" : "video"
            );

            media.src = mediaURL;
            media.className = "create-preview-media";

            if (media.tagName === "VIDEO") {
                media.controls = true;
            }

            const fileName = document.createElement("p");
            fileName.textContent = "Selected: " + file.name;

            preview.append(media, fileName);
            preview.hidden = false;
        });

        mediaLabel.appendChild(mediaInput);
        tools.append(emojiButton, mediaLabel);
        form.append(tools, emojiBox, preview);
    }

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "dialog-submit";
    submit.textContent =
        type === "post" ? "✨ Publish Post" :
        type === "community" ? "Create Community" :
        type === "video" ? "Share Video" :
        "Submit Suggestion";

    form.append(error, submit);

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const value = textarea.value.trim();
        const postTitle = titleInput ? titleInput.value.trim() : "";

        if ((type !== "community" && !value) ||
            (communityNameInput && !communityNameInput.value.trim()) ||
            (titleInput && !postTitle)) {
            error.textContent = "Please fill in all required fields.";
            error.hidden = false;
            return;
        }

        error.hidden = true;

        if (type === "community") {
            submit.disabled = true;
            submit.textContent = "Creating...";
            try {
                const response = await authenticatedFetch(`${API}/communities`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: communityNameInput.value.trim(),
                        description: value
                    })
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Could not create this community.");
                }
                dialog.close();
                await openCommunityDetails(data.community.id, "members");
            } catch (err) {
                error.textContent = err.message || "Unable to create this community.";
                error.hidden = false;
            } finally {
                submit.disabled = false;
                submit.textContent = "Create Community";
            }
            return;
        }

        
if (type === "post") {
    submit.disabled = true;
    submit.textContent = "Publishing...";

    try {
        const response = await authenticatedFetch(
            `${API}/posts`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: postTitle,
                    content: value,
                    post_type: "text"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Could not publish your post."
            );
        }

        dialog.close();

        textarea.value = "";
        if (titleInput) titleInput.value = "";

        await renderUserPosts();

        alert("Your post was published successfully!");

    } catch (err) {
        error.textContent = err.message;
        error.hidden = false;

    } finally {
        submit.disabled = false;
        submit.textContent = "✨ Publish Post";
    }

    return;
}


        openDialog(
            config.title,
            `<p>${escapeHTML(value)}</p>
             <p>This feature still needs its own saving logic.</p>`
        );
    });

    openDialog(config.title, form);
    if (titleInput) titleInput.focus();
    else if (communityNameInput) communityNameInput.focus();
}


// CREATE MENU BUTTONS

createPanel.querySelectorAll("[data-create]").forEach(button => {
    button.addEventListener("click", () => {
        createPanel.hidden = true;
        showCreateForm(button.dataset.create);
    });
});


// =====================================
// RECENT POSTS DISPLAY
// =====================================

async function renderUserPosts() {
    if (!recentPosts) return;

    const activeToken = sessionStorage.getItem("token");

    if (!activeToken) {
        window.location.replace("../login/login.html");
        return;
    }

    try {
        const [postsResponse, savedResponse] = await Promise.all([
            authenticatedFetch(`${API}/posts`),
            authenticatedFetch(`${API}/saved-posts`)
        ]);

        if (!postsResponse.ok) {
            throw new Error("Failed to fetch posts.");
        }

        const postsData = await postsResponse.json();

        let savedData = { saved_posts: [] };

        if (savedResponse.ok) {
            savedData = await savedResponse.json();
        }

        const savedPosts = Array.isArray(savedData.saved_posts)
            ? savedData.saved_posts
            : [];

        savedPostIds = new Set(
            savedPosts.map(item => String(item.id))
        );

        const serverPosts = Array.isArray(postsData.posts)
            ? postsData.posts
            : [];

        loadedPosts = await Promise.all(
            serverPosts.map(async item => {
                let liked = false;
                let likesCount = 0;

                try {
                    const likeResponse = await authenticatedFetch(
                        `${API}/likes/${item.id}`
                    );

                    if (likeResponse.ok) {
                        const likeData = await likeResponse.json();
                        liked = !!likeData.liked_by_user;
                        likesCount = Number(likeData.likes_count) || 0;
                    }
                } catch (error) {
                    console.error("Could not fetch like status:", error);
                }

                return {
                    id: item.id,
                    isMine: !!item.is_mine,
                    title: item.title || "",
                    content: item.content || "",
                    createdAt: item.created_at,
                    media: item.image_url || "",
                    liked,
                    likesCount,
                    saved: savedPostIds.has(String(item.id)),
                    comments: []
                };
            })
        );

        window.clgLoadedPosts = loadedPosts;

    } catch (error) {
        console.error("Error loading posts:", error);
        return;
    }

    recentPosts.querySelectorAll("[data-user-post]")
        .forEach(post => post.remove());

    loadedPosts.forEach(post => {
        if (!post || typeof post.content !== "string") return;

        const article = document.createElement("article");
        article.className = "post-card";
        article.dataset.userPost = post.id;

        const header = document.createElement("div");
        header.className = "post-header";

        const avatar = document.createElement("div");
        avatar.className = "anonymous-avatar";
        avatar.innerHTML = '<i class="fa-solid fa-user-secret"></i>';

        const author = document.createElement("div");
        author.className = "post-author";

        const name = document.createElement("strong");
        name.textContent = "Anonymous Student";

        const date = document.createElement("small");
        const timestamp = new Date(post.createdAt);

        date.textContent = Number.isNaN(timestamp.getTime())
            ? "Recently"
            : timestamp.toLocaleString();

        author.append(name, date);
        header.append(avatar, author);

        const postBody = document.createElement("div");
        postBody.className = "user-post-body";

        if (post.title) {
            const title = document.createElement("h3");
            title.className = "user-post-title";
            title.textContent = post.title;
            postBody.appendChild(title);
        }

        const description = document.createElement("p");
        description.className = "user-post-description";
        description.textContent = post.content;
        postBody.appendChild(description);

        if (post.media && typeof post.media === "string") {
            if (
                post.media.startsWith("data:image/") ||
                post.media.startsWith("http://") ||
                post.media.startsWith("https://")
            ) {
                const image = document.createElement("img");
                image.src = post.media;
                image.alt = post.title || "Post image";
                image.className = "user-post-media";
                image.loading = "lazy";
                postBody.appendChild(image);
            } else if (post.media.startsWith("data:video/")) {
                const video = document.createElement("video");
                video.src = post.media;
                video.className = "user-post-media";
                video.controls = true;
                video.preload = "metadata";
                postBody.appendChild(video);
            }
        }

        const actions = document.createElement("div");
        actions.className = "post-actions";

        const likeBtn = document.createElement("button");
        likeBtn.type = "button";
        likeBtn.className = "like-btn";
        likeBtn.innerHTML =
            '<i class="fa-regular fa-heart"></i> <span>Like</span>';

        const commentBtn = document.createElement("button");
        commentBtn.type = "button";
        commentBtn.className = "comment-btn";
        commentBtn.innerHTML =
            '<i class="fa-regular fa-comment"></i> <span>Comment</span>';

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "save-btn";
        saveBtn.innerHTML =
            '<i class="fa-regular fa-bookmark"></i> <span>Save</span>';

        actions.append(likeBtn, commentBtn, saveBtn);

        if (post.isMine) {
            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "edit-post-btn";
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit';

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-post-btn";
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';

            actions.append(editBtn, deleteBtn);

            editBtn.addEventListener("click", async () => {
                const newTitle = prompt("Edit post title:", post.title || "");
                if (newTitle === null) return;

                const newContent = prompt("Edit post content:", post.content);
                if (newContent === null || !newContent.trim()) return;

                try {
                    const response = await authenticatedFetch(
                        `${API}/posts/${post.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                title: newTitle,
                                content: newContent
                            })
                        }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || "Update failed.");
                    }

                    alert("Post updated successfully!");
                    await renderUserPosts();

                } catch (error) {
                    alert(error.message);
                }
            });

            deleteBtn.addEventListener("click", async () => {
                if (!confirm("Are you sure you want to delete this post?")) {
                    return;
                }

                try {
                    const response = await authenticatedFetch(
                        `${API}/posts/${post.id}`,
                        { method: "DELETE" }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || "Delete failed.");
                    }

                    alert("Post deleted successfully!");
                    await renderUserPosts();

                } catch (error) {
                    alert(error.message);
                }
            });
        }

        const commentArea = document.createElement("div");
        commentArea.className = "comment-area";
        commentArea.hidden = true;

        const commentInput = document.createElement("input");
        commentInput.type = "text";
        commentInput.placeholder = "Write a comment...";

        const sendComment = document.createElement("button");
        sendComment.type = "button";
        sendComment.className = "send-comment";
        sendComment.textContent = "Send";

        const commentList = document.createElement("div");
        commentList.className = "comment-list";

        commentArea.append(commentInput, sendComment, commentList);

        async function loadComments() {
            try {
                const response = await authenticatedFetch(
                    `${API}/comments/${post.id}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Could not load comments.");
                }

                commentList.replaceChildren();

                const comments = Array.isArray(data.comments)
                    ? data.comments
                    : [];

                comments.forEach(comment => {
                    const item = document.createElement("div");
                    item.className = "comment-item";

                    const text = document.createElement("span");
                    text.textContent = comment.content;
                    item.appendChild(text);

                    if (comment.is_mine) {
                        const deleteBtn = document.createElement("button");
                        deleteBtn.type = "button";
                        deleteBtn.textContent = "Delete";
                        deleteBtn.className = "delete-comment-btn";

                        deleteBtn.addEventListener("click", async () => {
                            if (!confirm("Delete this comment?")) return;

                            try {
                                const deleteResponse = await authenticatedFetch(
                                    `${API}/comments/${comment.id}`,
                                    { method: "DELETE" }
                                );

                                const result = await deleteResponse.json();

                                if (!deleteResponse.ok) {
                                    throw new Error(
                                        result.message || "Could not delete comment."
                                    );
                                }

                                await loadComments();

                            } catch (error) {
                                alert(error.message);
                            }
                        });

                        item.appendChild(deleteBtn);
                    }

                    commentList.appendChild(item);
                });

            } catch (error) {
                console.error("Comment loading error:", error);
            }
        }

        likeBtn.classList.toggle("active", post.liked);
        likeBtn.querySelector("i").className = post.liked
            ? "fa-solid fa-heart"
            : "fa-regular fa-heart";
        likeBtn.querySelector("span").textContent =
            post.liked ? "Liked" : "Like";

        saveBtn.classList.toggle("active", post.saved);
        saveBtn.querySelector("i").className = post.saved
            ? "fa-solid fa-bookmark"
            : "fa-regular fa-bookmark";
        saveBtn.querySelector("span").textContent =
            post.saved ? "Saved" : "Save";

        likeBtn.addEventListener("click", async () => {
            const currentlyLiked = likeBtn.classList.contains("active");
            likeBtn.disabled = true;

            try {
                const response = await authenticatedFetch(
                    `${API}/likes/${post.id}`,
                    {
                        method: currentlyLiked ? "DELETE" : "POST"
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Like action failed.");
                }

                await renderUserPosts();

            } catch (error) {
                alert(error.message);
                likeBtn.disabled = false;
            }
        });

        saveBtn.addEventListener("click", async () => {
            const currentlySaved = saveBtn.classList.contains("active");
            saveBtn.disabled = true;

            try {
                const response = await authenticatedFetch(
                    `${API}/saved-posts/${post.id}`,
                    {
                        method: currentlySaved ? "DELETE" : "POST"
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Could not update saved post.");
                }

                await renderUserPosts();

            } catch (error) {
                alert(error.message);
                saveBtn.disabled = false;
            }
        });

        commentBtn.addEventListener("click", async () => {
            commentArea.hidden = !commentArea.hidden;

            if (!commentArea.hidden) {
                commentInput.focus();
                await loadComments();
            }
        });

        async function addComment() {
            const value = commentInput.value.trim();
            if (!value) return;

            sendComment.disabled = true;

            try {
                const response = await authenticatedFetch(
                    `${API}/comments/${post.id}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ content: value })
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Could not add comment.");
                }

                commentInput.value = "";
                await loadComments();

            } catch (error) {
                alert(error.message);
            } finally {
                sendComment.disabled = false;
            }
        }

        sendComment.addEventListener("click", addComment);

        commentInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                addComment();
            }
        });

        article.append(header, postBody, actions, commentArea);
        recentPosts.prepend(article);
    });
}


// Refresh post data after account information is ready.
currentUserPromise.then(user => {
    if (user) renderUserPosts();
});


// =====================================
// PERSONAL POSTS CACHE
// =====================================

function getMyPosts() {
    return loadedPosts.filter(post => post.isMine);
}

function getLikedPosts() {
    return loadedPosts.filter(post => post.liked);
}

function getSavedPosts() {
    return loadedPosts.filter(post => post.saved);
}


// =====================================
// COMMUNITIES AND MY POSTS
// =====================================

communitiesBtn.addEventListener("click", event => {
    event.preventDefault();
    openCommunitiesPanel("mine");
});

document.getElementById("viewCommunities").addEventListener("click", () => {
    openCommunitiesPanel("explore");
});

document.getElementById("myPostsBtn").addEventListener("click", async () => {
    await renderUserPosts();

    const posts = getMyPosts();
    const content = document.createElement("div");

    if (!posts.length) {
        content.textContent = "You haven't created any posts yet.";
    } else {
        posts.forEach(post => {
            const item = document.createElement("article");
            item.className = "my-post-item";

            const heading = document.createElement("h3");
            heading.textContent = post.title || "Untitled Post";

            const text = document.createElement("p");
            text.textContent = post.content;

            const date = document.createElement("small");
            const timestamp = new Date(post.createdAt);

            date.textContent = Number.isNaN(timestamp.getTime())
                ? "Recently"
                : timestamp.toLocaleString();

            item.append(heading, text, date);

            if (post.media && /^https?:\/\//i.test(post.media)) {
                const image = document.createElement("img");
                image.src = post.media;
                image.alt = post.title || "Post image";
                image.className = "user-post-media";
                item.appendChild(image);
            }

            content.appendChild(item);
        });
    }

    openDialog("My Posts", content);
});


// =====================================
// SAVED, FAVORITE, SETTINGS, PROFILE
// =====================================

document.querySelectorAll("[data-panel]").forEach(button => {
    button.addEventListener("click", async () => {
        const type = button.dataset.panel;

        if (type === "favorite" || type === "saved") {
            await renderUserPosts();

            const posts = type === "favorite"
                ? getLikedPosts()
                : getSavedPosts();

            const content = document.createElement("div");

            if (!posts.length) {
                content.textContent = type === "favorite"
                    ? "Your liked posts will appear here."
                    : "Your saved posts will appear here.";
            } else {
                posts.forEach(post => {
                    const item = document.createElement("article");
                    item.className = "my-post-item";

                    const title = document.createElement("h3");
                    title.textContent = post.title || "Untitled post";

                    const description = document.createElement("p");
                    description.textContent = post.content || "";

                    item.append(title, description);

                    content.appendChild(item);
                });
            }

            openDialog(
                type === "favorite" ? "Favorite Posts" : "Saved Posts",
                content
            );
            return;
        }

        if (type === "account") {
            openSettings();
            return;
        }

        if (type === "profile") {
            openProfile();
        }
    });
});

// =====================================
// SHARED COMMUNITIES, MEMBERS, POSTS AND CHAT
// =====================================

let communityChatTimer = null;
let communityViewVersion = 0;
let activeCommunityChatId = null;
let communityChatGeneration = 0;

function stopCommunityChatPolling() {
    if (communityChatTimer) window.clearInterval(communityChatTimer);
    communityChatTimer = null;
    activeCommunityChatId = null;
    communityChatGeneration += 1;
}

dialog.addEventListener("close", () => {
    stopCommunityChatPolling();
    communityViewVersion += 1;
});

async function communityRequest(url, options = {}) {
    const response = await authenticatedFetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || "Community request failed.");
    }
    return data;
}

function makeCommunityButton(label, action, className = "community-action-btn") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
}

async function openCommunitiesPanel(mode = "explore") {
    stopCommunityChatPolling();
    const viewVersion = ++communityViewVersion;
    const content = document.createElement("div");
    content.className = "communities-content";
    content.textContent = "Loading communities...";
    openDialog(mode === "mine" ? "My Communities" : "Explore Communities", content);

    try {
        const data = await communityRequest(`${API}/communities`);
        if (viewVersion !== communityViewVersion) return;

        content.replaceChildren();
        const intro = document.createElement("p");
        intro.textContent = mode === "mine"
            ? "Communities you have joined, with their members and discussions."
            : "Find a community, meet members, and join the discussion.";
        content.appendChild(intro);

        const switcher = document.createElement("div");
        switcher.className = "community-detail-tabs";
        switcher.append(
            makeCommunityButton("Explore", () => openCommunitiesPanel("explore"), mode === "explore" ? "community-tab-btn active" : "community-tab-btn"),
            makeCommunityButton("My Communities", () => openCommunitiesPanel("mine"), mode === "mine" ? "community-tab-btn active" : "community-tab-btn"),
            makeCommunityButton("＋ Create", () => showCreateForm("community"), "community-action-btn")
        );
        content.appendChild(switcher);

        const list = document.createElement("div");
        list.className = "community-detail-list";
        const communities = (Array.isArray(data.communities) ? data.communities : [])
            .filter(item => mode !== "mine" || item.is_member);

        if (!communities.length) {
            const empty = document.createElement("p");
            empty.className = "community-empty";
            empty.textContent = mode === "mine"
                ? "You have not joined a community yet. Explore communities to find one."
                : "No communities are available yet. Create the first one.";
            list.appendChild(empty);
        }

        communities.forEach(community => {
            const item = document.createElement("article");
            item.className = "community-item";
            const info = document.createElement("div");
            info.className = "community-item-info";
            const name = document.createElement("strong");
            name.textContent = community.name;
            const description = document.createElement("p");
            description.textContent = community.description || "A campus community.";
            const meta = document.createElement("small");
            meta.textContent = `${community.members_count} ${Number(community.members_count) === 1 ? "member" : "members"}${community.my_role ? ` · ${community.my_role}` : ""}`;
            info.append(name, description, meta);
            const action = community.is_member
                ? makeCommunityButton("Open", () => openCommunityDetails(community.id))
                : makeCommunityButton("Join", async event => {
                    event.currentTarget.disabled = true;
                    try {
                        await communityRequest(`${API}/communities/${community.id}/join`, { method: "POST" });
                        await openCommunityDetails(community.id, "members");
                    } catch (error) {
                        alert(error.message);
                        event.currentTarget.disabled = false;
                    }
                });
            item.append(info, action);
            list.appendChild(item);
        });
        content.appendChild(list);
    } catch (error) {
        if (viewVersion !== communityViewVersion) return;
        content.replaceChildren();
        const message = document.createElement("p");
        message.className = "community-empty";
        message.textContent = error.message;
        content.appendChild(message);
    }
}

async function openCommunityDetails(communityId, selectedTab = "posts") {
    stopCommunityChatPolling();
    const viewVersion = ++communityViewVersion;
    const loading = document.createElement("p");
    loading.className = "community-empty";
    loading.textContent = "Loading community...";
    openDialog("Community", loading);

    try {
        const data = await communityRequest(`${API}/communities/${communityId}`);
        if (viewVersion !== communityViewVersion) return;
        const content = document.createElement("div");
        content.className = "community-detail";
        const description = document.createElement("p");
        description.className = "community-description";
        description.textContent = data.community.description || "A campus community.";
        const meta = document.createElement("p");
        meta.className = "community-detail-meta";
        meta.textContent = `${data.members.length} ${data.members.length === 1 ? "member" : "members"} · Led by ${data.community.leader_name}`;
        const tabs = document.createElement("div");
        tabs.className = "community-detail-tabs";
        const panel = document.createElement("section");
        panel.className = "community-detail-panel";
        content.append(description, meta, tabs, panel);
        let tabRequestId = 0;

        const renderTab = async tab => {
            stopCommunityChatPolling();
            const currentTabId = ++tabRequestId;
            const isCurrentTab = () =>
                viewVersion === communityViewVersion && currentTabId === tabRequestId;
            panel.replaceChildren();
            tabs.replaceChildren();
            ["posts", "members", "chat"].forEach(name => {
                tabs.appendChild(makeCommunityButton(
                    name[0].toUpperCase() + name.slice(1),
                    () => renderTab(name),
                    name === tab ? "community-tab-btn active" : "community-tab-btn"
                ));
            });

            if (tab === "posts") {
                await renderCommunityPosts(communityId, data.my_role, panel, isCurrentTab);
            } else if (tab === "members") {
                renderCommunityMembers(communityId, data, panel, () => openCommunityDetails(communityId, "members"));
            } else {
                await renderCommunityChat(communityId, panel, isCurrentTab);
            }
        };

        openDialog(data.community.name, content);
        await renderTab(selectedTab);
    } catch (error) {
        if (viewVersion !== communityViewVersion) return;
        const message = document.createElement("p");
        message.className = "community-empty";
        message.textContent = error.message;
        openDialog("Community", message);
    }
}

async function renderCommunityPosts(communityId, myRole, panel, isCurrentTab) {
    const composer = document.createElement("form");
    composer.className = "community-post-composer";
    const title = document.createElement("input");
    title.placeholder = "Post title (optional)";
    title.maxLength = 200;
    const text = document.createElement("textarea");
    text.placeholder = "Share something with this community...";
    text.maxLength = 2000;
    text.required = true;
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "community-action-btn";
    submit.textContent = "Share post";
    composer.append(title, text, submit);
    composer.addEventListener("submit", async event => {
        event.preventDefault();
        submit.disabled = true;
        try {
            await communityRequest(`${API}/posts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.value.trim(), content: text.value.trim(), community_id: communityId })
            });
            await openCommunityDetails(communityId, "posts");
        } catch (error) {
            alert(error.message);
            submit.disabled = false;
        }
    });
    panel.appendChild(composer);

    try {
        const data = await communityRequest(`${API}/communities/${communityId}/posts`);
        if (!isCurrentTab()) return;
        if (!data.posts.length) {
            const empty = document.createElement("p");
            empty.className = "community-empty";
            empty.textContent = "No posts yet. Start the conversation with a post.";
            panel.appendChild(empty);
        }
        data.posts.forEach(post => {
            const card = document.createElement("article");
            card.className = "community-post-card";
            const author = document.createElement("strong");
            author.textContent = post.username;
            const date = document.createElement("small");
            date.textContent = new Date(post.created_at).toLocaleString();
            const body = document.createElement("p");
            body.textContent = post.content;
            card.append(author, date);
            if (post.title) {
                const heading = document.createElement("h4");
                heading.textContent = post.title;
                card.appendChild(heading);
            }
            card.appendChild(body);
            if (post.is_mine || myRole === "leader") {
                card.appendChild(makeCommunityButton("Delete post", async () => {
                    if (!confirm("Delete this post?")) return;
                    try {
                        await communityRequest(`${API}/posts/${post.id}`, { method: "DELETE" });
                        await openCommunityDetails(communityId, "posts");
                    } catch (error) {
                        alert(error.message);
                    }
                }, "community-danger-btn"));
            }
            panel.appendChild(card);
        });
    } catch (error) {
        if (!isCurrentTab()) return;
        const message = document.createElement("p");
        message.className = "community-empty";
        message.textContent = error.message;
        panel.appendChild(message);
    }
}

function renderCommunityMembers(communityId, data, panel, refresh) {
    const members = document.createElement("div");
    members.className = "community-member-list";
    const leaderControls = data.my_role === "leader";

    data.members.forEach(member => {
        const row = document.createElement("article");
        row.className = "community-member-row";
        const identity = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = member.username;
        const role = document.createElement("small");
        role.textContent = member.role;
        identity.append(name, role);
        row.appendChild(identity);

        if (leaderControls && member.role !== "leader") {
            const roleButton = makeCommunityButton(
                member.role === "admin" ? "Remove admin" : "Make admin",
                async () => {
                    try {
                        await communityRequest(`${API}/communities/${communityId}/members/${member.id}/role`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ role: member.role === "admin" ? "member" : "admin" })
                        });
                        await refresh();
                    } catch (error) { alert(error.message); }
                }
            );
            const removeButton = makeCommunityButton("Remove", async () => {
                if (!confirm(`Remove ${member.username} from this community?`)) return;
                try {
                    await communityRequest(`${API}/communities/${communityId}/members/${member.id}`, { method: "DELETE" });
                    await refresh();
                } catch (error) { alert(error.message); }
            }, "community-danger-btn");
            row.append(roleButton, removeButton);
        }
        members.appendChild(row);
    });
    panel.appendChild(members);

    if (data.my_role !== "leader") {
        panel.appendChild(makeCommunityButton("Leave community", async () => {
            if (!confirm("Leave this community?")) return;
            try {
                await communityRequest(`${API}/communities/${communityId}/leave`, { method: "DELETE" });
                await openCommunitiesPanel("mine");
            } catch (error) { alert(error.message); }
        }, "community-danger-btn"));
    }
}

async function renderCommunityChat(communityId, panel, isCurrentTab) {
    const chatGeneration = ++communityChatGeneration;
    const messages = document.createElement("div");
    messages.className = "community-chat-feed";
    messages.setAttribute("aria-live", "polite");
    const form = document.createElement("form");
    form.className = "community-chat-composer";
    const input = document.createElement("input");
    input.maxLength = 500;
    input.placeholder = "Write a message to members...";
    input.required = true;
    const send = document.createElement("button");
    send.type = "submit";
    send.className = "community-action-btn";
    send.textContent = "Send";
    form.append(input, send);
    panel.append(messages, form);

    let lastMessageId = 0;
    const appendMessages = async () => {
        const data = await communityRequest(`${API}/communities/${communityId}/messages?afterId=${lastMessageId}`);
        if (!isCurrentTab() ||
            chatGeneration !== communityChatGeneration ||
            activeCommunityChatId !== String(communityId)) return;
        data.messages.forEach(message => {
            const item = document.createElement("article");
            item.className = "community-chat-message";
            const heading = document.createElement("strong");
            heading.textContent = message.username;
            const time = document.createElement("small");
            time.textContent = new Date(message.created_at).toLocaleTimeString();
            const text = document.createElement("p");
            text.textContent = message.content;
            item.append(heading, time, text);
            messages.appendChild(item);
            lastMessageId = Math.max(lastMessageId, Number(message.id));
        });
        if (messages.childElementCount) messages.scrollTop = messages.scrollHeight;
    };

    activeCommunityChatId = String(communityId);
    try {
        await appendMessages();
    } catch (error) {
        if (!isCurrentTab() || chatGeneration !== communityChatGeneration) return;
        const empty = document.createElement("p");
        empty.className = "community-empty";
        empty.textContent = error.message;
        messages.appendChild(empty);
    }
    if (!isCurrentTab() || chatGeneration !== communityChatGeneration) return;
    communityChatTimer = window.setInterval(() => {
        appendMessages().catch(error => console.error("Community chat refresh failed:", error));
    }, 3000);

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const content = input.value.trim();
        if (!content) return;
        send.disabled = true;
        try {
            await communityRequest(`${API}/communities/${communityId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });
            input.value = "";
            await appendMessages();
        } catch (error) {
            alert(error.message);
        } finally {
            send.disabled = false;
            input.focus();
        }
    });
}

// =====================================
// SETTINGS - ACCOUNT SPECIFIC
// =====================================

async function openSettings() {
    await currentUserPromise;
    if (!currentUserId) return;
    const saved = readAccountStorage("clgSettings", {});
    const settings = { notifications: true, privateProfile: false, theme: "dark",
        feedSuggestions: true, showActivity: true, ...saved };
    const content = document.createElement("div");
    content.className = "settings-content settings-layout";
    content.innerHTML = `
      <aside class="settings-sidebar">
        <label class="settings-search"><i class="fa-solid fa-magnifying-glass"></i><input id="settingsSearch" type="search" placeholder="Find a setting..."></label>
        <nav class="settings-nav">
          <button class="settings-tab active" data-tab="appearance"><i class="fa-solid fa-palette"></i> Appearance</button>
          <button class="settings-tab" data-tab="notifications"><i class="fa-regular fa-bell"></i> Notifications</button>
          <button class="settings-tab" data-tab="privacy"><i class="fa-solid fa-shield-halved"></i> Privacy</button>
          <button class="settings-tab" data-tab="feed"><i class="fa-solid fa-list"></i> Feed</button>
        </nav>
      </aside>
      <section class="settings-main">
        <div class="settings-pane" data-pane="appearance"><h3>Appearance</h3><p>Personalize how CLG Connect looks on your device.</p><h4>Choose your theme</h4>
          <div class="theme-choices">
            <button type="button" class="theme-choice" data-theme="dark"><span class="theme-preview dark-preview"><i class="fa-solid fa-moon"></i></span><b>Dark</b></button>
            <button type="button" class="theme-choice" data-theme="light"><span class="theme-preview light-preview"><i class="fa-solid fa-sun"></i></span><b>Light</b></button>
          </div><div class="settings-note"><i class="fa-solid fa-circle-info"></i> Your appearance preference is saved on this device.</div>
        </div>
        <div class="settings-pane" data-pane="notifications" hidden><h3>Notifications</h3><p>Choose which updates you want to receive.</p><label class="settings-toggle"><span><b>Enable notifications</b><small>Receive updates about your activity.</small></span><input id="settingNotifications" type="checkbox"></label></div>
        <div class="settings-pane" data-pane="privacy" hidden><h3>Privacy</h3><p>Control how your profile is shown.</p><label class="settings-toggle"><span><b>Keep my profile private</b><small>Limit who can view your profile information.</small></span><input id="settingPrivate" type="checkbox"></label><label class="settings-toggle"><span><b>Show my activity</b><small>Allow others to see your public activity.</small></span><input id="settingActivity" type="checkbox"></label></div>
        <div class="settings-pane" data-pane="feed" hidden><h3>Feed</h3><p>Personalize the content shown in your feed.</p><label class="settings-toggle"><span><b>Suggested content</b><small>Show recommended posts and topics.</small></span><input id="settingSuggestions" type="checkbox"></label></div>
        <button type="button" id="saveSettingsBtn">Save settings</button><p id="settingsMessage" role="status"></p>
      </section>`;
    openDialog("Settings", content);
    const tabs = [...content.querySelectorAll(".settings-tab")];
    const panes = [...content.querySelectorAll(".settings-pane")];
    function showPane(name) {
        tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tab === name));
        panes.forEach(pane => pane.hidden = pane.dataset.pane !== name);
    }
    tabs.forEach(tab => tab.addEventListener("click", () => showPane(tab.dataset.tab)));
    content.querySelector("#settingsSearch").addEventListener("input", event => {
        const q = event.target.value.trim().toLowerCase();
        const match = tabs.find(tab => tab.textContent.toLowerCase().includes(q));
        if (q && match) showPane(match.dataset.tab);
        else if (!q) showPane("appearance");
    });
    content.querySelectorAll(".theme-choice").forEach(button => {
        button.classList.toggle("selected", button.dataset.theme === settings.theme);
        button.addEventListener("click", () => {
            settings.theme = button.dataset.theme;
            content.querySelectorAll(".theme-choice").forEach(item => item.classList.toggle("selected", item.dataset.theme === settings.theme));
            content.dataset.theme = settings.theme;
            dialog.dataset.theme = settings.theme;
        });
    });
    content.querySelector("#settingNotifications").checked = !!settings.notifications;
    content.querySelector("#settingPrivate").checked = !!settings.privateProfile;
    content.querySelector("#settingActivity").checked = settings.showActivity !== false;
    content.querySelector("#settingSuggestions").checked = settings.feedSuggestions !== false;
    content.dataset.theme = settings.theme;
    dialog.dataset.theme = settings.theme;
    content.querySelector("#saveSettingsBtn").addEventListener("click", () => {
        const updated = {
            theme: settings.theme,
            notifications: content.querySelector("#settingNotifications").checked,
            privateProfile: content.querySelector("#settingPrivate").checked,
            showActivity: content.querySelector("#settingActivity").checked,
            feedSuggestions: content.querySelector("#settingSuggestions").checked
        };
        writeAccountStorage("clgSettings", updated);
        localStorage.setItem("clgConnectTheme", updated.theme);
        dialog.dataset.theme = updated.theme;
        content.querySelector("#settingsMessage").textContent = "Settings saved successfully!";
    });
}


// PROFILE - ACCOUNT SPECIFIC
// =====================================

async function openProfile() {
    await currentUserPromise;
    if (!currentUserId) return;
    try {
        const response = await authenticatedFetch(`${API}/auth/me`);
        const data = await response.json();
        if (!response.ok || !data.user) throw new Error(data.message || "Unable to load profile.");
        loggedInUser = data.user;
        const profile = readAccountStorage("clgProfile", { about: "", interests: [] });
        let savedInterests = [];
        try {
            const interestsResponse = await authenticatedFetch(`${API}/interests`);
            const interestsData = await interestsResponse.json();
            if (interestsResponse.ok && Array.isArray(interestsData.interests)) {
                savedInterests = interestsData.interests;
            }
        } catch (interestError) {
            console.error("Interest loading error:", interestError);
        }
        const profileInterests = Array.isArray(profile.interests) ? profile.interests : [];
        let locallySavedInterests = [];
        try {
            const storedInterests = JSON.parse(localStorage.getItem("userInterests") || "[]");
            if (Array.isArray(storedInterests)) locallySavedInterests = storedInterests;
        } catch (storageError) {
            console.warn("Saved local interests could not be read:", storageError);
        }
        const interests = profileInterests.length
            ? profileInterests
            : savedInterests.length ? savedInterests : locallySavedInterests;
        const interestMarkup = interests.length
            ? `<div class="profile-interest-tags">${interests.map(interest => `<span class="profile-interest-tag">${escapeHTML(interest)}</span>`).join("")}</div>`
            : "<p>No interests selected yet.</p>";
        const myPosts = loadedPosts.filter(post => post.isMine);
        const likedPosts = loadedPosts.filter(post => post.liked);
        const savedPosts = loadedPosts.filter(post => post.saved);
        const username = loggedInUser.username || "Campus Explorer";
        const avatarText = (username.trim()[0] || "C").toUpperCase();
        const content = document.createElement("div");
        content.className = "profile-content profile-redesign";
        content.innerHTML = `
          <header class="profile-hero"><div class="profile-avatar">${avatarText}</div>
            <div class="profile-identity"><h3>${escapeHTML(username)}</h3><p>@${escapeHTML(username.toLowerCase().replace(/[^a-z0-9_]/g, "-"))}</p><small>Anonymous campus member</small></div>
            <button type="button" class="profile-edit-btn" id="editProfileBtn"><i class="fa-solid fa-pen"></i> Edit Profile</button>
          </header>
          <div class="profile-dashboard">
            <section class="profile-info-card"><h4>About Me</h4><p>${escapeHTML(profile.about || "Here to learn, share, and connect anonymously.")}</p><div class="profile-meta">♟ Anonymous profile<br>🎓 CLG Connect member</div></section>
            <section class="profile-activity"><h4>My Activity</h4><div class="activity-grid">
              <article class="activity-card"><i class="fa-solid fa-file-lines"></i><b>My Posts</b><small>Your published posts</small><strong>${myPosts.length}</strong></article>
              <article class="activity-card"><i class="fa-regular fa-comment"></i><b>My Comments</b><small>Posts with comments</small><strong>—</strong></article>
              <article class="activity-card"><i class="fa-regular fa-heart"></i><b>Liked Posts</b><small>Your liked posts</small><strong>${likedPosts.length}</strong></article>
              <article class="activity-card"><i class="fa-regular fa-bookmark"></i><b>Saved Posts</b><small>Your saved posts</small><strong>${savedPosts.length || savedPostIds.size}</strong></article>
            </div></section>
            <section class="profile-interest-card"><h4>💗 My Interests</h4>${interestMarkup}</section>
            <section class="profile-stats-grid"><div><b>${myPosts.length}</b><span>Posts</span></div><div><b>${likedPosts.length}</b><span>Liked</span></div><div><b>${savedPosts.length || savedPostIds.size}</b><span>Saved</span></div><div><b>—</b><span>Comments</span></div></section>
          </div>
          <footer class="profile-logout-section">
            <button type="button" class="profile-logout-btn" id="profileLogoutBtn"><i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>Log out</button>
          </footer>`;
        content.querySelector("#profileLogoutBtn").addEventListener("click", () => {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            window.location.replace("../login/login.html");
        });
        content.querySelector("#editProfileBtn").addEventListener("click", () => {
            const form = document.createElement("div");
            form.className = "profile-edit-form";
            const aboutInput = document.createElement("textarea");
            aboutInput.placeholder = "Tell students something about yourself...";
            aboutInput.value = profile.about || "";
            const interestsInput = document.createElement("input");
            interestsInput.type = "text";
            interestsInput.placeholder = "Interests separated by commas";
            interestsInput.value = interests.join(", ");
            const saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.textContent = "Save Profile";
            form.append(aboutInput, interestsInput, saveButton);
            saveButton.addEventListener("click", () => {
                writeAccountStorage("clgProfile", {
                    about: aboutInput.value.trim(),
                    interests: interestsInput.value.split(",").map(item => item.trim()).filter(Boolean)
                });
                openProfile();
            });
            openDialog("Edit Profile", form);
        });
        openDialog("My Profile", content);
    } catch (error) {
        console.error("Profile loading error:", error);
        openDialog("Profile", `<p>${escapeHTML(error.message)}</p>`);
    }
}
