// Конфигурация окружения
export const ENV = {
    USE_SUPABASE: false, // Временно отключаем работу с сервером
    LOCAL_DELAY: 300     // Имитация задержки сети для локальных моков
};

// API Фасад для работы с локальным кэшем (LocalStorage)
export const StorageAPI = {
    get: (key, defaultValue) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Ошибка чтения ключа ${key} из localStorage:`, e);
            return defaultValue;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Ошибка записи ключа ${key} в localStorage:`, e);
        }
    }
};