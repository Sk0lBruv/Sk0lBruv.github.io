// Initialize AOS Library
AOS.init({
    offset: 120,
    duration: 1000,
});

// Function to navigate to the game page
function playGame(gameUrl) {
    window.location.href = gameUrl;
}
