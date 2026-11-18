
const form = document.getElementById("loginForm");
const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");
const message = document.getElementById("message");

// Show or hide password
showPassword.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        showPassword.textContent = "Hide";
    } else {
        password.type = "password";
        showPassword.textContent = "Show";
    }
});

// Login using backend API
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const contact = document.getElementById("contact").value.trim();
    const pass = password.value;

    if (!contact || !pass) {
        message.textContent = "Please fill in all fields.";
        message.style.color = "red";
        return;
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const validMobile = /^\d{10}$/.test(contact);

    if (!validEmail && !validMobile) {
        message.textContent =
            "Enter a valid email or 10-digit mobile number.";
        message.style.color = "red";
        return;
    }

    // Current backend login supports email, not mobile number.
    if (!validEmail) {
        message.textContent = "Please log in using your registered email.";
        message.style.color = "red";
        return;
    }

    message.textContent = "Logging in...";
    message.style.color = "blue";

    try {
        const response = await fetch("https://clg-connect.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: contact,
                password: pass
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Login failed.";
            message.style.color = "red";
            return;
        }

        // Keep the login token for this browser tab.
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));

        message.textContent = "Login successful! Opening home page...";
        message.style.color = "green";

        window.location.href = "../home/home.html";

    } catch (error) {
        console.error("Login error:", error);
        message.textContent =
            "Cannot connect to the server. Please try again.";
        message.style.color = "red";
    }
});

function googleLogin() {
    alert("Google authentication needs to be connected.");
}

function appleLogin() {
    alert("Apple authentication needs to be connected.");
}
