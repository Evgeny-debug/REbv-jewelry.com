// Підключення конфігів та ядра
import { ENV, StorageAPI } from './api/config.js?v=12';
import { loadCloudData } from './api/services.js?v=12';
import { migrateScopedState } from './core/state.js?v=12';
import { changeLang } from './core/i18n.js?v=12';

// 1. ІН'ЄКЦІЯ ЛЕЙАУТУ (Шапка, Футер, Модалки)
// Викликаємо одразу, щоб DOM оновився до запуску рендерів!
import { injectSharedLayout } from './components/layout.js?v=12';
injectSharedLayout();

// 2. Підключення UI компонентів (вони реєструють свої функції у window)
import './components/header.js?v=12';
import './components/cart.js?v=12';
import './components/auth.js?v=12';
import './components/productCard.js?v=12';

// 3. Підключення скриптів сторінок
import { initBannerSlider, renderHomeSections } from './pages/home.js?v=12';
import { initCatalogFilters } from './pages/catalog.js?v=12';
import { renderProductPage } from './pages/product.js?v=12';
import { initCheckout } from './pages/checkout.js?v=12';

// Глобальна ін'єкція додаткового UI (кнопка вгору та модалка авторизації)
window.injectGlobalUI = function() {
    if (typeof window.injectAuthModal === 'function') window.injectAuthModal(); 
    if (!document.getElementById('scrollToTopBtn')) {
        document.body.insertAdjacentHTML('beforeend', `<button id="scrollToTopBtn" onclick="window.scrollTo({top:0, behavior:'smooth'})" aria-label="Вверх" class="btn-cross fixed bottom-[165px] left-4 z-[4800] w-12 h-12 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border)] rounded-none flex items-center justify-center text-[var(--gold-muted)] shadow-[0_5px_20px_rgba(0,0,0,0.3)] opacity-0 translate-y-4 pointer-events-none transition-all duration-300 active:scale-95 md:bottom-10 md:left-10 hover:bg-[var(--gold-muted)] hover:text-[var(--bg-body)]"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></button>`);
    }
};

// ==========================================
// ГЛОБАЛЬНІ СЛУХАЧІ ТА ІНІЦІАЛІЗАЦІЯ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Десктопний і мобільний пошук (Enter)
    const deskSearch = document.querySelector('.search-input.desktop-only') || document.querySelector('.desktop-only .search-input');
    if (deskSearch) deskSearch.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.executeSearch(e.target.value); });
    
    const overlayInput = document.getElementById('mobSearchOverlayInput');
    if (overlayInput) overlayInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.executeSearch(e.target.value); });

    // Клік поза мега-меню
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
                catalogWrapper.classList.remove('open'); 
                document.body.classList.remove('menu-open');
            }
        });
    }
});

// Головний старт додатку
window.onload = async () => { 
    if(window.location.pathname.includes('admin.html')) return;

    migrateScopedState();
    window.injectGlobalUI();
    
    // Завантаження бази даних (локальної або хмарної)
    await loadCloudData();

    // Ініціалізація сторінок та локалізації
    const savedLang = StorageAPI.get('bv_lang', 'uk');
    changeLang(savedLang);

    // Встановлення теми
    const savedTheme = StorageAPI.get('bv_theme', 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    const svg = savedTheme === 'light' ? `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>` : `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
    if(document.getElementById('themeIcon')) document.getElementById('themeIcon').innerHTML = svg; 
    if(document.getElementById('themeIconMob')) document.getElementById('themeIconMob').innerHTML = svg;

    // Встановлення року у футері
    const yearEl = document.getElementById('currentYear');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    // Рендер кошика і меню профілю
    if(typeof window.renderCart === 'function') window.renderCart(); 
    if(typeof window.renderFavDrawer === 'function') window.renderFavDrawer();
    if(typeof window.updateProfileMenu === 'function') window.updateProfileMenu(); 

    // Бургер меню
    const burgerBtn = document.getElementById('burger');
    if(burgerBtn) burgerBtn.onclick = function(e) { e.stopPropagation(); window.toggleMenu(); };

    // Ініціалізація скриптів конкретних сторінок
    if(typeof initBannerSlider === 'function') initBannerSlider();
    if(typeof renderHomeCategories === 'function') renderHomeCategories(); // <-- Відображення плиток категорій
    if(typeof renderHomeSections === 'function' && document.getElementById('dynamicHomeBlocksContainer')) renderHomeSections();
    if(typeof initCatalogFilters === 'function') initCatalogFilters();
    if(typeof renderProductPage === 'function') renderProductPage();
    if(typeof initCheckout === 'function') initCheckout();
};

// Скролл-логіка (Хедер та кнопка Вгору)
let lastScrollTop = 0;
let isScrollingUp = false;

window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if(header) header.classList.toggle('scrolled', window.scrollY > 50);
    
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    isScrollingUp = currentScroll < lastScrollTop && currentScroll > 400;
    
    const topBtn = document.getElementById('scrollToTopBtn');

    if(isScrollingUp) { 
        if(topBtn) { topBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4'); topBtn.classList.add('opacity-100', 'translate-y-0'); }
    } else {
        if(topBtn) { topBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4'); topBtn.classList.remove('opacity-100', 'translate-y-0'); }
    }
    
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}, { passive: true });