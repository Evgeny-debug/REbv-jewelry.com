import { StorageAPI, ENV } from './config.js?v=10';
import { getCurrentUser } from '../core/state.js?v=10';

// Имитация сетевой задержки
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// ИНИЦИАЛИЗАЦИЯ ЛОКАЛЬНОЙ БАЗЫ ДАННЫХ
// ==========================================
export async function loadCloudData() {
    await delay(500); 
    console.log("BV Jewelry [Mock API]: Завантаження локальних демо-даних...");
    
    try {
        if (typeof window !== 'undefined' && window.INITIAL_MOCK_DB && !StorageAPI.get('mock_db_initialized')) {
            StorageAPI.set('bv_products', window.INITIAL_MOCK_DB.products || []);
            StorageAPI.set('bv_categories_flat', window.INITIAL_MOCK_DB.categories || []);
            StorageAPI.set('bv_home_blocks', window.INITIAL_MOCK_DB.homeBlocks || []);
            StorageAPI.set('bv_settings', window.INITIAL_MOCK_DB.settings || {});
            StorageAPI.set('bv_banners', window.INITIAL_MOCK_DB.banners || []);
            StorageAPI.set('mock_db_initialized', true);
        }

        // Бронебойная проверка: получаем данные и гарантируем, что это массив
        let flatCats = StorageAPI.get('bv_categories_flat', []);
        if (!Array.isArray(flatCats)) {
            flatCats = []; // Если там случайно сохранился мусор, превращаем в пустой массив
        }

        if (flatCats.length > 0) {
            let tree = [];
            let lookup = {};
            flatCats.forEach(c => lookup[c.id] = { ...c, subcategories: [] });
            flatCats.forEach(c => {
                if (c.parentId && lookup[c.parentId]) lookup[c.parentId].subcategories.push(lookup[c.id]);
                else tree.push(lookup[c.id]);
            });
            StorageAPI.set('bv_categories_tree', tree);
        }
    } catch (err) {
        console.error("Помилка генерації БД у services.js:", err);
    }
    
    return true;
}

// ==========================================
// MOCK СЕРВИСЫ ЗАКАЗОВ (ORDERS)
// ==========================================
export async function createOrder(orderData) {
    await delay();
    const orders = StorageAPI.get('mock_orders', []);
    
    const newOrder = {
        ...orderData,
        id: Date.now(),
        created_at: new Date().toISOString()
    };
    
    orders.push(newOrder);
    StorageAPI.set('mock_orders', orders);
    console.log('✅ Замовлення успішно створено (Локально):', newOrder);
    
    return newOrder;
}

export async function fetchUserOrders(userId) {
    await delay();
    const orders = StorageAPI.get('mock_orders', []);
    return orders.filter(o => o.user_id === userId).sort((a, b) => b.id - a.id);
}

// ==========================================
// MOCK АДМИНКИ (Товары, Настройки)
// ==========================================
export async function saveProduct(product) {
    await delay();
    let products = StorageAPI.get('bv_products', []);
    const idx = products.findIndex(p => p.id === product.id);
    
    if (idx !== -1) products[idx] = product;
    else products.unshift(product);
    
    StorageAPI.set('bv_products', products);
    return true;
}

export async function saveSiteSettings(settings) {
    await delay();
    StorageAPI.set('bv_settings', settings);
    return true;
}