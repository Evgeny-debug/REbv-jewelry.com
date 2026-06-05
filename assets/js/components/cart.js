import { StorageAPI } from '../api/config.js';
import { getCart, setCart, getFavs, setFavs } from '../core/state.js';
import { escapeHtml, priceFormatter } from '../core/utils.js';
import { getLoc, dictionary } from '../core/i18n.js';

export function toggleCart() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (!drawer || !overlay) return;
    
    if (!drawer.classList.contains('active')) {
        renderCart();
        drawer.classList.add('active'); 
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.remove('active'); 
        overlay.classList.remove('active');
        if (!document.getElementById('sideMenu')?.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }
}

export function addToCart(id, title, variant, price, img) {
    let cart = getCart();
    let extractedSize = null;
    let cleanTitle = String(title);
    
    if (cleanTitle.includes('(Розмір:')) {
        const parts = cleanTitle.split('(Розмір:');
        cleanTitle = parts[0].trim();
        extractedSize = parts[1].replace(')', '').trim();
    }

    const allProducts = StorageAPI.get('bv_products', []);
    const prod = allProducts.find(p => p.id === id);
    const sku = prod && prod.sku ? prod.sku : id;
    const cartId = id + (extractedSize ? '-' + extractedSize : '');
    const existing = cart.find(item => item.cartId === cartId);
    
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ 
            cartId, id, title: cleanTitle, variant: String(variant), 
            price: Number(price), img: String(img), qty: 1, sku, size: extractedSize
        });
    }
    
    setCart(cart);
    renderCart();
    if (!document.getElementById('cartDrawer').classList.contains('active')) toggleCart();
}

export function updateCartQty(cartId, delta) {
    const cart = getCart();
    const item = cart.find((entry) => entry.cartId === cartId);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    setCart(cart);
    renderCart();
}

export function removeFromCart(cartId) {
    let cart = getCart();
    cart = cart.filter(item => item.cartId !== cartId);
    setCart(cart);
    renderCart();
}

export function clearEntireCart(force = false) {
    if(force || confirm('Ви впевнені, що хочете очистити кошик?')) {
        setCart([]);
        renderCart();
    }
}

export function checkoutOrder() {
    const cart = getCart();
    if(cart.length === 0) return alert('Ваш кошик порожній!');
    toggleCart();
    window.location.href = 'checkout.html';
}

export function renderCart() {
    const cart = getCart();
    const cartBody = document.getElementById('cartBody');
    const cartBadges = document.querySelectorAll('.cart-badge:not(.fav-badge)');
    const subtotalVal = document.querySelector('.cart-subtotal-val');
    const checkoutBtnWrapper = document.getElementById('checkoutBtnWrapper');
    let total = 0, totalQty = 0;
    
    if(!cartBody) return;
    cartBody.innerHTML = '';

    if (cart.length === 0) {
        const lang = StorageAPI.get('bv_lang', 'uk');
        cartBody.innerHTML = `<div class="cart-empty-msg text-center text-[var(--text-muted)] mt-10">${dictionary[lang].cart_empty}</div>`;
        if(subtotalVal) subtotalVal.innerText = '0 ₴';
        cartBadges.forEach(b => { b.innerText = '0'; b.style.display = 'none'; });
        if(checkoutBtnWrapper) checkoutBtnWrapper.style.display = 'none';
        return;
    }

    cart.forEach(item => {
        total += item.price * item.qty;
        totalQty += item.qty;
        
        const sizeBadge = item.size ? `<span class="bg-[var(--gold-muted)]/20 text-[var(--gold-muted)] px-2 py-0.5 rounded-none text-[10px] font-bold">Розмір: ${item.size}</span>` : '';
        const skuBadge = `<span class="text-[10px] text-[var(--text-muted)]">Арт: ${item.sku}</span>`;

        cartBody.insertAdjacentHTML('beforeend', `
            <div class="cart-item flex gap-4 p-3 border border-[var(--border)] rounded-none mb-3 relative transition-all duration-300 hover:border-[var(--gold-muted)]/40">
                <img src="${item.img}" class="w-20 h-20 object-cover border border-[var(--border)] rounded-none mix-blend-multiply">
                <div class="flex-grow flex flex-col justify-center pr-6">
                    <span class="text-sm font-semibold uppercase tracking-wide leading-tight line-clamp-2">${escapeHtml(item.title)}</span>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                        ${sizeBadge}
                        ${skuBadge}
                    </div>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="text-sm font-bold text-[var(--gold-muted)]">${priceFormatter.format(item.price)} ₴</span>
                        <div class="inline-flex items-center rounded-none border border-[var(--border)] bg-[var(--bg-elevated)]">
                            <button class="px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] btn-cross" onclick="updateCartQty('${item.cartId}', -1)">−</button>
                            <span class="px-2 text-xs text-[var(--text-main)] font-semibold min-w-6 text-center">${item.qty}</span>
                            <button class="px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] btn-cross" onclick="updateCartQty('${item.cartId}', 1)">+</button>
                        </div>
                    </div>
                </div>
                <button class="cart-item-remove absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--danger)] btn-cross" onclick="removeFromCart('${item.cartId}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `);
    });
    
    if(subtotalVal) subtotalVal.innerText = priceFormatter.format(total) + ' ₴';
    cartBadges.forEach(b => {
        b.innerText = totalQty;
        b.style.display = totalQty > 0 ? 'flex' : 'none';
    });

    if(checkoutBtnWrapper) {
        checkoutBtnWrapper.style.display = 'block';
        checkoutBtnWrapper.innerHTML = `<button id="checkoutBtn" onclick="window.checkoutOrder()" class="btn-solid w-full bg-[var(--gold-muted)] !text-[#111] font-bold uppercase tracking-widest py-3 rounded-none hover:opacity-90 transition-opacity active:scale-95 border-none">Оформити замовлення</button>`;
    }
}

