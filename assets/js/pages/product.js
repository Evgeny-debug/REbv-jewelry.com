import { StorageAPI } from '../api/config.js';
import { getLoc, dictionary } from '../core/i18n.js';
import { getFavs } from '../core/state.js';
import { escapeHtml, priceFormatter } from '../core/utils.js';
import { renderProductCard } from '../components/productCard.js';

let currentGalleryIndex = 0;
let productGallery = [];
let currentProduct = null;
let currentSelectedSize = null;

function getVarData(prod, size, field, lang = null) {
    const b = prod.variations ? prod.variations.base : prod;
    const v = (prod.variations && size && prod.variations[size]) ? prod.variations[size] : b;
    
    if (field === 'images') return (v.images && v.images.length > 0) ? v.images : ((b.images && b.images.length > 0) ? b.images : [prod.img || prod.image]);
    if (field === 'price' || field === 'discount' || field === 'weight' || field === 'workCost') {
        return v[field] !== undefined && v[field] !== '' ? v[field] : b[field];
    }
    if (lang) return (v[field] && v[field][lang]) ? v[field][lang] : (b[field] && b[field][lang] ? b[field][lang] : '');
    return v[field] || b[field] || '';
}

export function selectSize(btn, size) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('selected-size-label').innerText = size;
    currentSelectedSize = size;
    updateProductUI();
}

export function updateProductUI() {
    if(!currentProduct) return;
    const size = currentSelectedSize || 'base';
    const currentLang = StorageAPI.get('bv_lang', 'uk');

    const name = getVarData(currentProduct, size, 'name', currentLang) || getLoc(currentProduct.name);
    const desc = getVarData(currentProduct, size, 'desc', currentLang) || getLoc(currentProduct.desc);
    const price = getVarData(currentProduct, size, 'price');
    const discount = getVarData(currentProduct, size, 'discount');
    const weight = getVarData(currentProduct, size, 'weight');

    if (document.getElementById('pd-title')) document.getElementById('pd-title').innerText = name;
    if (document.getElementById('pd-title-mob')) document.getElementById('pd-title-mob').innerText = name;
    if (document.getElementById('pd-desc-full')) document.getElementById('pd-desc-full').innerText = desc || 'Опис відсутній';
    
    if (weight && Number(weight) > 0) {
        if(document.getElementById('pd-spec-weight')) document.getElementById('pd-spec-weight').innerText = weight + ' г';
        document.getElementById('pd-spec-weight-row')?.classList.remove('hidden');
    } else {
        document.getElementById('pd-spec-weight-row')?.classList.add('hidden');
    }

    const hasDiscount = discount && Number(discount) > 0;
    const currentPrice = hasDiscount ? discount : price;
    
    let priceHtmlDesktop = hasDiscount 
        ? `<span class="text-3xl lg:text-4xl font-bold text-[var(--success)]">${priceFormatter.format(discount)} ₴</span>
           <span class="text-lg text-[var(--text-muted)] line-through ml-3">${priceFormatter.format(price)} ₴</span>`
        : `<span class="text-3xl lg:text-4xl font-bold text-[var(--gold-muted)]">${priceFormatter.format(price)} ₴</span>`;
    
    if(document.getElementById('pd-price-desktop')) document.getElementById('pd-price-desktop').innerHTML = priceHtmlDesktop;

    const isOutOfStock = currentProduct.status === 'out-stock';
    const setupAddBtn = (id) => {
        const btn = document.getElementById(id);
        if(!btn) return;
        
        if(isOutOfStock) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = `<span class="uppercase font-bold tracking-widest text-[11px]">${dictionary[currentLang]?.out_stock || 'Немає в наявності'}</span>`;
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.innerHTML = `<span class="uppercase font-bold tracking-widest text-[11px]">${dictionary[currentLang]?.btn_buy || 'Купити'} за ${priceFormatter.format(currentPrice)}</span>`;
            
            btn.onclick = () => {
                const needsSize = !document.getElementById('pd-sizes-container').classList.contains('hidden');
                if (needsSize && !currentSelectedSize) {
                    alert('Будь ласка, оберіть розмір перед покупкою.');
                    document.getElementById('pd-sizes-container').scrollIntoView({behavior: 'smooth', block: 'center'});
                    return;
                }
                const finalName = currentSelectedSize ? `${name} (Розмір: ${currentSelectedSize})` : name;
                window.addToCart(currentProduct.id, finalName, currentProduct.variant, currentPrice, productGallery[0]);
            };
        }
    };
    
    setupAddBtn('pd-add-btn-desktop');
    setupAddBtn('pd-add-btn-mob');

    const newGallery = getVarData(currentProduct, size, 'images');
    if(JSON.stringify(newGallery) !== JSON.stringify(productGallery)) {
        productGallery = newGallery;
        rebuildGallery();
    }
}

