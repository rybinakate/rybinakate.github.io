
document.addEventListener('DOMContentLoaded', () => {
    const headerHtml = `
        <header>
            <nav>
                <ul>
                    <li><a href="/index.html" data-i18n="nav_about">Обо мне</a></li>
                    <li><a href="/projects/project1.html" data-i18n="nav_map">Бизнес-геоаналитика</a></li>
                    <li><a href="/projects/qattara-depression.html" data-i18n="nav_qattara">Каттарская впадина</a></li>
                    <li><a href="/publications.html" data-i18n="nav_publications">Публикации</a></li>
                    <li><a href="/contacts.html" data-i18n="nav_contacts">Контакты</a></li>
                    <li><button id="lang-switch" class="lang-btn">🇬🇧 EN</button></li>
                  </ul>
            </nav>
        </header>
    `;
    
    const headerElement = document.querySelector('header');
    if (headerElement) {
        headerElement.innerHTML = headerHtml;
        console.log('✅ Меню вставлено (RU)');
    }
});



