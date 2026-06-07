// ==========================================
// УТИЛІТИ ТА СТАН
// ==========================================

// Глобальний фікс: прибираємо сіре/синє виділення кнопок при тапах на мобільних
if (!document.getElementById('mobile-tap-fix')) {
    const style = document.createElement('style');
    style.id = 'mobile-tap-fix';
    style.innerHTML = `* { -webkit-tap-highlight-color: transparent !important; touch-action: manipulation; }`;
    document.head.appendChild(style);
}

const formatterPrice = new Intl.NumberFormat('uk-UA', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const sunSVG = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
const moonSVG = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
const flags = { uk: "ua", en: "gb", ru: "ru" };

window.getLoc = function(obj, field) {
    if (!obj) return '';
    const lang = window.API ? API.get('bv_lang', 'uk') : 'uk';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
        if (field) {
            if (typeof obj[field] === 'object' && obj[field] !== null) return obj[field][lang] || obj[field]['uk'] || '';
            if (lang === 'uk') return obj[field] || '';
            return obj[field + lang.toUpperCase()] || obj[field] || ''; 
        }
        return obj[lang] || obj['uk'] || '';
    }
    return '';
};

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getCart() { return window.API ? API.get(window.getScopedStorageKey ? window.getScopedStorageKey('bv_cart') : 'bv_cart', []) : []; }
function setCart(cart) { 
    if(window.API) { 
        API.set(window.getScopedStorageKey ? window.getScopedStorageKey('bv_cart') : 'bv_cart', cart); 
        API.set('bv_cart', cart); 
    } 
}
function getFavs() { return window.API ? API.get(window.getScopedStorageKey ? window.getScopedStorageKey('bv_favs') : 'bv_favs', []) : []; }
window.setFavs = function(favs) {
    if(window.API) {
        API.set(window.getScopedStorageKey ? window.getScopedStorageKey('bv_favs') : 'bv_favs', favs);
        API.set('bv_favs', favs);
        const user = window.getCurrentUser ? window.getCurrentUser() : null;
        if(user) { user.favs = favs; API.set('bv_current_user', user); }
    }
};

// ==========================================
// КОШИК ТА УЛЮБЛЕНЕ
// ==========================================
window.toggleCart = function() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (!drawer || !overlay) return;
    if (!drawer.classList.contains('active')) {
        window.renderCart();
        drawer.classList.add('active'); overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.remove('active'); overlay.classList.remove('active');
        if (!document.getElementById('sideMenu')?.classList.contains('active')) document.body.style.overflow = '';
    }
};

window.addToCart = function(id, title, variant, price, img) {
    let cart = getCart();
    let extractedSize = null;
    let cleanTitle = String(title);
    if (cleanTitle.includes('(Розмір:')) {
        const parts = cleanTitle.split('(Розмір:');
        cleanTitle = parts[0].trim();
        extractedSize = parts[1].replace(')', '').trim();
    }
    const allProducts = window.API ? API.get('bv_products', []) : [];
    const prod = allProducts.find(p => p.id === id);
    const sku = prod && prod.sku ? prod.sku : id;
    const cartId = id + (extractedSize ? '-' + extractedSize : '');

    const existing = cart.find(item => item.cartId === cartId);
    if (existing) { existing.qty += 1; } 
    else {
        cart.push({ cartId, id, title: cleanTitle, variant: String(variant), price: Number(price), img: String(img), qty: 1, sku, size: extractedSize });
    }
    
    setCart(cart); window.renderCart();
    if (!document.getElementById('cartDrawer').classList.contains('active')) window.toggleCart();
};

window.updateCartQty = function(cartId, delta) {
    const cart = getCart();
    const item = cart.find(entry => entry.cartId === cartId);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    setCart(cart); window.renderCart();
};

window.removeFromCart = function(cartId) {
    let cart = getCart();
    cart = cart.filter(item => item.cartId !== cartId);
    setCart(cart); window.renderCart();
};

window.clearEntireCart = function(force = false) {
    if(force || confirm('Ви впевнені, що хочете очистити кошик?')) { setCart([]); window.renderCart(); }
};

window.checkoutOrder = function() {
    const cart = getCart();
    if(cart.length === 0) return alert('Ваш кошик порожній!');
    window.toggleCart();
    window.location.href = 'checkout.html';
};