export function rebuildGallery() {
    const track = document.getElementById('pd-gallery-track');
    const dots = document.getElementById('pd-gallery-dots');
    const thumbsContainer = document.getElementById('pd-gallery-thumbnails');
    currentGalleryIndex = 0;
    
    if(track) {
        track.innerHTML = productGallery.map((img, i) => `
            <div class="w-full h-full flex-shrink-0 relative cursor-zoom-in" onclick="openLightbox(${i})">
                <img src="${img}" class="w-full h-full object-cover">
            </div>
        `).join('');
        track.style.transform = `translateX(0%)`;
    }

    if(thumbsContainer) {
        if (productGallery.length > 1) {
            thumbsContainer.innerHTML = productGallery.map((img, i) => `
                <button onclick="goToGallery(${i})" class="thumb-btn btn-cross w-16 aspect-[4/5] rounded-none border border-[var(--border)] overflow-hidden shrink-0 ${i === 0 ? 'active' : ''}">
                    <img src="${img}" class="w-full h-full object-cover pointer-events-none">
                </button>
            `).join('');
            thumbsContainer.classList.remove('!hidden');
        } else {
            thumbsContainer.innerHTML = '';
            thumbsContainer.classList.add('!hidden'); 
        }
    }

    if(dots) {
        if (productGallery.length > 1) {
            dots.innerHTML = productGallery.map((_, i) => `
                <button class="btn-cross w-1.5 h-1.5 rounded-none transition-all duration-300 ${i === 0 ? 'bg-white scale-125' : 'bg-white/50'}" onclick="goToGallery(${i})"></button>
            `).join('');
        } else {
            dots.innerHTML = '';
        }
    }
}

export function scrollGallery(dir) {
    let newIndex = currentGalleryIndex + dir;
    if (newIndex >= productGallery.length) newIndex = 0;
    if (newIndex < 0) newIndex = productGallery.length - 1;
    goToGallery(newIndex);
}

export function goToGallery(index) {
    currentGalleryIndex = index;
    const track = document.getElementById('pd-gallery-track');
    if(track) track.style.transform = `translateX(-${index * 100}%)`;
    
    document.querySelectorAll('#pd-gallery-dots button').forEach((dot, i) => {
        if(i === index) { dot.classList.remove('bg-white/50'); dot.classList.add('bg-white', 'scale-125'); } 
        else { dot.classList.remove('bg-white', 'scale-125'); dot.classList.add('bg-white/50'); }
    });
    
    document.querySelectorAll('.thumb-btn').forEach((thumb, i) => {
        if(i === index) thumb.classList.add('active'); else thumb.classList.remove('active');
    });
}

export function openLightbox(index) {
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImg');
    if(!modal || !img || !productGallery[index]) return;
    img.src = productGallery[index];
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    document.body.style.overflow = 'hidden';
}

export function closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    if(!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 300);
    document.body.style.overflow = '';
}

