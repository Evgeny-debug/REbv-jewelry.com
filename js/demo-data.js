// ==========================================
// БАЗОВІ ДАНІ ТА ЛОКАЛІЗАЦІЯ (Словник)
// ==========================================
const i18n = {
    uk: { 
        m1: "Головна", m2: "Каталог", m3: "Бренд", m4: "Контакти", m_price: "Прайс", m_atelier: "Ексклюзив",
        menu_all: "Всі товари", menu_for_whom: "Для кого", menu_metal: "За металом",
        cart_title: "Кошик", cart_subtotal: "Підсумок:", cart_checkout: "Оформити замовлення", cart_empty: "Ваш кошик порожній",
        fav_title: "Улюблене", fav_empty: "Список порожній",
        in_stock: "В наявності", out_stock: "Немає", pre_order: "Під замовлення",
        badge_new: "Новинка", badge_exclusive: "Ексклюзив", badge_sale: "Sale", badge_sold_out: "Продано", badge_pre_order: "Під замовлення",
        btn_buy: "Купити", btn_details: "Детальніше", btn_send: "Надіслати",
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

// ==========================================
// ДЕМО-ДАНІ (Імітація БД)
// ==========================================
const DEMO_DATA = {
    settings: {
        phone: "+38 063 45 40 901",
        phoneClean: "+380634540901",
        email: "info@bv-jewelry.com",
        instagram: "https://instagram.com/bv_jewelry",
        telegram: "https://t.me/bv_jewelry_izmail",
        workHours: "Графік роботи: 08:00 - 18:00",
        address: "м. Ізмаїл, вул. Торгова, 68",
        addresses: ["м. Ізмаїл, вул. Торгова, 68", "м. Одеса, вул. Дерибасівська, 1"],
        goldRate: 7500,
        bannerRatio: "3/1"
    },
    banners: [
        { id: 1, img: 'https://images.pexels.com/photos/266621/pexels-photo-266621.jpeg', link: 'catalog.html' },
        { id: 2, img: 'https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg', link: 'exclusive.html' }
    ],
    categories_flat: [
        { id: "rings", name: {uk: "Каблучки", ru: "Кольца", en: "Rings"}, parentId: null },
        { id: "earrings", name: {uk: "Сережки", ru: "Серьги", en: "Earrings"}, parentId: null },
        { id: "necklaces", name: {uk: "Ланцюжки", ru: "Цепочки", en: "Necklaces"}, parentId: null },
        { id: "bracelets", name: {uk: "Браслети", ru: "Браслеты", en: "Bracelets"}, parentId: null },
        { id: "gold_rings", name: {uk: "Золоті", ru: "Золотые", en: "Gold"}, parentId: "rings" },
        { id: "silver_rings", name: {uk: "Срібні", ru: "Серебряные", en: "Silver"}, parentId: "rings" }
    ],
    home_blocks: [
        { id: 'hits', name: {uk: 'Хіти місяця', ru: 'Хиты', en: 'Hits'}, active: true },
        { id: 'weekly', name: {uk: 'Вибір тижня', ru: 'Выбор недели', en: 'Weekly Choice'}, active: true }
    ],
    products: [
        {
            id: "prod-1", sku: "R001", category: "rings", status: "in-stock", badge: "new",
            blocks: ["hits", "weekly"],
            sizes: ["16", "16.5", "17", "18"],
            variant: "Золото 585",
            variations: {
                base: {
                    name: { uk: "Каблучка 'Infinity'", ru: "Кольцо 'Infinity'", en: "Ring 'Infinity'" },
                    desc: { uk: "Витончена каблучка.", ru: "Утонченное кольцо.", en: "Elegant ring." },
                    price: 15500, discount: null, images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800"]
                }
            }
        },
        {
            id: "prod-2", sku: "E001", category: "earrings", status: "in-stock", badge: "sale",
            blocks: ["hits"], sizes: [], variant: "Срібло 925",
            variations: {
                base: {
                    name: { uk: "Сережки 'Drop'", ru: "Серьги 'Drop'", en: "Earrings 'Drop'" },
                    desc: { uk: "Стильні сережки.", ru: "Стильные серьги.", en: "Stylish earrings." },
                    price: 3200, discount: 2800, images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800"]
                }
            }
        },
        {
            id: "prod-3", sku: "N001", category: "necklaces", status: "in-stock", badge: "none",
            blocks: ["weekly"], sizes: ["40", "45", "50"], variant: "Золото 585",
            variations: {
                base: {
                    name: { uk: "Ланцюжок 'Classic'", ru: "Цепочка 'Classic'", en: "Necklace 'Classic'" },
                    desc: { uk: "Класичний ланцюжок.", ru: "Классическая цепочка.", en: "Classic necklace." },
                    price: 12000, discount: null, images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800"]
                }
            }
        },
        {
            id: "prod-4", sku: "B001", category: "bracelets", status: "pre-order", badge: "exclusive",
            blocks: ["hits", "weekly"], sizes: ["17", "18", "19"], variant: "Біле золото",
            variations: {
                base: {
                    name: { uk: "Браслет 'Elegance'", ru: "Браслет 'Elegance'", en: "Bracelet 'Elegance'" },
                    desc: { uk: "Ексклюзивний браслет.", ru: "Эксклюзивный браслет.", en: "Exclusive bracelet." },
                    price: 24000, discount: null, images: ["https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=800"]
                }
            }
        }
    ],
    pages_content: {
        home_hero: {
            title: "BV Jewelry",
            subtitle: "Atelier since 1984",
            heroBg: "https://images.pexels.com/photos/28146843/pexels-photo-28146843.jpeg",
            heroOpacity: 0.4,
            titleColor: "#ffffff",
            subColor: "#c5a059"
        }
    }
};

// Ініціалізація локальної БД при першому запуску
function initLocalDB() {
    if (!localStorage.getItem('bv_is_initialized')) {
        localStorage.setItem('bv_settings', JSON.stringify(DEMO_DATA.settings));
        localStorage.setItem('bv_products', JSON.stringify(DEMO_DATA.products));
        localStorage.setItem('bv_banners', JSON.stringify(DEMO_DATA.banners));
        localStorage.setItem('bv_categories_flat', JSON.stringify(DEMO_DATA.categories_flat));
        localStorage.setItem('bv_home_blocks', JSON.stringify(DEMO_DATA.home_blocks));
        localStorage.setItem('bv_pages_content', JSON.stringify(DEMO_DATA.pages_content));
        
        // Будуємо дерево категорій
        let tree = [];
        let lookup = {};
        DEMO_DATA.categories_flat.forEach(c => lookup[c.id] = { ...c, subcategories: [] });
        DEMO_DATA.categories_flat.forEach(c => {
            if (c.parentId && lookup[c.parentId]) lookup[c.parentId].subcategories.push(lookup[c.id]);
            else tree.push(lookup[c.id]);
        });
        localStorage.setItem('bv_categories_tree', JSON.stringify(tree));
        
        localStorage.setItem('bv_is_initialized', 'true');
        console.log("BV Jewelry: Локальну БД ініціалізовано демо-даними.");
    }
}

initLocalDB();