window.renderCart = function() {
    let cart = getCart();
    const cartBody = document.getElementById('cartBody');
    const cartBadges = document.querySelectorAll('.cart-badge:not(.fav-badge)');
    const subtotalVal = document.querySelector('.cart-subtotal-val');
    let total = 0, totalQty = 0;
    
    if(!cartBody) return;
    cartBody.innerHTML = '';

    if (cart.length === 0) {
        const lang = window.API ? API.get('bv_lang', 'uk') : 'uk';
        const t = typeof i18n !== 'undefined' ? i18n : (window.i18n || null);
        const emptyMsg = t && t[lang] && t[lang].cart_empty ? t[lang].cart_empty : "Кошик порожній";
        
        cartBody.innerHTML = `<div class="cart-empty-msg text-center text-[var(--text-muted)] mt-10">${emptyMsg}</div>`;
        if(subtotalVal) subtotalVal.innerText = '0 ₴';
        cartBadges.forEach(b => b.innerText = '0');
        const checkoutBtnWrapper = document.getElementById('checkoutBtnWrapper');
        if(checkoutBtnWrapper) checkoutBtnWrapper.style.display = 'none';
        return;
    }

    cart.forEach(item => {
        total += item.price * item.qty; totalQty += item.qty;
        const sizeBadge = item.size ? `<span class="bg-[var(--gold-muted)]/20 text-[var(--gold-muted)] px-2 py-0.5 rounded-none text-[10px] font-bold">Розмір: ${item.size}</span>` : '';
        cartBody.insertAdjacentHTML('beforeend', `
            <div class="cart-item flex gap-4 p-3 border border-[var(--border)] rounded-none mb-3 relative transition-all duration-300 hover:border-[var(--gold-muted)]/40">
                <img src="${item.img}" class="w-20 h-20 object-cover border border-[var(--border)] rounded-none mix-blend-multiply">
                <div class="flex-grow flex flex-col justify-center pr-6">
                    <span class="text-sm font-semibold uppercase tracking-wide leading-tight line-clamp-2">${escapeHtml(item.title)}</span>
                    <div class="flex flex-wrap items-center gap-2 mt-1">${sizeBadge} <span class="text-[10px] text-[var(--text-muted)]">Арт: ${item.sku}</span></div>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="text-sm font-bold text-[var(--gold-muted)]">${formatterPrice.format(item.price)} ₴</span>
                        <div class="inline-flex items-center rounded-none border border-[var(--border)] bg-[var(--bg-elevated)]">
                            <button class="px-2 py-1 text-sm text-[var(--text-muted)]" onclick="window.updateCartQty('${item.cartId}', -1)">−</button>
                            <span class="px-2 text-xs font-semibold min-w-6 text-center">${item.qty}</span>
                            <button class="px-2 py-1 text-sm text-[var(--text-muted)]" onclick="window.updateCartQty('${item.cartId}', 1)">+</button>
                        </div>
                    </div>
                </div>
                <button class="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--danger)]" onclick="window.removeFromCart('${item.cartId}')">✕</button>
            </div>
        `);
    });
    
    if(subtotalVal) subtotalVal.innerText = formatterPrice.format(total) + ' ₴';
    cartBadges.forEach(b => { b.innerText = totalQty; b.style.display = totalQty > 0 ? 'flex' : 'none'; });
    const checkoutBtnWrapper = document.getElementById('checkoutBtnWrapper');
    if(checkoutBtnWrapper) {
        checkoutBtnWrapper.style.display = 'block';
        checkoutBtnWrapper.innerHTML = `<button onclick="window.checkoutOrder()" class="btn-solid w-full bg-[var(--gold-muted)] !text-[#111] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-opacity">Оформити замовлення</button>`;
    }
};

window.toggleFavDrawer = function() {
    const drawer = document.getElementById('favDrawer');
    const overlay = document.getElementById('favOverlay');
    if (!drawer) return;
    if (!drawer.classList.contains('active')) {
        window.renderFavDrawer(); drawer.classList.add('active'); if(overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.remove('active'); if(overlay) overlay.classList.remove('active');
        if (!document.getElementById('sideMenu')?.classList.contains('active')) document.body.style.overflow = '';
    }
};

window.renderFavDrawer = function() {
    let favsIds = getFavs();
    const allProducts = window.API ? API.get('bv_products', []) : [];
    const favBody = document.getElementById('favBody');
    const favBadges = document.querySelectorAll('.fav-badge');
    
    favBadges.forEach(b => { b.innerText = favsIds.length; b.style.display = favsIds.length > 0 ? 'flex' : 'none'; });
    if(!favBody) return;

    if (favsIds.length === 0) {
        const lang = window.API ? API.get('bv_lang', 'uk') : 'uk';
        const t = typeof i18n !== 'undefined' ? i18n : (window.i18n || null);
        const emptyMsg = t && t[lang] && t[lang].fav_empty ? t[lang].fav_empty : "Список порожній";
        favBody.innerHTML = `<div class="text-center text-[var(--text-muted)] mt-10">${emptyMsg}</div>`;
        return;
    }

    const favProducts = allProducts.filter(p => favsIds.includes(p.id));
    favBody.innerHTML = favProducts.map(prod => {
        const base = prod.variations ? prod.variations.base : prod;
        const safeImg = escapeHtml((base.images && base.images.length > 0) ? base.images[0] : (base.img || ''));
        const safeName = escapeHtml(window.getLoc(base.name));
        const priceDisplay = base.discount && Number(base.discount) > 0 ? base.discount : base.price;

        return `
        <div class="cart-item flex gap-4 p-3 border border-[var(--border)] mb-3 relative cursor-pointer" onclick="location.href='product.html?id=${prod.id}'">
            <img src="${safeImg}" class="w-16 h-16 object-cover border border-[var(--border)] mix-blend-multiply">
            <div class="flex-grow flex flex-col justify-center pr-6">
                <span class="text-xs font-semibold uppercase tracking-wide line-clamp-1">${safeName}</span>
                <span class="text-sm font-bold text-[var(--gold-muted)] mt-1">${formatterPrice.format(priceDisplay)} ₴</span>
            </div>
            <button class="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--danger)]" onclick="event.stopPropagation(); window.toggleFav('${prod.id}')">✕</button>
        </div>
        `;
    }).join('');
};

// ==========================================
// НАВІГАЦІЯ ТА UI ЕЛЕМЕНТИ
// ==========================================
window.toggleMenu = function() {
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    if(sideMenu) sideMenu.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
    document.body.style.overflow = (sideMenu && sideMenu.classList.contains('active')) ? 'hidden' : 'auto';
};

window.toggleAccordion = function(listId, arrowId) {
    const list = document.getElementById(listId);
    const arrow = document.getElementById(arrowId);
    if (!list) return;
    list.classList.toggle('open');
    if (arrow) arrow.style.transform = list.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
};

window.toggleTheme = function() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    if(window.API) API.set('bv_theme', newTheme);
    const svg = newTheme === 'light' ? sunSVG : moonSVG;
    const icon = document.getElementById('themeIcon');
    const iconMob = document.getElementById('themeIconMob');
    if(icon) icon.innerHTML = svg;
    if(iconMob) iconMob.innerHTML = svg;
};

