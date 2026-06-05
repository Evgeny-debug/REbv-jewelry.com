import { StorageAPI, ENV } from '../api/config.js';

export function getCurrentUser() {
    return StorageAPI.get('bv_current_user', null);
}

export function getScopedStorageKey(baseKey) {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.username) return baseKey;
    return `${baseKey}_${currentUser.username.toLowerCase()}`;
}

export function migrateScopedState() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.username) return;
    const userCartKey = getScopedStorageKey('bv_cart');
    const globalCart = StorageAPI.get('bv_cart', null);
    if (!StorageAPI.get(userCartKey, null) && Array.isArray(globalCart)) {
        StorageAPI.set(userCartKey, globalCart);
    }
}

export function getFavs() {
    const currentUser = getCurrentUser();
    if (currentUser && Array.isArray(currentUser.favs)) {
        StorageAPI.set(getScopedStorageKey('bv_favs'), currentUser.favs);
        return currentUser.favs;
    }
    return StorageAPI.get(getScopedStorageKey('bv_favs'), []);
}

export async function setFavs(favs) {
    StorageAPI.set(getScopedStorageKey('bv_favs'), favs);
    StorageAPI.set('bv_favs', favs);
    
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id) {
        currentUser.favs = favs;
        StorageAPI.set('bv_current_user', currentUser);
        
        if (ENV.USE_SUPABASE) {
            try {
                // Динамический импорт клиента Supabase, если он включен
                const { _supabase } = await import('../api/supabase.js');
                await _supabase.from('profiles').update({ favs: favs }).eq('id', currentUser.id);
            } catch (err) {
                console.error("Ошибка обновления Избранного в Supabase:", err);
            }
        }
    }
}

export function getCart() {
    return StorageAPI.get(getScopedStorageKey('bv_cart'), []);
}

export function setCart(cart) {
    StorageAPI.set(getScopedStorageKey('bv_cart'), cart);
    StorageAPI.set('bv_cart', cart);
}

// Привязка к window для глобального контекста темплейтов
window.getFavs = getFavs;
window.getCart = getCart;