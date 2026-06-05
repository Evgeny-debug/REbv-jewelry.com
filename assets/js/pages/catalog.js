import { StorageAPI } from '../api/config.js';
import { getLoc, dictionary } from '../core/i18n.js';
import { renderProductCard } from '../components/productCard.js';

let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 120;

export function initCatalogFilters() {
    const sideFilterCategories = document.getElementById('sideFilterCategories');
    const mobFilterCategories = document.getElementById('mobileFilterCategories');
    if (!sideFilterCategories && !mobFilterCategories) return; // Працює лише на сторінці каталогу

    const cats = StorageAPI.get('bv_categories_tree', []);
    const lang = StorageAPI.get('bv_lang', 'uk');
    
    let sideHtml = `<button class="filter-link active font-bold mb-4 text-[14px] w-full text-left" data-filter="all" data-i18n="menu_all">${dictionary[lang]?.menu_all || 'Всі вироби'}</button>`;
    let mobHtml = `<button class="filter-link active font-bold mb-4 text-[14px] w-full text-left" data-filter="all" data-i18n="menu_all">${dictionary[lang]?.menu_all || 'Всі вироби'}</button>`;

    cats.forEach(cat => {
        const catName = getLoc(cat.name);
        let treeHtml = `
        <details class="group mb-1">
            <summary class="flex justify-between items-center cursor-pointer text-[12px] font-bold uppercase tracking-widest text-[var(--text-main)] outline-none py-2">
                <span class="hover:text-[var(--gold-muted)] transition-colors w-full" data-filter="${cat.id}">${catName}</span>
                <svg class="w-4 h-4 transform transition-transform group-open:rotate-180 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </summary>
            <div class="pl-3 mt-1 flex flex-col gap-1 border-l border-[var(--border)] ml-1 mb-4">`;
        
        if (cat.subcategories && cat.subcategories.length > 0) {
            cat.subcategories.forEach(sub => {
                const subName = getLoc(sub.name);
                if (sub.subcategories && sub.subcategories.length > 0) {
                    treeHtml += `
                    <details class="group/sub">
                        <summary class="flex justify-between items-center cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-[var(--gold-muted)] hover:opacity-80 transition-opacity outline-none py-1.5 mt-1">
                            <span class="hover:text-[var(--text-main)] transition-colors w-full" data-filter="${sub.id}">${subName}</span>
                            <svg class="w-3 h-3 transform transition-transform group-open/sub:rotate-180 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </summary>
                        <div class="pl-3 mt-1 flex flex-col gap-2 border-l border-white/10 ml-1 mb-2">`;
                    
                    sub.subcategories.forEach(subsub => {
                        const subsubName = getLoc(subsub.name);
                        treeHtml += `<button class="filter-link text-[12px] w-full text-left py-1" data-filter="${subsub.id}">${subsubName}</button>`;
                    });
                    treeHtml += `</div></details>`;
                } else {
                    treeHtml += `<button class="filter-link text-[11px] w-full text-left py-1.5 uppercase tracking-widest font-semibold" data-filter="${sub.id}">${subName}</button>`;
                }
            });
        }
        treeHtml += `</div></details>`;
        sideHtml += treeHtml;
        mobHtml += treeHtml;
    });

    if (sideFilterCategories) sideFilterCategories.innerHTML = sideHtml;
    if (mobFilterCategories) mobFilterCategories.innerHTML = mobHtml;

    attachFilterListeners();
    checkInitialHash();
}

function attachFilterListeners() {
    document.querySelectorAll('details').forEach(detail => {
        detail.addEventListener('toggle', function() {
            if (this.open) {
                const siblings = this.parentElement.querySelectorAll(':scope > details');
                siblings.forEach(sibling => { if (sibling !== this) sibling.removeAttribute('open'); });
            }
        });
    });

    document.querySelectorAll('[data-filter], .chip-filter, #mobileSortOptions button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const f = e.currentTarget.dataset.filter;
            const v = e.currentTarget.dataset.variant;
            const s = e.currentTarget.dataset.sort;
            
            if (f) {
                if(e.currentTarget.tagName === 'SPAN') { e.preventDefault(); e.stopPropagation(); }
                document.querySelectorAll(`[data-filter]`).forEach(b => b.classList.remove('active'));
                document.querySelectorAll(`[data-filter="${f}"]`).forEach(b => b.classList.add('active'));
                window.location.hash = f === 'all' ? '' : f;
                currentPage = 1;
                applyAllFilters();
                if(window.innerWidth < 1024) toggleMobileFilters(true);
            }
            if (v) {
                e.currentTarget.classList.toggle('active');
                currentPage = 1;
                applyAllFilters();
            }
            if (s) {
                document.querySelectorAll('#mobileSortOptions button').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.getElementById('sortSelect').value = s;
                currentPage = 1;
                applyAllFilters();
                if(window.innerWidth < 1024) toggleMobileFilters(true);
            }
        });
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => { currentPage = 1; applyAllFilters(); });
    }
}

