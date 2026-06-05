// ==========================================
// ЛОГІКА ПАНЕЛІ АДМІНІСТРАТОРА
// ==========================================

let categories = [];
let products = [];
let homeBlocks = [];
let siteSettings = {};
let pagesContentDB = {};
let priceListDB = [];
let exclusiveProcess = [];
let exclusiveMaterials = [];
let ordersList = [];
let currentAddresses = [];
let banners = [];

// Стан редактора товару
let actProd = null; 
let editLang = 'uk';
let editVar = 'base';

// Пагінація товарів
let currentPage = 1;
const itemsPerPage = 15;
let filteredProducts = [];

function showNotification(msg) {
    const toast = document.getElementById('toastMessage');
    toast.innerText = msg; 
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// 1. ПЕРЕВІРКА ДОСТУПУ ТА ЗАВАНТАЖЕННЯ ДАНИХ
function checkAdminAccess() {
    const user = API.get('bv_current_user', null);
    if (user && user.role === 'admin') { 
        document.body.style.opacity = '1'; 
        loadAllData(); 
    } else { 
        alert('У вас немає доступу до панелі адміністратора!');
        window.location.href = 'index.html'; 
    }
}

function loadAllData() {
    // Тягнемо з нашого локального "API" замість Supabase
    ordersList = API.get('bv_orders', []);
    renderOrders(ordersList);

    products = API.get('bv_products', []).map(migrateProductToNewFormat);
    filteredProducts = [...products];
    
    categories = API.get('bv_categories_flat', []);
    siteSettings = API.get('bv_settings', {});
    homeBlocks = API.get('bv_home_blocks', []);
    pagesContentDB = API.get('bv_pages_content', {});
    priceListDB = API.get('bv_price_list', []);
    exclusiveProcess = API.get('bv_exclusive_process', []);
    exclusiveMaterials = API.get('bv_exclusive_materials', []);
    banners = API.get('bv_banners', []);

    if(categories.length === 0) {
        const oldTree = API.get('bv_categories_tree', []);
        categories = flattenOldTree(oldTree);
        API.set('bv_categories_flat', categories);
    }

    if(homeBlocks.length === 0) {
        homeBlocks = [
            { id: 'hits', name: {uk: 'Хіти місяця', ru: 'Хиты', en: 'Hits'}, active: true },
            { id: 'weekly', name: {uk: 'Вибір тижня', ru: 'Выбор недели', en: 'Weekly Choice'}, active: true }
        ];
    }

    renderProducts();
    renderCategoriesAdmin();
    renderBlocksAdmin();
    renderBannersAdmin();
    renderExclusiveProcessAdmin();
    renderExclusiveMaterialsAdmin();
    populateSettings();
    
    const priceEditor = document.getElementById('price-json-editor');
    if(priceEditor) priceEditor.value = JSON.stringify(priceListDB, null, 4);
}

// 2. НАВІГАЦІЯ
window.toggleAdminMenu = function() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
};

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => { 
        btn.classList.remove('bg-white/5', 'text-[#c5a059]'); 
        btn.classList.add('text-gray-400'); 
    });
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    const activeBtn = document.getElementById('tab-' + tabName);
    if(activeBtn) {
        activeBtn.classList.add('bg-white/5', 'text-[#c5a059]');
        activeBtn.classList.remove('text-gray-400');
    }
    
    document.getElementById('content-' + tabName).classList.remove('hidden');
    if(tabName === 'builder') loadPageBuilderForm();
    if(window.innerWidth < 1024) toggleAdminMenu();
};

window.logout = function() { 
    API.set('bv_current_user', null);
    sessionStorage.removeItem('isAdminAuth');
    window.location.href = 'index.html'; 
};

