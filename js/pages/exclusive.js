// ==========================================
// ЛОГІКА СТОРІНКИ "ЕКСКЛЮЗИВ"
// ==========================================

let selectedMaterial = '';

window.updateFileName = function(input) {
    const display = document.getElementById('fileNameDisplay');
    if (input.files && input.files.length > 0) {
        display.innerText = input.files[0].name;
        display.classList.add('text-[var(--gold-muted)]');
    } else {
        display.innerText = 'Натисніть або перетягніть файл сюди';
        display.classList.remove('text-[var(--gold-muted)]');
    }
};

window.selectMaterial = function(id, btnElement) {
    selectedMaterial = id;
    document.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
};

window.submitExclusiveOrder = function() {
    const name = document.getElementById('exName').value;
    if(!selectedMaterial) {
        window.showToast ? window.showToast("Будь ласка, оберіть наявність матеріалів.") : alert("Будь ласка, оберіть наявність матеріалів.");
        return;
    }
    
    const msg = `Дякуємо, ${name}! Вашу заявку збережено. Майстер зв'яжеться з вами найближчим часом.`;
    window.showToast ? window.showToast(msg) : alert(msg);
    
    document.getElementById('exclusiveForm').reset();
    document.getElementById('fileNameDisplay').innerText = 'Натисніть або перетягніть файл сюди';
    document.getElementById('fileNameDisplay').classList.remove('text-[var(--gold-muted)]');
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Дефолтні дані, якщо в БД ще нічого немає
        const defaultProcess = [
            { id: 1, title: 'Ескіз та ідея', desc: 'Обговорюємо ваші побажання та створюємо 3D-модель.', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800' },
            { id: 2, title: 'Вибір матеріалів', desc: 'Підбираємо ідеальне золото та каміння.', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800' },
            { id: 3, title: 'Створення виробу', desc: 'Наші ювеліри вручну створюють вашу прикрасу.', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800' }
        ];
        
        const defaultMaterials = [
            { id: 'my_gold', label: 'Маю своє золото', selected: true },
            { id: 'need_gold', label: 'Потрібні матеріали Atelier', selected: false }
        ];

        // Тягнемо з бази (або ставимо дефолт)
        const processData = API.get('bv_exclusive_process', null) || defaultProcess;
        const processContainer = document.getElementById('processListContainer');
        
        if (processContainer && processData.length > 0) {
            processContainer.innerHTML = processData.map((step, index) => `
                <div class="process-step flex flex-col md:flex-row items-center gap-8 md:gap-16 group">
                    <div class="process-img-wrap w-full md:w-1/2 order-1 overflow-hidden rounded-none shadow-xl relative aspect-[4/3] md:aspect-[4/3]">
                        <img src="${step.img}" alt="${step.title}" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105">
                        <div class="absolute inset-0 border border-white/10 pointer-events-none"></div>
                    </div>
                    <div class="process-text-wrap w-full md:w-1/2 order-2 flex flex-col justify-center px-2 md:px-0">
                        <span class="text-[10px] md:text-xs uppercase tracking-widest text-[var(--gold-muted)] font-bold mb-3 block">Етап 0${index + 1}</span>
                        <h3 class="text-3xl md:text-4xl lg:text-5xl font-serif mb-4 md:mb-6 text-[var(--text-main)]">${step.title}</h3>
                        <p class="text-sm md:text-base text-[var(--text-muted)] font-light leading-relaxed max-w-md">${step.desc}</p>
                    </div>
                </div>
            `).join('');
        }

        const materialsData = API.get('bv_exclusive_materials', null) || defaultMaterials;
        const matContainer = document.getElementById('materialsContainer');
        
        if (matContainer && materialsData.length > 0) {
            matContainer.innerHTML = materialsData.map(mat => `
                <button type="button" class="choice-btn rounded-none flex-grow sm:flex-grow-0 ${mat.selected ? 'active' : ''}" onclick="window.selectMaterial('${mat.id}', this)">
                    ${mat.label}
                </button>
            `).join('');
            const defaultMat = materialsData.find(m => m.selected);
            if(defaultMat) selectedMaterial = defaultMat.id;
        }
    }, 200);
});