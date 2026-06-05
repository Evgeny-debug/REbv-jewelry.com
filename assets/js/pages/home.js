import { StorageAPI } from '../api/config.js';
import { getLoc } from '../core/i18n.js';

// ==========================================
// 1. СЛАЙДЕР БАНЕРІВ (На всю ширину)
// ==========================================
export function initBannerSlider() {
    const container = document.getElementById('mainBannerContainer');
    if (!container) return;

    let banners = StorageAPI.get('bv_banners', []);
    if (!banners || banners.length === 0) {
        banners = [
            { id: 1, img: 'https://images.pexels.com/photos/266621/pexels-photo-266621.jpeg', link: 'catalog.html' },
            { id: 2, img: 'https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg', link: 'exclusive.html' }
        ];
    }

    const settings = StorageAPI.get('bv_settings', {});
    const ratio = settings.bannerRatio || '21/9'; // Более широкий формат для десктопа

    window.bannerCount = banners.length; 
    window.currentBanner = 0; 
    window.isBannerAnimating = false;
    
    let html = `
        <div class="relative w-full h-full overflow-hidden group bg-[var(--bg-elevated)]" id="bannerTrack">
            ${banners.map((b, i) => `
                <div class="banner-slide absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-1000 ease-in-out" style="opacity: ${i === 0 ? '1' : '0'}; z-index: ${i === 0 ? '10' : '1'};" data-index="${i}" onclick="window.location.href='${b.link || '#'}'">
                    <img src="${b.img}" class="w-full h-full object-cover hidden md:block" style="aspect-ratio: ${ratio};">
                    <img src="${b.imgMob || b.img}" class="w-full h-full object-cover block md:hidden" style="aspect-ratio: 4/5;">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500"></div>
                </div>
            `).join('')}
            
            <button class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20" onclick="window.moveBanner(-1, event)"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>
            <button class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20" onclick="window.moveBanner(1, event)"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>
            
            <div id="bannerDots" class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                ${banners.map((_, i) => `
                    <button class="banner-dot w-2 h-2 rounded-full transition-all duration-300 ${i === 0 ? 'bg-white w-6' : 'bg-white/50'}" onclick="window.goToBanner(${i}, event)"></button>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    if(banners.length > 1) { 
        clearInterval(window.bannerInterval); 
        window.bannerInterval = setInterval(() => window.moveBanner(1), 5000); 
    }
}

export function updateBannerDots() {
    const dots = document.querySelectorAll('.banner-dot');
    dots.forEach((d, i) => {
        d.className = i === window.currentBanner 
            ? 'banner-dot h-2 rounded-full transition-all duration-300 bg-white w-6' 
            : 'banner-dot w-2 h-2 rounded-full transition-all duration-300 bg-white/50';
    });
}

export function moveBanner(dir, e) {
    if(e) e.stopPropagation();
    if(window.bannerCount <= 1 || window.isBannerAnimating) return;
    window.isBannerAnimating = true;
    clearInterval(window.bannerInterval);
    
    const newIndex = (window.currentBanner + dir + window.bannerCount) % window.bannerCount;
    window.executeFade(newIndex);
    
    setTimeout(() => { window.isBannerAnimating = false; }, 1000);
    window.bannerInterval = setInterval(() => window.moveBanner(1), 5000);
}

export function executeFade(newIndex) {
    const track = document.getElementById('bannerTrack');
    if(!track) return;
    const slides = track.querySelectorAll('.banner-slide');
    
    slides.forEach((slide, i) => {
        slide.style.opacity = i === newIndex ? '1' : '0';
        slide.style.zIndex = i === newIndex ? '10' : '1';
    });
    
    window.currentBanner = newIndex;
    updateBannerDots();
}

