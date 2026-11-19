document.addEventListener("DOMContentLoaded", function () {

    // Get all cards
    const cards = document.querySelectorAll(".card");

    // Get navigation buttons
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");

    // Current card index
    let currentIndex = 0;

    // Check whether cards exist
    if (cards.length === 0) {
        console.error("No cards found!");
        return;
    }

    // Check whether buttons exist
    if (!nextBtn || !prevBtn) {
        console.error("Navigation buttons not found!");
        return;
    }


    // DISPLAY CARD FUNCTION
    function showCard(index) {

        // Hide all cards
        cards.forEach(function (card) {
            card.classList.remove("active");
        });

        // Display selected card
        cards[index].classList.add("active");

    }


    // NEXT BUTTON
    nextBtn.addEventListener("click", function () {

        currentIndex++;

        // Return to first card after last card
        if (currentIndex >= cards.length) {
            currentIndex = 0;
        }

        showCard(currentIndex);

    });


    // PREVIOUS BUTTON
    prevBtn.addEventListener("click", function () {

        currentIndex--;

        // Go to last card if at first card
        if (currentIndex < 0) {
            currentIndex = cards.length - 1;
        }

        showCard(currentIndex);

    });


    // DISPLAY FIRST CARD WHEN PAGE LOADS
    showCard(currentIndex);

    console.log("Card swapping initialized successfully!");

});

// AI Assistant
const aiDialog = document.getElementById("aiDialog");
const aiMessages = document.getElementById("aiMessages");
const aiInput = document.getElementById("aiInput");

document.getElementById("aiOpen").onclick = () => aiDialog.showModal();
document.getElementById("aiClose").onclick = () => aiDialog.close();

document.querySelectorAll("[data-prompt]").forEach(button => {
    button.onclick = () => {
        aiInput.value = button.dataset.prompt;
        aiInput.focus();
    };
});

document.getElementById("aiForm").onsubmit = event => {
    event.preventDefault();

    const question = aiInput.value.trim();
    if (!question) return;

    aiMessages.innerHTML += `<div class="ai-user"></div>`;
    aiMessages.lastElementChild.textContent = question;

    const answer = getDemoAnswer(question);
    aiMessages.innerHTML += `<div class="ai-bot"></div>`;
    aiMessages.lastElementChild.textContent = answer;

    aiInput.value = "";
    aiMessages.scrollTop = aiMessages.scrollHeight;
};

function getDemoAnswer(question) {
    const text = question.toLowerCase();

    if (text.includes("community") || text.includes("trending"))
        return "Try communities about coding, placements, college events, hobbies, study groups, and campus life.";

    if (text.includes("post") || text.includes("improve"))
        return "Make your post clear and friendly. Explain your main point, add useful details, and end with a question to invite responses.";

    return "For campus questions, try asking clearly and including relevant details. I’m currently in demo mode, so live AI answers need a connected AI backend.";
}