export function applyAllFilters() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const allProducts = StorageAPI.get('bv_products', []);
    const hash = window.location.hash.replace('#', '');
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const sortSelect = document.getElementById('sortSelect');
    const sortType = sortSelect ? sortSelect.value : 'newest';
    
    let results = [...allProducts];

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        results = results.filter(p => {
            const name = getLoc(p.name).toLowerCase();
            return name.includes(q) || p.id.toLowerCase().includes(q);
        });
        document.getElementById('catalogMainTitle').innerText = `Пошук: "${searchQuery}"`;
    } else if (hash) {
        if (['new', 'sale', 'exclusive'].includes(hash)) {
            results = results.filter(p => p.badge === hash);
        } else {
            results = results.filter(p => p.category === hash || p.subcategory === hash);
        }
        const activeBtn = document.querySelector(`[data-filter="${hash}"]`);
        document.getElementById('catalogMainTitle').innerText = activeBtn ? activeBtn.innerText : 'Каталог';
    } else {
        const titleEl = document.getElementById('catalogMainTitle');
        if (titleEl) titleEl.innerText = 'Колекція Atelier';
    }

    const activeChips = Array.from(document.querySelectorAll('.chip-filter[data-variant].active')).map(b => b.dataset.variant.toLowerCase());
    if (activeChips.length > 0) {
        results = results.filter(p => p.variant && activeChips.some(v => p.variant.toLowerCase().includes(v)));
    }

    if (sortType === 'price-asc') results.sort((a, b) => a.price - b.price);
    if (sortType === 'price-desc') results.sort((a, b) => b.price - a.price);
    if (sortType === 'newest') results.sort((a, b) => (b.badge === 'new' ? -1 : 1));

    filteredProducts = results;
    renderCatalogBatch();
}

export function renderCatalogBatch() {
    const grid = document.getElementById('productGrid');
    const pagContainer = document.getElementById('paginationContainer');
    const pageIndicator = document.getElementById('pageIndicator');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const emptyState = document.getElementById('emptyState');
    const subTitle = document.getElementById('catalogSubTitle');

    if (!grid) return;
    grid.innerHTML = '';
    
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const nextBatch = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    if (nextBatch.length > 0) {
        grid.innerHTML = nextBatch.map(p => renderProductCard(p)).join('');
    }

    if (emptyState) emptyState.classList.toggle('hidden', filteredProducts.length > 0);
    grid.classList.toggle('hidden', filteredProducts.length === 0);
    
    if (pagContainer) {
        if (totalPages > 1) {
            pagContainer.classList.remove('hidden');
            pageIndicator.innerText = `${currentPage} / ${totalPages}`;
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
        } else {
            pagContainer.classList.add('hidden');
        }
    }

    if (subTitle) subTitle.innerText = `Знайдено виробів: ${filteredProducts.length}`;
}

export function toggleMobileFilters(forceClose = false) {
    const overlay = document.getElementById('mobileFilterOverlay');
    const drawer = document.getElementById('mobileFilterDrawer');
    if (!overlay || !drawer) return;
    
    if (forceClose || drawer.classList.contains('active')) {
        drawer.classList.remove('active');
        overlay.classList.add('hidden');
        overlay.classList.remove('opacity-100');
        document.body.style.overflow = '';
    } else {
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
        drawer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

export function resetFilters() {
    window.location.hash = '';
    window.history.pushState({}, '', window.location.pathname);
    document.querySelectorAll('.active[data-filter]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('[data-filter="all"]').forEach(b => b.classList.add('active'));
    document.querySelectorAll('.chip-filter.active').forEach(b => b.classList.remove('active'));
    currentPage = 1;
    applyAllFilters();
}

function checkInitialHash() {
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
        setTimeout(() => {
            document.querySelectorAll('.active[data-filter]').forEach(b => b.classList.remove('active'));
            const newActive = document.querySelectorAll(`[data-filter="${initialHash}"]`);
            newActive.forEach(b => {
                b.classList.add('active');
                let parentDetails = b.closest('details');
                while(parentDetails) {
                    parentDetails.setAttribute('open', '');
                    parentDetails = parentDetails.parentElement.closest('details');
                }
            });
            applyAllFilters();
        }, 100);
    } else {
        applyAllFilters();
    }
}

// Слухачі для пагінації (прив'язуються якщо ми на сторінці каталогу)
document.addEventListener('DOMContentLoaded', () => {
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if(currentPage > 1) { currentPage--; renderCatalogBatch(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
            if(currentPage < totalPages) { currentPage++; renderCatalogBatch(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        });
    }

    window.addEventListener('hashchange', () => {
        if (!document.getElementById('productGrid')) return;
        const hash = window.location.hash.replace('#', '') || 'all';
        document.querySelectorAll('.active[data-filter]').forEach(b => b.classList.remove('active'));
        const newActive = document.querySelectorAll(`[data-filter="${hash}"]`);
        newActive.forEach(b => {
            b.classList.add('active');
            let parentDetails = b.closest('details');
            while(parentDetails) {
                parentDetails.setAttribute('open', '');
                parentDetails = parentDetails.parentElement.closest('details');
            }
        });
        currentPage = 1;
        applyAllFilters();
    });
});

Object.assign(window, { toggleMobileFilters, resetFilters, applyAllFilters, renderCatalogBatch, initCatalogFilters });