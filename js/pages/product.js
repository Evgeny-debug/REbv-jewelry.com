// ==========================================
// ЛОГІКА СТОРІНКИ ТОВАРУ
// ==========================================

let currentProduct = null;
let selectedVariantKey = 'base';
let selectedSize = null;

window.renderProductPage = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const allProducts = API.get('bv_products', []);
    currentProduct = allProducts.find(p => p.id === id);

    if (!currentProduct) {
        const container = document.getElementById('productContainer');
        if(container) container.innerHTML = `<div class="text-center py-32"><h2 class="text-2xl font-serif text-[var(--text-main)] mb-4">Товар не знайдено</h2><a href="catalog.html" class="text-[11px] uppercase tracking-widest font-bold text-[var(--gold-muted)] border-b border-[var(--gold-muted)] pb-1 hover:opacity-70 transition-opacity">Повернутися до каталогу</a></div>`;
        return;
    }

    // Встановлюємо дефолтні значення
    const varKeys = Object.keys(currentProduct.variations || {});
    if(varKeys.length > 0 && !currentProduct.variations[selectedVariantKey]) {
        selectedVariantKey = varKeys[0];
    }
    if (currentProduct.sizes && currentProduct.sizes.length > 0) {
        selectedSize = currentProduct.sizes[0];
    }

    // Рендер UI
    renderBreadcrumbs();
    renderVariants();
    renderSizes();
    window.updateProductUI();
    renderSimilarAndBoughtTogether(allProducts);
};

function renderBreadcrumbs() {
    const bcCat = document.getElementById('bcCategory');
    if(!bcCat) return;
    const cats = API.get('bv_categories_tree', []);
    
    // Шукаємо назву категорії
    let catName = currentProduct.category;
    for(let c of cats) {
        if(c.id === currentProduct.category) catName = window.getLoc(c.name);
        if(c.subcategories) {
            for(let sub of c.subcategories) {
                if(sub.id === currentProduct.category) catName = window.getLoc(sub.name);
            }
        }
    }
    
    bcCat.innerText = catName;
    bcCat.href = `catalog.html#${currentProduct.category}`;
}

function renderVariants() {
    const container = document.getElementById('variantsContainer');
    if(!container || !currentProduct.variations) return;
    
    const keys = Object.keys(currentProduct.variations);
    if(keys.length <= 1) {
        document.getElementById('variantsWrapper').style.display = 'none';
        return;
    }
    
    container.innerHTML = keys.map(k => {
        const v = currentProduct.variations[k];
        const name = window.getLoc(v.name);
        // Беремо перше слово (наприклад "Золото", "Срібло") для кнопки
        const shortName = name.split(' ')[0] || k; 
        return `<button class="chip-filter ${k === selectedVariantKey ? 'active' : ''}" onclick="window.changeVariant('${k}')">${shortName}</button>`;
    }).join('');
}

function renderSizes() {
    const container = document.getElementById('sizesContainer');
    const wrapper = document.getElementById('sizesWrapper');
    if(!container || !wrapper) return;
    
    if(!currentProduct.sizes || currentProduct.sizes.length === 0) {
        wrapper.style.display = 'none';
        return;
    }
    
    wrapper.style.display = 'block';
    container.innerHTML = currentProduct.sizes.map(s => `
        <button class="chip-filter ${s === selectedSize ? 'active' : ''} !px-4" onclick="window.changeSize('${s}')">${s}</button>
    `).join('');
}

window.changeVariant = function(key) {
    selectedVariantKey = key;
    renderVariants();
    window.updateProductUI();
};

window.changeSize = function(size) {
    selectedSize = size;
    renderSizes();
};

