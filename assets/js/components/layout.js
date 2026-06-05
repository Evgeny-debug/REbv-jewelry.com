import { StorageAPI } from '../api/config.js';

export function injectSharedLayout() {
    if (window.location.pathname.includes('admin.html')) return;

    const settings = StorageAPI.get('bv_settings', {});
    const phone = settings.phone || '';
    const cleanPhone = phone ? phone.replace(/\s+/g, '') : '';
    const address = settings.address || '';
    const schedule = settings.schedule || '';
    const tgLink = settings.tgLink || '';
    const instLink = settings.instLink || ''; 

    // 1. ВЕРХНЯ ЧАСТИНА (Оверлеї, Модалки, Шапка і Меню)
    const headerAndModalsHTML = `
        <div class="menu-overlay" id="overlay" onclick="window.toggleMenu()" aria-hidden="true"></div>
        <div class="cart-overlay" id="cartOverlay" onclick="window.toggleCart()" aria-hidden="true"></div>
        <div class="cart-overlay" id="favOverlay" onclick="window.toggleFavDrawer()" aria-hidden="true"></div>

        <div class="cart-drawer" id="cartDrawer" role="dialog">
            <div class="cart-header">
                <h2 data-i18n="cart_title">Кошик</h2>
                <button class="cart-close" id="cartClose" onclick="window.toggleCart()">&times;</button>
            </div>
            <div class="cart-body custom-scrollbar" id="cartBody"></div>
            <div class="cart-footer">
                <div class="flex justify-end mb-3">
                    <button onclick="window.clearEntireCart()" class="text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg> Очистити
                    </button>
                </div>
                <div class="cart-subtotal">
                    <span data-i18n="cart_subtotal">Підсумок:</span>
                    <span class="cart-subtotal-val text-[var(--gold-muted)] font-bold text-xl">0 ₴</span>
                </div>
                <div id="checkoutBtnWrapper" class="w-full mt-4"></div>
            </div>
        </div>

        <div class="cart-drawer" id="favDrawer" role="dialog">
            <div class="cart-header">
                <h2 data-i18n="fav_title">Улюблене</h2>
                <button class="cart-close" onclick="window.toggleFavDrawer()">&times;</button>
            </div>
            <div class="cart-body custom-scrollbar" id="favBody"></div>
        </div>

        <header id="header">
            <div class="header-left">
                <button class="mobile-only p-2 cursor-pointer text-[var(--text-main)]" onclick="window.toggleMobileSearch()">
                    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" class="w-6 h-6"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>
                
                <nav class="nav-left desktop-only">
                    <a href="index.html" data-i18n="m1" class="nav-link hover:text-[var(--gold-muted)] transition-colors active">Головна</a>
                    <div class="catalog-dropdown-wrapper group">
                        <button class="nav-link catalog-toggle flex items-center gap-1 cursor-pointer hover:text-[var(--gold-muted)] transition-colors" onclick="location.href='catalog.html'">
                            <span data-i18n="m2">Каталог</span> <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="mega-menu zlato-style">
                            <div class="mega-col-1 zlato-categories" id="megaCol1"></div>
                            <div class="mega-col-2 zlato-content" id="megaCol2"></div>
                        </div>
                    </div>
                    <a href="services.html" class="nav-link hover:text-[var(--gold-muted)] transition-colors" data-i18n="m_price">Прайс</a>
                    <a href="exclusive.html" class="exclusive-nav-btn" data-i18n="m_atelier">Ексклюзив</a>
                </nav>
            </div>

            <a href="index.html" class="bv-logo"><span>BV</span><span>jewelry</span></a>

            <div class="header-right">
                ${tgLink ? `
                <a href="${tgLink}" target="_blank" class="mobile-only p-2 cursor-pointer text-[var(--text-main)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </a>` : ''}
                
                <div class="search-box desktop-only group mr-4">
                    <input type="search" class="search-input" data-i18n-placeholder="search_ph" placeholder="Пошук..." onkeypress="if(event.key==='Enter') window.executeSearch(this.value)">
                    <svg class="search-icon group-focus-within:stroke-[var(--gold-muted)] transition-colors" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                
                ${phone ? `
                <a href="tel:${cleanPhone}" class="header-phone-link desktop-only hover:text-[var(--gold-muted)] transition-colors">
                    <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span class="header-phone-text font-medium tracking-wide">${phone}</span>
                </a>` : ''}
                
                <button id="themeToggle" class="icon-btn desktop-only hover:text-[var(--gold-muted)]" onclick="window.toggleTheme()"><svg id="themeIcon" viewBox="0 0 24 24"></svg></button>
                
                <div class="dropdown-wrapper lang-dropdown desktop-only">
                    <button class="lang-current"><img src="https://flagcdn.com/ua.svg" class="flag" id="currentFlag" alt=""><span id="currentLangLabel">UA</span></button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item w-full text-left flex items-center gap-2" onclick="window.changeLang('uk')"><img src="https://flagcdn.com/ua.svg" class="w-5 rounded-[3px]" alt=""> UA</button>
                        <button class="dropdown-item w-full text-left flex items-center gap-2" onclick="window.changeLang('en')"><img src="https://flagcdn.com/gb.svg" class="w-5 rounded-[3px]" alt=""> EN</button>
                        <button class="dropdown-item w-full text-left flex items-center gap-2" onclick="window.changeLang('ru')"><img src="https://flagcdn.com/ru.svg" class="w-5 rounded-[3px]" alt=""> RU</button>
                    </div>
                </div>
                
                <div class="dropdown-wrapper desktop-only group">
                    <button class="icon-btn" id="headerProfileBtn" onclick="window.smartProfileClick()">
                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </button>
                    <div class="dropdown-menu" id="profileDropdownMenu"></div>
                </div>
                
                <button onclick="window.toggleFavDrawer()" class="icon-btn desktop-only">
                    <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span class="cart-badge fav-badge" style="background: var(--danger);">0</span>
                </button>
                <button onclick="window.toggleCart()" class="icon-btn desktop-only">
                    <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    <span class="cart-badge">0</span>
                </button>
            </div>
            
            <div id="mobSearchContainer" class="absolute top-[100%] left-0 w-full p-4 bg-[var(--bg-card)] border-b border-[var(--border)] shadow-xl hidden z-[4000]">
                <div class="flex items-center bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-none px-4 py-3 focus-within:border-[var(--gold-muted)] transition-colors">
                    <input type="search" id="mobSearchOverlayInput" data-i18n-placeholder="search_ph" placeholder="Пошукаємо прикрасу?..." class="w-full bg-transparent outline-none text-[var(--text-main)] text-sm font-['Inter']">
                    <button onclick="window.executeSearch(document.getElementById('mobSearchOverlayInput').value)" class="text-[var(--gold-muted)] ml-2">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                </div>
            </div>
        </header>

        <!-- МІНІМАЛІСТИЧНЕ БОКОВЕ МЕНЮ -->
        <nav class="side-menu flex flex-col bg-[var(--bg-body)] z-[5000]" id="sideMenu" aria-label="Мобільна навігація" onclick="if(!event.target.closest('#mobLangBtn')) { const d = document.getElementById('mobLangDropdown'); if(d) d.classList.add('hidden'); }">
            
            <!-- Шапка бокового меню -->
            <div class="flex items-center justify-between p-6 pb-4 shrink-0 border-b border-[var(--border)]">
                <!-- Логотип -->
                <div class="bv-logo relative !static !transform-none !items-start !opacity-100">
                    <span class="!text-2xl text-[var(--text-main)]">BV</span><span class="!text-[7px] mt-1 font-['Montserrat'] font-bold tracking-widest text-[var(--gold-muted)]">jewelry</span>
                </div>
                
                <!-- Іконки системних дій (Праворуч) -->
                <div class="flex items-center gap-3">
                    <!-- Профіль -->
                    <button onclick="window.smartProfileClick(); window.toggleMenu();" class="text-[var(--text-main)] hover:text-[var(--gold-muted)] transition-colors" aria-label="Профіль">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </button>
                    
                    <!-- Мова -->
                    <div class="relative flex" id="mobLangBtn">
                        <button class="text-[var(--text-main)] hover:text-[var(--gold-muted)] transition-colors" onclick="document.getElementById('mobLangDropdown').classList.toggle('hidden')" aria-label="Мова">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        </button>
                        <div id="mobLangDropdown" class="hidden absolute top-full right-1/2 translate-x-1/2 mt-4 bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl z-[6000] w-[70px] rounded-lg flex flex-col text-sm overflow-hidden">
                            <button class="p-3 text-center text-[var(--text-main)] hover:bg-[var(--bg-body)] hover:text-[var(--gold-muted)] font-medium" onclick="window.changeLang('uk'); document.getElementById('mobLangDropdown').classList.add('hidden')">UA</button>
                            <button class="p-3 text-center text-[var(--text-main)] hover:bg-[var(--bg-body)] hover:text-[var(--gold-muted)] font-medium border-t border-[var(--border)]" onclick="window.changeLang('en'); document.getElementById('mobLangDropdown').classList.add('hidden')">EN</button>
                            <button class="p-3 text-center text-[var(--text-main)] hover:bg-[var(--bg-body)] hover:text-[var(--gold-muted)] font-medium border-t border-[var(--border)]" onclick="window.changeLang('ru'); document.getElementById('mobLangDropdown').classList.add('hidden')">RU</button>
                        </div>
                    </div>

                    <!-- Тема -->
                    <button onclick="window.toggleTheme()" class="text-[var(--text-main)] hover:text-[var(--gold-muted)] transition-colors" aria-label="Тема">
                        <svg id="themeIconMob" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"></svg>
                    </button>
                    
                    <!-- Розділювач -->
                    <div class="w-px h-5 bg-[var(--border)] mx-1"></div>

                    <!-- Хрестик -->
                    <button class="p-1 -mr-1 text-[var(--text-main)] hover:text-[var(--gold-muted)] transition-colors" onclick="window.toggleMenu()" aria-label="Закрити">
                        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Тіло меню -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-6 pt-6 flex flex-col" id="sideMenuBody">
                
                <!-- Контакти на старому місці (вгорі списку) -->
                ${(phone || schedule || address) ? `
                <div class="flex flex-col gap-2 border-b border-[var(--border)] pb-6 mb-6">
                    ${phone ? `<a href="tel:${cleanPhone}" class="text-[22px] font-medium text-[var(--text-main)] tracking-wide hover:text-[var(--gold-muted)] transition-colors">${phone}</a>` : ''}
                    ${schedule ? `<span class="text-[13px] text-[var(--text-muted)] mt-1">${schedule}</span>` : ''}
                    ${address ? `<span class="text-[13px] text-[var(--text-muted)] mt-1">${address}</span>` : ''}
                </div>` : ''}
                
                <!-- Основна навігація -->
                <div class="flex flex-col gap-5">
                    <a href="index.html" class="text-xl font-serif text-[var(--text-main)] hover:text-[var(--gold-muted)] transition-colors">Головна</a>
                    
                    <details class="group">
                        <summary class="flex justify-between items-center text-xl font-serif text-[var(--text-main)] cursor-pointer list-none marker:hidden transition-colors hover:text-[var(--gold-muted)]">
                            <span>Каталог</span>
                            <svg class="w-5 h-5 transition-transform group-open:rotate-180 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"></path></svg>
                        </summary>
                        <div class="mt-4 flex flex-col gap-4 pl-4 border-l border-[var(--border)]">
                            <a href="catalog.html" class="text-[15px] text-[var(--text-muted)] hover:text-[var(--gold-muted)] transition-colors">Всі прикраси</a>
                            <a href="catalog.html#rings" class="text-[15px] text-[var(--text-muted)] hover:text-[var(--gold-muted)] transition-colors">Каблучки</a>
                            <a href="catalog.html#earrings" class="text-[15px] text-[var(--text-muted)] hover:text-[var(--gold-muted)] transition-colors">Сережки</a>
                            <a href="catalog.html#necklaces" class="text-[15px] text-[var(--text-muted)] hover:text-[var(--gold-muted)] transition-colors">Ланцюжки</a>
                            <a href="catalog.html#bracelets" class="text-[15px] text-[var(--text-muted)] hover:text-[var(--gold-muted)] transition-colors">Браслети</a>
                        </div>
                    </details>

                    <details class="group">
                        <summary class="flex justify-between items-center text-xl font-serif text-[var(--text-main)] cursor-pointer list-none marker:hidden transition-colors hover:text-[var(--gold-muted)]">
                            <span>Інформація</span>
                            <svg class="w-5 h-5 transition-transform group-open:rotate-180 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7"></path></svg>
                        </summary>
                        <div class="mt-4 flex flex-col gap-4 pl-4 border-l border-[var(--border)]">
                            <a href="services.html" class="text-[15px] text-[var(--text-muted)] hover:text-[var(--gold-muted)] transition-colors">Послуги та Прайс</a>
                            <a href="info.html?p=warranty" class="text-[15px] text-[var(--text-muted)] hover:text-[var(--gold-muted)] transition-colors">Гарантія та догляд</a>
                            <a href="info.html?p=terms" class="text-[15px] text-[var(--text-muted)] hover:text-[var(--gold-muted)] transition-colors">Доставка та оплата</a>
                        </div>
                    </details>

                    <a href="exclusive.html" class="text-[15px] font-bold uppercase tracking-widest text-[var(--gold-muted)] hover:opacity-80 transition-opacity mt-2">Ексклюзивне замовлення</a>
                </div>

                <!-- Соцмережі (внизу скролу) -->
                ${(instLink || tgLink) ? `
                <div class="mt-auto pt-8 pb-4 flex items-center gap-4">
                    ${instLink ? `
                    <a href="${instLink}" target="_blank" class="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--gold-muted)] hover:border-[var(--gold-muted)] hover:text-white transition-all duration-300">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>` : ''}
                    
                    ${tgLink ? `
                    <a href="${tgLink}" target="_blank" class="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--gold-muted)] hover:border-[var(--gold-muted)] hover:text-white transition-all duration-300">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </a>` : ''}
                </div>` : ''}
            </div>
        </nav>
    `;

    // 2. НИЖНЯ ЧАСТИНА (Моб. навігація і Основний Футер)
    const footerAndBottomNavHTML = `
        <nav class="mobile-bottom-nav">
            <button onclick="window.location.href='index.html'" class="bottom-nav-item active">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span data-i18n="m1">Головна</span>
            </button>
            <button onclick="window.location.href='catalog.html'" class="bottom-nav-item">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span data-i18n="m2">Каталог</span>
            </button>
            <button onclick="window.toggleCart();" class="bottom-nav-item">
                <div class="relative">
                    <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    <span class="cart-badge">0</span>
                </div>
                <span data-i18n="cart_title">Кошик</span>
            </button>
            <button onclick="window.toggleFavDrawer();" class="bottom-nav-item">
                <div class="relative">
                    <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span class="cart-badge fav-badge" style="background: var(--danger);">0</span>
                </div>
                <span data-i18n="fav_title">Улюблене</span>
            </button>
            <button onclick="window.toggleMenu()" class="bottom-nav-item">
                <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>Меню</span>
            </button>
        </nav>

        <footer id="footer" class="pt-12 pb-24 md:pb-12 bg-[var(--bg-card)] border-t border-[var(--border)] relative z-10">
            <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                
                <div class="col-span-2 md:col-span-1 flex flex-col items-start mb-4 md:mb-0">
                    <div class="bv-logo mb-4 relative !static !transform-none !items-start !opacity-100">
                        <span class="!text-3xl">BV</span><span class="!text-[8px] mt-1 font-['Montserrat'] font-bold tracking-widest">jewelry</span>
                    </div>
                    <p class="text-[12px] text-[var(--text-muted)] font-light leading-relaxed">
                        Вишуканість у деталях. Формуємо сімейні цінності у дорогоцінних металах з 1984 року.
                    </p>
                </div>
                
                <div class="col-span-1 flex flex-col items-start">
                    <h4 class="font-serif text-[var(--text-main)] text-sm uppercase tracking-widest mb-4 border-b border-[var(--border)] pb-2 w-full" data-i18n="m2">Каталог</h4>
                    <a href="catalog.html#rings" class="text-[12px] text-[var(--text-main)] opacity-90 hover:text-[var(--gold-muted)] mb-3 transition">Каблучки</a>
                    <a href="catalog.html#earrings" class="text-[12px] text-[var(--text-main)] opacity-90 hover:text-[var(--gold-muted)] mb-3 transition">Сережки</a>
                    <a href="catalog.html#necklaces" class="text-[12px] text-[var(--text-main)] opacity-90 hover:text-[var(--gold-muted)] mb-3 transition">Ланцюжки</a>
                </div>
                
                <div class="col-span-1 flex flex-col items-start">
                    <h4 class="font-serif text-[var(--text-main)] text-sm uppercase tracking-widest mb-4 border-b border-[var(--border)] pb-2 w-full">Клієнтам</h4>
                    <a href="services.html" class="text-[12px] text-[var(--text-main)] opacity-90 hover:text-[var(--gold-muted)] mb-3 transition" data-i18n="m_price">Послуги та Прайс</a>
                    <a href="info.html?p=warranty" class="text-[12px] text-[var(--text-main)] opacity-90 hover:text-[var(--gold-muted)] mb-3 transition" data-i18n="brand_warranty">Гарантія</a>
                    <a href="info.html?p=terms" class="text-[12px] text-[var(--text-main)] opacity-90 hover:text-[var(--gold-muted)] mb-3 transition" data-i18n="brand_terms">Доставка</a>
                </div>
                
                <div class="col-span-2 md:col-span-1 flex flex-col items-start mt-2 md:mt-0 w-full">
                    <h4 class="font-serif text-[var(--text-main)] text-sm uppercase tracking-widest mb-5 border-b border-[var(--border)] pb-2 w-full" data-i18n="m4">Контакти</h4>
                    
                    <div class="flex flex-col gap-3 w-full">
                        ${phone ? `<a href="tel:${cleanPhone}" class="flex items-center gap-3 text-[14px] text-[var(--gold-muted)] font-medium transition hover:opacity-80 tracking-wide"><svg class="w-4 h-4 shrink-0 text-[var(--text-main)] opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>${phone}</a>` : ''}
                        ${schedule ? `<div class="flex items-start gap-3 text-[12px] text-[var(--text-muted)]"><svg class="w-4 h-4 shrink-0 mt-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>${schedule}</span></div>` : ''}
                        ${address ? `<div class="flex items-start gap-3 text-[12px] text-[var(--text-muted)]"><svg class="w-4 h-4 shrink-0 mt-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span>${address}</span></div>` : ''}
                    </div>
                    
                    ${(instLink || tgLink) ? `
                    <div class="flex items-center gap-3 mt-6">
                        ${instLink ? `<a href="${instLink}" target="_blank" class="inst-link w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-main)] hover:text-[#111] hover:bg-[var(--gold-muted)] hover:border-[var(--gold-muted)] transition-all duration-300"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>` : ''}
                        ${tgLink ? `<a href="${tgLink}" target="_blank" class="tg-link w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-main)] hover:text-[#111] hover:bg-[var(--gold-muted)] hover:border-[var(--gold-muted)] transition-all duration-300"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></a>` : ''}
                    </div>` : ''}
                </div>
            </div>
            
            <div class="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-[var(--border)] text-center text-[11px] text-[var(--text-muted)] font-medium tracking-wide">
                <p>© <span id="currentYear">${new Date().getFullYear()}</span> BV Jewelry. Всі права захищені.</p>
            </div>
        </footer>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerAndModalsHTML);
    document.body.insertAdjacentHTML('beforeend', footerAndBottomNavHTML);
}