export function goToBanner(index, e) {
    if(e) e.stopPropagation();
    if(window.bannerCount <= 1 || window.isBannerAnimating || index === window.currentBanner) return;
    window.isBannerAnimating = true;
    clearInterval(window.bannerInterval);
    executeFade(index);
    setTimeout(() => { window.isBannerAnimating = false; }, 1000);
    window.bannerInterval = setInterval(() => window.moveBanner(1), 5000);
}

// ==========================================
// 2. СІТКА КАТЕГОРІЙ (Стиль "Золотий Вік")
// ==========================================
export function renderHomeCategories() {
    const categories = StorageAPI.get('bv_categories_tree', []);
    const container = document.getElementById('homeCategoriesGrid');
    if (!container) return;

    // Беремо перші 4 або 8 категорій для сітки
    const topCategories = categories.slice(0, 4);

    container.innerHTML = topCategories.map(cat => {
        // Якщо адмін не задав фото категорії, ставимо плейсхолдер
        const img = cat.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800'; 
        const name = getLoc(cat.name);

        return `
            <a href="catalog.html#${cat.id}" class="group relative block overflow-hidden bg-[var(--bg-elevated)] aspect-[4/5] md:aspect-[3/4]">
                <img src="${img}" alt="${name}" class="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" loading="lazy">
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                
                <div class="absolute bottom-0 left-0 w-full p-4 md:p-6 flex flex-col items-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 class="text-white font-serif text-lg md:text-2xl tracking-wide mb-2 text-center">${name}</h3>
                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        <span class="text-[10px] md:text-xs uppercase tracking-widest text-[var(--gold-muted)] font-bold">Переглянути</span>
                        <svg class="w-4 h-4 text-[var(--gold-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

// ==========================================
// 3. ДИНАМІЧНІ БЛОКИ (Каруселі товарів)
// ==========================================
export function renderHomeSections() {
    const homeBlocks = StorageAPI.get('bv_home_blocks', [
        { id: 'hits', name: {uk: 'Хіти продажу', ru: 'Хиты продаж', en: 'Bestsellers'}, active: true },
        { id: 'new', name: {uk: 'Новинки', ru: 'Новинки', en: 'New Arrivals'}, active: true }
    ]);
    
    const products = StorageAPI.get('bv_products', []);
    let container = document.getElementById('dynamicHomeBlocksContainer');
    if (!container) return;
    
    let html = '';
    homeBlocks.filter(b => b.active).forEach(block => {
        let items = products.filter(p => {
            if (p.blocks && p.blocks.includes(block.id)) return true;
            if (block.id === 'hits' && p.badge === 'sale') return true;
            if (block.id === 'new' && p.badge === 'new') return true;
            return false;
        });
        
        if (items.length > 0) {
            const title = getLoc(block.name);
            const trackId = `block-track-${block.id}`;
            const cardWrapper = (p) => `<div class="flex-none w-[50%] sm:w-[33.333%] md:w-[25%] lg:w-[20%] snap-start flex">${window.renderProductCard(p)}</div>`;
            
            // Дублюємо товари для нескінченної каруселі, якщо їх мало
            let blockItems = [...items];
            while(blockItems.length < 8 && blockItems.length > 0) { blockItems = blockItems.concat(items); }
            
            html += `
            <section class="max-w-[1920px] mx-auto px-0 py-8 md:py-16 border-t border-[var(--border)]">
                <div class="mb-6 md:mb-10 text-center px-4">
                    <h2 class="hero-title text-[var(--text-main)] text-[24px] md:text-[32px]">${title}</h2>
                </div>
                <div class="promo-carousel-container select-none group relative">
                    <div id="${trackId}" class="flex overflow-x-auto gap-0 snap-x snap-mandatory no-scrollbar min-h-[300px]">
                        ${blockItems.slice(0, 15).map(cardWrapper).join('')}
                    </div>
                </div>
            </section>`;
        }
    });
    
    container.innerHTML = html;
    
    homeBlocks.filter(b => b.active).forEach(block => {
        const track = document.getElementById(`block-track-${block.id}`);
        if (track) initPremiumCarousel(track);
    });
}

export function initPremiumCarousel(track) {
    // [Залишаємо логіку свайпу без змін, вона працювала ідеально]
    if (!track || track.dataset.init === 'true') return;
    track.dataset.init = 'true';

    let wrapper = track.closest('.group');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'relative w-full group outline-none'; 
        track.parentNode.insertBefore(wrapper, track);
        wrapper.appendChild(track);
    }

    const btnClass = "btn-cross hidden md:flex absolute top-1/2 -translate-y-1/2 z-40 w-12 h-12 lg:w-14 lg:h-14 items-center justify-center rounded-full bg-[var(--bg-body)]/80 backdrop-blur-sm border border-[var(--border)] text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition-all duration-400 hover:text-[var(--gold-muted)] hover:border-[var(--gold-muted)] shadow-lg";
    const prevBtn = document.createElement('button'); prevBtn.className = `${btnClass} left-2 lg:left-6`; prevBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 18l-6-6 6-6"/></svg>`;
    const nextBtn = document.createElement('button'); nextBtn.className = `${btnClass} right-2 lg:right-6`; nextBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg>`;
    wrapper.appendChild(prevBtn); wrapper.appendChild(nextBtn);

    track.classList.add('no-scrollbar', 'cursor-grab'); track.classList.remove('snap-x', 'snap-mandatory'); track.style.scrollBehavior = 'auto';

    let isDown = false, isDragging = false, startX, scrollLeft, lastX, velX = 0, momentumID;

    const momentumLoop = () => {
        if (isDown) return; track.scrollLeft -= velX; velX *= 0.95; checkInfinite();
        if (Math.abs(velX) > 0.5) { momentumID = requestAnimationFrame(momentumLoop); } else { track.classList.add('snap-x', 'snap-mandatory'); }
    };

    const beginMomentum = () => { track.classList.remove('snap-x', 'snap-mandatory'); cancelAnimationFrame(momentumID); momentumID = requestAnimationFrame(momentumLoop); };

    nextBtn.onclick = () => { velX = -30; beginMomentum(); };
    prevBtn.onclick = () => { velX = 30; beginMomentum(); };

    const startAction = (e) => { isDown = true; isDragging = false; track.classList.remove('snap-x', 'snap-mandatory'); track.classList.add('cursor-grabbing'); cancelAnimationFrame(momentumID); startX = (e.pageX || e.touches[0].pageX); scrollLeft = track.scrollLeft; lastX = startX; velX = 0; };
    const endAction = () => { if (!isDown) return; isDown = false; track.classList.remove('cursor-grabbing'); beginMomentum(); setTimeout(() => { isDragging = false; }, 50); };
    const moveAction = (e) => { if (!isDown) return; const currentX = (e.pageX || e.touches[0].pageX); const walk = (currentX - startX); if (Math.abs(walk) > 5) isDragging = true; track.scrollLeft = scrollLeft - walk; velX = currentX - lastX; lastX = currentX; checkInfinite(); };
    const checkInfinite = () => { const bWidth = track.scrollWidth / 3; if (track.scrollLeft >= bWidth * 2) track.scrollLeft -= bWidth; if (track.scrollLeft <= 0) track.scrollLeft += bWidth; };

    track.addEventListener('mousedown', startAction); window.addEventListener('mouseup', endAction); track.addEventListener('mousemove', moveAction); track.addEventListener('mouseleave', endAction);
    track.addEventListener('touchstart', startAction, {passive: true}); track.addEventListener('touchend', endAction); track.addEventListener('touchmove', moveAction, {passive: true});

    setTimeout(() => { track.scrollLeft = track.scrollWidth / 3; }, 200);
}

Object.assign(window, { initBannerSlider, updateBannerDots, moveBanner, executeFade, goToBanner, renderHomeCategories, renderHomeSections, initPremiumCarousel });