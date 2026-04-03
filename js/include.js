document.addEventListener('DOMContentLoaded', () => {
    const headerHtml = `
        <header>
            <nav>
                <ul>
                    <li><a href="/index.html">Обо мне</a></li>
                    <li><a href="/projects/project1.html">Web-приложение для геоаналитики</a></li>
                   <!-- <li><a href="/projects/project2.html">Каттарская низменность</a></li -->
                   <!-- <li><a href="/projects/project3.html">Проект 3</a></li> -->
                   <!-- <li><a href="/projects/project4.html">Проект 4</a></li> -->
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