// 3. ЗАМОВЛЕННЯ
function renderOrders(ords) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    if(ords.length === 0) return tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Замовлень немає.</td></tr>';
    
    ords.forEach(o => {
        const date = new Date(o.created_at).toLocaleString('uk-UA');
        const itemsHtml = o.items.map(i => `
            <div class="mb-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <div class="text-[11px] text-white font-medium">${i.title} <span class="text-[#c5a059] ml-1">x${i.qty}</span></div>
                <div class="text-[10px] text-gray-400 mt-0.5">Арт: ${i.sku||'-'} ${i.size ? `<span class="bg-white/10 px-1 rounded text-[#c5a059] ml-1">Розмір: ${i.size}</span>` : ''}</div>
            </div>
        `).join('');
        
        const comment = o.comment ? `<div class="mt-2 text-[10px] text-yellow-500 bg-yellow-500/10 p-2 rounded">Коментар: ${o.comment}</div>` : '';
        
        tbody.innerHTML += `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="p-3 align-top" data-label="ID / Дата">
                    <div class="font-bold text-[#c5a059] text-sm">#${o.id.toString().slice(-6)}</div>
                    <div class="text-[10px] text-gray-500 mt-1">${date}</div>
                </td>
                <td class="p-3 text-xs text-white align-top" data-label="Клієнт">
                    <div><span class="text-gray-500">Email:</span> ${o.user_email || 'Гість'}</div>
                    <div class="text-[#c5a059] font-bold my-1"><span class="text-gray-500 font-normal">Тел:</span> ${o.phone || ''}</div>
                    <div class="text-gray-400"><span class="text-gray-500">Доставка:</span> ${o.delivery_info?.city||''} ${o.delivery_info?.branch||''}</div>
                    ${comment}
                </td>
                <td class="p-3 align-top" data-label="Товари">
                    <div class="bg-black/20 p-2.5 rounded-lg border border-white/5 w-full">${itemsHtml}</div>
                </td>
                <td class="p-3 font-semibold text-white align-top whitespace-nowrap" data-label="Сума">
                    <span class="text-base">${o.total_price} ₴</span><br>
                    <span class="text-[9px] font-bold tracking-widest text-gray-500 uppercase mt-1 inline-block">${o.payment_method === 'card' ? 'Картка' : 'Накладений'}</span>
                </td>
                <td class="p-3 align-top" data-label="Статус">
                    <select class="input-field py-2 px-2 text-xs w-full max-w-[150px]" onchange="updateOrderStatus('${o.id}', this.value)">
                        <option value="pending" ${o.status==='pending'?'selected':''}>🔴 Нове</option>
                        <option value="accepted" ${o.status==='accepted'?'selected':''}>🟡 В роботі</option>
                        <option value="shipped" ${o.status==='shipped'?'selected':''}>🔵 Відправлено</option>
                        <option value="completed" ${o.status==='completed'?'selected':''}>🟢 Успіх</option>
                        <option value="cancelled" ${o.status==='cancelled'?'selected':''}>⚫ Скасовано</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

window.updateOrderStatus = function(id, newStatus) {
    const idx = ordersList.findIndex(o => String(o.id) === String(id));
    if(idx > -1) {
        ordersList[idx].status = newStatus;
        API.set('bv_orders', ordersList);
        showNotification('Статус змінено!');
    }
};

// 4. ТОВАРИ
function migrateProductToNewFormat(p) {
    if(p.variations) return p; 
    let base = {
        name: { uk: p.name || '', ru: p.name || '', en: p.nameEN || p.name || '' },
        desc: { uk: p.desc || '', ru: p.desc || '', en: p.desc || '' },
        priceType: p.priceType || 'manual', price: p.price || 0, weight: p.weight || 0, workCost: p.workCost || 0, discount: p.discount || null,
        images: p.images && p.images.length > 0 ? p.images : (p.img || p.image ? [p.img || p.image] : [])
    };
    let blocks = []; if(p.isSpecial) blocks.push('hits'); if(p.isWeekly) blocks.push('weekly');
    return {
        id: p.id, sku: p.sku || p.id, category: p.category || '', status: p.status || 'in-stock', badge: p.badge || 'none',
        blocks: blocks, sizes: Array.isArray(p.sizes) ? p.sizes : (typeof p.sizes === 'string' && p.sizes.trim() ? p.sizes.split(',').map(s=>s.trim()) : []),
        stones: p.stones || '', variant: p.variant || '', variations: { base: base }
    };
}

window.searchProducts = function() {
    const term = document.getElementById('prodSearch').value.toLowerCase();
    filteredProducts = products.filter(p => {
        const n = p.variations.base.name.uk.toLowerCase();
        const s = (p.sku || '').toLowerCase();
        return n.includes(term) || s.includes(term);
    });
    currentPage = 1; renderProducts();
};

window.changePage = function(dir) { currentPage += dir; renderProducts(); };

function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    if(currentPage < 1) currentPage = 1;
    if(currentPage > totalPages) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentBatch = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    const pageInfoEl = document.getElementById('pageInfo');
    if(pageInfoEl) pageInfoEl.innerText = `Показано ${startIndex + (total>0?1:0)}-${startIndex + currentBatch.length} з ${total}`;
    
    if(total === 0) { tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Порожньо.</td></tr>'; return; }
    
    currentBatch.forEach(p => {
        const mainImg = p.variations.base.images[0] || '';
        const catName = categories.find(c => c.id === p.category)?.name?.uk || p.category;
        
        tbody.innerHTML += `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="p-3" data-label="Фото"><img src="${mainImg}" class="w-12 h-12 object-cover rounded border border-white/10"></td>
                <td class="p-3 font-medium text-xs w-full" data-label="Назва / Артикул">
                    <span class="text-[10px] text-[#c5a059] block mb-1">Арт: ${p.sku}</span> ${p.variations.base.name.uk}
                    <div class="text-[9px] text-gray-500 mt-1">Розміри: ${p.sizes && p.sizes.length > 0 ? p.sizes.join(', ') : 'Немає'}</div>
                </td>
                <td class="p-3 text-gray-400 text-xs" data-label="Категорія">${catName}</td>
                <td class="p-3 text-[#c5a059] text-xs font-semibold" data-label="Ціна">${p.variations.base.price} ₴</td>
                <td class="p-3" data-label="Дії">
                    <div class="flex justify-end gap-4">
                        <button onclick="openProductModal('${p.id}')" class="text-blue-400 font-bold hover:underline uppercase tracking-wider text-[10px]">Ред</button>
                        <button onclick="deleteProduct('${p.id}')" class="text-red-500 font-bold hover:underline uppercase tracking-wider text-[10px]">Видал</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// 5. РЕДАКТОР ТОВАРУ
window.openProductModal = function(id = null) {
    editLang = 'uk'; editVar = 'base';
    if(id) {
        actProd = JSON.parse(JSON.stringify(products.find(p => p.id === id)));
        if(!actProd.variations) actProd.variations = { base: { name:{uk:''}, desc:{uk:''}, images:[] } };
        if(!actProd.blocks) actProd.blocks = [];
        if(!actProd.sizes) actProd.sizes = [];
    } else {
        actProd = { id: '', sku: '', category: '', status: 'in-stock', badge: 'none', blocks: [], sizes: [], stones: '', variant: '', variations: { base: { name: {uk:'', ru:'', en:''}, desc: {uk:'', ru:'', en:''}, priceType: 'manual', price: '', weight: '', workCost: '', discount: '', images: [] } } };
    }

    document.getElementById('prodModalTitle').innerText = id ? 'Редагувати товар' : 'Новий товар';
    document.getElementById('prod-id').value = actProd.id;
    document.getElementById('prod-sku').value = actProd.sku;
    document.getElementById('prod-category').innerHTML = buildCategorySelectOptions(actProd.category);
    document.getElementById('prod-status').value = actProd.status;
    document.getElementById('prod-badge').value = actProd.badge;
    document.getElementById('prod-variant').value = actProd.variant || '';
    document.getElementById('prod-stones').value = actProd.stones || '';

    const bCont = document.getElementById('prod-blocks-container');
    bCont.innerHTML = homeBlocks.map(b => `
        <label class="flex items-center gap-2 text-[11px] text-white cursor-pointer bg-black/20 p-2.5 rounded border border-white/5 hover:border-[#c5a059]/50 transition-colors">
            <input type="checkbox" value="${b.id}" class="prod-block-cb accent-[#c5a059] w-4 h-4" ${actProd.blocks.includes(b.id) ? 'checked' : ''}> ${b.name.uk}
        </label>
    `).join('');

    renderProductEditor();
    document.getElementById('productModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('productModal').classList.remove('opacity-0'), 10);
};

window.closeProductModal = function() { 
    document.getElementById('productModal').classList.add('opacity-0'); 
    setTimeout(() => document.getElementById('productModal').classList.add('hidden'), 300); 
};

window.switchLangTab = function(l) { editLang = l; renderProductEditor(); };
window.switchVarTab = function(v) { editVar = v; renderProductEditor(); };

window.addVariationSize = function() {
    const s = prompt('Введіть розмір (напр. 16.5 або 45):');
    if(s && s.trim()) {
        const val = s.trim();
        if(!actProd.sizes.includes(val)) {
            actProd.sizes.push(val);
            actProd.variations[val] = { name:{uk:'', ru:'', en:''}, desc:{uk:'', ru:'', en:''}, images:[], price:'', weight:'', workCost:'' };
            editVar = val; renderProductEditor();
        }
    }
};

window.removeVariationSize = function(size) {
    if(confirm(`Видалити розмір ${size}?`)) {
        actProd.sizes = actProd.sizes.filter(s => s !== size);
        delete actProd.variations[size];
        if(editVar === size) editVar = 'base';
        renderProductEditor();
    }
};

function renderProductEditor() {
    document.querySelectorAll('.tab-lang').forEach(b => {
        b.classList.toggle('active', b.innerText.toLowerCase() === editLang);
        b.classList.toggle('bg-[#c5a059]', b.innerText.toLowerCase() === editLang);
    });

    let vTabs = `<button type="button" class="tab-var px-3 py-2 text-xs font-bold whitespace-nowrap ${editVar==='base'?'active':''}" onclick="switchVarTab('base')">Основна</button>`;
    if (actProd.sizes && actProd.sizes.length > 0) {
        actProd.sizes.forEach(s => {
            vTabs += `<div class="flex items-center tab-var px-2 py-1 text-xs font-bold whitespace-nowrap ${editVar===s?'active':''}"><button type="button" onclick="switchVarTab('${s}')" class="px-2">Розмір: ${s}</button><button type="button" onclick="removeVariationSize('${s}')" class="text-red-500 hover:text-white px-1">&times;</button></div>`;
        });
    }
    vTabs += `<button type="button" onclick="addVariationSize()" class="px-3 py-1 text-xs font-bold text-green-400 hover:bg-white/5 rounded ml-2">+ Додати розмір</button>`;
    document.getElementById('varTabsContainer').innerHTML = vTabs;

    if (!actProd.variations[editVar]) actProd.variations[editVar] = { name:{uk:'', ru:'', en:''}, desc:{uk:'', ru:'', en:''}, images:[], price:'', weight:'', workCost:'', priceType: 'manual' };
    const vData = actProd.variations[editVar];
    const isBase = editVar === 'base';
    
    if(!vData.name) vData.name = {uk:'', ru:'', en:''};
    if(!vData.desc) vData.desc = {uk:'', ru:'', en:''};
    if(!vData.priceType) vData.priceType = isBase ? 'manual' : (actProd.variations.base.priceType || 'manual');
    
    const baseData = actProd.variations.base;
    const phName = isBase ? 'Назва товару' : (baseData.name[editLang] || 'Від Основної');
    const phDesc = isBase ? 'Опис товару...' : (baseData.desc[editLang] || 'Від Основної');
    const phPrice = isBase ? '0' : (baseData.price || 'Від Основної');
    
    const cont = document.getElementById('variationFieldsContainer');
    
    cont.innerHTML = `
        <div class="grid grid-cols-1 gap-4">
            <div><label class="text-[10px] uppercase font-bold tracking-widest text-[#c5a059] block mb-1">Назва [${editLang.toUpperCase()}] ${!isBase?'<span class="text-gray-400 font-normal normal-case">(Пусто = як в Основній)</span>':''}</label><input type="text" id="var-name" class="input-field" value="${vData.name[editLang] || ''}" placeholder="${phName}" oninput="actProd.variations['${editVar}'].name['${editLang}'] = this.value"></div>
            <div><label class="text-[10px] uppercase font-bold tracking-widest text-[#c5a059] block mb-1">Опис [${editLang.toUpperCase()}]</label><textarea id="var-desc" class="input-field h-24 resize-none" placeholder="${phDesc}" oninput="actProd.variations['${editVar}'].desc['${editLang}'] = this.value">${vData.desc[editLang] || ''}</textarea></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 border-t border-white/10 pt-4 items-end">
            <div class="md:col-span-1"><label class="text-[10px] uppercase text-gray-400 block mb-1">Тип розрахунку</label><select id="var-price-type" class="input-field bg-[#1a1a1a] font-semibold text-[#c5a059]" onchange="toggleVarPriceMode(this.value)"><option value="manual" ${vData.priceType === 'manual' ? 'selected' : ''}>Вручну</option><option value="auto" ${vData.priceType === 'auto' ? 'selected' : ''}>Авто (по вазі)</option></select></div>
            <div id="var-price-manual-box" class="${vData.priceType === 'auto' ? 'hidden' : ''}"><label class="text-[10px] uppercase text-gray-400 block mb-1">Ціна (ГРН)</label><input type="number" id="var-price" class="input-field" value="${vData.price || ''}" placeholder="${phPrice}" oninput="actProd.variations['${editVar}'].price = this.value"></div>
            <div id="var-price-auto-box" class="${vData.priceType === 'auto' ? 'flex' : 'hidden'} gap-4 md:col-span-2">
                <div class="w-1/2"><label class="text-[10px] uppercase text-gray-400 block mb-1">Вага (г)</label><input type="number" step="0.01" id="var-weight" class="input-field border-[#c5a059]" value="${vData.weight || ''}" placeholder="${isBase?'':(baseData.weight||'Від Основної')}" oninput="actProd.variations['${editVar}'].weight = this.value"></div>
                <div class="w-1/2"><label class="text-[10px] uppercase text-gray-400 block mb-1">Робота (ГРН)</label><input type="number" id="var-workCost" class="input-field border-[#c5a059]" value="${vData.workCost || ''}" placeholder="${isBase?'0':(baseData.workCost||'Від Основної')}" oninput="actProd.variations['${editVar}'].workCost = this.value"></div>
            </div>
            <div class="md:col-span-1"><label class="text-[10px] uppercase text-gray-400 block mb-1">Акційна ціна</label><input type="number" id="var-discount" class="input-field" value="${vData.discount || ''}" placeholder="${isBase?'Немає':(baseData.discount||'Від Основної')}" oninput="actProd.variations['${editVar}'].discount = this.value"></div>
        </div>
        <div class="mt-4 border-t border-white/10 pt-4">
            <label class="text-[10px] font-bold uppercase tracking-widest text-[#c5a059] block mb-2">Фото ${isBase?'основного товару':`для розміру ${editVar}`} <span class="text-gray-400 normal-case ml-1">${!isBase?'(Пусто = фото Основної)':''}</span></label>
            <input type="file" accept="image/png, image/jpeg, image/webp" multiple class="input-field file-input bg-[#1a1a1a]" id="varImgUpload">
            <div id="varGalleryPreview" class="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar"></div>
        </div>
    `;

    window.toggleVarPriceMode = function(mode) {
        actProd.variations[editVar].priceType = mode;
        if(mode === 'auto') {
            document.getElementById('var-price-manual-box').classList.add('hidden');
            document.getElementById('var-price-auto-box').classList.remove('hidden'); document.getElementById('var-price-auto-box').classList.add('flex');
        } else {
            document.getElementById('var-price-auto-box').classList.add('hidden'); document.getElementById('var-price-auto-box').classList.remove('flex');
            document.getElementById('var-price-manual-box').classList.remove('hidden');
        }
    };

    document.getElementById('varImgUpload').addEventListener('change', (e) => {
        const files = e.target.files;
        if(!files || files.length === 0) return;
        if(!actProd.variations[editVar].images) actProd.variations[editVar].images = [];
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => { actProd.variations[editVar].images.push(ev.target.result); renderVarGallery(); };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    });
    renderVarGallery();
}

function renderVarGallery() {
    const cont = document.getElementById('varGalleryPreview');
    const imgs = actProd.variations[editVar].images || [];
    if(imgs.length === 0) { cont.innerHTML = '<div class="text-[10px] text-gray-500 italic">Фотографій не завантажено.</div>'; return; }
    cont.innerHTML = imgs.map((img, idx) => `
        <div class="relative w-24 h-24 flex-shrink-0 group rounded-lg overflow-hidden border border-white/20">
            ${idx === 0 ? '<div class="absolute top-0 left-0 bg-[#c5a059] text-black text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">ГОЛОВНЕ</div>' : ''}
            <img src="${img}" class="w-full h-full object-cover">
            <button type="button" onclick="actProd.variations['${editVar}'].images.splice(${idx},1); renderVarGallery();" class="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex justify-center items-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
        </div>
    `).join('');
}

window.saveActiveProduct = async function() {
    const submitBtn = document.querySelector('.btn-primary[onclick="saveActiveProduct()"]');
    if(submitBtn) { submitBtn.innerText = 'Зберігаю...'; submitBtn.disabled = true; }

    try {
        if (document.getElementById('var-weight')) {
            actProd.variations[editVar].weight = document.getElementById('var-weight').value;
            actProd.variations[editVar].workCost = document.getElementById('var-workCost').value;
            actProd.variations[editVar].price = document.getElementById('var-price').value;
            actProd.variations[editVar].discount = document.getElementById('var-discount').value;
            const pType = document.getElementById('var-price-type');
            if(pType) actProd.variations[editVar].priceType = pType.value;
            actProd.variations[editVar].name[editLang] = document.getElementById('var-name').value;
            actProd.variations[editVar].desc[editLang] = document.getElementById('var-desc').value;
        }

        actProd.sku = document.getElementById('prod-sku').value.trim();
        actProd.category = document.getElementById('prod-category').value;
        actProd.status = document.getElementById('prod-status').value;
        actProd.badge = document.getElementById('prod-badge').value;
        actProd.variant = document.getElementById('prod-variant').value;
        actProd.stones = document.getElementById('prod-stones').value;
        actProd.blocks = Array.from(document.querySelectorAll('.prod-block-cb:checked')).map(cb => cb.value);

        if(!actProd.sku) throw new Error('Артикул (SKU) обов\'язковий!');
        if(!actProd.variations.base.name.uk) throw new Error('Базова назва товару (UA) обов\'язкова!');

        const base = actProd.variations.base;
        let currWeight = Number(base.weight) || 0;
        let currWorkCost = Number(base.workCost) || 0;
        let currDiscount = (base.discount && String(base.discount).trim() !== '') ? Number(base.discount) : null;
        let currPriceType = base.priceType || 'manual';
        
        if (currPriceType === 'auto') base.price = Math.round((currWeight * Number(siteSettings.goldRate || 0)) + currWorkCost);
        else base.price = Number(base.price) || 0;

        if (actProd.sizes && actProd.sizes.length > 0) {
            const sortedSizes = [...actProd.sizes].sort((a, b) => parseFloat(a) - parseFloat(b));
            sortedSizes.forEach(size => {
                if (!actProd.variations[size]) actProd.variations[size] = { name:{uk:'',ru:'',en:''}, desc:{uk:'',ru:'',en:''}, images:[], price:'', weight:'', workCost:'', priceType: currPriceType };
                const v = actProd.variations[size];

                if (!v.priceType || v.priceType.trim() === '') v.priceType = currPriceType;
                currPriceType = v.priceType;
                if (v.weight && String(v.weight).trim() !== '') currWeight = Number(v.weight); v.weight = currWeight;
                if (v.workCost && String(v.workCost).trim() !== '') currWorkCost = Number(v.workCost); v.workCost = currWorkCost;
                
                if (v.discount && String(v.discount).trim() !== '') currDiscount = Number(v.discount);
                else if (String(v.discount).trim() === '0') currDiscount = null; 
                v.discount = currDiscount;

                if (currPriceType === 'auto') v.price = Math.round((currWeight * Number(siteSettings.goldRate || 0)) + currWorkCost);
                else { if(!v.price || String(v.price).trim() === '') v.price = base.price; }
            });
        }

        const safeSkuId = actProd.sku.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || Date.now();
        actProd.id = actProd.id || `prod_${safeSkuId}_${Date.now()}`;

        const i = products.findIndex(p => p.id === actProd.id);
        if (i !== -1) products[i] = actProd; else products.unshift(actProd);
        
        API.set('bv_products', products);
        filteredProducts = [...products];
        renderProducts();
        closeProductModal();
        showNotification('Товар збережено!');

    } catch (err) { alert("Увага: " + err.message); }
    if(submitBtn) { submitBtn.innerText = 'Зберегти товар'; submitBtn.disabled = false; }
};

window.deleteProduct = function(id) {
    if(confirm('Точно видалити цей товар?')) {
        products = products.filter(p => p.id !== id);
        API.set('bv_products', products);
        filteredProducts = [...products];
        renderProducts();
        showNotification('Товар видалено');
    }
};

// Інші утиліти (Категорії, Блоки, Банери, Ексклюзив, Налаштування)
function flattenOldTree(tree, parentId = null) {
    let res = [];
    tree.forEach(n => {
        let nameObj = typeof n.name === 'object' ? n.name : {uk: n.name, ru: n.name, en: n.name};
        res.push({ id: n.id, name: nameObj, parentId: parentId });
        if(n.subcategories) res = res.concat(flattenOldTree(n.subcategories, n.id));
    });
    return res;
}

function buildCategorySelectOptions(selectedId = null, currentIdToIgnore = null) {
    let html = '<option value="">-- Коренева (Головна категорія) --</option>';
    categories.forEach(c => {
        if(c.id !== currentIdToIgnore) html += `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name.uk} (${c.id})</option>`;
    });
    return html;
}

function populateCategorySelects() {
    const catSelect = document.getElementById('prod-category');
    if(catSelect) catSelect.innerHTML = buildCategorySelectOptions();
}

function renderCategoriesAdmin() {
    const container = document.getElementById('categoriesListContainer');
    const renderNode = (parentId, depth) => {
        const children = categories.filter(c => c.parentId === parentId);
        if(children.length === 0) return '';
        return children.map(c => `
            <div class="py-2 ${depth === 0 ? 'bg-white/5 p-4 rounded-xl border border-white/10 mb-3' : 'ml-4 sm:ml-6 pl-3 sm:pl-4 border-l border-white/10 mt-2'}">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div class="font-medium text-sm text-white"><span class="text-[10px] text-[#c5a059] mr-2">${c.id}</span> ${c.name.uk}</div>
                    <div class="flex gap-3 w-full sm:w-auto">
                        <button onclick="window.openCategoryModal('${c.id}')" class="flex-1 sm:flex-none btn-secondary text-xs py-1.5 px-3">Ред</button>
                        <button onclick="window.deleteCategory('${c.id}')" class="flex-1 sm:flex-none btn-danger text-xs py-1.5 px-3">Видал</button>
                    </div>
                </div>
                ${renderNode(c.id, depth + 1)}
            </div>
        `).join('');
    };
    container.innerHTML = renderNode(null, 0) || '<div class="text-gray-500 text-sm">Категорій немає</div>';
    populateCategorySelects();
}

window.openCategoryModal = function(id = null) {
    document.getElementById('categoryForm').reset();
    document.getElementById('cat-old-id').value = '';
    document.getElementById('catModalTitle').innerText = 'Додати категорію';
    let currentParent = null;
    if (id) {
        const c = categories.find(cat => cat.id === id);
        document.getElementById('cat-old-id').value = c.id; document.getElementById('cat-id').value = c.id;
        document.getElementById('cat-name-uk').value = c.name.uk || ''; document.getElementById('cat-name-ru').value = c.name.ru || ''; document.getElementById('cat-name-en').value = c.name.en || '';
        currentParent = c.parentId; document.getElementById('catModalTitle').innerText = 'Редагувати';
    }
    document.getElementById('cat-parent').innerHTML = buildCategorySelectOptions(currentParent, id);
    document.getElementById('categoryModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('categoryModal').classList.remove('opacity-0'), 10);
};

window.closeCategoryModal = function() { 
    document.getElementById('categoryModal').classList.add('opacity-0'); 
    setTimeout(() => document.getElementById('categoryModal').classList.add('hidden'), 300); 
};

window.deleteCategory = function(id) {
    if(categories.find(c => c.parentId === id)) return alert('Неможливо видалити: у цієї категорії є підкатегорії.');
    if(confirm('Видалити категорію?')) {
        categories = categories.filter(c => c.id !== id);
        API.set('bv_categories_flat', categories);
        renderCategoriesAdmin(); showNotification('Видалено');
    }
};

window.handleImageUpload = function(event, previewId, targetInputId, mb = 5) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > mb * 1024 * 1024) alert(`Розмір більше ${mb}MB.`);
    const reader = new FileReader();
    reader.onload = e => {
        const preview = document.getElementById(previewId);
        if(preview) { preview.src = e.target.result; preview.classList.remove('hidden'); }
        const targetEl = document.getElementById(targetInputId);
        if(targetEl) targetEl.value = e.target.result;
    };
    reader.readAsDataURL(file);
};

// Блоки
function renderBlocksAdmin() {
    const list = document.getElementById('blocksListContainer');
    list.innerHTML = homeBlocks.map(b => `
        <div class="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div><div class="font-bold text-[#c5a059]">${b.name.uk} <span class="text-[10px] text-gray-500 ml-2">(${b.id})</span></div><div class="text-[10px] ${b.active ? 'text-green-500' : 'text-red-500'} uppercase font-bold mt-1">${b.active ? 'Активний' : 'Вимкнено'}</div></div>
            <div class="flex gap-3 w-full sm:w-auto"><button onclick="window.openBlockModal('${b.id}')" class="flex-1 sm:flex-none btn-secondary text-xs py-1.5 px-4">Ред</button><button onclick="window.deleteBlock('${b.id}')" class="flex-1 sm:flex-none btn-danger text-xs py-1.5 px-4">Видал</button></div>
        </div>
    `).join('');
}
window.openBlockModal = function(id = null) {
    document.getElementById('blockForm').reset(); document.getElementById('block-old-id').value = '';
    if(id) {
        const b = homeBlocks.find(x => x.id === id);
        document.getElementById('block-old-id').value = b.id; document.getElementById('block-id').value = b.id;
        document.getElementById('block-name-uk').value = b.name.uk || ''; document.getElementById('block-name-ru').value = b.name.ru || ''; document.getElementById('block-name-en').value = b.name.en || '';
        document.getElementById('block-active').checked = b.active;
    } else { document.getElementById('block-active').checked = true; }
    document.getElementById('blockModal').classList.remove('hidden'); setTimeout(() => document.getElementById('blockModal').classList.remove('opacity-0'), 10);
};
window.closeBlockModal = function() { document.getElementById('blockModal').classList.add('opacity-0'); setTimeout(() => document.getElementById('blockModal').classList.add('hidden'), 300); };
window.deleteBlock = function(id) { if(confirm('Видалити цей блок назавжди?')) { homeBlocks = homeBlocks.filter(b => b.id !== id); API.set('bv_home_blocks', homeBlocks); renderBlocksAdmin(); showNotification('Блок видалено'); } };

// Банери
function renderBannersAdmin() {
    const list = document.getElementById('bannersListContainer'); list.innerHTML = '';
    let ratio = siteSettings.bannerRatio || '3/1';
    banners.forEach((b, index) => {
        list.innerHTML += `<div class="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col gap-3 relative group"><div class="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold z-10 text-[#c5a059]">№ ${index + 1}</div><img src="${b.img}" class="w-full object-cover rounded border border-white/20" style="aspect-ratio: ${ratio};"><div class="text-xs text-gray-400 mt-2 truncate">Лінк: ${b.link || 'Немає'}</div><div class="flex gap-2 mt-2"><button onclick="window.openBannerModal(${b.id})" class="flex-1 btn-secondary text-xs py-2">Ред</button><button onclick="window.deleteBanner(${b.id})" class="flex-1 btn-danger text-xs py-2">Видалити</button></div></div>`;
    });
}
window.openBannerModal = function(id = null) {
    document.getElementById('bannerForm').reset(); document.getElementById('bannerPreview').classList.add('hidden'); document.getElementById('banner-id').value = ''; document.getElementById('banner-img').value = ''; document.getElementById('bannerModalTitle').innerText = 'Додати Банер';
    if(id) {
        const b = banners.find(ban => ban.id === id);
        document.getElementById('banner-id').value = b.id; document.getElementById('banner-img').value = b.img; document.getElementById('banner-link').value = b.link || ''; document.getElementById('bannerPreview').src = b.img;
        document.getElementById('bannerPreview').style.aspectRatio = siteSettings.bannerRatio || '3/1'; document.getElementById('bannerPreview').classList.remove('hidden'); document.getElementById('bannerModalTitle').innerText = 'Редагувати Банер';
    }
    document.getElementById('bannerModal').classList.remove('hidden'); setTimeout(() => document.getElementById('bannerModal').classList.remove('opacity-0'), 10);
};
window.closeBannerModal = function() { document.getElementById('bannerModal').classList.add('opacity-0'); setTimeout(() => document.getElementById('bannerModal').classList.add('hidden'), 300); };
window.deleteBanner = function(id) { if(confirm('Видалити цей банер?')) { banners = banners.filter(b => b.id !== id); API.set('bv_banners', banners); renderBannersAdmin(); showNotification('Видалено'); } };

// Ексклюзив (Процес)
function renderExclusiveProcessAdmin() {
    const list = document.getElementById('exclusiveProcessList'); list.innerHTML = '';
    exclusiveProcess.forEach((step, index) => { list.innerHTML += `<div class="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col md:flex-row gap-4 items-center relative"><div class="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold z-10 text-[#c5a059]">Крок ${index + 1}</div><img src="${step.img}" class="w-full md:w-32 aspect-[4/3] object-cover rounded border border-white/20"><div class="flex-grow w-full"><h4 class="font-serif text-lg mb-1">${step.title}</h4><p class="text-xs text-gray-400 line-clamp-2">${step.desc}</p></div><div class="flex gap-2 w-full md:w-auto mt-2 md:mt-0"><button onclick="window.openProcessModal(${step.id})" class="flex-1 btn-secondary text-xs px-4 py-2">Ред</button><button onclick="window.deleteProcessStep(${step.id})" class="flex-1 btn-danger text-xs px-4 py-2">Видалити</button></div></div>`; });
}
window.openProcessModal = function(id = null) {
    document.getElementById('processForm').reset(); document.getElementById('processPreview').classList.add('hidden'); document.getElementById('process-id').value = ''; document.getElementById('process-img').value = ''; document.getElementById('processModalTitle').innerText = 'Додати етап';
    if(id) { const step = exclusiveProcess.find(s => s.id === id); document.getElementById('process-id').value = step.id; document.getElementById('process-title').value = step.title; document.getElementById('process-desc').value = step.desc; document.getElementById('process-img').value = step.img; document.getElementById('processPreview').src = step.img; document.getElementById('processPreview').classList.remove('hidden'); document.getElementById('processModalTitle').innerText = 'Редагувати етап'; }
    document.getElementById('processModal').classList.remove('hidden'); setTimeout(() => document.getElementById('processModal').classList.remove('opacity-0'), 10);
};
window.closeProcessModal = function() { document.getElementById('processModal').classList.add('opacity-0'); setTimeout(() => document.getElementById('processModal').classList.add('hidden'), 300); };
window.saveProcessStep = function() {
    const idInput = document.getElementById('process-id').value; const imgData = document.getElementById('process-img').value;
    if(!imgData) return alert('Завантажте фото!');
    const stepData = { id: idInput ? parseInt(idInput) : Date.now(), title: document.getElementById('process-title').value, desc: document.getElementById('process-desc').value, img: imgData };
    if(idInput) { const idx = exclusiveProcess.findIndex(s => s.id === parseInt(idInput)); if(idx !== -1) exclusiveProcess[idx] = stepData; } else { exclusiveProcess.push(stepData); }
    API.set('bv_exclusive_process', exclusiveProcess); renderExclusiveProcessAdmin(); closeProcessModal(); showNotification('Збережено!');
};
window.deleteProcessStep = function(id) { if(confirm('Видалити цей етап?')) { exclusiveProcess = exclusiveProcess.filter(s => s.id !== id); API.set('bv_exclusive_process', exclusiveProcess); renderExclusiveProcessAdmin(); showNotification('Видалено'); } };

// Ексклюзив (Матеріали)
function renderExclusiveMaterialsAdmin() {
    const list = document.getElementById('exclusiveMaterialsList'); list.innerHTML = '';
    exclusiveMaterials.forEach((mat) => { list.innerHTML += `<div class="bg-white/5 p-3 rounded-lg border ${mat.selected ? 'border-[#c5a059]' : 'border-white/10'} flex justify-between items-center relative"><div><span class="text-sm font-medium ${mat.selected ? 'text-[#c5a059]' : 'text-white'}">${mat.label}</span><span class="text-[10px] text-gray-500 ml-2">ID: ${mat.id}</span>${mat.selected ? '<span class="text-[9px] bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded ml-2 uppercase tracking-wider">За замовчуванням</span>' : ''}</div><div class="flex gap-2"><button onclick="window.openMaterialModal('${mat.id}')" class="btn-secondary text-xs px-3 py-1.5">Ред</button><button onclick="window.deleteMaterialOption('${mat.id}')" class="btn-danger text-xs px-3 py-1.5">Видал</button></div></div>`; });
}
window.openMaterialModal = function(id = null) {
    document.getElementById('materialForm').reset(); document.getElementById('material-old-id').value = ''; document.getElementById('materialModalTitle').innerText = 'Додати матеріал';
    if(id) { const mat = exclusiveMaterials.find(m => m.id === id); document.getElementById('material-old-id').value = mat.id; document.getElementById('material-id').value = mat.id; document.getElementById('material-label').value = mat.label; document.getElementById('material-selected').checked = mat.selected; document.getElementById('materialModalTitle').innerText = 'Редагувати матеріал'; }
    document.getElementById('materialModal').classList.remove('hidden'); setTimeout(() => document.getElementById('materialModal').classList.remove('opacity-0'), 10);
};
window.closeMaterialModal = function() { document.getElementById('materialModal').classList.add('opacity-0'); setTimeout(() => document.getElementById('materialModal').classList.add('hidden'), 300); };
window.saveMaterialOption = function() {
    const oldId = document.getElementById('material-old-id').value; const newId = document.getElementById('material-id').value.toLowerCase(); const isSelected = document.getElementById('material-selected').checked;
    if(isSelected) exclusiveMaterials.forEach(m => m.selected = false);
    const matData = { id: newId, label: document.getElementById('material-label').value, selected: isSelected };
    if (oldId) { const idx = exclusiveMaterials.findIndex(m => m.id === oldId); if(idx !== -1) exclusiveMaterials[idx] = matData; } else { if(exclusiveMaterials.find(m => m.id === newId)) return alert('Такий ID вже існує!'); exclusiveMaterials.push(matData); }
    if(!exclusiveMaterials.find(m => m.selected) && exclusiveMaterials.length > 0) exclusiveMaterials[0].selected = true; 
    API.set('bv_exclusive_materials', exclusiveMaterials); renderExclusiveMaterialsAdmin(); closeMaterialModal(); showNotification('Кнопку збережено!');
};
window.deleteMaterialOption = function(id) { if(confirm('Видалити цю кнопку з форми?')) { exclusiveMaterials = exclusiveMaterials.filter(m => m.id !== id); if(!exclusiveMaterials.find(m => m.selected) && exclusiveMaterials.length > 0) exclusiveMaterials[0].selected = true; API.set('bv_exclusive_materials', exclusiveMaterials); renderExclusiveMaterialsAdmin(); showNotification('Кнопку видалено'); } };

// Булдер сторінок та Налаштування
window.loadPageBuilderForm = function() {
    const pageId = document.getElementById('builder-page-select').value;
    const container = document.getElementById('builder-form-container');
    const data = pagesContentDB[pageId] || {title: '', content: '', subtitle: '', titleColor: '#ffffff', subColor: '#cccccc', heroBg: '', heroOpacity: 0.4};

    if(pageId === 'home_hero') {
        container.innerHTML = `<div class="builder-section"><div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label class="text-[10px] uppercase text-gray-400 block mb-1">Головний заголовок Hero</label><input type="text" id="bld-hero-title" class="input-field" value="${data.title || ''}"></div><div><label class="text-[10px] uppercase text-gray-400 block mb-1">Колір заголовка</label><input type="color" id="bld-hero-title-color" class="input-field h-[46px] p-1 cursor-pointer" value="${data.titleColor || '#ffffff'}"></div><div><label class="text-[10px] uppercase text-gray-400 block mb-1">Підзаголовок Hero</label><input type="text" id="bld-hero-sub" class="input-field" value="${data.subtitle || ''}"></div><div><label class="text-[10px] uppercase text-gray-400 block mb-1">Колір підзаголовка</label><input type="color" id="bld-hero-sub-color" class="input-field h-[46px] p-1 cursor-pointer" value="${data.subColor || '#cccccc'}"></div></div><div class="border-t border-white/10 pt-4 mt-4 mb-4"><h4 class="text-sm font-semibold text-[#c5a059] mb-3">Фонове зображення (Hero)</h4><div class="grid grid-cols-1 gap-4 mb-4"><div><label class="text-[10px] uppercase text-gray-400 block mb-1">Завантажити файл</label><input type="file" accept="image/*" class="input-field file-input" onchange="window.handleImageUpload(event, 'heroPreview', 'bld-hero-bg', 3)"><input type="hidden" id="bld-hero-bg" value="${data.heroBg || siteSettings.heroBg || ''}"></div><div class="flex gap-4 items-start"><div class="w-1/2"><label class="text-[10px] uppercase text-gray-400 block mb-1">Затемнення (0.0 - 1.0)</label><input type="number" step="0.1" min="0" max="1" id="bld-hero-opacity" class="input-field" value="${data.heroOpacity !== undefined ? data.heroOpacity : 0.4}"></div><div class="w-1/2"><label class="text-[10px] uppercase text-gray-400 block mb-1">Прев'ю фону</label><img id="heroPreview" src="${data.heroBg || siteSettings.heroBg || ''}" class="h-16 w-full object-cover rounded border border-white/20 ${data.heroBg || siteSettings.heroBg ? '' : 'hidden'}"></div></div></div></div><button onclick="window.saveBuilderData('${pageId}')" class="btn-primary w-full sm:w-auto">Зберегти</button></div>`;
    } else {
        container.innerHTML = `<div class="builder-section"><div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label class="text-[10px] uppercase text-gray-400 block mb-1">Заголовок Сторінки</label><input type="text" id="bld-page-title" class="input-field" value="${data.title || ''}"></div><div><label class="text-[10px] uppercase text-gray-400 block mb-1">Колір заголовка</label><input type="color" id="bld-page-title-color" class="input-field h-[46px] p-1 cursor-pointer" value="${data.titleColor || '#ffffff'}"></div></div><label class="text-[10px] uppercase text-gray-400 block mb-1">Контент (HTML)</label><textarea id="bld-page-content" class="input-field h-[40vh] font-mono text-xs leading-relaxed mb-4" spellcheck="false">${data.content || ''}</textarea><div class="mb-4"><label class="text-[10px] uppercase text-gray-400 block mb-1">Колір тексту сторінки</label><input type="color" id="bld-page-sub-color" class="input-field w-1/2 h-[46px] p-1 cursor-pointer" value="${data.subColor || '#cccccc'}"></div><button onclick="window.saveBuilderData('${pageId}')" class="btn-primary w-full sm:w-auto mt-4">Зберегти Сторінку</button></div>`;
    }
};

window.saveBuilderData = function(pageId) {
    if (!pagesContentDB[pageId]) pagesContentDB[pageId] = {};
    if(pageId === 'home_hero') {
        pagesContentDB[pageId].title = document.getElementById('bld-hero-title').value; pagesContentDB[pageId].titleColor = document.getElementById('bld-hero-title-color').value; pagesContentDB[pageId].subtitle = document.getElementById('bld-hero-sub').value; pagesContentDB[pageId].subColor = document.getElementById('bld-hero-sub-color').value; pagesContentDB[pageId].heroBg = document.getElementById('bld-hero-bg').value; pagesContentDB[pageId].heroOpacity = document.getElementById('bld-hero-opacity').value;
    } else {
        pagesContentDB[pageId].title = document.getElementById('bld-page-title').value; pagesContentDB[pageId].titleColor = document.getElementById('bld-page-title-color').value; pagesContentDB[pageId].content = document.getElementById('bld-page-content').value; pagesContentDB[pageId].subColor = document.getElementById('bld-page-sub-color').value;
    }
    API.set('bv_pages_content', pagesContentDB); showNotification('Оновлено!');
};

window.savePriceList = function() {
    try { priceListDB = JSON.parse(document.getElementById('price-json-editor').value); API.set('bv_price_list', priceListDB); showNotification('Прайс-лист збережено в локальну БД!'); } catch (e) { alert('Помилка в форматі JSON!'); }
};

function populateSettings() {
    ['phone','tg','inst','gold-rate', 'banner-ratio'].forEach(k => {
        const mapKey = k==='tg'?'tgLink':(k==='inst'?'instLink':(k==='gold-rate'?'goldRate':(k==='banner-ratio'?'bannerRatio':k)));
        if(document.getElementById(`set-${k}`)) document.getElementById(`set-${k}`).value = siteSettings[mapKey] || (k==='banner-ratio'?'3/1':'');
    });
    currentAddresses = siteSettings.addresses || [];
    if(currentAddresses.length === 0) { if(siteSettings.addr1) currentAddresses.push(siteSettings.addr1); if(siteSettings.addr2) currentAddresses.push(siteSettings.addr2); }
    renderAddresses();
}

function renderAddresses() {
    const container = document.getElementById('addressesContainer');
    container.innerHTML = currentAddresses.map((addr, idx) => `<div class="flex gap-2 items-center"><input type="text" class="input-field addr-input" value="${addr}" placeholder="Місто, Вулиця, 1"><button type="button" class="btn-danger flex items-center justify-center w-10 h-10 px-0" onclick="window.removeAddressField(${idx})" title="Видалити філіал">&times;</button></div>`).join('');
    if (currentAddresses.length === 0) container.innerHTML = '<div class="text-[10px] text-gray-500 italic">Жодного філіалу не додано</div>';
}

window.addAddressField = function() { currentAddresses.push(''); renderAddresses(); };
window.removeAddressField = function(index) { currentAddresses.splice(index, 1); renderAddresses(); };

window.saveSiteSettings = function(event) {
    const btn = event ? event.target : document.querySelector('.btn-primary[onclick="window.saveSiteSettings(event)"]');
    const originalText = btn ? btn.innerText : 'Зберегти';
    if(btn) { btn.innerText = 'Зберігаю...'; btn.disabled = true; }

    try {
        const oldRate = Number(siteSettings.goldRate) || 0;
        const newRate = Number(document.getElementById('set-gold-rate')?.value || siteSettings.goldRate) || 0;
        const newRatio = document.getElementById('set-banner-ratio')?.value || siteSettings.bannerRatio;
        
        const addrInputs = document.querySelectorAll('.addr-input');
        const savedAddresses = Array.from(addrInputs).map(inp => inp.value.trim()).filter(val => val !== '');

        siteSettings = {
            ...siteSettings,
            phone: document.getElementById('set-phone')?.value || siteSettings.phone,
            tgLink: document.getElementById('set-tg')?.value || siteSettings.tgLink,
            instLink: document.getElementById('set-inst')?.value || siteSettings.instLink,
            addresses: savedAddresses.length > 0 ? savedAddresses : siteSettings.addresses,
            goldRate: newRate, bannerRatio: newRatio
        };
        
        API.set('bv_settings', siteSettings);
        
        if (oldRate !== newRate && newRate > 0) {
            products.forEach(p => {
                Object.values(p.variations).forEach(v => {
                    if (v.priceType === 'auto' && v.weight && v.workCost) v.price = Math.round((Number(v.weight) * newRate) + Number(v.workCost));
                });
            });
            API.set('bv_products', products);
            renderProducts(); 
            showNotification('Курс оновлено, ціни перераховано!');
        } else { showNotification('Налаштування збережено'); }
    } catch (err) { alert('Помилка: ' + err.message); } finally { if(btn) { btn.innerText = originalText; btn.disabled = false; } }
};

// Запуск
document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { checkAdminAccess(); }, 200); });

