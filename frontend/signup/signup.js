
const form = document.getElementById("signupForm");
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

// Signup using backend API
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const pass = password.value;

    if (!name || !contact || !pass) {
        message.textContent = "Please fill in all fields.";
        message.style.color = "red";
        return;
    }

    // Backend currently supports email registration.
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);

    if (!validEmail) {
        message.textContent = "Please enter a valid email address.";
        message.style.color = "red";
        return;
    }

    // Backend requires at least 8 characters.
    if (pass.length < 8) {
        message.textContent =
            "Password must be at least 8 characters.";
        message.style.color = "red";
        return;
    }

    message.textContent = "Creating your account...";
    message.style.color = "blue";

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: name,
                email: contact,
                password: pass
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Registration failed.";
            message.style.color = "red";
            return;
        }
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        message.textContent =
            "Account created successfully! Opening interests...";
        message.style.color = "green";

        form.reset();
        showPassword.textContent = "Show";

        window.location.href = "../interest/interest.html";

    } catch (error) {
        console.error("Signup error:", error);
        message.textContent =
            "Cannot connect to the server. Please try again.";
        message.style.color = "red";
    }
});