window.changeLang = function(lang) {
    const displayLang = lang === 'uk' ? 'UA' : lang.toUpperCase();
    ['currentFlag', 'currentFlagMob'].forEach(id => { const el = document.getElementById(id); if(el) el.src = `https://flagcdn.com/${flags[lang]}.svg`; });
    ['currentLangLabel', 'currentLangLabelMob'].forEach(id => { const el = document.getElementById(id); if(el) el.innerText = displayLang; });
    
    const t = typeof i18n !== 'undefined' ? i18n : (window.i18n || null);
    if (t && t[lang]) {
        document.querySelectorAll('[data-i18n]').forEach(el => el.innerHTML = t[lang][el.dataset.i18n] || el.innerHTML);
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = t[lang][el.dataset.i18nPlaceholder] || el.placeholder);
    }
    
    if(window.API) API.set('bv_lang', lang);
    if(typeof window.renderCart === 'function') window.renderCart(); 
    if(typeof window.renderFavDrawer === 'function') window.renderFavDrawer();
    if(document.getElementById('dynamicHomeBlocksContainer')) window.renderHomeSections();
    
    // ДОДАЙ ОСЬ ЦЕЙ РЯДОК:
    if(document.getElementById('dynamicCategoriesContainer')) window.renderHomeCategories();
};

window.toggleMobileSearch = function() {
    const searchBox = document.getElementById('mobSearchContainer');
    if (!searchBox) return;
    searchBox.classList.toggle('hidden');
    if (!searchBox.classList.contains('hidden')) { setTimeout(() => { document.getElementById('mobSearchOverlayInput')?.focus(); }, 100); }
};

window.executeSearch = function(query) {
    if (!query || !query.trim()) return;
    window.location.href = `catalog.html?search=${encodeURIComponent(query.trim())}`;
};

window.toggleAccordionPanel = function(clickedPanel) {
    const allPanels = document.querySelectorAll('.glass-panel-item');
    if (clickedPanel.classList.contains('active')) return;
    allPanels.forEach(panel => panel.classList.remove('active'));
    clickedPanel.classList.add('active');
};

// ==========================================
// АВТОРИЗАЦІЯ
// ==========================================
window.smartProfileClick = function() {
    if(document.getElementById('sideMenu')?.classList.contains('active')) window.toggleMenu(); 
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    if (user && user.id) window.location.href = 'profile.html';
    else window.openAuthModal();
};

window.openAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) { modal.classList.remove('hidden'); setTimeout(() => modal.classList.remove('opacity-0'), 10); }
};

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if(modal) { modal.classList.add('opacity-0'); setTimeout(() => modal.classList.add('hidden'), 300); }
};

window.updateProfileMenu = function() {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    const dropdownMenu = document.getElementById('profileDropdownMenu');
    if(dropdownMenu) {
        if (user) {
            dropdownMenu.innerHTML = `
                <a href="profile.html" class="dropdown-item w-full text-left font-medium">Мій кабінет</a>
                ${user.role === 'admin' ? '<a href="admin.html" class="dropdown-item w-full text-left font-bold text-[#c5a059]">Панель Адміна</a>' : ''}
                <button onclick="window.logoutUser()" class="dropdown-item w-full text-left text-red-400 hover:text-red-500 mt-2 border-t border-[var(--border)] pt-2">Вийти з акаунту</button>
            `;
        } else {
            dropdownMenu.innerHTML = `
                <button onclick="window.isRegisterMode=false; window.openAuthModal();" class="dropdown-item w-full text-left font-medium">Увійти</button>
                <button onclick="window.isRegisterMode=true; window.openAuthModal();" class="dropdown-item w-full text-left font-medium text-[#c5a059]">Зареєструватися</button>
            `;
        }
    }
};

window.logoutUser = async function() {
    if(window.mockAuth) await window.mockAuth.signOut();
    if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('profile.html')) {
        window.location.href = 'index.html';
    } else {
        if(typeof window.renderCart === 'function') window.renderCart(); 
        if(typeof window.renderFavDrawer === 'function') window.renderFavDrawer(); 
        if(typeof window.updateProfileMenu === 'function') window.updateProfileMenu(); 
    }
};

window.isRegisterMode = false;
window.toggleAuthMode = function(e) {
    if(e) e.preventDefault();
    window.isRegisterMode = !window.isRegisterMode;
    
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('authToggleText');
    const toggleLink = document.getElementById('authToggleLink');
    const nameField = document.getElementById('nameFieldContainer');
    
    if (window.isRegisterMode) {
        if(title) title.innerText = 'Реєстрація';
        if(btn) btn.innerText = 'Зареєструватися';
        if(toggleText) toggleText.innerText = 'Вже є акаунт?';
        if(toggleLink) toggleLink.innerText = 'Увійти';
        if(nameField) { nameField.classList.remove('hidden'); nameField.classList.add('flex'); }
    } else {
        if(title) title.innerText = 'Вхід';
        if(btn) btn.innerText = 'Увійти';
        if(toggleText) toggleText.innerText = 'Немає акаунта?';
        if(toggleLink) toggleLink.innerText = 'Зареєструватися';
        if(nameField) { nameField.classList.add('hidden'); nameField.classList.remove('flex'); }
    }
};

document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'authForm') {
        e.preventDefault();
        const btn = document.getElementById('authSubmitBtn');
        const originalText = btn.innerText;
        btn.innerText = 'Зачекайте...'; btn.disabled = true;
        
        const email = document.getElementById('authUser').value.trim();
        const pass = document.getElementById('authPass').value.trim();
        const name = document.getElementById('authName') ? document.getElementById('authName').value.trim() : '';

        try {
            let res;
            if (window.isRegisterMode) res = await window.mockAuth.signUp(email, pass, name);
            else res = await window.mockAuth.signIn(email, pass);
            
            if (res.error) {
                alert(res.error.message || 'Помилка авторизації');
            } else {
                window.closeAuthModal();
                const checkoutEmail = document.getElementById('orderEmail');
                if (checkoutEmail) checkoutEmail.value = res.data.user.email;
                if(typeof window.updateProfileMenu === 'function') window.updateProfileMenu();
                if(typeof window.migrateScopedState === 'function') window.migrateScopedState();
                if(typeof window.renderCart === 'function') window.renderCart();
                if(typeof window.renderFavDrawer === 'function') window.renderFavDrawer();
                
                if (res.data.user.role === 'admin') window.location.href = 'admin.html';
                else window.location.href = 'profile.html';
            }
        } catch (err) { alert('Помилка: ' + err.message); } 
        finally { btn.innerText = originalText; btn.disabled = false; }
    }
});

