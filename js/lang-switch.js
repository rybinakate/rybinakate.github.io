// ========== ПЕРЕКЛЮЧЕНИЕ МЕЖДУ РУССКОЙ И АНГЛИЙСКОЙ ВЕРСИЯМИ ==========

// Определяем текущий язык
function getCurrentLanguage() {
    const path = window.location.pathname;
    return path.includes('/en/') ? 'en' : 'ru';
}

// Переключение языка
function switchLanguage() {
    const currentLang = getCurrentLanguage();
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    
    // Сохраняем выбранный язык
    localStorage.setItem('preferred_language', newLang);
    
    // Переходим на нужную версию текущей страницы
    const currentPath = window.location.pathname;
    
    if (newLang === 'en') {
        // Переход на английскую версию
        let newPath = '/en' + currentPath;
        if (currentPath === '/' || currentPath === '/index.html') {
            newPath = '/en/index.html';
        }
        window.location.href = newPath;
    } else {
        // Переход на русскую версию
        let newPath = currentPath.replace('/en/', '/');
        if (currentPath === '/en/index.html') {
            newPath = '/index.html';
        }
        window.location.href = newPath;
    }
}

// Обновляем текст кнопки
function updateButtonText() {
    const langBtn = document.getElementById('lang-switch');
    if (!langBtn) return;
    
    const currentLang = getCurrentLanguage();
    langBtn.textContent = currentLang === 'ru' ? '🇬🇧 EN' : '🇷🇺 RU';
}

// Перенаправление на правильную языковую версию при загрузке
function redirectToPreferredLanguage() {
    const preferredLang = localStorage.getItem('preferred_language');
    const currentLang = getCurrentLanguage();
    
    // Если язык не выбран — ничего не делаем
    if (!preferredLang) return;
    
    // Если текущий язык не соответствует выбранному — перенаправляем
    if (preferredLang !== currentLang) {
        const currentPath = window.location.pathname;
        
        if (preferredLang === 'en') {
            // Нужна английская версия
            let newPath = '/en' + currentPath;
            if (currentPath === '/' || currentPath === '/index.html') {
                newPath = '/en/index.html';
            }
            window.location.href = newPath;
        } else {
            // Нужна русская версия
            let newPath = currentPath.replace('/en/', '/');
            if (currentPath === '/en/index.html') {
                newPath = '/index.html';
            }
            window.location.href = newPath;
        }
    }
}

// Обработчик кликов по ссылкам (для сохранения языка при навигации)
function handleLinkClicks() {
    document.querySelectorAll('a').forEach(link => {
        // Не обрабатываем внешние ссылки и якоря
        if (link.hostname !== window.location.hostname) return;
        if (link.getAttribute('href')?.startsWith('#')) return;
        
        link.addEventListener('click', (e) => {
            // Сохраняем текущий язык перед переходом
            const currentLang = getCurrentLanguage();
            localStorage.setItem('preferred_language', currentLang);
        });
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    redirectToPreferredLanguage();
    updateButtonText();
    handleLinkClicks();
    
    const langBtn = document.getElementById('lang-switch');
    if (langBtn) {
        langBtn.addEventListener('click', switchLanguage);
    }
});