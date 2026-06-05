import { StorageAPI, ENV } from '../api/config.js';
import { getCurrentUser } from '../core/state.js';

export function smartProfileClick() {
    if(document.getElementById('sideMenu')?.classList.contains('active')) {
        window.toggleMenu(); 
    }
    const user = getCurrentUser();
    if (user && user.id) {
        window.location.href = 'profile.html';
    } else {
        openAuthModal();
    }
}

export function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    }
}

export function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if(modal) { 
        modal.classList.add('opacity-0'); 
        setTimeout(() => modal.classList.add('hidden'), 300); 
    }
}

export function toggleAuthMode(e) {
    if (e) e.preventDefault(); 
    window.isRegisterMode = !window.isRegisterMode; 
    updateAuthView();
}

export function updateAuthView() {
    document.getElementById('authTitle').innerText = window.isRegisterMode ? 'Реєстрація' : 'Вхід';
    document.getElementById('authSubtitle').innerText = window.isRegisterMode ? 'Приєднуйтесь до світу BV Jewelry' : 'Раді бачити вас знову';
    document.getElementById('authSubmitBtn').innerText = window.isRegisterMode ? 'Створити акаунт' : 'Увійти';
    document.getElementById('authToggleText').innerText = window.isRegisterMode ? 'Вже є акаунт?' : 'Немає акаунта?';
    document.getElementById('authToggleLink').innerText = window.isRegisterMode ? 'Увійти' : 'Зареєструватися';
    
    const nameField = document.getElementById('nameFieldContainer');
    if(nameField) {
        if(window.isRegisterMode) {
            nameField.classList.remove('hidden'); 
            nameField.classList.add('flex'); 
            document.getElementById('authName').required = true;
        } else {
            nameField.classList.add('hidden'); 
            nameField.classList.remove('flex'); 
            document.getElementById('authName').required = false;
        }
    }
}

export function updateProfileMenu() {
    const user = getCurrentUser();
    const dropdownMenu = document.getElementById('profileDropdownMenu');
    const profileBtn = document.getElementById('headerProfileBtn');
    
    if (profileBtn) {
        profileBtn.onclick = function() {
            if (user) location.href = 'profile.html';
            else openAuthModal();
        };
    }
    
    if(dropdownMenu) {
        if (user) {
            dropdownMenu.innerHTML = `
                <a href="profile.html" class="dropdown-item w-full text-left font-medium">Мій кабінет</a>
                ${user.role === 'admin' ? '<a href="admin.html" class="dropdown-item w-full text-left font-bold text-[#c5a059]">Панель Адміна</a>' : ''}
                <button onclick="logoutUser()" class="btn-cross dropdown-item w-full text-left text-red-400 hover:text-red-500 mt-2 border-t border-[var(--border)] pt-2">Вийти з акаунту</button>
            `;
        } else {
            dropdownMenu.innerHTML = `
                <button onclick="window.isRegisterMode=false; window.openAuthModal();" class="btn-cross dropdown-item w-full text-left font-medium">Увійти</button>
                <button onclick="window.isRegisterMode=true; window.openAuthModal();" class="btn-cross dropdown-item w-full text-left font-medium text-[#c5a059]">Зареєструватися</button>
            `;
        }
    }
}

export async function logoutUser() {
    if(ENV.USE_SUPABASE) {
        try {
            const { _supabase } = await import('../api/supabase.js');
            if (_supabase.auth) {
                _supabase.removeAllChannels();
                await _supabase.auth.signOut();
            }
        } catch (e) {
            console.error("Помилка Supabase при виході", e);
        }
    }
    
    StorageAPI.set('bv_current_user', null); 
    StorageAPI.set('bv_favs', []); 
    StorageAPI.set('bv_cart', []);
    sessionStorage.removeItem('isAdminAuth'); 
    
    if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('profile.html')) {
        window.location.href = 'index.html';
    } else {
        if(typeof window.renderCart === 'function') window.renderCart(); 
        if(typeof window.renderFavDrawer === 'function') window.renderFavDrawer();
        updateProfileMenu(); 
    }
}

// Заглушки для соц-авторизації, доки Supabase вимкнено
export async function loginWithGoogle() {
    if (!ENV.USE_SUPABASE) return alert('Режим локальної розробки. Supabase відключено.');
    // логіка Supabase...
}

export async function loginWithApple() {
    if (!ENV.USE_SUPABASE) return alert('Режим локальної розробки. Supabase відключено.');
    // логіка Supabase...
}

// Ін'єкція модалки перенесена сюди з main.js
export function injectAuthModal() {
    if (document.getElementById('authModal')) return; 
    // ...[Тут HTML-шаблон модалки з твого файлу, без змін]...
}

Object.assign(window, { smartProfileClick, openAuthModal, closeAuthModal, toggleAuthMode, updateAuthView, updateProfileMenu, logoutUser, loginWithGoogle, loginWithApple, injectAuthModal });