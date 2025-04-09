document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const sunIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 9c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-10c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1s1-.45 1-1V8c0-.55-.45-1-1-1zm6.36 1.64l-.71.71c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l.71-.71c.39-.39.39-1.02 0-1.41-.39-.39-1.03-.39-1.41 0zM4.34 6.05l-.71-.71c-.39-.39-.39-1.02 0-1.41s1.02-.39 1.41 0l.71.71c.39.39.39 1.02 0 1.41-.39.39-1.02.39-1.41 0zm0 11.9l.71-.71c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-.71.71c-.39.39-1.02.39-1.41 0-.39-.39-.39-1.02 0-1.41zm13.42 0l.71.71c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-.71-.71c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.03 0 1.41zM12 3c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1zm0 16c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1s1-.45 1-1v-1c0-.55-.45-1-1-1zM4 11H3c-.55 0-1 .45-1 1s.45 1 1 1h1c.55 0 1-.45 1-1s-.45-1-1-1zm16 0h-1c-.55 0-1 .45-1 1s.45 1 1 1h1c.55 0 1-.45 1-1s-.45-1-1-1z"/>
        </svg>
    `;
    const moonIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M9.37 5.51C9.19 6.15 9 6.82 9 7.5c0 4.42 3.58 8 8 8 .68 0 1.35-.19 1.99-.37C17.47 18.89 14.81 21 11.5 21 6.81 21 3 17.19 3 12.5S6.81 4 11.5 4c1.51 0 2.92.38 4.13 1.02-.48-.07-.97-.11-1.48-.11-1.98 0-3.78.65-5.31 1.72z"/>
        </svg>
    `;

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

    function typeHello() {
        if (indices.hello < texts.hello.length) {
            elements.hello.textContent += texts.hello.charAt(indices.hello++);
            setTimeout(typeHello, 150);
        } else {
            elements.main.classList.add('visible');
            setTimeout(typeWhere, 500);
        }
    }

    function typeWhere() {
        if (indices.where < texts.where.length) {
            elements.where.textContent += texts.where.charAt(indices.where++);
            setTimeout(typeWhere, 100);
        }
    }

    typeHello();
});
