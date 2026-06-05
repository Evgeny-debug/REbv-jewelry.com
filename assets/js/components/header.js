import { StorageAPI } from '../api/config.js';
import { getLoc } from '../core/i18n.js';
import { getCategoryIconSVG } from '../core/utils.js';

export function toggleMenu() {
    const burger = document.getElementById('burger');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    
    if(burger) burger.classList.toggle('open');
    if(sideMenu) sideMenu.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
    
    document.body.style.overflow = (sideMenu && sideMenu.classList.contains('active')) ? 'hidden' : 'auto';
    const searchBox = document.getElementById('mobSearchContainer');
    if(searchBox && !searchBox.classList.contains('hidden')) toggleMobileSearch(true);
}

export function toggleAccordion(listId, arrowId) {
    const list = document.getElementById(listId);
    const arrow = document.getElementById(arrowId);
    if (!list) return;

    const isOpening = !list.classList.contains('open');

    if (isOpening && list.classList.contains('mob-accordion-list')) {
        const openMainLists = document.querySelectorAll('.mob-accordion-list.open');
        openMainLists.forEach(ol => {
            if (ol !== list) {
                ol.classList.remove('open');
                const title = ol.previousElementSibling;
                if (title) {
                    const siblingArrow = title.querySelector('svg');
                    if (siblingArrow) siblingArrow.style.transform = 'rotate(0deg)';
                }
            }
        });
    }

    list.classList.toggle('open');
    if (arrow) arrow.style.transform = list.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
}

export function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    StorageAPI.set('bv_theme', newTheme);
    
    const sunSVG = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    const moonSVG = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
    const svg = newTheme === 'light' ? sunSVG : moonSVG;
    
    const icon = document.getElementById('themeIcon');
    const iconMob = document.getElementById('themeIconMob');
    if(icon) icon.innerHTML = svg;
    if(iconMob) iconMob.innerHTML = svg;
}

export function executeSearch(query) {
    if (!query || !query.trim()) return;
    window.location.href = `catalog.html?search=${encodeURIComponent(query.trim())}`;
}

export function toggleMobileSearch(forceClose = null) {
    const searchBox = document.getElementById('mobSearchContainer');
    if (!searchBox) return;
    if (forceClose === true) { searchBox.classList.add('hidden'); return; }
    if (forceClose === false) { searchBox.classList.remove('hidden'); }
    else { searchBox.classList.toggle('hidden'); }
    
    if (!searchBox.classList.contains('hidden')) { 
        setTimeout(() => { 
            const inp = document.getElementById('mobSearchOverlayInput'); 
            if (inp) inp.focus(); 
        }, 100); 
    }
}

