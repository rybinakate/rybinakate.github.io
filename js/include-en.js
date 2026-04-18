document.addEventListener('DOMContentLoaded', () => {
    const headerHtml = `
        <header>
            <nav>
                <ul>
                    <li><a href="/en/index.html">About Me</a></li>
                    <li><a href="/en/projects/project1.html">Business Geoanalytics</a></li>
                    <li><a href="/en/projects/qattara-depression.html">Qattara Depression</a></li>
                    <li><a href="/en/publications.html">Publications</a></li>
                    <li><a href="/en/contacts.html">Contacts</a></li>
                    <li><button id="lang-switch" class="lang-btn">🇷🇺 RU</button></li>
                </ul>
            </nav>
        </header>
    `;
    
    const headerElement = document.querySelector('header');
    if (headerElement) {
        headerElement.innerHTML = headerHtml;
        console.log('✅ Menu inserted (EN)');
    }
});