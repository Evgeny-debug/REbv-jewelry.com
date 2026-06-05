// ==========================================
// ЛОГІКА СТОРІНКИ "ІНФОРМАЦІЯ" (FAQ, ДОСТАВКА ТОЩО)
// ==========================================

const infoPagesFallback = {
    'about': {
        title: 'Історія Atelier',
        content: `
            <p>Atelier BV Jewelry — це не просто бренд, це спадщина, яка передається з покоління в покоління. Ми створюємо прикраси, які стають сімейними реліквіями.</p>
            <h3>Наші цінності</h3>
            <p>Кожен виріб виготовляється вручну майстрами з багаторічним досвідом. Ми використовуємо лише сертифіковані дорогоцінні метали та каміння найвищої якості.</p>
            <ul>
                <li>Ексклюзивний дизайн та індивідуальний підхід до кожного клієнта.</li>
                <li>Бездоганна якість матеріалів (золото 585, 750 проби).</li>
                <li>Використання сучасних технологій у поєднанні з класичним ювелірним мистецтвом.</li>
            </ul>
        `
    },
    'warranty': {
        title: 'Гарантія на продукцію',
        content: `
            <p>Всі ювелірні вироби BV Jewelry проходять суворий контроль якості перед видачею клієнту. Всі дорогоцінні камені супроводжуються сертифікатами авторитетних світових лабораторій (GIA, HRD, IGI та інших).</p>
            
            <h3>Що включає безкоштовне обслуговування</h3>
            <p>Гарантія та безкоштовне обслуговування включає усунення прихованих дефектів, що виникли з вини виробника.</p>
            <p>Для виконання гарантійного ремонту, заміни або безкоштовного обслуговування клієнту необхідно мати при собі: Товарний чек, паспорт виробу, гарантійний сертифікат. Гарантійне обслуговування здійснюється виключно при наявності чека, бірки, паспорта, сертифіката на ім'я особи, на яку було оформлено виріб.</p>
            
            <h3>Умови гарантійного обслуговування</h3>
            <ul>
                <li>Товар ремонтується протягом 10 днів з моменту прийому виробу в ремонт.</li>
                <li>Покупець погоджується з тим, що всі пошкодження і дефекти, які можуть бути виявлені під час ремонту, виникли до прийняття виробу в ремонт.</li>
                <li>При механічному пошкодженні (не гарантійний випадок) Ваш виріб може пройти платну послугу термінового ремонту і бути виданий в той же день. З цінами на послуги ремонту ви можете ознайомитися в розділі "Прайс".</li>
            </ul>
        `
    },
    'terms': {
        title: 'Умови оплати та доставки',
        content: `
            <p>Ми дбаємо про те, щоб процес покупки був максимально комфортним та безпечним для вас.</p>
            <h3>Доставка</h3>
            <ul>
                <li><b>Нова Пошта:</b> Доставка у відділення або кур'єром за адресою. Безкоштовно для замовлень від 5000 ₴.</li>
                <li><b>Самовивіз:</b> Ви можете забрати своє замовлення безпосередньо з нашого Atelier в м. Ізмаїл.</li>
            </ul>
            <h3>Оплата</h3>
            <ul>
                <li>Онлайн оплата картою (Visa, MasterCard, Apple Pay, Google Pay).</li>
                <li>Накладений платіж при отриманні (за умови мінімальної передоплати).</li>
                <li>Оплата частинами від Монобанк та ПриватБанк.</li>
            </ul>
        `
    },
    'reviews': {
        title: 'Відгуки клієнтів',
        content: `
            <p>Ваша думка — найвища оцінка нашої роботи. Незабаром тут з'явиться можливість залишати та читати відгуки наших клієнтів.</p>
            <div class="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl bg-[rgba(255,255,255,0.01)] mt-8">
                <button class="border border-[var(--gold-muted)] text-[var(--gold-muted)] px-8 py-3 rounded-none text-xs uppercase tracking-widest font-bold hover:bg-[var(--gold-muted)] hover:text-[#111] transition-colors">Залишити відгук</button>
            </div>
        `
    }
};

window.loadPage = function(pageId) {
    // 1. Спочатку шукаємо в базі (те, що зберіг адмін)
    const dbPages = API.get('bv_pages_content', {});
    
    // 2. Якщо в базі немає - беремо дефолтні
    const data = dbPages[pageId] || infoPagesFallback[pageId] || infoPagesFallback['about'];
    
    // Оновлюємо контент
    const titleEl = document.getElementById('pageTitle');
    const contentEl = document.getElementById('pageContent');
    
    if(titleEl) {
        titleEl.innerText = data.title;
        if(data.titleColor) titleEl.style.color = data.titleColor;
    }
    if(contentEl) {
        contentEl.innerHTML = data.content;
        if(data.subColor) contentEl.style.color = data.subColor;
    }
    
    // Оновлюємо URL без перезавантаження сторінки
    const url = new URL(window.location);
    url.searchParams.set('p', pageId);
    window.history.pushState({}, '', url);

    // Оновлюємо активні класи в навігації (Десктоп)
    document.querySelectorAll('.info-nav-link').forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('data-target') === pageId) link.classList.add('active');
    });

    // Оновлюємо активні класи в навігації (Мобілка)
    document.querySelectorAll('.info-tab-mob').forEach(tab => {
        tab.classList.remove('text-[var(--gold-muted)]', 'border-b-2', 'border-[var(--gold-muted)]');
        tab.classList.add('text-[var(--text-muted)]');
        if(tab.getAttribute('data-target') === pageId) {
            tab.classList.remove('text-[var(--text-muted)]');
            tab.classList.add('text-[var(--gold-muted)]', 'border-b-2', 'border-[var(--gold-muted)]');
            // Центруємо активну табу
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    });
    
    // Скролимо до гори контенту на мобілках
    if(window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const pageToLoad = urlParams.get('p') || 'about';
        window.loadPage(pageToLoad);
    }, 150);
});

// Обробка кнопок "Назад/Вперед" в браузері
window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    window.loadPage(urlParams.get('p') || 'about');
});