export function generateMenus() {
    const categoriesTree = StorageAPI.get('bv_categories_tree', []);
    const megaCol1 = document.getElementById('megaCol1');
    const megaMenu = document.querySelector('.mega-menu');
    const sideMenu = document.getElementById('sideMenu');
    
    const buildMobileTree = (nodes) => {
        let html = '';
        nodes.forEach(n => {
            const name = getLoc(n.name);
            if (n.subcategories && n.subcategories.length > 0) {
                html += `
                <div class="mob-nested-wrap">
                    <div class="mob-nested-title" onclick="window.toggleAccordion('mob-sub-${n.id}', 'mob-arrow-${n.id}')">
                        <div class="flex items-center gap-3">
                            <span style="font-size: 14px; font-weight: 500;">${name}</span>
                        </div>
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
            const svgIcon = getCategoryIconSVG(cat.id);
            const catName = getLoc(cat.name);
            
            megaCol1.innerHTML += `<div class="mega-cat-item ${isActive}" data-target="mc-${cat.id}"><svg class="mega-cat-icon" viewBox="0 0 24 24">${svgIcon}</svg><span>${catName}</span></div>`;

            let groupsHtml = '<div class="zlato-groups-grid">';
            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach(sub => {
                    groupsHtml += `<div class="zlato-group-wrapper">`;
                    groupsHtml += `<a href="catalog.html#${sub.id}" class="zlato-group-title">${getLoc(sub.name)}</a>`;
                    
                    if (sub.subcategories && sub.subcategories.length > 0) {
                        groupsHtml += `<div class="zlato-tags-container">`;
                        sub.subcategories.forEach(subsub => { 
                            groupsHtml += `<a href="catalog.html#${subsub.id}" class="zlato-tag">${getLoc(subsub.name)}</a>`; 
                        });
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
                newCol2.innerHTML = `
                    <div class="flex items-center gap-3 mb-6">
                        <h2 class="text-3xl font-serif text-[var(--text-main)]">${catName}</h2>
                        <a href="catalog.html#${cat.id}" class="text-[12px] uppercase tracking-widest text-[var(--gold-muted)] font-bold transition-colors">Всі →</a>
                    </div>
                    ${groupsHtml}
                `;
                megaMenu.appendChild(newCol2);
            }
        });

        megaCol1.innerHTML += `<a href="exclusive.html" class="mega-atelier-btn mt-auto mx-4 mb-4 border border-[var(--gold-muted)] text-[var(--gold-muted)] p-3 rounded-none flex items-center justify-center gap-2 hover:bg-[var(--gold-muted)] hover:text-[#111] transition-colors font-bold uppercase tracking-widest text-[10px]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7-7-7M5 12h14"/></svg><span data-i18n="m_atelier">Ексклюзив</span></a>`;
        
        document.querySelectorAll('.mega-cat-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                document.querySelectorAll('.mega-cat-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.zlato-content').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                const targetId = item.getAttribute('data-target').replace('mc-', '');
                const targetCol = document.getElementById('mc-' + targetId);
                if(targetCol) targetCol.classList.add('active');
            });
        });
    }

    if(sideMenu) {
        let mobCatHtml = buildMobileTree(categoriesTree);
        const savedLang = StorageAPI.get('bv_lang', 'uk');
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const sunSVG = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
        const moonSVG = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
        const currentThemeIcon = currentTheme === 'light' ? sunSVG : moonSVG;

        sideMenu.innerHTML = `
            <div class="flex justify-between items-center pb-4 mb-4 border-b border-[var(--border)] pt-4 px-4">
                <a href="index.html" class="flex flex-col items-start gap-1" style="text-decoration:none;">
                    <span class="text-3xl font-serif text-[var(--gold-muted)] leading-none">BV</span>
                </a>
                <div class="flex items-center gap-5">
                    <button onclick="window.toggleTheme()" class="text-[var(--text-main)] opacity-80 hover:opacity-100 transition-opacity">
                        <svg id="themeIconMob" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${currentThemeIcon}</svg>
                    </button>
                    
                    <div class="text-[11px] font-bold text-[var(--text-main)] flex gap-1.5 uppercase opacity-80">
                        <span class="cursor-pointer ${savedLang==='uk'?'text-[var(--gold-muted)]':''}" onclick="window.changeLang('uk')">UK</span>
                        <span class="opacity-30">|</span>
                        <span class="cursor-pointer ${savedLang==='ru'?'text-[var(--gold-muted)]':''}" onclick="window.changeLang('ru')">RU</span>
                        <span class="opacity-30">|</span>
                        <span class="cursor-pointer ${savedLang==='en'?'text-[var(--gold-muted)]':''}" onclick="window.changeLang('en')">EN</span>
                    </div>
                    
                    <button onclick="window.smartProfileClick()" class="text-[var(--text-main)] opacity-80 hover:opacity-100 transition-opacity">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </button>
                </div>
            </div>
            
            <div class="px-4 pb-6 flex flex-col flex-grow overflow-y-auto custom-scrollbar">
                <a href="index.html" class="mob-menu-title" onclick="window.toggleMenu()">Головна</a>
                
                <div class="menu-divider"></div>
                
                <div>
                    <div class="mob-menu-title" onclick="window.toggleAccordion('mobCatList', 'mobCatArrow')">
                        <span data-i18n="m2">Каталог</span>
                        <svg id="mobCatArrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-muted)" stroke-width="2" class="transition-transform duration-300"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div class="mob-accordion-list" id="mobCatList" style="gap: 0; padding-left: 0;">${mobCatHtml}</div>
                </div>
                
                <div>
                    <div class="mob-menu-title cursor-pointer" onclick="window.toggleAccordion('mobInfoList', 'mobInfoArrow')">
                        <span>Бренд</span>
                        <svg id="mobInfoArrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transition-transform duration-300"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div class="mob-accordion-list" id="mobInfoList" style="gap: 5px; padding-left: 10px;">
                        <a href="info.html?p=about" class="sub-cat-link py-3 block text-[14px] opacity-80" onclick="window.toggleMenu()">Про нас</a>
                        <a href="info.html?p=warranty" class="sub-cat-link py-3 block text-[14px] opacity-80" onclick="window.toggleMenu()">Гарантія та повернення</a>
                        <a href="info.html?p=terms" class="sub-cat-link py-3 block text-[14px] opacity-80" onclick="window.toggleMenu()">Оплата і доставка</a>
                        <a href="info.html?p=faq" class="sub-cat-link py-3 block text-[14px] opacity-80" onclick="window.toggleMenu()">Часті питання</a>
                    </div>
                </div>
                
                <a href="services.html" class="mob-menu-title" onclick="window.toggleMenu()"><span data-i18n="m_price">Прайс</span></a>
                <a href="exclusive.html" class="block w-full border border-[var(--gold-muted)] text-[var(--gold-muted)] py-3 text-center font-bold uppercase tracking-widest text-[10px] hover:bg-[var(--gold-muted)] hover:text-[#111] transition-colors mt-4" onclick="window.toggleMenu()">
                        <span data-i18n="m_atelier">Ексклюзив</span>
                    </a>
                <div class="menu-divider mt-4"></div>
                
                <div class="mt-auto pt-4 pb-4">
                    <div class="flex flex-col gap-1 text-xs text-[var(--text-muted)] font-light mb-6 px-2">
                        <a href="tel:+380634540901" class="text-[var(--gold-muted)] font-medium text-sm mb-1">+38 063 45 40 901</a>
                        <span>Графік роботи: 08:00 - 18:00</span>
                        <span>м. Ізмаїл, вул. Торгова, 68</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Реєструємо функції глобально
Object.assign(window, { toggleMenu, toggleAccordion, toggleTheme, executeSearch, toggleMobileSearch, generateMenus });