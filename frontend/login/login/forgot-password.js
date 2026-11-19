const requestCodeForm = document.getElementById("requestCodeForm");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const emailInput = document.getElementById("email");
const resetEmail = document.getElementById("resetEmail");
const message = document.getElementById("message");
const sendCodeButton = document.getElementById("sendCodeButton");
const resetPasswordButton = document.getElementById("resetPasswordButton");
let pendingEmail = "";

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#c62828" : "#237a3b";
}

async function requestCode(email) {
    const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not send a verification code.");
    return data;
}

requestCodeForm.addEventListener("submit", async event => {
    event.preventDefault();
    pendingEmail = emailInput.value.trim().toLowerCase();
    sendCodeButton.disabled = true;
    showMessage("Sending code…");

    try {
        const data = await requestCode(pendingEmail);
        resetEmail.textContent = pendingEmail;
        requestCodeForm.hidden = true;
        resetPasswordForm.hidden = false;
        showMessage(data.message || "If that email is registered, a code has been sent. Check your inbox and spam folder.");
        document.getElementById("otp").focus();
    } catch (error) {
        showMessage(error.message, true);
        sendCodeButton.disabled = false;
    }
});

document.getElementById("resendCode").addEventListener("click", async event => {
    event.preventDefault();
    showMessage("Sending another code…");
    try {
        const data = await requestCode(pendingEmail);
        showMessage(data.message || "If that email is registered, a code has been sent.");
    } catch (error) {
        showMessage(error.message, true);
    }
});

resetPasswordForm.addEventListener("submit", async event => {
    event.preventDefault();
    const otp = document.getElementById("otp").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        showMessage("The passwords do not match.", true);
        return;
    }

    resetPasswordButton.disabled = true;
    showMessage("Verifying code and changing password…");
    try {
        const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pendingEmail, otp, newPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not reset the password.");

        resetPasswordForm.reset();
        showMessage("Password changed successfully. Returning to login…");
        window.setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    } catch (error) {
        showMessage(error.message, true);
        resetPasswordButton.disabled = false;
    }
});
