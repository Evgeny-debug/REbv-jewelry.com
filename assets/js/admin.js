import { StorageAPI } from './api/config.js';

document.addEventListener('DOMContentLoaded', () => {
    initSettingsTab();
});

// Функція управління вкладкою "Налаштування"
function initSettingsTab() {
    const form = document.getElementById('settingsForm');
    if (!form) return;

    // 1. ЗАВАНТАЖЕННЯ ДАНИХ ПРИ ВХОДІ
    // Отримуємо поточні налаштування з бази (або порожній об'єкт, якщо їх ще немає)
    const settings = StorageAPI.get('bv_settings', {});

    // Заповнюємо поля форми даними з бази
    form.phone.value = settings.phone || '';
    form.address.value = settings.address || '';
    form.schedule.value = settings.schedule || '';
    form.instLink.value = settings.instLink || '';
    form.tgLink.value = settings.tgLink || '';

    // 2. ЗБЕРЕЖЕННЯ ДАНИХ
    form.onsubmit = (e) => {
        e.preventDefault(); // Зупиняємо стандартне перезавантаження сторінки
        
        // Збираємо все, що адмін ввів у поля
        const newSettings = {
            ...StorageAPI.get('bv_settings', {}), // Зберігаємо старі дані, які ми не міняли (якщо такі є)
            phone: form.phone.value.trim(),
            address: form.address.value.trim(),
            schedule: form.schedule.value.trim(),
            instLink: form.instLink.value.trim(),
            tgLink: form.tgLink.value.trim()
        };

        // Записуємо нові дані в базу браузера
        StorageAPI.set('bv_settings', newSettings);
        
        // Показуємо красиве повідомлення про успіх
        showToast();
    };
}

// Функція для красивого повідомлення "Збережено!"
function showToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Висуваємо повідомлення
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    // Ховаємо через 3 секунди
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}