// ==========================================
// ГЕНЕРАЦІЯ МЕНЮ (Десктоп та Мобільне)
// ==========================================
window.getCategoryIconSVG = function(catId) {
    const id = catId.toLowerCase();
    if (id.includes('gold')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M6 3h12l4 6-10 13L2 9Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M11 3 8 9l4 13"/><path stroke-linecap="round" stroke-linejoin="round" d="M13 3l3 6-4 13"/>`; 
    if (id.includes('silver')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
    if (id.includes('ring')) return `<circle cx="12" cy="14" r="5" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 9l-2-3h4l-2 3z"/>`; 
    if (id.includes('earring')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v9"/><circle cx="12" cy="16" r="3" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 4h6"/>`; 
    if (id.includes('chain') || id.includes('neck')) return `<circle cx="8" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" d="M11 12h2"/>`; 
    if (id.includes('bracelet')) return `<ellipse cx="12" cy="12" rx="7" ry="3" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 12v2c0 2 3 7 7 7s7-5 7-7v-2"/>`; 
    return `<circle cx="12" cy="12" r="4" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v2"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 20v2"/>`; 
};

window.generateMenus = function() {
    const megaCol1 = document.getElementById('megaCol1');
    const megaMenu = document.querySelector('.mega-menu');
    const sideMenu = document.getElementById('sideMenu');
    const categoriesTree = window.API ? API.get('bv_categories_tree', []) : [];
    
    // Динамічно тягнемо налаштування для підвалу меню
    const settings = window.API ? API.get('bv_settings', {}) : {};
    
    const buildMobileTree = (nodes) => {
        let html = '';
        nodes.forEach(n => {
            const name = window.getLoc(n.name);
            if (n.subcategories && n.subcategories.length > 0) {
                html += `
                <div class="mob-nested-wrap">
                    <div class="mob-nested-title" onclick="window.toggleAccordion('mob-sub-${n.id}', 'mob-arrow-${n.id}')">
                        <div class="flex items-center gap-3"><span style="font-size: 14px; font-weight: 500;">${name}</span></div>
                        <svg id="mob-arrow-${n.id}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="transition-transform duration-300"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div class="mob-nested-list" id="mob-sub-${n.id}">
                        ${buildMobileTree(n.subcategories)}
                        <a href="catalog.html#${n.id}" class="mob-all-btn mt-2" onclick="window.toggleMenu()">Всі товари: ${name} →</a>
                    </div>
                </div>`;
            } else {
                html += `<a href="catalog.html#${n.id}" class="mob-tag py-2" onclick="window.toggleMenu()">${name}</a>`;
            }
        });
        return html;
    };

    if(megaCol1 && categoriesTree.length > 0) {
        // ... (Тут залишається код десктопного мега-меню, він у тебе працює ідеально, я його не чіпаю)
        megaCol1.innerHTML = '';
        if(megaMenu) megaMenu.querySelectorAll('.mega-col-2').forEach(col => col.remove());

        categoriesTree.forEach((cat, index) => {
            const isActive = index === 0 ? 'active' : ''; 
            const svgIcon = window.getCategoryIconSVG(cat.id);
            const catName = window.getLoc(cat.name);
            
            megaCol1.innerHTML += `<div class="mega-cat-item ${isActive}" data-target="mc-${cat.id}"><svg class="mega-cat-icon" viewBox="0 0 24 24">${svgIcon}</svg><span>${catName}</span></div>`;

            let groupsHtml = '<div class="zlato-groups-grid">';
            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach(sub => {
                    groupsHtml += `<div class="zlato-group-wrapper"><a href="catalog.html#${sub.id}" class="zlato-group-title">${window.getLoc(sub.name)}</a>`;
                    if (sub.subcategories && sub.subcategories.length > 0) {
                        groupsHtml += `<div class="zlato-tags-container">`;
                        sub.subcategories.forEach(subsub => { groupsHtml += `<a href="catalog.html#${subsub.id}" class="zlato-tag">${window.getLoc(subsub.name)}</a>`; });
                        groupsHtml += `</div>`;
                    }
                    groupsHtml += `</div>`;
                });
            }
            groupsHtml += '</div>';

            if(megaMenu) {
                const newCol2 = document.createElement('div');
                newCol2.className = `mega-col-2 zlato-content ${isActive}`;
                newCol2.id = `mc-${cat.id}`;
                newCol2.innerHTML = `<div class="flex items-center gap-3 mb-6"><h2 class="text-3xl font-serif text-[var(--text-main)]">${catName}</h2><a href="catalog.html#${cat.id}" class="text-[12px] uppercase tracking-widest text-[var(--gold-muted)] font-bold transition-colors">Всі →</a></div>${groupsHtml}`;
                megaMenu.appendChild(newCol2);
            }
        });

        megaCol1.innerHTML += `<a href="exclusive.html" class="mega-atelier-btn mt-auto mx-4 mb-4 border border-[var(--gold-muted)] text-[var(--gold-muted)] p-3 rounded-none flex items-center justify-center gap-2 hover:bg-[var(--gold-muted)] hover:text-[#111] transition-colors font-bold uppercase tracking-widest text-[10px]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7-7-7M5 12h14"/></svg><span data-i18n="m_atelier">Ексклюзив</span></a>`;
        
        document.querySelectorAll('.mega-cat-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                document.querySelectorAll('.mega-cat-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.zlato-content').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                const targetCol = document.getElementById(item.getAttribute('data-target'));
                if(targetCol) targetCol.classList.add('active');
            });
        });
    }

    if(sideMenu) {
        const mobCatHtml = buildMobileTree(categoriesTree);
        const savedLang = window.API ? API.get('bv_lang', 'uk') : 'uk';
        const currentThemeIcon = document.documentElement.getAttribute('data-theme') === 'light' ? sunSVG : moonSVG;

        // Формуємо динамічні контакти з бази
        let contactsHtml = '';
        if (settings.phone) {
            contactsHtml += `<a href="tel:${settings.phoneClean || ''}" class="text-[16px] font-medium text-[var(--text-main)] tracking-wide hover:text-[var(--gold-muted)] transition block mb-1">${settings.phone}</a>`;
        }
        if (settings.workHours) {
            contactsHtml += `<span class="block text-[11px] text-[var(--text-muted)] mb-1">${settings.workHours}</span>`;
        }
        if (settings.address) {
            contactsHtml += `<span class="block text-[11px] text-[var(--text-muted)] leading-relaxed">${settings.address}</span>`;
        }

        let socialsHtml = '';
        if (settings.instagram || settings.telegram) {
            socialsHtml += `<div class="flex gap-3 mt-4">`;
            if (settings.instagram) {
                socialsHtml += `<a href="${settings.instagram}" target="_blank" class="w-10 h-10 border border-[var(--border)] flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--gold-muted)] hover:text-[#111] transition"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>`;
            }
            if (settings.telegram) {
                socialsHtml += `<a href="${settings.telegram}" target="_blank" class="w-10 h-10 border border-[var(--border)] flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--gold-muted)] hover:text-[#111] transition"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></a>`;
            }
            socialsHtml += `</div>`;
        }

        sideMenu.innerHTML = `
            <div class="flex justify-between items-center pb-4 pt-12 px-6">
                <a href="index.html" class="flex flex-col items-start gap-1" style="text-decoration:none;"><span class="text-3xl font-serif text-[var(--gold-muted)] leading-none">BV</span></a>
                <div class="flex items-center gap-5">
                    <button onclick="window.toggleTheme()" class="text-[var(--text-main)] opacity-80 hover:opacity-100 transition-opacity"><svg id="themeIconMob" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${currentThemeIcon}</svg></button>
                    <div class="text-[11px] font-bold text-[var(--text-main)] flex gap-1.5 uppercase opacity-80">
                        <span class="cursor-pointer ${savedLang==='uk'?'text-[var(--gold-muted)]':''}" onclick="window.changeLang('uk')">UK</span><span class="opacity-30">|</span>
                        <span class="cursor-pointer ${savedLang==='ru'?'text-[var(--gold-muted)]':''}" onclick="window.changeLang('ru')">RU</span><span class="opacity-30">|</span>
                        <span class="cursor-pointer ${savedLang==='en'?'text-[var(--gold-muted)]':''}" onclick="window.changeLang('en')">EN</span>
                    </div>
                    <button onclick="window.smartProfileClick()" class="text-[var(--text-main)] opacity-80 hover:opacity-100 transition-opacity"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></button>
                </div>
            </div>

            <div class="px-6 py-4 flex flex-col flex-grow overflow-y-auto custom-scrollbar">
                <a href="index.html" class="mob-menu-title" onclick="window.toggleMenu()">Головна</a>
                <div>
                    <div class="mob-menu-title cursor-pointer" onclick="window.toggleAccordion('mobCatList', 'mobCatArrow')">
                        <span data-i18n="m2">Каталог</span>
                        <svg id="mobCatArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="transition-transform duration-300 opacity-60"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div class="mob-accordion-list" id="mobCatList" style="gap: 0; padding-left: 0;">${mobCatHtml}</div>
                </div>
                <a href="services.html" class="mob-menu-title" onclick="window.toggleMenu()"><span data-i18n="m_price">Прайс</span></a>
                <a href="exclusive.html" class="mob-menu-title text-[var(--gold-muted)]" onclick="window.toggleMenu()"><span data-i18n="m_atelier">Ексклюзив</span></a>
            </div>

            <div class="mt-auto px-6 py-8 border-t border-[var(--border)] bg-black/10">
                ${contactsHtml}
                ${socialsHtml}
            </div>
        `;
    }
};

