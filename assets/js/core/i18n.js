import { StorageAPI } from '../api/config.js';

export const dictionary = {
    uk: { 
        m1: "Головна", m2: "Каталог", m3: "Бренд", m4: "Контакти", m_price: "Прайс", m_atelier: "Ексклюзив",
        menu_all: "Всі товари", menu_for_whom: "Для кого", menu_metal: "За металом",
        cart_title: "Кошик", cart_subtotal: "Підсумок:", cart_checkout: "Оформити замовлення", cart_empty: "Ваш кошик порожній",
        fav_title: "Улюблене", fav_empty: "Список порожній",
        in_stock: "В наявності", out_stock: "Немає", pre_order: "Під замовлення",
        badge_new: "Новинка", badge_exclusive: "Ексклюзив", badge_sale: "Sale", badge_sold_out: "Продано", badge_pre_order: "Під замовлення",
        btn_buy: "Купити", btn_details: "Дізнатися більше", btn_send: "Надіслати",
        similar: "Також рекомендуємо", desc_title: "Опис виробу", pd_nav_specs: "Характеристики", pd_nav_review: "Відгуки", pd_nav_all: "Усе про товар", pd_nav_photo: "Фото", pd_nav_ask: "Задати питання",
        cat_filters: "Фільтри", cat_sort: "Сортування", cat_sort_new: "Спочатку нові", cat_sort_cheap: "Від дешевих до дорогих", cat_sort_exp: "Від дорогих до дешевих", cat_load_more: "Показати ще", cat_reset: "Скинути", cat_empty: "Товарів не знайдено",
        search_ph: "Пошук...", login: "Увійти", register: "Зареєструватися", login_mob_title: "КАБІНЕТ", theme_mob: "Змінити тему", lang_title: "МОВА",
        footer_rights: "Всі права захищені.", footer_dev: "Розроблено",
        exc_title: "Створення ексклюзиву", exc_step: "Етап", exc_order: "Замовити прорахунок"
    },
    ru: { 
        m1: "Главная", m2: "Каталог", m3: "Бренд", m4: "Контакты", m_price: "Прайс", m_atelier: "Эксклюзив",
        menu_all: "Все товары", menu_for_whom: "Для кого", menu_metal: "По металлу",
        cart_title: "Корзина", cart_subtotal: "Итог:", cart_checkout: "Оформить заказ", cart_empty: "Ваша корзина пуста",
        fav_title: "Избранное", fav_empty: "Список пуст",
        in_stock: "В наличии", out_stock: "Нет в наличии", pre_order: "Под заказ",
        badge_new: "Новинка", badge_exclusive: "Эксклюзив", badge_sale: "Sale", badge_sold_out: "Продано", badge_pre_order: "Под заказ",
        btn_buy: "Купить", btn_details: "Подробнее", btn_send: "Отправить",
        similar: "Также рекомендуем", desc_title: "Описание изделия", pd_nav_specs: "Характеристики", pd_nav_review: "Отзывы", pd_nav_all: "Всё о товаре", pd_nav_photo: "Фото", pd_nav_ask: "Задать вопрос",
        cat_filters: "Фильтры", cat_sort: "Сортировка", cat_sort_new: "Сначала новые", cat_sort_cheap: "От дешевых к дорогим", cat_sort_exp: "От дорогих к дешевым", cat_load_more: "Показать еще", cat_reset: "Сбросить", cat_empty: "Товары не найдены",
        search_ph: "Поиск...", login: "Войти", register: "Регистрация", login_mob_title: "КАБИНЕТ", theme_mob: "Сменить тему", lang_title: "ЯЗЫК",
        footer_rights: "Все права защищены.", footer_dev: "Разработано",
        exc_title: "Создание эксклюзива", exc_step: "Этап", exc_order: "Заказать просчет"
    },
    en: { 
        m1: "Home", m2: "Catalog", m3: "Brand", m4: "Contacts", m_price: "Price", m_atelier: "Exclusive",
        menu_all: "All products", menu_for_whom: "For whom", menu_metal: "By metal",
        cart_title: "Cart", cart_subtotal: "Subtotal:", cart_checkout: "Checkout", cart_empty: "Your cart is empty",
        fav_title: "Favorites", fav_empty: "List is empty",
        in_stock: "In stock", out_stock: "Out of stock", pre_order: "Pre-order",
        badge_new: "New", badge_exclusive: "Exclusive", badge_sale: "Sale", badge_sold_out: "Sold Out", badge_pre_order: "Pre-order",
        btn_buy: "Buy", btn_details: "Details", btn_send: "Send",
        similar: "You might also like", desc_title: "Description", pd_nav_specs: "Specifications", pd_nav_review: "Reviews", pd_nav_all: "About Product", pd_nav_photo: "Photos", pd_nav_ask: "Ask a Question",
        cat_filters: "Filters", cat_sort: "Sort by", cat_sort_new: "Newest first", cat_sort_cheap: "Price: Low to High", cat_sort_exp: "Price: High to Low", cat_load_more: "Load more", cat_reset: "Reset", cat_empty: "No products found",
        search_ph: "Search...", login: "Log in", register: "Register", login_mob_title: "PROFILE", theme_mob: "Change Theme", lang_title: "LANGUAGE",
        footer_rights: "All rights reserved.", footer_dev: "Developed by",
        exc_title: "Exclusive Creation", exc_step: "Step", exc_order: "Request Quote"
    }
};

const flags = { uk: "ua", en: "gb", ru: "ru" };

export function getLoc(obj, field) {
    if (!obj) return '';
    const lang = StorageAPI.get('bv_lang', 'uk');
    
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
        if (field) {
            if (typeof obj[field] === 'object' && obj[field] !== null) {
                return obj[field][lang] || obj[field]['uk'] || '';
            }
            if (lang === 'uk') return obj[field] || '';
            const locField = field + lang.toUpperCase(); 
            return obj[locField] || obj[field] || ''; 
        } else {
            return obj[lang] || obj['uk'] || '';
        }
    }
    return '';
}

export function changeLang(lang) {
    const displayLang = lang === 'uk' ? 'UA' : lang.toUpperCase();
    
    ['currentFlag', 'currentFlagMob'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.src = `https://flagcdn.com/${flags[lang]}.svg`; 
    });
    
    ['currentLangLabel', 'currentLangLabelMob'].forEach(id => { 
        const el = document.getElementById(id); 
        if (el) el.innerText = displayLang; 
    });
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerHTML = dictionary[lang][el.dataset.i18n] || el.innerHTML;
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = dictionary[lang][el.dataset.i18nPlaceholder] || el.placeholder;
    });
    
    StorageAPI.set('bv_lang', lang);

    // Глобальные вызовы рендеров при наличии модулей на странице
    if (typeof window.renderCart === 'function') window.renderCart();
    if (typeof window.renderFavDrawer === 'function') window.renderFavDrawer();
    if (typeof window.renderHomeSections === 'function' && document.getElementById('dynamicHomeBlocksContainer')) {
        window.renderHomeSections();
    }
    if (typeof window.renderCatalogBatch === 'function') window.renderCatalogBatch();
    if (typeof window.renderProductPage === 'function' && document.getElementById('productContainer')) {
        window.renderProductPage();
    }
    
    const mobLangList = document.getElementById('mobLangList');
    if (mobLangList && mobLangList.classList.contains('open')) {
        if (typeof window.toggleAccordion === 'function') window.toggleAccordion('mobLangList', 'mobLangArrow');
    }
}

// Привязка методов к window для инлайновых обработчиков в HTML
window.getLoc = getLoc;
window.changeLang = changeLang;