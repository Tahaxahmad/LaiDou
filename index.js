document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const sunIconSVG = `<img src="Assets/sun.png" alt="Sun" width="24" height="24">`;
    const moonIconSVG = `<img src="Assets/moon.png" alt="Moon" width="24" height="24">`;

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        document.documentElement.classList[isDark ? 'add' : 'remove']('dark-mode');
        if (themeToggleButton) themeToggleButton.innerHTML = isDark ? sunIconSVG : moonIconSVG;
        localStorage.setItem('theme', theme);
    };

    if (themeToggleButton) {
        applyTheme(localStorage.getItem('theme') || 'light');
        themeToggleButton.addEventListener('click', () => {
            applyTheme(document.documentElement.classList.contains('dark-mode') ? 'light' : 'dark');
        });
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }

    const elements = {
        hello: document.querySelector('header h1'),
        where: document.querySelector('header p'),
        logo: document.querySelector('.header-logo'),
        main: document.querySelector('main')
    };
    
    if (!Object.values(elements).every(Boolean)) return;
    
    const texts = {
        hello: 'Hello,',
        where: 'Where will you go?'
    };
    let indices = { hello: 0, where: 0 };
    
    elements.hello.textContent = '';
    elements.where.textContent = '';
    setTimeout(() => elements.logo.style.opacity = '1', 150);

    const typeText = (element, text, index, delay, callback) => {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            setTimeout(() => typeText(element, text, index + 1, delay, callback), delay);
        } else if (callback) {
            callback();
        }
    };

    typeText(elements.hello, texts.hello, 0, 150, () => {
        elements.main.classList.add('visible');
        setTimeout(() => typeText(elements.where, texts.where, 0, 100), 500);
    });
});
