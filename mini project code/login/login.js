
const form = document.getElementById("loginForm");
const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");
const message = document.getElementById("message");

showPassword.addEventListener("click", () => {
    if (password.type === "password") {
        password.type = "text";
        showPassword.textContent = "Hide";
    } else {
        password.type = "password";
        showPassword.textContent = "Show";
    }
});

form.addEventListener("submit", function(event) {
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

    // Frontend demo only: this does not verify account credentials.
    message.textContent = "Login successful! Opening home page...";
    message.style.color = "green";

    window.location.href = "../home/home.html";
});

function googleLogin() {
    alert("Google authentication needs to be connected.");
}

function appleLogin() {
    alert("Apple authentication needs to be connected.");
}
