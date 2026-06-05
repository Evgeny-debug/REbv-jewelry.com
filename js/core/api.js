// ==========================================
// API ФАСАД (ЛОКАЛЬНИЙ КЕШ ЗАМІСТЬ SUPABASE)
// ==========================================
// Закоментований Supabase (для майбутнього повернення)
// const supabaseUrl = 'https://...'; 
// const supabaseKey = 'sb_publishable_...'; 
// const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

const API = {
    get: (key, def) => {
        try {
            const d = localStorage.getItem(key);
            return d ? JSON.parse(d) : def;
        } catch (e) { return def; }
    },
    set: (key, val) => {
        localStorage.setItem(key, JSON.stringify(val));
    }
};

// Глобальні змінні
let categoriesTree = [];
let products = [];

// ==========================================
// АСИНХРОННЕ ЗАВАНТАЖЕННЯ ДАНИХ (ІМІТАЦІЯ ХМАРИ)
// ==========================================
window.loadCloudData = async function() {
    console.log("BV Jewelry: Завантаження даних з локального сховища...");
    
    products = API.get('bv_products', []);
    categoriesTree = API.get('bv_categories_tree', []);
    
    // Викликаємо функції рендеру, якщо вони вже завантажені (з ui.js/init.js)
    if (typeof window.generateMenus === 'function') window.generateMenus();
    if (typeof window.initBannerSlider === 'function') window.initBannerSlider();
    if (document.getElementById('dynamicHomeBlocksContainer') && typeof window.renderHomeSections === 'function') {
        window.renderHomeSections();
    }
    if(typeof window.applySiteSettings === 'function') window.applySiteSettings();
};

// ==========================================
// ІМІТАЦІЯ АВТОРИЗАЦІЇ
// ==========================================
window.mockAuth = {
    signIn: async function(email, pass) {
        // Проста імітація логіну
        if (pass.length < 6) return { error: { message: "Пароль занадто короткий" } };
        
        const mockUser = {
            id: "user-" + Date.now(),
            email: email,
            role: email.includes('admin') ? 'admin' : 'client',
            name: email.split('@')[0],
            favs: []
        };
        
        API.set('bv_current_user', mockUser);
        if (mockUser.role === 'admin') sessionStorage.setItem('isAdminAuth', 'true');
        
        return { data: { user: mockUser }, error: null };
    },
    signUp: async function(email, pass, name) {
        return this.signIn(email, pass); // Для демо реєстрація працює як логін
    },
    signOut: async function() {
        API.set('bv_current_user', null);
        sessionStorage.removeItem('isAdminAuth');
        return { error: null };
    }
};

// Робота зі Scope (користувацькі корзини та улюблене)
function getCurrentUser() { return API.get('bv_current_user', null); }

function getScopedStorageKey(baseKey) {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.email) return baseKey;
    return `${baseKey}_${currentUser.email.toLowerCase()}`;
}

function migrateScopedState() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.email) return;
    const userCartKey = getScopedStorageKey('bv_cart');
    const globalCart = API.get('bv_cart', null);
    if (!API.get(userCartKey, null) && Array.isArray(globalCart)) {
        API.set(userCartKey, globalCart);
    }
}