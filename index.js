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
