import { ENV } from '../api/config.js';
import { getCart, getCurrentUser } from '../core/state.js';
import { clearEntireCart } from '../components/cart.js'; // <-- Исправленный путь!
import { priceFormatter } from '../core/utils.js';

const NP_API_KEY = ''; // Встав свій API ключ Нової Пошти, якщо є
let allBranches = []; 
let cityDebounceTimer;

export async function fetchNP(model, method, properties) {
    if(!NP_API_KEY) {
        console.warn('API Ключ Нової Пошти не вказано! Працюємо без інтеграції.');
        return [];
    }
    try {
        const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: NP_API_KEY,
                modelName: model,
                calledMethod: method,
                methodProperties: properties
            })
        });
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error('Помилка NP API:', e);
        return [];
    }
}

export function initCheckout() {
    const checkoutContainer = document.getElementById('checkoutContainer');
    if (!checkoutContainer) return; // Працює тільки на сторінці checkout

    // Рендер товарів з кошика
    const cart = getCart();
    if (cart.length === 0) {
        alert('Ваш кошик порожній!');
        window.location.href = 'index.html';
        return;
    }

    const listContainer = document.getElementById('checkoutItemsList');
    let total = 0;
    
    listContainer.innerHTML = cart.map(item => {
        total += item.price * item.qty;
        const sizeBadge = item.size ? `<span class="bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded text-[10px] font-bold">Розмір: ${item.size}</span>` : '';
        return `
            <div class="flex gap-4 bg-white/5 p-3 rounded-xl border border-white/5 relative group">
                <img src="${item.img}" class="w-16 h-16 object-cover rounded-lg border border-white/10">
                <div class="flex-grow flex flex-col justify-center pr-6">
                    <span class="text-xs font-semibold uppercase tracking-wide leading-tight line-clamp-1">${item.title}</span>
                    <div class="flex items-center gap-2 mt-1 mb-1">
                        ${sizeBadge}
                        <span class="text-[10px] text-gray-400">Арт: ${item.sku}</span>
                    </div>
                    <div class="flex justify-between items-center mt-auto">
                        <span class="text-xs text-gray-400">${item.qty} шт.</span>
                        <span class="text-sm font-bold text-[#c5a059]">${priceFormatter.format(item.price * item.qty)} ₴</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('checkoutTotal').innerText = priceFormatter.format(total) + ' ₴';

    // Автозаповнення даних юзера
    const user = getCurrentUser();
    if (user) {
        const emailInput = document.getElementById('orderEmail');
        const nameInput = document.getElementById('orderName');
        const guestPromo = document.getElementById('guestPromo');
        
        if(emailInput) emailInput.value = user.username || '';
        if(nameInput) nameInput.value = user.name || '';
        if(guestPromo) guestPromo.classList.add('hidden');
    }

    attachNPListeners();
    attachSubmitListener(total, cart, user);
}

function attachNPListeners() {
    const cityInput = document.getElementById('orderCity');
    const cityDropdown = document.getElementById('cityDropdown');
    const cityRefInput = document.getElementById('orderCityRef');
    const branchInput = document.getElementById('orderBranch');
    const branchDropdown = document.getElementById('branchDropdown');

    if(!cityInput) return;

    cityInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(cityDebounceTimer);
        
        branchInput.value = '';
        branchInput.disabled = true;
        branchInput.placeholder = 'Оберіть місто спочатку';
        allBranches = [];

        if (query.length < 2) {
            cityDropdown.classList.add('hidden');
            return;
        }

        cityDebounceTimer = setTimeout(async () => {
            const cities = await fetchNP("Address", "searchSettlements", { CityName: query, Limit: "20" });
            const addresses = cities.length > 0 ? cities[0].Addresses : [];
            
            if (addresses.length > 0) {
                cityDropdown.innerHTML = addresses.map(c => `
                    <div class="np-dropdown-item" data-ref="${c.DeliveryCity}" data-name="${c.Present}">
                        ${c.Present}
                    </div>
                `).join('');
                cityDropdown.classList.remove('hidden');
            } else {
                cityDropdown.innerHTML = '<div class="p-3 text-xs text-gray-500">Місто не знайдено (або відключено API)</div>';
                cityDropdown.classList.remove('hidden');
            }
        }, 400);
    });

    cityDropdown.addEventListener('click', async (e) => {
        if (e.target.classList.contains('np-dropdown-item')) {
            const name = e.target.getAttribute('data-name');
            const ref = e.target.getAttribute('data-ref');
            
            cityInput.value = name;
            cityRefInput.value = ref;
            cityDropdown.classList.add('hidden');

            branchInput.disabled = false;
            branchInput.placeholder = 'Завантаження відділень...';
            branchInput.value = '';
            
            allBranches = await fetchNP("Address", "getWarehouses", { CityRef: ref });
            branchInput.placeholder = 'Введіть номер або адресу відділення';
        }
    });

    branchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length === 0) {
            branchDropdown.classList.add('hidden');
            return;
        }
        const filtered = allBranches.filter(b => b.Description.toLowerCase().includes(query) || b.Number === query);
        
        if (filtered.length > 0) {
            branchDropdown.innerHTML = filtered.slice(0, 30).map(b => `
                <div class="np-dropdown-item" data-name="${b.Description}">
                    ${b.Description}
                </div>
            `).join('');
            branchDropdown.classList.remove('hidden');
        } else {
            branchDropdown.innerHTML = '<div class="p-3 text-xs text-gray-500">Відділення не знайдено</div>';
            branchDropdown.classList.remove('hidden');
        }
    });
    
    branchInput.addEventListener('focus', () => {
        if (allBranches.length > 0 && branchInput.value === '') {
            branchDropdown.innerHTML = allBranches.slice(0, 30).map(b => `
                <div class="np-dropdown-item" data-name="${b.Description}">
                    ${b.Description}
                </div>
            `).join('');
            branchDropdown.classList.remove('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target !== cityInput && !cityDropdown.contains(e.target)) cityDropdown.classList.add('hidden');
        if (e.target !== branchInput && !branchDropdown.contains(e.target)) branchDropdown.classList.add('hidden');
    });
}

function attachSubmitListener(total, cart, user) {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cityInput = document.getElementById('orderCity');
        const branchInput = document.getElementById('orderBranch');

        if(!NP_API_KEY && (!cityInput.value.trim() || !branchInput.value.trim())) {
            alert('Будь ласка, введіть місто та відділення Нової Пошти.');
            return;
        }

        const btn = document.getElementById('submitBtn');
        btn.innerText = 'Обробка...';
        btn.disabled = true;

        const paymentMethod = document.getElementById('orderPayment').value;

        const orderData = {
            user_id: user ? user.id : null,
            user_email: document.getElementById('orderEmail').value.trim(),
            phone: document.getElementById('orderPhone').value.trim(),
            delivery_info: {
                name: document.getElementById('orderName').value.trim(),
                city: cityInput.value.trim(),
                branch: branchInput.value.trim()
            },
            payment_method: paymentMethod,
            comment: document.getElementById('orderComment').value.trim(),
            items: cart,
            total_price: total,
            status: 'pending'
        };

        try {
            if (ENV.USE_SUPABASE) {
                const { _supabase } = await import('../api/supabase.js');
                const { error } = await _supabase.from('orders').insert([orderData]);
                if (error) throw error;
            } else {
                console.log("Локальний режим: замовлення сформовано", orderData);
            }

            clearEntireCart(true); 

            document.getElementById('checkoutContainer').classList.add('hidden');
            const modal = document.getElementById('successModal');
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.remove('opacity-0'), 50);

        } catch (err) {
            alert('Виникла помилка: ' + err.message);
            btn.innerText = 'Підтвердити замовлення';
            btn.disabled = false;
        }
    });
}

Object.assign(window, { initCheckout });