// ==========================================
// СЛАЙДЕРИ ТА КАРУСЕЛІ
// ==========================================
window.initPremiumCarousel = function(track) {
    if (!track || track.dataset.init === 'true') return;
    track.dataset.init = 'true';

    let wrapper = track.closest('.group');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'relative w-full group outline-none'; 
        track.parentNode.insertBefore(wrapper, track);
        wrapper.appendChild(track);
    }

    const btnClass = "btn-cross hidden md:flex absolute top-1/2 -translate-y-1/2 z-40 w-12 h-12 lg:w-14 lg:h-14 items-center justify-center rounded-none bg-[var(--bg-card)]/40 backdrop-blur-md border border-[var(--border)] text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition-all duration-400 hover:bg-[var(--bg-card)] hover:border-[var(--gold-muted)] hover:text-[var(--gold-muted)] shadow-[0_8px_30px_rgba(0,0,0,0.15)]";
    const prevBtn = document.createElement('button'); prevBtn.className = `${btnClass} left-2 lg:left-6`; prevBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 18l-6-6 6-6"/></svg>`;
    const nextBtn = document.createElement('button'); nextBtn.className = `${btnClass} right-2 lg:right-6`; nextBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg>`;
    wrapper.appendChild(prevBtn); wrapper.appendChild(nextBtn);

    track.classList.add('no-scrollbar', 'cursor-grab'); track.classList.remove('snap-x', 'snap-mandatory'); track.style.scrollBehavior = 'auto';

    let isDown = false, isDragging = false, startX, scrollLeft, lastX, velX = 0, momentumID;

    const momentumLoop = () => {
        if (isDown) return; track.scrollLeft -= velX; velX *= 0.95; 
        const bWidth = track.scrollWidth / 3; if (track.scrollLeft >= bWidth * 2) track.scrollLeft -= bWidth; if (track.scrollLeft <= 0) track.scrollLeft += bWidth;
        if (Math.abs(velX) > 0.5) { momentumID = requestAnimationFrame(momentumLoop); } else { track.classList.add('snap-x', 'snap-mandatory'); }
    };
    const beginMomentum = () => { track.classList.remove('snap-x', 'snap-mandatory'); cancelAnimationFrame(momentumID); momentumID = requestAnimationFrame(momentumLoop); };

    nextBtn.onclick = () => { velX = -25; beginMomentum(); };
    prevBtn.onclick = () => { velX = 25; beginMomentum(); };

    const startAction = (e) => { isDown = true; isDragging = false; track.classList.remove('snap-x', 'snap-mandatory'); track.classList.add('cursor-grabbing'); cancelAnimationFrame(momentumID); startX = (e.pageX || e.touches[0].pageX); scrollLeft = track.scrollLeft; lastX = startX; velX = 0; };
    const endAction = () => { if (!isDown) return; isDown = false; track.classList.remove('cursor-grabbing'); beginMomentum(); setTimeout(() => { isDragging = false; }, 50); };
    const moveAction = (e) => { if (!isDown) return; const currentX = (e.pageX || e.touches[0].pageX); const walk = (currentX - startX); if (Math.abs(walk) > 5) isDragging = true; track.scrollLeft = scrollLeft - walk; velX = currentX - lastX; lastX = currentX; };
    
    track.addEventListener('mousedown', startAction); window.addEventListener('mouseup', endAction); track.addEventListener('mousemove', moveAction); track.addEventListener('mouseleave', endAction);
    track.addEventListener('touchstart', startAction, {passive: true}); track.addEventListener('touchend', endAction); track.addEventListener('touchmove', moveAction, {passive: true});
    setTimeout(() => { track.scrollLeft = track.scrollWidth / 3; }, 200);
};

window.initBannerSlider = function() {
    const container = document.getElementById('mainBannerContainer');
    if (!container) return;
    let banners = window.API ? API.get('bv_banners', []) : [];
    const ratio = window.API ? API.get('bv_settings', {}).bannerRatio || '3/1' : '3/1';
    window.bannerCount = banners.length; window.currentBanner = 0; window.isBannerAnimating = false;
    
    container.innerHTML = `
        <div class="relative w-full h-full rounded-none overflow-hidden group bg-[var(--bg-elevated)] border border-[var(--border)]" id="bannerTrack">
            ${banners.map((b, i) => `
                <div class="banner-slide absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-700 ease-in-out" style="opacity: ${i === 0 ? '1' : '0'}; z-index: ${i === 0 ? '10' : '1'};" onclick="window.location.href='${b.link || '#'}'">
                    <img src="${b.img}" class="w-full h-full object-cover" style="aspect-ratio: ${ratio};">
                    <div class="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                </div>
            `).join('')}
            <button class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-none items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hidden md:flex" onclick="window.moveBanner(-1, event)">❮</button>
            <button class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/70 text-white rounded-none items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hidden md:flex" onclick="window.moveBanner(1, event)">❯</button>
            <div id="bannerDots" class="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                ${banners.map((_, i) => `<button class="banner-dot w-1.5 h-1.5 md:w-2 md:h-2 rounded-none transition-all duration-300 ${i === 0 ? 'bg-[var(--gold-muted)] scale-125' : 'bg-white/50'}" onclick="window.goToBanner(${i}, event)"></button>`).join('')}
            </div>
        </div>
    `;
    
    if(banners.length > 1) window.bannerInterval = setInterval(() => window.moveBanner(1), 5000); 
};

window.moveBanner = function(dir, e) {
    if(e) e.stopPropagation();
    if(window.bannerCount <= 1 || window.isBannerAnimating) return;
    window.isBannerAnimating = true; clearInterval(window.bannerInterval);
    const newIndex = (window.currentBanner + dir + window.bannerCount) % window.bannerCount;
    window.executeFade(newIndex);
    setTimeout(() => { window.isBannerAnimating = false; }, 700);
    window.bannerInterval = setInterval(() => window.moveBanner(1), 5000);
};

window.goToBanner = function(index, e) {
    if(e) e.stopPropagation();
    if(window.bannerCount <= 1 || window.isBannerAnimating || index === window.currentBanner) return;
    window.isBannerAnimating = true; clearInterval(window.bannerInterval);
    window.executeFade(index);
    setTimeout(() => { window.isBannerAnimating = false; }, 700);
    window.bannerInterval = setInterval(() => window.moveBanner(1), 5000);
};

window.executeFade = function(newIndex) {
    const slides = document.querySelectorAll('.banner-slide');
    if(slides.length === 0) return;
    slides.forEach((slide, i) => { slide.style.opacity = i === newIndex ? '1' : '0'; slide.style.zIndex = i === newIndex ? '10' : '1'; });
    window.currentBanner = newIndex;
    document.querySelectorAll('.banner-dot').forEach((d, i) => {
        d.className = i === window.currentBanner ? 'banner-dot w-1.5 h-1.5 md:w-2 md:h-2 rounded-none transition-all duration-300 bg-[var(--gold-muted)] scale-125' : 'banner-dot w-1.5 h-1.5 md:w-2 md:h-2 rounded-none transition-all duration-300 bg-white/50';
    });
};

// ==========================================
// ГЕНЕРАЦИЯ БЛОКОВ ГЛАВНОЙ (Стиль "Золотой Век")
// ==========================================
window.renderHomeSections = function() {
    const homeBlocks = window.API ? API.get('bv_home_blocks', []) : [];
    const allProducts = window.API ? API.get('bv_products', []) : []; 
    let container = document.getElementById('dynamicHomeBlocksContainer');
    
    if (!container || homeBlocks.length === 0) return;
    
    let html = '';
    homeBlocks.filter(b => b.active).forEach(block => {
        let items = allProducts.filter(p => p.blocks && p.blocks.includes(block.id));
        
        if (items.length > 0) {
            const title = window.getLoc(block.name);
            const trackId = `block-track-${block.id}`;
            // flex-none, без відступів
            const cardWrapper = (p) => `<div class="flex-none w-[60%] sm:w-[33.333%] md:w-[25%] lg:w-[20%] xl:w-[16.666%] snap-start flex">${window.renderProductCard(p)}</div>`;
            
            const bgStyle = block.bgImage ? `background-image: url('${block.bgImage}'); background-size: cover; background-position: center;` : '';
            const overlayClass = block.bgImage ? 'bg-black/60 backdrop-blur-[2px]' : 'bg-[var(--bg-body)]';
            const titleColor = block.bgImage ? 'text-white' : 'text-[var(--text-main)]';
            const subtitleColor = block.bgImage ? 'text-[var(--gold-muted)]' : 'text-[var(--text-muted)]';
            
            html += `
            <section class="relative max-w-[1920px] mx-auto py-6 md:py-8 overflow-hidden border-b border-[var(--border)]" style="${bgStyle}">
                <div class="absolute inset-0 ${overlayClass} z-0 pointer-events-none transition-colors duration-500"></div>
                
                <div class="relative z-10 mb-4 text-center px-4">
                    <span class="text-[10px] uppercase tracking-[0.4em] ${subtitleColor} font-bold block mb-1 drop-shadow-md">BV Jewelry</span>
                    <h2 class="font-serif text-2xl md:text-3xl ${titleColor} drop-shadow-lg">${title}</h2>
                </div>
                
                <div class="relative z-10 promo-carousel-container select-none group w-full">
                    <div id="${trackId}" class="flex overflow-x-auto gap-0 px-0 snap-x snap-mandatory no-scrollbar pb-0 w-full border-t border-[var(--border)]">
                        ${items.map(cardWrapper).join('')}
                    </div>
                </div>
            </section>`;
        }
    });
    
    container.innerHTML = html;

    homeBlocks.forEach(block => {
        const track = document.getElementById(`block-track-${block.id}`);
        if (track) window.initPremiumCarousel(track);
    });
};

// ==========================================
// БЕЗПЕЧНИЙ ПЕРЕХІД ТА ПОКУПКА 
// ==========================================
window.goToProduct = function(el) {
    const id = el.getAttribute('data-id');
    if(id) window.location.href = 'product.html?id=' + encodeURIComponent(id);
};

window.handleFavClick = function(event, el) {
    event.preventDefault(); 
    event.stopPropagation();
    
    const id = el.getAttribute('data-id');
    if(id && window.toggleFav) {
        window.toggleFav(id);
        
        // Оновлюємо іконку ТІЛЬКИ на тій кнопці, яку натиснули
        const favs = getFavs();
        const svg = el.querySelector('svg');
        if(favs.includes(id)) {
            el.classList.remove('text-white');
            el.classList.add('text-[var(--danger)]');
            if(svg) svg.setAttribute('fill', 'currentColor');
        } else {
            el.classList.remove('text-[var(--danger)]');
            el.classList.add('text-white');
            if(svg) svg.setAttribute('fill', 'none');
        }
    }
};

window.handleQuickBuy = function(event, el) {
    event.preventDefault(); 
    event.stopPropagation(); 
    const productId = el.getAttribute('data-id');
    
    const products = window.API ? API.get('bv_products', []) : [];
    const prod = products.find(p => p.id === productId);
    if(!prod) return;

    const cartItem = {
        cartId: Date.now() + Math.random().toString(36).substr(2, 9),
        id: prod.id,
        sku: prod.sku || prod.id,
        title: prod.variations?.base?.name?.uk || 'Прикраса',
        price: prod.variations?.base?.discount || prod.variations?.base?.price || 0,
        img: (prod.variations?.base?.images && prod.variations.base.images.length > 0) ? prod.variations.base.images[0] : 'img/placeholder.jpg',
        qty: 1,
        size: prod.sizes && prod.sizes.length > 0 ? prod.sizes[0] : null
    };
    
    let cart = window.API ? API.get('bv_cart', []) : [];
    cart.push(cartItem);
    if(window.API) API.set('bv_cart', cart);
    
    if(typeof window.renderCart === 'function') window.renderCart();
    if(typeof window.showToast === 'function') window.showToast("Товар додано до кошика!");
    
    // Анімація: міняємо ТІЛЬКИ ту кнопку, по якій клікнули
    const originalHtml = el.innerHTML;
    el.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    el.classList.add('bg-green-500', 'border-green-500', 'text-white');
    el.classList.remove('lg:hover:bg-[var(--gold-muted)]', 'lg:hover:border-[var(--gold-muted)]', 'lg:hover:text-[#111]', 'text-[var(--text-main)]');
    
    setTimeout(() => {
        el.innerHTML = originalHtml;
        el.classList.remove('bg-green-500', 'border-green-500', 'text-white');
        el.classList.add('lg:hover:bg-[var(--gold-muted)]', 'lg:hover:border-[var(--gold-muted)]', 'lg:hover:text-[#111]', 'text-[var(--text-main)]');
    }, 2000);
};

// ==========================================
// ГЛОБАЛЬНИЙ ГЕНЕРАТОР КАРТКИ ТОВАРУ
// ==========================================
window.renderProductCard = function(p) {
    if (!p || !p.variations || !p.variations.base) return '';

    const mainImg = (p.variations.base.images && p.variations.base.images.length > 0) ? p.variations.base.images[0] : 'img/placeholder.jpg';
    const categories = window.API ? API.get('bv_categories_flat', []) : [];
    const catName = categories.find(c => c.id === p.category)?.name?.uk || 'Прикраса';
    
    const price = p.variations.base.discount || p.variations.base.price || 0;
    
    let oldPriceHtml = '';
    if (p.variations.base.discount && Number(p.variations.base.discount) > 0 && p.variations.base.price) {
         oldPriceHtml = `<span class="text-[10px] text-gray-500 line-through">${p.variations.base.price} ₴</span>`;
    }

    const badgeHtml = p.badge && p.badge !== 'none' ? `<div class="absolute top-2 left-2 bg-[var(--gold-muted)] text-[#111] text-[9px] font-bold uppercase tracking-widest px-2 py-1 z-10">${p.badge}</div>` : '';
    const safeName = (p.variations.base.name.uk || '').replace(/"/g, '&quot;');

    const isFav = getFavs().includes(String(p.id));
    const heartFill = isFav ? 'currentColor' : 'none';
    const heartColor = isFav ? 'text-[var(--danger)]' : 'text-white';

    // Всі класи rounded замінені на rounded-none
    return `
    <div class="group flex flex-col bg-[var(--bg-card)] border-r border-b border-[var(--border)] w-full overflow-hidden cursor-pointer lg:hover:border-[var(--gold-muted)] transition-all duration-500 relative" onclick="window.goToProduct(this)" data-id="${p.id}">
        
        <div class="relative w-full aspect-square overflow-hidden bg-[rgba(255,255,255,0.02)]">
            <img src="${mainImg}" class="w-full h-full object-cover transition-transform duration-1000 lg:group-hover:scale-110" alt="${safeName}" loading="lazy">
            ${badgeHtml}
            
            <button type="button" onclick="window.handleFavClick(event, this)" data-id="${p.id}" class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-none bg-black/30 backdrop-blur-md border border-white/10 ${heartColor} lg:hover:text-[var(--danger)] lg:hover:bg-black/50 transition-colors z-20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="${heartFill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
        </div>

        <div class="p-3 md:p-4 flex flex-col flex-grow bg-[var(--bg-card)] relative z-10">
            <span class="text-[9px] uppercase tracking-[0.2em] text-[var(--gold-muted)] font-bold mb-1 block">${catName}</span>
            <h3 class="text-sm font-medium text-[var(--text-main)] mb-3 line-clamp-2 leading-snug flex-grow">${safeName}</h3>
            
            <div class="flex items-end justify-between mt-auto">
                <div class="flex flex-col">
                    ${oldPriceHtml}
                    <span class="text-[15px] font-bold text-[var(--text-main)]">${price} ₴</span>
                </div>
                
                <button type="button" onclick="window.handleQuickBuy(event, this)" data-id="${p.id}" class="buy-btn w-9 h-9 rounded-none bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-main)] lg:hover:bg-[var(--gold-muted)] lg:hover:border-[var(--gold-muted)] lg:hover:text-[#111] transition-colors duration-300 lg:active:scale-90 z-30 shadow-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
    `;
};

// ==========================================
// ГЕНЕРАЦІЯ КАТЕГОРІЙ НА ГОЛОВНІЙ (Мобільно-адаптивна сітка + Рандомні фото)
// ==========================================
window.renderHomeCategories = function() {
    const container = document.getElementById('dynamicCategoriesContainer');
    if (!container) return;

    const categoriesTree = window.API ? API.get('bv_categories_tree', []) : [];
    const allProducts = window.API ? API.get('bv_products', []) : [];

    const getCategoryIds = (cat) => {
        let ids = [cat.id];
        if (cat.subcategories && cat.subcategories.length > 0) {
            cat.subcategories.forEach(sub => { ids = ids.concat(getCategoryIds(sub)); });
        }
        return ids;
    };

    // Змінено gap-3 md:gap-6 на gap-0 (монолітна стіна)
    let html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-t border-[var(--border)]">';

    categoriesTree.forEach(cat => {
        const catName = window.getLoc(cat.name);
        const validIds = getCategoryIds(cat);
        const catProducts = allProducts.filter(p => validIds.includes(p.category) && p.variations?.base?.images?.length > 0);
        
        let randomImg = 'img/placeholder.jpg';
        if (catProducts.length > 0) {
            const randomItem = catProducts[Math.floor(Math.random() * catProducts.length)];
            randomImg = randomItem.variations.base.images[0];
        }

        html += `
        <a href="catalog.html#${cat.id}" class="group relative block aspect-[4/5] overflow-hidden border-b border-r border-[var(--border)] bg-[var(--bg-elevated)] rounded-none">
            <img src="${randomImg}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 lg:group-hover:scale-110" loading="lazy" alt="${escapeHtml(catName)}">
            
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 lg:group-hover:opacity-100 transition-opacity"></div>
            
            <div class="absolute bottom-0 left-0 w-full p-3 md:p-5 flex items-end justify-between">
                <span class="text-white font-serif text-sm md:text-xl tracking-wide drop-shadow-md line-clamp-1 pr-2">${catName}</span>
                <div class="w-6 h-6 md:w-8 md:h-8 rounded-none bg-white/20 backdrop-blur-sm flex items-center justify-center text-white lg:-translate-x-2 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 transition-all duration-300 flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
            </div>
        </a>`;
    });

    html += '</div>';
    container.innerHTML = html;
};

// Автоматичний запуск при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if(document.getElementById('dynamicCategoriesContainer')) {
            window.renderHomeCategories();
        }
    }, 100);
});