export function toggleFavDrawer() {
    const drawer = document.getElementById('favDrawer');
    const overlay = document.getElementById('favOverlay');
    if (!drawer) return;
    
    if (!drawer.classList.contains('active')) {
        renderFavDrawer();
        drawer.classList.add('active'); 
        if(overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.remove('active'); 
        if(overlay) overlay.classList.remove('active');
        if (!document.getElementById('sideMenu')?.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }
}

export function toggleFav(id) {
    let favs = getFavs();
    const idx = favs.indexOf(id);
    if(idx > -1) favs.splice(idx, 1); else favs.push(id);
    setFavs(favs);
    
    document.querySelectorAll(`.fav-btn-inline[data-id="${id}"]`).forEach(btn => {
        const icon = btn.querySelector('svg');
        if (!icon) return;
        if(favs.includes(id)) {
            btn.classList.add('text-[var(--danger)]'); btn.classList.remove('text-[var(--text-muted)]');
            icon.setAttribute('fill', 'currentColor');
        } else {
            btn.classList.remove('text-[var(--danger)]'); btn.classList.add('text-[var(--text-muted)]');
            icon.setAttribute('fill', 'none');
        }
    });
    renderFavDrawer();
}

export function renderFavDrawer() {
    const favsIds = getFavs();
    const allProducts = StorageAPI.get('bv_products', []);
    const favBody = document.getElementById('favBody');
    const favBadges = document.querySelectorAll('.fav-badge');
    
    favBadges.forEach(b => {
        b.innerText = favsIds.length;
        b.style.display = favsIds.length > 0 ? 'flex' : 'none';
    });
    
    if(!favBody) return;

    if (favsIds.length === 0) {
        const lang = StorageAPI.get('bv_lang', 'uk');
        favBody.innerHTML = `<div class="text-center text-[var(--text-muted)] mt-10" data-i18n="fav_empty">${dictionary[lang].fav_empty || "Список порожній"}</div>`;
        return;
    }

    const favProducts = allProducts.filter(p => favsIds.includes(p.id));
    favBody.innerHTML = favProducts.map(prod => {
        const base = prod.variations ? prod.variations.base : prod;
        const safeImg = escapeHtml((base.images && base.images.length > 0) ? base.images[0] : (base.img || base.image || ''));
        const safeName = escapeHtml(getLoc(base.name));
        const priceDisplay = base.discount && Number(base.discount) > 0 ? base.discount : base.price;

        return `
        <div class="cart-item flex gap-4 p-3 border border-[var(--border)] rounded-none mb-3 relative transition-all duration-300 hover:border-[var(--gold-muted)]/35 cursor-pointer" onclick="location.href='product.html?id=${prod.id}'">
            <img src="${safeImg}" class="w-16 h-16 object-cover border border-[var(--border)] rounded-none mix-blend-multiply">
            <div class="flex-grow flex flex-col justify-center pr-6">
                <span class="text-xs font-semibold uppercase tracking-wide line-clamp-1">${safeName}</span>
                <span class="text-[10px] text-[var(--text-muted)] mt-1">${escapeHtml(prod.variant || '')}</span>
                <span class="text-sm font-bold text-[var(--gold-muted)] mt-1">${priceFormatter.format(priceDisplay)} ₴</span>
            </div>
            <button class="cart-item-remove absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--danger)] btn-cross" onclick="event.stopPropagation(); toggleFav('${prod.id}')" title="Видалити">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        `;
    }).join('');
}

// Прив'язка до window
Object.assign(window, { toggleCart, addToCart, updateCartQty, removeFromCart, clearEntireCart, checkoutOrder, renderCart, toggleFavDrawer, toggleFav, renderFavDrawer });