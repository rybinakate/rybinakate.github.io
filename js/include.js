document.addEventListener('DOMContentLoaded', () => {
    const headerHtml = `
        <header>
            <nav>
                <ul>
                    <li><a href="/index.html">Обо мне</a></li>
                    <li><a href="/projects/project1.html">Web-приложение для геоаналитики</a></li>
                     <li><a href="/projects/qattara-depression.html">Каттарская впадина</a></li>
                   <li><a href="/publications.html">Публикации</a></li>
                    
                    <li><a href="/contacts.html">Контакты</a></li>
                </ul>
            </nav>
        </header>
    `;
    
    const headerElement = document.querySelector('header');
    if (headerElement) {
        headerElement.innerHTML = headerHtml;
        console.log('✅ Меню вставлено');
    }
});