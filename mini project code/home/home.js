
/* =====================================
   CLG CONNECT - HOME JAVASCRIPT
===================================== */

// ELEMENTS
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

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    searchResults.replaceChildren();

    if (!query) {
        searchResults.textContent =
            "Search posts, communities, videos and topics.";
        return;
    }

    const savedPosts = readStorage("clgPosts", []);

    const allContent = [
        ...searchableContent,
        ...(Array.isArray(savedPosts)
            ? savedPosts.map(post => ({
                title: post.content,
                type: "Post",
                keywords: post.content
            }))
            : [])
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
            placeholder: "Enter your community name..."
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
    let mediaInput = null;
    let preview = null;
    let mediaURL = "";

    // TITLE: shown for posts only
    if (type === "post") {
        const titleLabel = document.createElement("label");
        titleLabel.textContent = "Post Title";

        titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.placeholder = "Give your post a catchy title...";
        titleInput.maxLength = 100;
        titleInput.required = true;
        titleInput.className = "create-title-input";

        titleLabel.htmlFor = "newPostTitle";
        titleInput.id = "newPostTitle";

        form.append(titleLabel, titleInput);
    }

    // DESCRIPTION / MAIN CONTENT
    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent =
        type === "post" ? "Description" : "Your content";

    const textarea = document.createElement("textarea");
    textarea.placeholder = config.placeholder;
    textarea.required = true;
    textarea.maxLength = type === "community" ? 60 : 2000;
    textarea.className = "create-description-input";

    form.append(descriptionLabel, textarea);

    
    // POST EMOJIS AND MEDIA
    if (type === "post") {
        const tools = document.createElement("div");
        tools.className = "create-post-tools";

        // Emoji icon button
        const emojiButton = document.createElement("button");
        emojiButton.type = "button";
        emojiButton.className = "create-tool-button icon-only";
        emojiButton.textContent = "😊";
        emojiButton.title = "Add emoji";
        emojiButton.setAttribute("aria-label", "Add emoji");

        // Emoji picker
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

        // Photo / Video icon button
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

        // Preview selected image or video
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

        // IMPORTANT: Attach the input and toolbar buttons
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

    form.addEventListener("submit", event => {
        event.preventDefault();

        const value = textarea.value.trim();
        const postTitle = titleInput ? titleInput.value.trim() : "";

        if (!value || (titleInput && !postTitle)) {
            error.textContent = "Please fill in all required fields.";
            error.hidden = false;
            return;
        }

        error.hidden = true;

        // CREATE COMMUNITY
        if (type === "community") {
            const communities = readStorage("clgCustomCommunities", []);

            if (!Array.isArray(communities)) {
                error.textContent = "Unable to read saved communities.";
                error.hidden = false;
                return;
            }

            const exists = [
                ...availableCommunities,
                ...communities
            ].some(community =>
                community.name.toLowerCase() === value.toLowerCase()
            );

            if (exists) {
                error.textContent = "This community already exists.";
                error.hidden = false;
                return;
            }

            try {
                communities.unshift({
                    name: value,
                    description: "A community created by a student",
                    icon: "fa-users"
                });

                writeStorage("clgCustomCommunities", communities);

                saveJoinedCommunities([
                    ...getJoinedCommunities(),
                    value
                ]);

                dialog.close();
                openCommunitiesPanel("mine");
            } catch (err) {
                error.textContent = "Unable to save this community.";
                error.hidden = false;
            }

            return;
        }

        // SAVE POST
        if (type === "post") {
            try {
                const posts = readStorage("clgPosts", []);

                if (!Array.isArray(posts)) {
                    throw new Error("Invalid posts data");
                }

                let mediaData = "";

                // Store a small selected file for this local demo.
                if (mediaInput && mediaInput.files[0]) {
                    const file = mediaInput.files[0];
                    const reader = new FileReader();

                    reader.onload = () => {
                        saveNewPost(posts, postTitle, value, reader.result);
                    };

                    reader.onerror = () => {
                        error.textContent = "Could not read the selected file.";
                        error.hidden = false;
                    };

                    reader.readAsDataURL(file);
                    submit.disabled = true;
                    submit.textContent = "Publishing...";
                    return;
                }

                saveNewPost(posts, postTitle, value, mediaData);

            } catch (err) {
                console.error(err);
                error.textContent =
                    "Unable to publish. Try removing the attached media.";
                error.hidden = false;
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

    function saveNewPost(posts, postTitle, description, mediaData) {
        try {
            posts.unshift({
                id: Date.now().toString(),
                title: postTitle,
                content: description,
                media: mediaData,
                createdAt: new Date().toISOString(),
                likes: 0,
                comments: [],
                saved: false
            });

            writeStorage("clgPosts", posts);
            renderUserPosts();

            dialog.close();

            openDialog(
                "Post Published!",
                "<p>Your post has been published successfully.</p>"
            );

            if (searchInput.value.trim()) {
                searchInput.dispatchEvent(new Event("input"));
            }
        } catch (err) {
            console.error(err);
            submit.disabled = false;
            submit.textContent = "✨ Publish Post";
            error.textContent =
                "Unable to save the post. Try a smaller image or video.";
            error.hidden = false;
        }
    }
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


function renderUserPosts() {
    if (!recentPosts) return;

    const posts = readStorage("clgPosts", []);

    recentPosts.querySelectorAll("[data-user-post]")
        .forEach(post => post.remove());

    if (!Array.isArray(posts)) return;

    [...posts].forEach(post => {
        if (!post || typeof post.content !== "string") return;

        const article = document.createElement("article");
        article.className = "post-card";
        article.dataset.userPost = post.id;

        // Header
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

        // Post content
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

        // Display image or video
        if (post.media && typeof post.media === "string") {
            if (post.media.startsWith("data:image/")) {
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

        // Actions
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

        // Comments
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

        // Restore saved state
        likeBtn.classList.toggle("active", !!post.liked);
        likeBtn.querySelector("i").className = post.liked
            ? "fa-solid fa-heart"
            : "fa-regular fa-heart";
        likeBtn.querySelector("span").textContent =
            post.liked ? "Liked" : "Like";

        saveBtn.classList.toggle("active", !!post.saved);
        saveBtn.querySelector("i").className = post.saved
            ? "fa-solid fa-bookmark"
            : "fa-regular fa-bookmark";
        saveBtn.querySelector("span").textContent =
            post.saved ? "Saved" : "Save";

        // Like
        likeBtn.addEventListener("click", () => {
            updateStoredPost(post.id, item => {
                item.liked = !item.liked;
            });
            renderUserPosts();
        });

        // Save
        saveBtn.addEventListener("click", () => {
            updateStoredPost(post.id, item => {
                item.saved = !item.saved;
            });
            renderUserPosts();
        });

        // Show existing comments
        if (Array.isArray(post.comments)) {
            post.comments.forEach(commentText => {
                const comment = document.createElement("p");
                comment.textContent = "Anonymous: " + commentText;
                commentList.appendChild(comment);
            });
        }

        commentBtn.addEventListener("click", () => {
            commentArea.hidden = !commentArea.hidden;
            if (!commentArea.hidden) commentInput.focus();
        });

        function addComment() {
            const value = commentInput.value.trim();
            if (!value) return;

            updateStoredPost(post.id, item => {
                if (!Array.isArray(item.comments)) {
                    item.comments = [];
                }
                item.comments.push(value);
            });

            renderUserPosts();
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



function updateStoredPost(postId, update) {
    try {
        const posts = readStorage("clgPosts", []);
        if (!Array.isArray(posts)) return;

        const post = posts.find(item => item.id === postId);
        if (!post) return;

        update(post);
        writeStorage("clgPosts", posts);
    } catch (error) {
        console.error("Could not update post:", error);
    }
}

renderUserPosts();


// =====================================
// COMMUNITIES AND MY POSTS
// =====================================

communitiesBtn.addEventListener("click", (event) => {
    event.preventDefault();
    openCommunitiesPanel("mine");
});

document.getElementById("viewCommunities").addEventListener("click", () => {
    openCommunitiesPanel("explore");
});

document.getElementById("myPostsBtn").addEventListener("click", () => {
    const posts = readStorage("clgPosts", []);
    const content = document.createElement("div");

    if (!Array.isArray(posts) || posts.length === 0) {
        content.textContent = "You haven't created any posts yet.";
    } else {
        posts.forEach(post => {
            if (!post || typeof post.content !== "string") return;

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

item.append(heading, text);

// Display image or video in My Posts
if (post.media && typeof post.media === "string") {
    if (post.media.startsWith("data:image/")) {
        const image = document.createElement("img");
        image.src = post.media;
        image.alt = post.title || "Post image";
        image.className = "user-post-media";
        item.appendChild(image);
    } else if (post.media.startsWith("data:video/")) {
        const video = document.createElement("video");
        video.src = post.media;
        video.className = "user-post-media";
        video.controls = true;
        item.appendChild(video);
    }
}

item.appendChild(date);

            content.appendChild(item);
        });
    }

    openDialog("My Posts", content);
});



/* =====================================
   SAVED, FAVORITE, SETTINGS, PROFILE
===================================== */

document.querySelectorAll("[data-panel]").forEach(button => {
    button.addEventListener("click", () => {
        const type = button.dataset.panel;

        // FAVORITES: show liked posts
        if (type === "favorite") {
            const posts = readStorage("clgPosts", []);
            const favorites = Array.isArray(posts)
                ? posts.filter(post => post && post.liked)
                : [];

            const content = document.createElement("div");

            if (!favorites.length) {
                content.textContent = "Your liked posts will appear here.";
            } else {
                favorites.forEach(post => {
                    const item = document.createElement("article");
                    item.className = "my-post-item";

                    const title = document.createElement("h3");
                    title.textContent = post.title || "Untitled post";

                    const description = document.createElement("p");
                    description.textContent = post.content || "";

                    item.append(title, description);

                    if (post.media) {
                        const media = document.createElement(
                            post.media.startsWith("data:video/")
                                ? "video" : "img"
                        );

                        media.src = post.media;
                        media.className = "user-post-media";

                        if (media.tagName === "VIDEO") {
                            media.controls = true;
                        }

                        item.appendChild(media);
                    }

                    content.appendChild(item);
                });
            }

            openDialog("Favorite Posts", content);
            return;
        }

        // SAVED POSTS
        if (type === "saved") {
            const posts = readStorage("clgPosts", []);
            const saved = Array.isArray(posts)
                ? posts.filter(post => post && post.saved)
                : [];

            const content = document.createElement("div");

            if (!saved.length) {
                content.textContent = "Your saved posts will appear here.";
            } else {
                saved.forEach(post => {
                    const item = document.createElement("article");
                    item.className = "my-post-item";

                    const title = document.createElement("h3");
                    title.textContent = post.title || "Untitled post";

                    const description = document.createElement("p");
                    description.textContent = post.content || "";

                    item.append(title, description);

                    if (post.media) {
                        const media = document.createElement(
                            post.media.startsWith("data:video/")
                                ? "video" : "img"
                        );

                        media.src = post.media;
                        media.className = "user-post-media";

                        if (media.tagName === "VIDEO") {
                            media.controls = true;
                        }

                        item.appendChild(media);
                    }

                    content.appendChild(item);
                });
            }

            openDialog("Saved Posts", content);
            return;
        }

        // SETTINGS
        if (type === "account") {
            openSettings();
            return;
        }

        // PROFILE
        if (type === "profile") {
            openProfile();
        }
    });
});


/* =====================================
   WEBSITE SETTINGS
===================================== */


function openSettings() {
    const defaults = {
        theme: "dark",
        notifications: true,
        anonymous: true,
        compactFeed: false
    };

    let settings = {
        ...defaults,
        ...readStorage("clgSettings", {})
    };

    const form = document.createElement("form");
    form.className = "clg-settings-form";

    form.innerHTML = `
        <div class="settings-layout">

            <aside class="settings-sidebar">
                <div class="settings-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="search" placeholder="Find a setting..."
                           aria-label="Find a setting">
                </div>

                <button type="button" class="settings-nav active"
                        data-section="appearance">
                    <i class="fa-solid fa-palette"></i> Appearance
                </button>

                <button type="button" class="settings-nav"
                        data-section="notifications">
                    <i class="fa-regular fa-bell"></i> Notifications
                </button>

                <button type="button" class="settings-nav"
                        data-section="privacy">
                    <i class="fa-solid fa-shield-halved"></i> Privacy
                </button>

                <button type="button" class="settings-nav"
                        data-section="feed">
                    <i class="fa-solid fa-list"></i> Feed
                </button>
            </aside>

            <div class="settings-main">

                <section class="settings-section active"
                         data-page="appearance">
                    <h3>Appearance</h3>
                    <p class="settings-description">
                        Personalize how CLG Connect looks on your device.
                    </p>

                    <h4>Choose your theme</h4>

                    <div class="theme-options">
                        <label class="theme-card">
                            <input type="radio" name="theme" value="dark">
                            <span class="theme-preview dark-preview">
                                <i class="fa-solid fa-moon"></i>
                            </span>
                            <strong>Dark</strong>
                        </label>

                        <label class="theme-card">
                            <input type="radio" name="theme" value="light">
                            <span class="theme-preview light-preview">
                                <i class="fa-solid fa-sun"></i>
                            </span>
                            <strong>Light</strong>
                        </label>
                    </div>

                    <div class="settings-info">
                        <i class="fa-solid fa-circle-info"></i>
                        Your appearance preference is saved on this device.
                    </div>
                </section>

                <section class="settings-section"
                         data-page="notifications">
                    <h3>Notifications</h3>
                    <p class="settings-description">
                        Choose how you want to stay updated.
                    </p>

                    <label class="settings-row">
                        <span>
                            <strong>Website notifications</strong>
                            <small>Enable notification preferences.</small>
                        </span>
                        <input type="checkbox" name="notifications">
                    </label>
                </section>

                <section class="settings-section"
                         data-page="privacy">
                    <h3>Privacy</h3>
                    <p class="settings-description">
                        Manage how your identity appears in the community.
                    </p>

                    <label class="settings-row">
                        <span>
                            <strong>Anonymous identity</strong>
                            <small>
                                Use an anonymous identity in community interactions.
                            </small>
                        </span>
                        <input type="checkbox" name="anonymous">
                    </label>

                    <div class="settings-info">
                        <i class="fa-solid fa-shield-halved"></i>
                        This preference controls the setting in your interface;
                        it does not guarantee anonymity of account or server data.
                    </div>
                </section>

                <section class="settings-section" data-page="feed">
                    <h3>Feed preferences</h3>
                    <p class="settings-description">
                        Customize how posts appear in your feed.
                    </p>

                    <label class="settings-row">
                        <span>
                            <strong>Compact feed</strong>
                            <small>
                                Reduce spacing between posts.
                            </small>
                        </span>
                        <input type="checkbox" name="compactFeed">
                    </label>
                </section>

                <div class="settings-footer">
                    <p class="settings-status" aria-live="polite"></p>
                    <button type="submit" class="settings-save-btn">
                        Save settings
                    </button>
                </div>

            </div>
        </div>
    `;

    const themeInputs = form.querySelectorAll('[name="theme"]');
    const notifications = form.elements.notifications;
    const anonymous = form.elements.anonymous;
    const compactFeed = form.elements.compactFeed;
    const status = form.querySelector(".settings-status");

    themeInputs.forEach(input => {
        input.checked = input.value === settings.theme;
    });

    notifications.checked = settings.notifications;
    anonymous.checked = settings.anonymous;
    compactFeed.checked = settings.compactFeed;

    // Switch between settings categories
    const navButtons = form.querySelectorAll(".settings-nav");
    const sections = form.querySelectorAll(".settings-section");

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            navButtons.forEach(item => item.classList.remove("active"));
            sections.forEach(item => item.classList.remove("active"));

            button.classList.add("active");

            const section = form.querySelector(
                `[data-page="${button.dataset.section}"]`
            );

            if (section) section.classList.add("active");
            status.textContent = "";
        });
    });

    // Search settings categories
    const search = form.querySelector(".settings-search input");

    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();

        navButtons.forEach(button => {
            const section = form.querySelector(
                `[data-page="${button.dataset.section}"]`
            );

            const matches = (
                button.textContent + " " +
                (section?.textContent || "")
            ).toLowerCase().includes(query);

            button.hidden = !matches;
        });

        const activeButton = form.querySelector(
            ".settings-nav.active:not([hidden])"
        );

        if (!activeButton) {
            const firstVisible = [...navButtons].find(
                button => !button.hidden
            );

            if (firstVisible) firstVisible.click();
            else sections.forEach(section =>
                section.classList.remove("active")
            );
        }
    });

    form.addEventListener("submit", event => {
        event.preventDefault();

        const selectedTheme = form.querySelector(
            '[name="theme"]:checked'
        );

        settings = {
            theme: selectedTheme?.value || "dark",
            notifications: notifications.checked,
            anonymous: anonymous.checked,
            compactFeed: compactFeed.checked
        };

        try {
            writeStorage("clgSettings", settings);

            document.body.classList.toggle(
                "light-mode", settings.theme === "light"
            );

            document.body.classList.toggle(
                "compact-feed", settings.compactFeed
            );

            status.textContent = "Settings saved successfully!";
        } catch (error) {
            status.textContent = "Could not save settings.";
        }
    });

    openDialog("Settings", form);
}


// Apply saved preferences when the page loads
(function applySavedSettings() {
    const settings = readStorage("clgSettings", {
        theme: "dark",
        notifications: true,
        anonymous: true,
        compactFeed: false
    });

    document.body.classList.toggle(
        "light-mode",
        settings.theme === "light"
    );

    document.body.classList.toggle(
        "compact-feed",
        !!settings.compactFeed
    );
})();



// =====================================
// SAMPLE POST LIKE / SAVE / COMMENT
// =====================================

document.querySelectorAll(
    "#recentPosts > .post-card:not([data-user-post])"
).forEach(post => {
    const likeBtn = post.querySelector(".like-btn");
    const saveBtn = post.querySelector(".save-btn");
    const commentBtn = post.querySelector(".comment-btn");
    const commentArea = post.querySelector(".comment-area");

    if (!likeBtn || !saveBtn || !commentBtn || !commentArea) return;

    const commentInput = commentArea.querySelector("input");
    const sendComment = post.querySelector(".send-comment");
    const commentList = post.querySelector(".comment-list");

    likeBtn.addEventListener("click", () => {
        likeBtn.classList.toggle("active");

        const liked = likeBtn.classList.contains("active");
        likeBtn.querySelector("i").className = liked
            ? "fa-solid fa-heart"
            : "fa-regular fa-heart";
        likeBtn.querySelector("span").textContent =
            liked ? "Liked" : "Like";
    });

    saveBtn.addEventListener("click", () => {
        saveBtn.classList.toggle("active");

        const saved = saveBtn.classList.contains("active");
        saveBtn.querySelector("i").className = saved
            ? "fa-solid fa-bookmark"
            : "fa-regular fa-bookmark";
        saveBtn.querySelector("span").textContent =
            saved ? "Saved" : "Save";
    });

    commentBtn.addEventListener("click", () => {
        commentArea.hidden = !commentArea.hidden;
        if (!commentArea.hidden) commentInput.focus();
    });

    function addSampleComment() {
        const value = commentInput.value.trim();
        if (!value) return;

        const comment = document.createElement("p");
        comment.textContent = "Anonymous: " + value;

        commentList.appendChild(comment);
        commentInput.value = "";
    }

    sendComment.addEventListener("click", addSampleComment);

    commentInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            addSampleComment();
        }
    });
});


// =====================================
// TRENDING TOPICS
// =====================================

document.querySelectorAll("[data-topic]").forEach(button => {
    button.addEventListener("click", () => {
        const topic = button.dataset.topic;

        openDialog(
            topic,
            `<p>Explore anonymous discussions related to ${escapeHTML(topic)}.</p>`
        );
    });
});


// =====================================
// CLOSE PANELS WHEN CLICKING OUTSIDE
// =====================================

document.addEventListener("click", event => {
    if (!searchPanel.contains(event.target) &&
        !searchBtn.contains(event.target)) {
        searchPanel.hidden = true;
    }

    if (!createPanel.contains(event.target) &&
        !createBtn.contains(event.target)) {
        createPanel.hidden = true;
    }
});


// =====================================
// AI ASSISTANT - DEMO RESPONSES
// =====================================

const aiDialog = document.getElementById("aiDialog");
const aiMessages = document.getElementById("aiMessages");
const aiInput = document.getElementById("aiInput");

document.getElementById("aiOpen").addEventListener("click", () => {
    aiDialog.showModal();
});

document.getElementById("aiClose").addEventListener("click", () => {
    aiDialog.close();
});

document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
        aiInput.value = button.dataset.prompt;
        aiInput.focus();
    });
});

