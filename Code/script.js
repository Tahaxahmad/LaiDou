document.addEventListener('DOMContentLoaded', () => {
    const helloText = 'Hello,';
    const whereText = 'Where will you go?';
    const helloElement = document.querySelector('header h1');
    const whereElement = document.querySelector('header p');
    const logoElement = document.querySelector('.header-logo');
    const searchBarElement = document.querySelector('.search-bar');
    const mainElement = document.querySelector('main');
    
    // Animation timing configurations
    const animationDelay = 100; // Delay before slide-up animation starts (in milliseconds)

    helloElement.textContent = '';
    whereElement.textContent = '';

    let helloIndex = 0;
    let whereIndex = 0;

    // Start the logo and search bar fade as soon as typing begins
    setTimeout(() => {
        logoElement.style.opacity = '1';
        searchBarElement.style.opacity = '1';
    }, 150); // Same timing as first letter

    function typeHello() {
        if (helloIndex < helloText.length) {
            helloElement.textContent += helloText.charAt(helloIndex);
            helloIndex++;
            setTimeout(typeHello, 150);
        } else {
            // Start the main section animation when beginning to type 'Where'
            mainElement.classList.add('visible');
            setTimeout(typeWhere, 500);
        }
    }

    function typeWhere() {
        if (whereIndex < whereText.length) {
            whereElement.textContent += whereText.charAt(whereIndex);
            whereIndex++;
            setTimeout(typeWhere, 100);
        }
    }

    typeHello();
}); 