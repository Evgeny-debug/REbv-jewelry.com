// ==========================================
// УТИЛІТИ ТА СТАН
// ==========================================
const formatterPrice = new Intl.NumberFormat('uk-UA', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const sunSVG = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
const moonSVG = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
const flags = { uk: "ua", en: "gb", ru: "ru" };

window.getLoc = function(obj, field) {
    if (!obj) return '';
    const lang = API.get('bv_lang', 'uk');
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

function getCart() { return API.get(getScopedStorageKey('bv_cart'), []); }
function setCart(cart) { API.set(getScopedStorageKey('bv_cart'), cart); API.set('bv_cart', cart); }
function getFavs() { return API.get(getScopedStorageKey('bv_favs'), []); }
window.setFavs = function(favs) {
    API.set(getScopedStorageKey('bv_favs'), favs);
    API.set('bv_favs', favs);
    const user = getCurrentUser();
    if(user) { user.favs = favs; API.set('bv_current_user', user); }
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
    const allProducts = API.get('bv_products', []);
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
        const lang = API.get('bv_lang', 'uk');
        cartBody.innerHTML = `<div class="cart-empty-msg text-center text-[var(--text-muted)] mt-10">${i18n[lang].cart_empty}</div>`;
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
                            <button class="px-2 py-1 text-sm text-[var(--text-muted)]" onclick="updateCartQty('${item.cartId}', -1)">−</button>
                            <span class="px-2 text-xs font-semibold min-w-6 text-center">${item.qty}</span>
                            <button class="px-2 py-1 text-sm text-[var(--text-muted)]" onclick="updateCartQty('${item.cartId}', 1)">+</button>
                        </div>
                    </div>
                </div>
                <button class="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--danger)]" onclick="removeFromCart('${item.cartId}')">✕</button>
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

window.toggleFav = function(id) {
    let favs = getFavs();
    const idx = favs.indexOf(id);
    if(idx > -1) favs.splice(idx, 1); else favs.push(id);
    setFavs(favs);
    window.renderFavDrawer();
    // Оновлюємо іконки на сторінці
    document.querySelectorAll(`.fav-btn-inline[data-id="${id}"]`).forEach(btn => {
        const icon = btn.querySelector('svg');
        if(favs.includes(id)) { btn.classList.add('text-[var(--danger)]'); icon.setAttribute('fill', 'currentColor'); } 
        else { btn.classList.remove('text-[var(--danger)]'); icon.setAttribute('fill', 'none'); }
    });
};

window.renderFavDrawer = function() {
    let favsIds = getFavs();
    const allProducts = API.get('bv_products', []);
    const favBody = document.getElementById('favBody');
    const favBadges = document.querySelectorAll('.fav-badge');
    
    favBadges.forEach(b => { b.innerText = favsIds.length; b.style.display = favsIds.length > 0 ? 'flex' : 'none'; });
    if(!favBody) return;

    if (favsIds.length === 0) {
        const lang = API.get('bv_lang', 'uk');
        favBody.innerHTML = `<div class="text-center text-[var(--text-muted)] mt-10">${i18n[lang].fav_empty || "Список порожній"}</div>`;
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
            <button class="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--danger)]" onclick="event.stopPropagation(); toggleFav('${prod.id}')">✕</button>
        </div>
        `;
    }).join('');
};

// ==========================================
// КАРТКА ТОВАРУ ТА ДИНАМІЧНІ БЛОКИ
// ==========================================
window.renderProductCard = function(prod) {
    const lang = API.get('bv_lang', 'uk');
    const base = prod.variations ? prod.variations.base : prod; 
    const isOutOfStock = prod.status === 'out-stock';
    const isFav = getFavs().includes(prod.id);
    
    let badgesHtml = '<div class="flex flex-wrap gap-1 justify-end items-center">';
    if (isOutOfStock) badgesHtml += `<div class="prod-badge badge-sold-out rounded-none">${i18n[lang].badge_sold_out}</div>`;
    else if (prod.status === 'pre-order') badgesHtml += `<div class="prod-badge badge-pre-order rounded-none">${i18n[lang].badge_pre_order}</div>`;
    if(prod.badge === 'new') badgesHtml += `<div class="prod-badge badge-new rounded-none">${i18n[lang].badge_new}</div>`;
    if(prod.badge === 'exclusive') badgesHtml += `<div class="prod-badge badge-exclusive rounded-none">${i18n[lang].badge_exclusive}</div>`;
    if(prod.badge === 'sale') badgesHtml += `<div class="prod-badge badge-sale rounded-none">${i18n[lang].badge_sale}</div>`;
    badgesHtml += '</div>';

    const price = base.price || 0;
    const discount = base.discount || null;
    let priceHtml = `<span class="text-[14px] font-bold text-[var(--gold-muted)]">${formatterPrice.format(price)} ₴</span>`;
    if (discount && Number(discount) > 0) {
        priceHtml = `<span class="text-[14px] font-bold text-[#c5a059]">${formatterPrice.format(discount)} ₴</span><span class="text-[10px] text-[var(--text-muted)] line-through ml-2">${formatterPrice.format(price)} ₴</span>`;
    }

    const safeId = escapeHtml(prod.id);
    const safeName = escapeHtml(window.getLoc(base.name)).replace(/'/g, "\\'"); 
    const safeImg = escapeHtml((base.images && base.images.length > 0) ? base.images[0] : '');
    const priceDisplay = discount && Number(discount) > 0 ? discount : price;

    return `
        <div class="product-card group relative overflow-hidden flex flex-col w-full h-full bg-[#ffffff] transition-colors duration-300">
            <a href="product.html?id=${prod.id}" class="relative w-full aspect-square overflow-hidden bg-white block p-2 md:p-4">
                <img src="${safeImg}" class="product-img w-full h-full object-contain transition duration-700 group-hover:scale-105" loading="lazy">
            </a>
            <div class="px-3 md:px-4 pb-1 pt-2 flex flex-col gap-1 flex-grow bg-white border-t border-[#f5f5f5]">
                <a href="product.html?id=${prod.id}" class="text-[9px] uppercase tracking-widest text-[#888]">${escapeHtml(prod.variant || '')}</a>
                <a href="product.html?id=${prod.id}" class="text-[12px] md:text-[14px] font-medium text-[#222] leading-snug line-clamp-2 mt-1 min-h-[36px]">${safeName}</a>
                <div class="mt-auto pt-2 mb-1 flex items-center">${priceHtml}</div>
            </div>
            <div class="px-3 md:px-4 py-3 border-t border-[#f5f5f5] flex justify-between items-center mt-auto bg-white">
                <div class="flex items-center gap-2">
                    ${!isOutOfStock ? `
                    <button onclick="addToCart('${safeId}', '${safeName}', '${escapeHtml(prod.variant || '')}', ${priceDisplay}, '${safeImg}')" class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#222] hover:text-[var(--gold-muted)]">
                        <span>${i18n[lang].btn_buy}</span><span class="text-[14px] font-light">+</span>
                    </button>
                    ` : `<span class="text-[9px] font-bold uppercase text-[#888]">${i18n[lang].out_stock}</span>`}
                </div>
                <div class="flex items-center gap-3">
                    ${badgesHtml}
                    <button class="fav-btn-inline ${isFav ? 'text-[var(--danger)]' : 'text-[#888]'} hover:text-[#222]" data-id="${prod.id}" onclick="toggleFav('${prod.id}')">
                        <svg width="18" height="18" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
};

window.renderHomeSections = function() {
    const homeBlocks = API.get('bv_home_blocks', []);
    let container = document.getElementById('dynamicHomeBlocksContainer');
    if (!container) return;
    
    let html = '';
    homeBlocks.filter(b => b.active).forEach(block => {
        let items = products.filter(p => p.blocks && p.blocks.includes(block.id));
        if (items.length > 0) {
            const title = window.getLoc(block.name);
            const trackId = `block-track-${block.id}`;
            const cardWrapper = (p) => `<div class="flex-none w-[50%] sm:w-[33.333%] md:w-[25%] lg:w-[20%] xl:w-[16.666%] snap-start flex">${window.renderProductCard(p)}</div>`;
            
            let blockItems = [...items];
            while(blockItems.length < 12 && blockItems.length > 0) { blockItems = blockItems.concat(items); } // Для каруселі
            
            html += `
            <section class="max-w-[1920px] mx-auto px-0 py-4 md:py-6 border-t border-[var(--border)]">
                <div class="mb-3 text-center px-4">
                    <span class="text-[9px] uppercase tracking-[0.4em] text-[var(--gold-muted)] font-semibold block mb-1">BV Jewelry</span>
                    <h2 class="hero-title text-[var(--text-main)] !text-[24px] md:!text-[32px]">${title}</h2>
                </div>
                <div class="promo-carousel-container select-none group relative">
                    <div id="${trackId}" class="flex overflow-x-auto gap-0 snap-x snap-mandatory no-scrollbar min-h-[300px]">
                        ${blockItems.map(cardWrapper).join('')}
                    </div>
                </div>
            </section>`;
        }
    });
    container.innerHTML = html;
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
    API.set('bv_theme', newTheme);
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
    document.querySelectorAll('[data-i18n]').forEach(el => el.innerHTML = i18n[lang][el.dataset.i18n] || el.innerHTML);
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = i18n[lang][el.dataset.i18nPlaceholder] || el.placeholder);
    API.set('bv_lang', lang);
    window.renderCart(); window.renderFavDrawer();
    if(document.getElementById('dynamicHomeBlocksContainer')) renderHomeSections();
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
// АВТОРИЗАЦІЯ (Модалка)
// ==========================================
window.smartProfileClick = function() {
    if(document.getElementById('sideMenu')?.classList.contains('active')) window.toggleMenu(); 
    const user = getCurrentUser();
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
    const user = getCurrentUser();
    const dropdownMenu = document.getElementById('profileDropdownMenu');
    if(dropdownMenu) {
        if (user) {
            dropdownMenu.innerHTML = `
                <a href="profile.html" class="dropdown-item w-full text-left font-medium">Мій кабінет</a>
                ${user.role === 'admin' ? '<a href="admin.html" class="dropdown-item w-full text-left font-bold text-[#c5a059]">Панель Адміна</a>' : ''}
                <button onclick="logoutUser()" class="dropdown-item w-full text-left text-red-400 hover:text-red-500 mt-2 border-t border-[var(--border)] pt-2">Вийти з акаунту</button>
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
    await mockAuth.signOut();
    if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('profile.html')) {
        window.location.href = 'index.html';
    } else {
        window.renderCart(); window.renderFavDrawer(); window.updateProfileMenu(); 
    }
};
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
    if (id.includes('bracelet')) return `<ellipse cx="12" cy="12" rx="7" ry="3" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 12v2c0 2 3 7 3s7-1 7-3v-2"/>`; 
    return `<circle cx="12" cy="12" r="4" stroke-linecap="round" stroke-linejoin="round"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v2"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 20v2"/>`; 
};

window.generateMenus = function() {
    const megaCol1 = document.getElementById('megaCol1');
    const megaMenu = document.querySelector('.mega-menu');
    const sideMenu = document.getElementById('sideMenu');
    const categoriesTree = API.get('bv_categories_tree', []);
    
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
        const savedLang = API.get('bv_lang', 'uk');
        const currentThemeIcon = document.documentElement.getAttribute('data-theme') === 'light' ? sunSVG : moonSVG;

        sideMenu.innerHTML = `
            <div class="flex justify-between items-center pb-4 mb-4 border-b border-[var(--border)] pt-4 px-4">
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
            <div class="px-4 pb-6 flex flex-col flex-grow overflow-y-auto custom-scrollbar">
                <a href="index.html" class="mob-menu-title" onclick="window.toggleMenu()">Головна</a>
                <div class="menu-divider"></div>
                <div>
                    <div class="mob-menu-title" onclick="window.toggleAccordion('mobCatList', 'mobCatArrow')"><span data-i18n="m2">Каталог</span><svg id="mobCatArrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-muted)" stroke-width="2" class="transition-transform duration-300"><path d="M6 9l6 6 6-6"/></svg></div>
                    <div class="mob-accordion-list" id="mobCatList" style="gap: 0; padding-left: 0;">${mobCatHtml}</div>
                </div>
                <a href="services.html" class="mob-menu-title" onclick="window.toggleMenu()"><span data-i18n="m_price">Прайс</span></a>
                <a href="exclusive.html" class="block w-full border border-[var(--gold-muted)] text-[var(--gold-muted)] py-3 text-center font-bold uppercase tracking-widest text-[10px] hover:bg-[var(--gold-muted)] hover:text-[#111] transition-colors mt-4" onclick="window.toggleMenu()"><span data-i18n="m_atelier">Ексклюзив</span></a>
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
    let banners = API.get('bv_banners', []);
    const ratio = API.get('bv_settings', {}).bannerRatio || '3/1';
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
// ЛОГІКА АВТОРИЗАЦІЇ (Форма та Модалка)
// ==========================================
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
        title.innerText = 'Реєстрація';
        btn.innerText = 'Зареєструватися';
        toggleText.innerText = 'Вже є акаунт?';
        toggleLink.innerText = 'Увійти';
        if(nameField) { nameField.classList.remove('hidden'); nameField.classList.add('flex'); }
    } else {
        title.innerText = 'Вхід';
        btn.innerText = 'Увійти';
        toggleText.innerText = 'Немає акаунта?';
        toggleLink.innerText = 'Зареєструватися';
        if(nameField) { nameField.classList.add('hidden'); nameField.classList.remove('flex'); }
    }
};

// Обробка відправки форми авторизації
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'authForm') {
        e.preventDefault();
        
        const btn = document.getElementById('authSubmitBtn');
        const originalText = btn.innerText;
        btn.innerText = 'Зачекайте...';
        btn.disabled = true;
        
        const email = document.getElementById('authUser').value.trim();
        const pass = document.getElementById('authPass').value.trim();
        const name = document.getElementById('authName') ? document.getElementById('authName').value.trim() : '';

        try {
            let res;
            // Викликаємо наш локальний API замість Supabase
            if (window.isRegisterMode) {
                res = await window.mockAuth.signUp(email, pass, name);
            } else {
                res = await window.mockAuth.signIn(email, pass);
            }
            
            if (res.error) {
                alert(res.error.message || 'Помилка авторизації');
            } else {
                // Успішний вхід!
                window.closeAuthModal();
                
                // Якщо ми на сторінці оформлення замовлення - підставляємо email
                const checkoutEmail = document.getElementById('orderEmail');
                if (checkoutEmail) checkoutEmail.value = res.data.user.email;
                
                if(typeof window.updateProfileMenu === 'function') window.updateProfileMenu();
                if(typeof migrateScopedState === 'function') migrateScopedState();
                if(typeof window.renderCart === 'function') window.renderCart();
                if(typeof window.renderFavDrawer === 'function') window.renderFavDrawer();
                
                // Перекидаємо в кабінет (або адмінку, якщо логін містить 'admin')
                if (res.data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'profile.html';
                }
            }
        } catch (err) {
            alert('Помилка: ' + err.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
});

// Імітація входу через соцмережі (для тестування)
window.loginWithGoogle = function() {
    document.getElementById('authUser').value = 'client@gmail.com';
    document.getElementById('authPass').value = '123456';
    document.getElementById('authForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
};

window.loginWithApple = function() {
    document.getElementById('authUser').value = 'admin@test.com'; // Адмін для тесту
    document.getElementById('authPass').value = '123456';
    document.getElementById('authForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
};