// Обробка форми Категорій
document.getElementById('categoryForm').onsubmit = (e) => {
    e.preventDefault();
    const oldId = document.getElementById('cat-old-id').value;
    const newId = document.getElementById('cat-id').value.toLowerCase();
    const parentId = document.getElementById('cat-parent').value || null;
    
    const data = { id: newId, parentId: parentId, name: { uk: document.getElementById('cat-name-uk').value, ru: document.getElementById('cat-name-ru').value, en: document.getElementById('cat-name-en').value } };
    if (oldId) {
        const idx = categories.findIndex(c => c.id === oldId); categories[idx] = data;
        if(oldId !== newId) categories.filter(c => c.parentId === oldId).forEach(c => c.parentId = newId);
    } else {
        if(categories.find(c => c.id === newId)) return alert('ID вже існує!'); categories.push(data);
    }
    API.set('bv_categories_flat', categories); renderCategoriesAdmin(); populateCategorySelects(); closeCategoryModal(); showNotification('Категорію збережено');
};

// Обробка форми Блоків
document.getElementById('blockForm').onsubmit = (e) => {
    e.preventDefault();
    const oldId = document.getElementById('block-old-id').value; const newId = document.getElementById('block-id').value.toLowerCase();
    const data = { id: newId, name: { uk: document.getElementById('block-name-uk').value, ru: document.getElementById('block-name-ru').value, en: document.getElementById('block-name-en').value }, active: document.getElementById('block-active').checked };
    if(oldId) { const idx = homeBlocks.findIndex(b => b.id === oldId); if(idx > -1) homeBlocks[idx] = data; } else { if(homeBlocks.find(b => b.id === newId)) return alert('Блок з таким ID вже існує'); homeBlocks.push(data); }
    API.set('bv_home_blocks', homeBlocks); renderBlocksAdmin(); closeBlockModal(); showNotification('Блок збережено');
};

// Обробка Банерів
document.getElementById('bannerForm').onsubmit = (e) => {
    e.preventDefault();
    const idInput = document.getElementById('banner-id').value; const imgData = document.getElementById('banner-img').value;
    if(!imgData) return alert('Завантажте фото!');
    const bData = { id: idInput ? parseInt(idInput) : Date.now(), img: imgData, link: document.getElementById('banner-link').value };
    if(idInput) { const idx = banners.findIndex(b => b.id === parseInt(idInput)); if(idx !== -1) banners[idx] = bData; } else { banners.push(bData); }
    API.set('bv_banners', banners); renderBannersAdmin(); closeBannerModal(); showNotification('Збережено!');
};