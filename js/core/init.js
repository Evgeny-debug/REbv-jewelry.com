// ==========================================
// ЗАВАНТАЖЕННЯ КОМПОНЕНТІВ HTML
// ==========================================
async function loadComponent(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
        const response = await fetch(url);
        el.innerHTML = await response.text();
    } catch (err) {
        console.error(`Помилка завантаження компонента ${url}:`, err);
    }
}

// ==========================================
// ПІДСТАНОВКА НАЛАШТУВАНЬ З БД У ВЕРСТКУ
// ==========================================
window.applySiteSettings = function() {
    const settings = API.get('bv_settings', {});
    
    // Текстові дані (Телефони, адреси, графік)
    document.querySelectorAll('[data-setting-text]').forEach(el => {
        const key = el.getAttribute('data-setting-text');
        if (settings[key]) el.innerText = settings[key];
    });

    // Посилання
    document.querySelectorAll('[data-setting="phone-link"]').forEach(el => {
        if(settings.phoneClean) el.href = `tel:${settings.phoneClean}`;
    });
    document.querySelectorAll('[data-setting="inst-link"]').forEach(el => {
        if(settings.instagram) el.href = settings.instagram;
    });
    document.querySelectorAll('[data-setting="tg-link"]').forEach(el => {
        if(settings.telegram) el.href = settings.telegram;
    });

    // Налаштування Hero-банера для головної
    const pages = API.get('bv_pages_content', {});
    if (pages.home_hero) {
        const heroBg = document.querySelector('.hero-img-bg');
        const heroOverlay = document.querySelector('.hero-overlay');
        const heroTitle = document.querySelector('.hero-title');
        const heroSub = document.querySelector('.hero-subtitle');

        if (heroBg && pages.home_hero.heroBg) heroBg.style.backgroundImage = `url('${pages.home_hero.heroBg}')`;
        if (heroOverlay && pages.home_hero.heroOpacity !== undefined) heroOverlay.style.backgroundColor = `rgba(0, 0, 0, ${pages.home_hero.heroOpacity})`;
        if (heroTitle) {
            if (pages.home_hero.title) heroTitle.innerText = pages.home_hero.title;
            if (pages.home_hero.titleColor) heroTitle.style.color = pages.home_hero.titleColor;
        }
        if (heroSub) {
            if (pages.home_hero.subtitle) heroSub.innerText = pages.home_hero.subtitle;
            if (pages.home_hero.subColor) heroSub.style.color = pages.home_hero.subColor;
        }
    }
};

// ==========================================
// ІНІЦІАЛІЗАЦІЯ ПРИ ЗАВАНТАЖЕННІ СТОРІНКИ (ВИПРАВЛЕНО RACE CONDITION)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. СУВОРА ЧЕРГА: Чекаємо завантаження ВСІХ блоків HTML
    await loadComponent("auth-modal-placeholder", "components/auth-modal.html");
    await loadComponent("cart-sidebar-placeholder", "components/cart-sidebar.html");
    await loadComponent("header-placeholder", "components/header.html");
    await loadComponent("footer-placeholder", "components/footer.html");
    
    // Внутри DOMContentLoaded, после загрузки данных:
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
    const products = API.get('bv_products', []);
    const container = document.getElementById('homeProductsGrid');
    
    if (container && products.length > 0) {
        // Рендерим первые 8 товаров
        container.innerHTML = products.slice(0, 8).map(p =>`<div class="flex-none w-[60%] sm:w-[40%] md:w-[25%] snap-start">${window.renderProductCard(p)}</div>`).join('');
        
        // Активируем скролл для этого трека
        window.initPremiumCarousel(container);
        }
    }




    // 2. ТІЛЬКИ ТЕПЕР, коли всі блоки на місці, завантажуємо дані і будуємо меню
    if (!window.location.pathname.includes('admin.html')) {
        if (typeof migrateScopedState === 'function') migrateScopedState();
        if (typeof window.loadCloudData === 'function') await window.loadCloudData();
    }

    // 3. Застосовуємо налаштування сайту до існуючого HTML
    applySiteSettings();

    // 4. Відновлюємо налаштування мови та теми
    if (typeof API !== 'undefined') {
        const savedLang = API.get('bv_lang', 'uk');
        if (typeof window.changeLang === 'function') window.changeLang(savedLang);

        const savedTheme = API.get('bv_theme', 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
        const icon = document.getElementById('themeIcon'); 
        const svg = savedTheme === 'light' ? sunSVG : moonSVG;
        if(icon && typeof sunSVG !== 'undefined') icon.innerHTML = svg; 
    }

    // 5. Рендеримо кошик та профіль
    if(typeof window.renderCart === 'function') window.renderCart(); 
    if(typeof window.renderFavDrawer === 'function') window.renderFavDrawer();
    if(typeof window.updateProfileMenu === 'function') window.updateProfileMenu(); 

    // 6. Налаштовуємо Мега-меню (Dropdown)
    const catalogToggle = document.querySelector('.catalog-toggle');
    const catalogWrapper = document.querySelector('.catalog-dropdown-wrapper');
    if (catalogToggle && catalogWrapper) {
        catalogToggle.onclick = function(e) {
            e.preventDefault();
            const isOpen = catalogWrapper.classList.toggle('open');
            document.body.classList.toggle('menu-open', isOpen);
        };
        document.addEventListener('click', function(e) {
            if (catalogWrapper.classList.contains('open') && !catalogWrapper.contains(e.target)) {
                catalogWrapper.classList.remove('open'); document.body.classList.remove('menu-open');
            }
        });
    }

    // 7. Рік у футері
    const yearEl = document.getElementById('currentYear');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
});

// ==========================================
// ГЛОБАЛЬНІ ПОДІЇ СТОРІНКИ (Скрол)
// ==========================================
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if(header) header.classList.toggle('scrolled', window.scrollY > 50);
    
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const isScrollingUp = currentScroll < lastScrollTop && currentScroll > 400;
    const topBtn = document.getElementById('scrollToTopBtn');

    if(isScrollingUp) { 
        if(topBtn) { topBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4'); topBtn.classList.add('opacity-100', 'translate-y-0'); }
    } else {
        if(topBtn) { topBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4'); topBtn.classList.remove('opacity-100', 'translate-y-0'); }
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}, { passive: true });