document.getElementById("aiForm").addEventListener("submit", event => {
    event.preventDefault();

    const question = aiInput.value.trim();
    if (!question) return;

    const userMessage = document.createElement("div");
    userMessage.className = "ai-user";
    userMessage.textContent = question;
    aiMessages.appendChild(userMessage);

    const botMessage = document.createElement("div");
    botMessage.className = "ai-bot";
    botMessage.textContent = getDemoAnswer(question);
    aiMessages.appendChild(botMessage);

    aiInput.value = "";
    aiMessages.scrollTop = aiMessages.scrollHeight;
});

function getDemoAnswer(question) {
    const text = question.toLowerCase();

    if (text.includes("community") || text.includes("trending")) {
        return "Try communities about coding, placements, college events, hobbies, study groups and campus life.";
    }

    if (text.includes("post") || text.includes("improve")) {
        return "Make your post clear and friendly. Explain your main point, add useful details, and end with a question.";
    }

    return "For campus questions, include relevant details and ask clearly. This is demo mode; live AI answers require a connected AI backend.";
}


// =====================================
// DISPLAY SELECTED INTERESTS
// =====================================

const homeInterests = document.getElementById("homeInterests");

if (homeInterests) {
    const interests = readStorage("userInterests", []);
    homeInterests.replaceChildren();

    if (Array.isArray(interests) && interests.length > 0) {
        interests.forEach(interest => {
            if (typeof interest !== "string") return;

            const tag = document.createElement("span");
            tag.className = "interest-tag";
            tag.textContent = interest;
            homeInterests.appendChild(tag);
        });
    } else {
        homeInterests.textContent =
            "No interests selected yet. Choose your interests to personalize your feed.";
    }
}