export function renderProductPage() {
    if (!document.getElementById('pd-title')) return; // Тільки для сторінки товару

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const allProducts = StorageAPI.get('bv_products', []);
    const categories = StorageAPI.get('bv_categories_tree', []) || StorageAPI.get('bv_categories_flat', []);

    currentProduct = productId ? allProducts.find(p => p.id === productId) : allProducts[0];
    if (!currentProduct) {
        if (document.getElementById('pd-title')) document.getElementById('pd-title').innerText = 'Товар не знайдено';
        if (document.getElementById('pd-title-mob')) document.getElementById('pd-title-mob').innerText = 'Товар не знайдено';
        return;
    }

    productGallery = getVarData(currentProduct, 'base', 'images');
    
    let touchStartX = 0; let touchEndX = 0;
    const galleryContainer = document.getElementById('pd-gallery-container');
    if (galleryContainer && !galleryContainer.dataset.touchAttached) {
        galleryContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
        galleryContainer.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            if (productGallery.length > 1) {
                if (touchStartX - touchEndX > 40) scrollGallery(1); 
                else if (touchEndX - touchStartX > 40) scrollGallery(-1);
            }
        }, {passive: true});
        galleryContainer.dataset.touchAttached = 'true';
    }

    ['pd-sku', 'pd-spec-sku', 'pd-sku-mob'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).innerText = currentProduct.sku || currentProduct.id;
    });
    if(document.getElementById('pd-spec-metal')) document.getElementById('pd-spec-metal').innerText = currentProduct.variant || 'Не вказано';
    
    if(currentProduct.stones && currentProduct.stones.trim() !== '') {
        if(document.getElementById('pd-spec-stones')) document.getElementById('pd-spec-stones').innerText = currentProduct.stones;
        document.getElementById('pd-spec-stones-row')?.classList.remove('hidden');
    }

    const catObj = categories.find(c => c.id === currentProduct.category) || {};
    const catName = getLoc(catObj.name) || currentProduct.category;
    if(document.getElementById('pd-category-name')) document.getElementById('pd-category-name').innerText = catName;
    if(document.getElementById('pd-category-link')) document.getElementById('pd-category-link').href = `catalog.html#${currentProduct.category}`;
    if(document.getElementById('pd-category-name-mob')) document.getElementById('pd-category-name-mob').innerText = catName;
    if(document.getElementById('pd-category-link-mob')) document.getElementById('pd-category-link-mob').href = `catalog.html#${currentProduct.category}`;

    const sizesContainer = document.getElementById('pd-sizes-container');
    const sizesList = document.getElementById('pd-sizes-list');
    if (currentProduct.sizes && currentProduct.sizes.length > 0) {
        sizesList.innerHTML = currentProduct.sizes.map(s => `
            <button class="size-btn btn-cross border border-[var(--border)] text-[var(--text-main)] hover:border-[var(--gold-muted)] py-2 px-4 text-[11px] font-medium transition-colors rounded-none" onclick="selectSize(this, '${s}')">${s}</button>
        `).join('');
        sizesContainer.classList.remove('hidden');
    } else {
        sizesContainer.classList.add('hidden');
        currentSelectedSize = null;
    }

    let statusHtml = currentProduct.status === 'out-stock' 
        ? `<span class="text-[10px] uppercase tracking-widest font-bold text-red-500 border border-red-500/20 px-3 py-1 rounded">Немає в наявності</span>`
        : `<span class="text-[10px] uppercase tracking-widest font-bold text-green-500 border border-green-500/20 px-3 py-1 rounded">В наявності</span>`;
    if(document.getElementById('pd-status')) document.getElementById('pd-status').innerHTML = statusHtml;
    if(document.getElementById('pd-status-mob')) document.getElementById('pd-status-mob').innerHTML = statusHtml;

    const favs = getFavs();
    const setupFavBtn = (id) => {
        const btn = document.getElementById(id);
        if(!btn) return;
        if(favs.includes(currentProduct.id)) {
            btn.classList.add('text-[var(--danger)]', 'border-[var(--danger)]');
            btn.querySelector('svg').setAttribute('fill', 'currentColor');
        }
        btn.onclick = (e) => {
            e.preventDefault();
            let isLoggedIn = false;
            const nameEl = document.getElementById('profName');
            if (nameEl && nameEl.innerText.trim().length > 0 && nameEl.innerText !== 'User') isLoggedIn = true;
            if (!isLoggedIn && StorageAPI.get('bv_current_user')) isLoggedIn = true;

            if (!isLoggedIn) {
                if(typeof window.smartProfileClick === 'function') window.smartProfileClick();
                else alert('Будь ласка, увійдіть в акаунт, щоб додати в улюблене.');
                return;
            }

            if(typeof window.toggleFav === 'function') window.toggleFav(currentProduct.id);
            const isFav = btn.classList.contains('text-[var(--danger)]');
            if(isFav) {
                btn.classList.remove('text-[var(--danger)]', 'border-[var(--danger)]');
                btn.querySelector('svg').setAttribute('fill', 'none');
            } else {
                btn.classList.add('text-[var(--danger)]', 'border-[var(--danger)]');
                btn.querySelector('svg').setAttribute('fill', 'currentColor');
            }
        };
    };
    setupFavBtn('pd-fav-btn-desktop-img');
    setupFavBtn('pd-fav-btn-mob');

    // Рекомендації
    let similarProducts = allProducts.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    if (similarProducts.length > 0 && document.getElementById('similarGrid')) {
        document.getElementById('similarGrid').innerHTML = similarProducts.map(p => renderProductCard(p)).join('');
        document.getElementById('similarSection')?.classList.remove('hidden');
    }
    
    let boughtTogether = allProducts.filter(p => p.category !== currentProduct.category && p.id !== currentProduct.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    if (boughtTogether.length > 0 && document.getElementById('boughtTogetherGrid')) {
        document.getElementById('boughtTogetherGrid').innerHTML = boughtTogether.map(p => renderProductCard(p)).join('');
        document.getElementById('boughtTogetherSection')?.classList.remove('hidden');
    }

    rebuildGallery();
    updateProductUI();
}

Object.assign(window, { selectSize, scrollGallery, goToGallery, openLightbox, closeLightbox, renderProductPage });