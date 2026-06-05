// ==========================================
// ЛОГІКА ОФОРМЛЕННЯ ЗАМОВЛЕННЯ (CHECKOUT)
// ==========================================

const NP_API_KEY = 'ea3e6549afc2be5909102726eeafd052'; // API Ключ Нової Пошти
let allBranches = []; // Кеш відділень

async function fetchNP(model, method, properties) {
    if(!NP_API_KEY) return [];
    try {
        const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: NP_API_KEY, modelName: model, calledMethod: method, methodProperties: properties })
        });
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (e) {
        console.error('Помилка NP API:', e); return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('orderCity');
    const cityDropdown = document.getElementById('cityDropdown');
    const cityRefInput = document.getElementById('orderCityRef');
    const branchInput = document.getElementById('orderBranch');
    const branchDropdown = document.getElementById('branchDropdown');
    let cityDebounceTimer;

    if(cityInput) {
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
                    cityDropdown.innerHTML = addresses.map(c => `<div class="np-dropdown-item" data-ref="${c.DeliveryCity}" data-name="${c.Present}">${c.Present}</div>`).join('');
                    cityDropdown.classList.remove('hidden');
                } else {
                    cityDropdown.innerHTML = '<div class="p-3 text-xs text-gray-500">Місто не знайдено</div>';
                    cityDropdown.classList.remove('hidden');
                }
            }, 400); 
        });

        cityDropdown.addEventListener('click', async (e) => {
            if (e.target.classList.contains('np-dropdown-item')) {
                cityInput.value = e.target.getAttribute('data-name');
                cityRefInput.value = e.target.getAttribute('data-ref');
                cityDropdown.classList.add('hidden');

                branchInput.disabled = false;
                branchInput.placeholder = 'Завантаження відділень...';
                branchInput.value = '';
                
                allBranches = await fetchNP("Address", "getWarehouses", { CityRef: cityRefInput.value });
                branchInput.placeholder = 'Введіть номер або адресу відділення';
            }
        });

        branchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length === 0) { branchDropdown.classList.add('hidden'); return; }
            const filtered = allBranches.filter(b => b.Description.toLowerCase().includes(query) || b.Number === query);
            
            if (filtered.length > 0) {
                branchDropdown.innerHTML = filtered.slice(0, 30).map(b => `<div class="np-dropdown-item" data-name="${b.Description}">${b.Description}</div>`).join('');
                branchDropdown.classList.remove('hidden');
            } else {
                branchDropdown.innerHTML = '<div class="p-3 text-xs text-gray-500">Відділення не знайдено</div>';
                branchDropdown.classList.remove('hidden');
            }
        });
        
        branchInput.addEventListener('focus', () => {
            if (allBranches.length > 0 && branchInput.value === '') {
                branchDropdown.innerHTML = allBranches.slice(0, 30).map(b => `<div class="np-dropdown-item" data-name="${b.Description}">${b.Description}</div>`).join('');
                branchDropdown.classList.remove('hidden');
            }
        });

        branchDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('np-dropdown-item')) {
                branchInput.value = e.target.getAttribute('data-name');
                branchDropdown.classList.add('hidden');
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target !== cityInput && !cityDropdown.contains(e.target)) cityDropdown.classList.add('hidden');
            if (e.target !== branchInput && !branchDropdown.contains(e.target)) branchDropdown.classList.add('hidden');
        });
    }

    // Завантаження кошика
    setTimeout(() => {
        const cart = typeof getCart === 'function' ? getCart() : [];
        if (cart.length === 0) {
            alert('Ваш кошик порожній!');
            window.location.href = 'index.html';
            return;
        }

        const listContainer = document.getElementById('checkoutItemsList');
        let total = 0;
        
        if(listContainer) {
            listContainer.innerHTML = cart.map(item => {
                total += item.price * item.qty;
                const sizeBadge = item.size ? `<span class="bg-[var(--gold-muted)]/20 text-[var(--gold-muted)] px-2 py-0.5 rounded text-[10px] font-bold">Розмір: ${item.size}</span>` : '';
                return `
                    <div class="flex gap-4 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] relative group">
                        <img src="${item.img}" class="w-16 h-16 object-cover rounded-lg border border-[var(--border)] mix-blend-multiply dark:mix-blend-normal bg-white">
                        <div class="flex-grow flex flex-col justify-center pr-6">
                            <span class="text-xs font-semibold uppercase tracking-wide leading-tight line-clamp-1 text-[var(--text-main)]">${item.title}</span>
                            <div class="flex items-center gap-2 mt-1 mb-1">
                                ${sizeBadge}
                                <span class="text-[10px] text-[var(--text-muted)]">Арт: ${item.sku}</span>
                            </div>
                            <div class="flex justify-between items-center mt-auto">
                                <span class="text-xs text-[var(--text-muted)]">${item.qty} шт.</span>
                                <span class="text-sm font-bold text-[var(--gold-muted)]">${new Intl.NumberFormat('uk-UA').format(item.price * item.qty)} ₴</span>
                            </div>
                        </div>
                        <button class="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors opacity-0 group-hover:opacity-100" onclick="window.removeFromCart('${item.cartId}'); location.reload();">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                `;
            }).join('');
        }

        const totalEl = document.getElementById('checkoutTotal');
        if(totalEl) totalEl.innerText = new Intl.NumberFormat('uk-UA').format(total) + ' ₴';

        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (user) {
            const emailInp = document.getElementById('orderEmail');
            const nameInp = document.getElementById('orderName');
            const promo = document.getElementById('guestPromo');
            if(emailInp) emailInp.value = user.email || '';
            if(nameInp) nameInp.value = user.name || '';
            if(promo) promo.classList.add('hidden');
        }
    }, 300);

    // Обробка форми
    const form = document.getElementById('checkoutForm');
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if(!NP_API_KEY && (!cityInput.value.trim() || !branchInput.value.trim())) {
                alert('Будь ласка, введіть місто та відділення Нової Пошти.');
                return;
            }

            const btn = document.getElementById('submitBtn');
            btn.innerText = 'Обробка...';
            btn.disabled = true;

            const cart = getCart();
            const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const user = getCurrentUser();
            const paymentMethod = document.getElementById('orderPayment').value;

            // Створюємо об'єкт замовлення
            const orderData = {
                id: Date.now(), // Імітація унікального ID
                user_id: user ? user.id : null,
                user_email: document.getElementById('orderEmail').value.trim(),
                phone: document.getElementById('orderPhone').value.trim(),
                delivery_info: {
                    name: document.getElementById('orderName').value.trim(),
                    city: document.getElementById('orderCity').value.trim(),
                    branch: document.getElementById('orderBranch').value.trim()
                },
                payment_method: paymentMethod,
                comment: document.getElementById('orderComment').value.trim(),
                items: cart,
                total_price: total,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            try {
                // Зберігаємо замовлення в локальну БД (замість Supabase)
                let allOrders = API.get('bv_orders', []);
                allOrders.push(orderData);
                API.set('bv_orders', allOrders);

                if(typeof clearEntireCart === 'function') clearEntireCart(true); 

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
});