document.addEventListener('DOMContentLoaded', () => {
    // Get all elements that need animation
    const header = document.querySelector('.fade-in');
    const locationCard = document.querySelector('.fade-in-second');
    const placeholderText = document.querySelector('.slide-up');
    const typingText = document.querySelector('.typing-text');

    // Text to be typed
    const textToType = "Please input the location you're currently at and the destination you'd like to reach to show the routes.";
    let charIndex = 0;

    // Function to add active class with delay
    const animateWithDelay = (element, delay) => {
        setTimeout(() => {
            element.classList.add('active');
        }, delay);
    };

    // Typing animation function
    const typeText = () => {
        if (charIndex < textToType.length) {
            typingText.textContent += textToType.charAt(charIndex);
            charIndex++;
            setTimeout(typeText, 15); // Adjust typing speed here (lower number = faster)
        }
    };

    // Sequence the animations
    // 1. Fade in header (BUS title and buttons)
    animateWithDelay(header, 100);

    // 2. Fade in location card (From/To container)
    animateWithDelay(locationCard, 600);

    // 3. Slide up placeholder text while location card is still fading in
    animateWithDelay(placeholderText, 800);

    // 4. Start typing animation after placeholder slides up
    setTimeout(typeText, 1600); // Start typing after slide-up animation

    // Add click functionality to navigation buttons
    const trainBtn = document.querySelector('.nav-btn:nth-child(1)');
    const homeBtn = document.querySelector('.nav-btn:nth-child(2)');

    trainBtn.addEventListener('click', () => {
        window.location.href = 'train-select.html';
    });

    homeBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}); 