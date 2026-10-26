const form = document.getElementById("signupForm");
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

    const name = document.getElementById("name").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const pass = password.value.trim();

    if (!name || !contact || !pass) {
        message.textContent = "Please fill in all fields.";
        message.style.color = "red";
        return;
    }

    if (pass.length < 6) {
        message.textContent = "Password must be at least 6 characters.";
        message.style.color = "red";
        return;
    }

    message.textContent = "Account created successfully!";
    message.style.color = "green";

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
const validMobile = /^\d{10}$/.test(contact);

if (!validEmail && !validMobile) {
    message.textContent = "Enter a valid email or 10-digit mobile number.";
    message.style.color = "red";
    return;
}

    form.reset();
    window.location.href = "../interest/interest.html";
});