// =====================================
// COMMUNITY CHAT WINDOW
// =====================================

const chatWindow = document.getElementById("communityChatWindow");
const chatRoomTitle = document.getElementById("chatRoomTitle");
const chatMessages = document.getElementById("communityChatMessages");
const chatForm = document.getElementById("communityChatForm");
const chatInput = document.getElementById("communityChatInput");
const closeChatBtn = document.getElementById("closeCommunityChat");

let activeChatRoom = "";

function getRoomMessages(room) {
    try {
        const messages = JSON.parse(
            localStorage.getItem("clgChat_" + room) || "[]"
        );

        return Array.isArray(messages) ? messages : [];
    } catch {
        return [];
    }
}

function displayRoomMessages() {
    chatMessages.replaceChildren();

    getRoomMessages(activeChatRoom).forEach(message => {
        const bubble = document.createElement("div");
        bubble.className = "chat-message";

        const text = document.createElement("p");
        text.textContent = message.text || "";

        const time = document.createElement("small");
        time.textContent = message.time || "";

        bubble.append(text, time);
        chatMessages.appendChild(bubble);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function openCommunityChat(name) {
    const joined = readStorage("clgJoinedCommunities", []);

    if (!Array.isArray(joined) || !joined.includes(name)) {
        openCommunitiesPanel("explore");
        return;
    }

    activeChatRoom = name;
    chatRoomTitle.textContent = name;

    document.getElementById("communitiesPanel").hidden = true;
    chatWindow.hidden = false;

    displayRoomMessages();

    chatWindow.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

    chatInput.focus();
}


// One handler per chat card: no conflicting preview handlers.
document.querySelectorAll(".chat-card[data-chat]").forEach(card => {
    card.addEventListener("click", () => {
        const name = card.dataset.chat;
        const joined = readStorage("clgJoinedCommunities", []);

        if (!Array.isArray(joined) || !joined.includes(name)) {
            openCommunitiesPanel("explore");
            return;
        }

        openCommunityChat(name);
    });
});

chatForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = chatInput.value.trim();
    if (!text || !activeChatRoom) return;

    const messages = getRoomMessages(activeChatRoom);

    messages.push({
        text,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    });

    try {
        localStorage.setItem(
            "clgChat_" + activeChatRoom,
            JSON.stringify(messages)
        );

        chatInput.value = "";
        displayRoomMessages();
        chatInput.focus();
    } catch {
        alert("Unable to save the message in this browser.");
    }
});

closeChatBtn.addEventListener("click", () => {
    chatWindow.hidden = true;
    activeChatRoom = "";
});


// =====================================
// COMMUNITIES: EXPLORE / JOIN / MY COMMUNITIES
// =====================================

const communitiesPanel = document.getElementById("communitiesPanel");
const communitiesPanelTitle =
    document.getElementById("communitiesPanelTitle");
const communitiesList = document.getElementById("communitiesList");
const closeCommunitiesPanel =
    document.getElementById("closeCommunitiesPanel");

const communityTabs = document.querySelectorAll("[data-community-tab]");

const availableCommunities = [
    {
        name: "Campus Talk",
        description: "General campus discussions",
        icon: "fa-message"
    },
    {
        name: "Study Group",
        description: "Notes, subjects and exam help",
        icon: "fa-book-open"
    },
    {
        name: "Campus Events",
        description: "College events and activities",
        icon: "fa-calendar"
    }
];

const joinedCommunitiesKey = "clgJoinedCommunities";
let currentCommunityTab = "explore";


function saveJoinedCommunities(names) {
    try {
        writeStorage(
            joinedCommunitiesKey,
            [...new Set(names)]
        );
        return true;
    } catch (error) {
        console.error("Unable to save communities:", error);
        alert("Unable to save your communities. Please try again.");
        return false;
    }
}

function renderCommunityTabs() {
    communityTabs.forEach(tab => {
        const selected =
            tab.dataset.communityTab === currentCommunityTab;

        tab.classList.toggle("active", selected);
        tab.setAttribute("aria-pressed", String(selected));
    });

    communitiesPanelTitle.textContent =
        currentCommunityTab === "mine"
            ? "My Communities"
            : "Explore Communities";
}


function getAllCommunities() {
    const custom = readStorage("clgCustomCommunities", []);

    return [
        ...availableCommunities,
        ...(Array.isArray(custom) ? custom : [])
    ];
}

function getJoinedCommunities() {
    const joined = readStorage(joinedCommunitiesKey, []);

    return Array.isArray(joined) ? joined : [];
}

/* =====================================
   COMMUNITY PROFILE AND MEMBERS
===================================== */

function getCommunityMembers(communityName) {
    const key = "clgMembers_" + communityName;

    let members = readStorage(key, []);

    if (!Array.isArray(members) || members.length === 0) {
        members = [
            {
                name: "Anonymous Student",
                role: "Member"
            }
        ];

        writeStorage(key, members);
    }

    return members;
}

function openCommunityProfile(community) {
    const members = getCommunityMembers(community.name);

    const profile = document.createElement("div");
    profile.className = "community-profile";

    profile.innerHTML = `
        <div class="community-profile-header">
            <div class="community-profile-avatar">
                <i class="fa-solid ${escapeHTML(
                    community.icon || "fa-users"
                )}"></i>
            </div>

            <h2>${escapeHTML(community.name)}</h2>

            <p>${members.length} member(s)</p>
        </div>

        <div class="community-profile-section">
            <h3>About this community</h3>
            <p>${escapeHTML(
                community.description || "A student community on CLG Connect."
            )}</p>
        </div>

        <div class="community-profile-section">
            <h3>Members</h3>

            <div class="community-member-list">
                ${members.map(member => `
                    <div class="community-member">
                        <div class="community-member-avatar">
                            <i class="fa-solid fa-user-secret"></i>
                        </div>

                        <div>
                            <strong>${escapeHTML(member.name)}</strong>
                            <small>${escapeHTML(member.role)}</small>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>

        <button type="button"
                class="community-open-chat-btn">
            <i class="fa-solid fa-comments"></i>
            Open Community Chat
        </button>
    `;

    openDialog(community.name, profile);

    profile.querySelector(".community-open-chat-btn")
        .addEventListener("click", () => {
            dialog.close();
            openCommunityChat(community.name);
        });
}

function renderCommunities() {
    communitiesList.replaceChildren();

    const joined = getJoinedCommunities();
    const allCommunities = getAllCommunities();

    const communities = currentCommunityTab === "mine"
        ? allCommunities.filter(community =>
            joined.includes(community.name)
        )
        : allCommunities;

    if (communities.length === 0) {
        const empty = document.createElement("p");
        empty.className = "community-empty";
        empty.textContent = currentCommunityTab === "mine"
            ? "You haven't joined any communities yet. Explore and join one!"
            : "No communities available yet.";

        communitiesList.appendChild(empty);
        return;
    }

    communities.forEach(community => {
        const isJoined = joined.includes(community.name);

        const card = document.createElement("div");
        card.className = "community-item";

        const icon = document.createElement("span");
        icon.className = "community-item-icon";

        const iconElement = document.createElement("i");
        iconElement.className = "fa-solid " + community.icon;
        icon.appendChild(iconElement);

        const info = document.createElement("div");
        info.className = "community-item-info";

        const name = document.createElement("strong");
        name.textContent = community.name;

        const description = document.createElement("small");
        description.textContent = community.description;

        info.append(name, description);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "community-join-btn";
        button.textContent = isJoined ? "View Community" : "Join";

        if (isJoined) button.classList.add("joined");

        
button.addEventListener("click", () => {
    if (!isJoined) {
        const updated = [
            ...getJoinedCommunities(),
            community.name
        ];

        if (!saveJoinedCommunities(updated)) return;

        // Add the joining student to the member list.
        const members = getCommunityMembers(community.name);

        if (!members.some(member =>
            member.name === "Anonymous Student"
        )) {
            members.push({
                name: "Anonymous Student",
                role: "Member"
            });

            writeStorage(
                "clgMembers_" + community.name,
                members
            );
        }

        renderCommunityTabs();
        renderCommunities();
    } else {
        openCommunityProfile(community);
    }
});


        card.append(icon, info, button);
        communitiesList.appendChild(card);
    });
}

function openCommunitiesPanel(tab = "explore") {
    currentCommunityTab = tab;

    // Hide other panels
    searchPanel.hidden = true;
    createPanel.hidden = true;
    chatWindow.hidden = true;

    // Show the communities panel
    communitiesPanel.hidden = false;

    // Update tabs and community cards
    renderCommunityTabs();
    renderCommunities();

    communitiesPanel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}



// COMMUNITY PANEL TABS
communityTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        currentCommunityTab = tab.dataset.communityTab;

        renderCommunityTabs();
        renderCommunities();
    });
});


// CLOSE COMMUNITY PANEL
closeCommunitiesPanel.addEventListener("click", () => {
    communitiesPanel.hidden = true;
});


// INITIAL STATE
communitiesPanel.hidden = true;
chatWindow.hidden = true; 


function getProfileInitials(username) {
    return username.trim().split(/\s+/).slice(0, 2)
        .map(word => word[0]).join("").toUpperCase();
}

function openProfile() {
    const profile = {
        username: "Campus Explorer",
        bio: "Here to learn, share, and connect anonymously.",
        color: "#7657d5",
        avatarType: "custom",
        avatar: "🐼",
        ...readStorage("clgProfile", {})
    };

    const posts = readStorage("clgPosts", []);
    const safePosts = Array.isArray(posts) ? posts : [];
    const avatarText = profile.avatarType === "initials"
        ? getProfileInitials(profile.username)
        : profile.avatar;

    const content = document.createElement("div");
    content.className = "clg-profile";

    content.innerHTML = `
        <div class="profile-cover">
            <button type="button" class="profile-edit-btn" id="editProfileBtn">
                <i class="fa-solid fa-pen"></i> Edit Profile
            </button>

            <div class="profile-cover-info">
                <div class="profile-avatar"
                     style="--profile-color:${escapeHTML(profile.color)}">
                    ${escapeHTML(avatarText)}
                </div>
                <div class="profile-heading">
                    <h3>${escapeHTML(profile.username)}</h3>
                    <p>@campus-member</p>
                    <p>Anonymous campus member</p>
                </div>
            </div>
        </div>

        <aside class="profile-bio">
            <strong>About Me</strong>
            <p>${escapeHTML(profile.bio)}</p>
            <hr>
            <p><i class="fa-solid fa-user-secret"></i> Anonymous profile</p>
            <p><i class="fa-solid fa-graduation-cap"></i> CLG Connect member</p>
        </aside>
        
        <section class="profile-interests">
            <h3>❤️ My Interests</h3>
            <div class="profile-interest-tags" id="profileInterestTags"></div>
        </section>


        <div class="profile-stats">
            <div><strong>${safePosts.length}</strong><span>Posts</span></div>
            <div><strong>${safePosts.filter(p => p.liked).length}</strong><span>Liked</span></div>
            <div><strong>${safePosts.filter(p => p.saved).length}</strong><span>Saved</span></div>
            <div><strong>${safePosts.reduce((n, p) =>
                n + (Array.isArray(p.comments) ? p.comments.length : 0), 0)}</strong>
                <span>Comments</span>
            </div>
        </div>

        <section class="profile-activity">
            <h3>My Activity</h3>
            <div class="profile-activity-grid">
                <button data-activity="My Posts">
                    <i class="fa-solid fa-file-lines"></i>
                    <span>My Posts</span>
                    <small>Your published posts</small>
                </button>
                <button data-activity="My Comments">
                    <i class="fa-regular fa-comment"></i>
                    <span>My Comments</span>
                    <small>Posts with comments</small>
                </button>
                <button data-activity="Liked Posts">
                    <i class="fa-regular fa-heart"></i>
                    <span>Liked Posts</span>
                    <small>Your liked posts</small>
                </button>
                <button data-activity="Saved Posts">
                    <i class="fa-regular fa-bookmark"></i>
                    <span>Saved Posts</span>
                    <small>Your saved posts</small>
                </button>
            </div>
        </section>

        <section class="profile-edit-area" id="profileEditArea" hidden>
            <h3>Edit Profile</h3>
            <form id="profileEditForm">
                <label>Anonymous username
                    <input name="username" maxlength="30"
                           value="${escapeHTML(profile.username)}" required>
                </label>

                <label>About Me
                    <textarea name="bio" maxlength="150" rows="3">${escapeHTML(profile.bio)}</textarea>
                </label>

                <span class="profile-field-label">Avatar style</span>
                <div class="profile-choice-row">
                    <label class="profile-choice">
                        <input type="radio" name="avatarType" value="initials"
                            ${profile.avatarType === "initials" ? "checked" : ""}>
                        Initials
                    </label>
                    <label class="profile-choice">
                        <input type="radio" name="avatarType" value="custom"
                            ${profile.avatarType === "custom" ? "checked" : ""}>
                        Emoji
                    </label>
                </div>

                <span class="profile-field-label">Choose avatar</span>
                <div class="profile-avatar-options">
                    ${["🐼", "✨", "🌙", "🌻", "🦋", "🌈"].map(emoji => `
                        <button type="button"
                            class="profile-avatar-option ${profile.avatar === emoji ? "selected" : ""}"
                            data-avatar="${emoji}">${emoji}</button>
                    `).join("")}
                </div>

                <label>Avatar color
                    <input type="color" name="color"
                           value="${escapeHTML(profile.color)}">
                </label>

                <div class="profile-form-actions">
                    <button type="submit" class="profile-save-btn">Save Changes</button>
                    <button type="button" class="profile-cancel-btn"
                            id="cancelProfileEdit">Cancel</button>
                </div>
                <p class="profile-status" aria-live="polite"></p>
            </form>
        </section>

        <section class="profile-activity-results" id="profileActivityResults" hidden>
        </section>
    `;

    openDialog("My Profile", content);
    
const interestContainer = content.querySelector("#profileInterestTags");
const interests = readStorage("userInterests", []);

if (Array.isArray(interests) && interests.length > 0) {
    interests.forEach(interest => {
        if (typeof interest !== "string") return;

        const tag = document.createElement("span");
        tag.className = "profile-interest-tag";
        tag.textContent = interest;
        interestContainer.appendChild(tag);
    });
} else {
    interestContainer.textContent = "No interests selected yet.";
}


    content.querySelector("#editProfileBtn").addEventListener("click", () => {
        content.querySelector("#profileEditArea").hidden = false;
        content.querySelector("#profileActivityResults").hidden = true;
        content.querySelector("#profileEditArea").scrollIntoView({
            behavior: "smooth", block: "nearest"
        });
    });

    content.querySelector("#cancelProfileEdit").addEventListener("click", () => {
        openProfile();
    });

    let selectedAvatar = profile.avatar;

    content.querySelectorAll("[data-avatar]").forEach(button => {
        button.addEventListener("click", () => {
            selectedAvatar = button.dataset.avatar;

            content.querySelectorAll("[data-avatar]").forEach(item => {
                item.classList.toggle("selected", item === button);
            });
        });
    });

    content.querySelector("#profileEditForm").addEventListener("submit", event => {
        event.preventDefault();

        const form = event.currentTarget;
        const username = form.elements.username.value.trim();

        if (!username) return;

        const updatedProfile = {
            username,
            bio: form.elements.bio.value.trim(),
            avatarType: form.elements.avatarType.value,
            avatar: selectedAvatar,
            color: form.elements.color.value
        };

        try {
            writeStorage("clgProfile", updatedProfile);
            openProfile();
        } catch (error) {
            form.querySelector(".profile-status").textContent =
                "Unable to save your profile. Please try again.";
        }
    });

    content.querySelectorAll("[data-activity]").forEach(button => {
        button.addEventListener("click", () => {
            showProfileActivity(button.dataset.activity, content);
        });
    });
}

function showProfileActivity(type, container) {
    const posts = readStorage("clgPosts", []);
    const safePosts = Array.isArray(posts) ? posts : [];

    let filtered = safePosts;

    if (type === "Saved Posts") {
        filtered = safePosts.filter(post => post.saved);
    } else if (type === "Liked Posts") {
        filtered = safePosts.filter(post => post.liked);
    } else if (type === "My Comments") {
        filtered = safePosts.filter(post =>
            Array.isArray(post.comments) && post.comments.length > 0
        );
    }

    const results = container.querySelector("#profileActivityResults");
    results.hidden = false;
    results.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = type;
    results.appendChild(heading);

    if (!filtered.length) {
        const empty = document.createElement("p");
        empty.textContent = "Nothing to display yet.";
        results.appendChild(empty);
    }

    filtered.forEach(post => {
        const article = document.createElement("article");
        article.className = "profile-activity-list";

        const title = document.createElement("strong");
        title.textContent = post.title || "Campus Post";

        const description = document.createElement("p");
        description.textContent = post.content || "";

        article.append(title, description);
        results.appendChild(article);
    });

    results.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
