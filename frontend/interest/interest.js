
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".interest-card");
    const selectedCount = document.getElementById("selectedCount");
    const continueBtn = document.getElementById("continueBtn");

    const selectedInterests = new Set();

    if (!cards.length || !selectedCount || !continueBtn) {
        console.error("Interest page elements are missing.");
        return;
    }

    function updateSelection() {
        selectedCount.textContent = selectedInterests.size;
        continueBtn.disabled = selectedInterests.size === 0;
    }

    // Select or deselect interests
    cards.forEach(card => {
        card.setAttribute("role", "checkbox");
        card.setAttribute("aria-checked", "false");
        card.setAttribute("tabindex", "0");

        function toggleInterest() {
            const interest = card.dataset.interest;

            if (!interest) return;

            if (selectedInterests.has(interest)) {
                selectedInterests.delete(interest);
                card.classList.remove("selected");
                card.setAttribute("aria-checked", "false");
            } else {
                selectedInterests.add(interest);
                card.classList.add("selected");
                card.setAttribute("aria-checked", "true");
            }

            updateSelection();
        }

        card.addEventListener("click", toggleInterest);

        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleInterest();
            }
        });
    });

    // Save interests to backend
    continueBtn.addEventListener("click", async () => {
        if (selectedInterests.size === 0) {
            alert("Please select at least one interest!");
            return;
        }

        const token = sessionStorage.getItem("token");

        if (!token) {
            alert("Please log in first.");
            window.location.href = "../login/login.html";
            return;
        }

        continueBtn.disabled = true;
        continueBtn.textContent = "Saving...";

        try {
            const response = await fetch(
                "http://localhost:3000/api/interests",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        interests: [...selectedInterests]
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not save interests.");
            }

            localStorage.setItem(
                "userInterests",
                JSON.stringify([...selectedInterests])
            );

            window.location.href = "../home/home.html";

        } catch (error) {
            console.error("Interest saving error:", error);
            alert(error.message);
            continueBtn.disabled = false;
            continueBtn.textContent = "Continue";
        }
    });

    updateSelection();
});