window.updateProductUI = function() {
    if(!currentProduct) return;
    const variantData = currentProduct.variations[selectedVariantKey] || currentProduct;
    const lang = API.get('bv_lang', 'uk');
    
    // Тексти
    document.getElementById('prodTitle').innerText = window.getLoc(variantData.name);
    document.getElementById('prodDesc').innerHTML = window.getLoc(variantData.desc) || 'Опис відсутній.';
    document.getElementById('prodSku').innerText = currentProduct.sku || currentProduct.id;
    
    // Статус
    const statusEl = document.getElementById('prodStatus');
    if(currentProduct.status === 'out-stock') {
        statusEl.innerText = i18n[lang].out_stock;
        statusEl.className = 'text-[10px] uppercase font-bold tracking-widest text-[var(--danger)]';
        document.getElementById('mainBuyBtn').disabled = true;
        document.getElementById('mainBuyBtn').innerText = i18n[lang].out_stock;
        document.getElementById('mainBuyBtn').classList.add('opacity-50', 'cursor-not-allowed');
    } else if (currentProduct.status === 'pre-order') {
        statusEl.innerText = i18n[lang].pre_order;
        statusEl.className = 'text-[10px] uppercase font-bold tracking-widest text-[#4B5563]';
    } else {
        statusEl.innerText = i18n[lang].in_stock;
        statusEl.className = 'text-[10px] uppercase font-bold tracking-widest text-[var(--success)]';
    }

    // Ціна
    const priceEl = document.getElementById('prodPrice');
    const oldPriceEl = document.getElementById('prodOldPrice');
    
    if (variantData.discount && Number(variantData.discount) > 0) {
        priceEl.innerText = formatterPrice.format(variantData.discount) + ' ₴';
        priceEl.classList.add('text-[#c5a059]');
        oldPriceEl.innerText = formatterPrice.format(variantData.price) + ' ₴';
        oldPriceEl.style.display = 'inline-block';
    } else {
        priceEl.innerText = formatterPrice.format(variantData.price || 0) + ' ₴';
        priceEl.classList.remove('text-[#c5a059]');
        oldPriceEl.style.display = 'none';
    }

    // Фаворити
    const isFav = window.getFavs && window.getFavs().includes(currentProduct.id);
    const favBtn = document.getElementById('prodFavBtn');
    if(favBtn) {
        favBtn.innerHTML = `<svg width="20" height="20" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
        favBtn.className = `w-14 h-14 border border-[var(--border)] rounded-xl flex items-center justify-center transition-colors active:scale-95 ${isFav ? 'text-[var(--danger)] border-[var(--danger)]/30 bg-[var(--danger)]/5' : 'text-[var(--text-main)] hover:border-[var(--gold-muted)] hover:text-[var(--gold-muted)]'}`;
    }

    window.rebuildGallery(variantData.images || [variantData.img]);
};

window.rebuildGallery = function(images) {
    if(!images || images.length === 0) images = ['https://via.placeholder.com/800?text=No+Image'];
    
    const mainImg = document.getElementById('mainGalleryImg');
    const thumbsContainer = document.getElementById('galleryThumbs');
    
    if(mainImg) mainImg.src = images[0];
    
    if(thumbsContainer) {
        if(images.length > 1) {
            thumbsContainer.style.display = 'flex';
            thumbsContainer.innerHTML = images.map((img, i) => `
                <button onclick="document.getElementById('mainGalleryImg').src='${img}'; document.querySelectorAll('.gal-thumb').forEach(b=>b.classList.remove('border-[var(--gold-muted)]')); this.classList.add('border-[var(--gold-muted)]');" 
                        class="gal-thumb w-20 h-20 flex-shrink-0 border ${i===0 ? 'border-[var(--gold-muted)]' : 'border-[var(--border)]'} overflow-hidden transition-colors rounded-xl bg-white p-1">
                    <img src="${img}" class="w-full h-full object-contain mix-blend-multiply">
                </button>
            `).join('');
        } else {
            thumbsContainer.style.display = 'none';
        }
    }
};

window.handleMainBuyClick = function() {
    if(!currentProduct) return;
    const variantData = currentProduct.variations[selectedVariantKey] || currentProduct;
    let title = window.getLoc(variantData.name);
    
    if(selectedSize) {
        title += ` (Розмір: ${selectedSize})`;
    }
    
    const price = variantData.discount > 0 ? variantData.discount : variantData.price;
    const img = (variantData.images && variantData.images.length > 0) ? variantData.images[0] : '';
    
    if(typeof window.addToCart === 'function') {
        window.addToCart(currentProduct.id, title, currentProduct.variant || '', price, img);
    }
};

window.handleMainFavClick = function() {
    if(!currentProduct) return;
    if(typeof window.toggleFav === 'function') {
        window.toggleFav(currentProduct.id);
        window.updateProductUI(); // Перемальовуємо кнопку-сердечко
    }
};

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-[var(--gold-muted)]', 'border-[var(--gold-muted)]');
        btn.classList.add('text-[var(--text-muted)]', 'border-transparent');
    });
    
    const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
    if(activeBtn) {
        activeBtn.classList.remove('text-[var(--text-muted)]', 'border-transparent');
        activeBtn.classList.add('text-[var(--gold-muted)]', 'border-[var(--gold-muted)]');
    }
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const target = document.getElementById(tabId);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('animate-fade-in');
    }
};

function renderSimilarAndBoughtTogether(allProducts) {
    if(!currentProduct) return;
    
    // Схожі товари (з тієї ж категорії)
    let similarProducts = allProducts.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    
    if (similarProducts.length > 0 && typeof window.renderProductCard === 'function') {
        const html = similarProducts.map(p => `<div class="flex-none w-[60%] sm:w-[40%] md:w-[30%] lg:w-[22%] snap-start flex">${window.renderProductCard(p)}</div>`).join('');
        const grid = document.getElementById('similarGrid');
        if(grid) grid.innerHTML = html;
        document.getElementById('similarSection')?.classList.remove('hidden');
    }

    // З цим купують (з інших категорій)
    let boughtTogether = allProducts.filter(p => p.category !== currentProduct.category && p.id !== currentProduct.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    
    if (boughtTogether.length > 0 && typeof window.renderProductCard === 'function') {
        const html = boughtTogether.map(p => `<div class="flex-none w-[60%] sm:w-[40%] md:w-[30%] lg:w-[22%] snap-start flex">${window.renderProductCard(p)}</div>`).join('');
        const grid = document.getElementById('boughtTogetherGrid');
        if(grid) grid.innerHTML = html;
        document.getElementById('boughtTogetherSection')?.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Даємо час на завантаження API (api.js і init.js)
    setTimeout(() => {
        window.renderProductPage();
    }, 150);
});