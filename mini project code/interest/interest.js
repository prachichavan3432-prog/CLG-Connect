
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".interest-card");
    const selectedCount = document.getElementById("selectedCount");
    const continueBtn = document.getElementById("continueBtn");

    const selectedInterests = new Set();

    if (!cards.length || !selectedCount || !continueBtn) {
        console.error("Interest page elements are missing. Check interest.html.");
        return;
    }

    // Update the selected count and continue button
    function updateSelection() {
        selectedCount.textContent = selectedInterests.size;
        continueBtn.disabled = selectedInterests.size === 0;
    }

    // Select or deselect interest cards
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

    // Continue to the home page
    continueBtn.addEventListener("click", () => {
        if (selectedInterests.size === 0) {
            alert("Please select at least one interest!");
            return;
        }

        try {
            localStorage.setItem(
                "userInterests",
                JSON.stringify([...selectedInterests])
            );

            window.location.href = "../home/home.html";
        } catch (error) {
            console.error("Could not save interests:", error);
            alert("Your interests could not be saved. Please try again.");
        }
    });

    updateSelection();
});
