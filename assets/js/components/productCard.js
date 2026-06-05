import { StorageAPI } from '../api/config.js';
import { getFavs } from '../core/state.js';
import { getLoc, dictionary } from '../core/i18n.js';
import { escapeHtml, priceFormatter } from '../core/utils.js';

export function renderProductCard(prod) {
    const lang = StorageAPI.get('bv_lang', 'uk');
    const base = prod.variations ? prod.variations.base : prod; 
    
    const isOutOfStock = prod.status === 'out-stock';
    const isPreOrder = prod.status === 'pre-order';
    const isFav = getFavs().includes(prod.id);
    
    let badgesHtml = '<div class="flex flex-wrap gap-1 justify-end items-center">';
    if (isOutOfStock) badgesHtml += `<div class="prod-badge badge-sold-out rounded-none">${dictionary[lang].badge_sold_out}</div>`;
    else if (isPreOrder) badgesHtml += `<div class="prod-badge badge-pre-order rounded-none">${dictionary[lang].badge_pre_order}</div>`;
    if(prod.badge === 'new') badgesHtml += `<div class="prod-badge badge-new rounded-none">${dictionary[lang].badge_new}</div>`;
    if(prod.badge === 'exclusive') badgesHtml += `<div class="prod-badge badge-exclusive rounded-none">${dictionary[lang].badge_exclusive}</div>`;
    if(prod.badge === 'sale') badgesHtml += `<div class="prod-badge badge-sale rounded-none">${dictionary[lang].badge_sale}</div>`;
    badgesHtml += '</div>';

    const price = base.price || 0;
    const discount = base.discount || null;

    let priceHtml = `<span class="text-[14px] md:text-[16px] font-bold text-[var(--gold-muted)]">${priceFormatter.format(price)} ₴</span>`;
    if (discount && Number(discount) > 0) {
        priceHtml = `<span class="text-[14px] md:text-[16px] font-bold text-[#c5a059]">${priceFormatter.format(discount)} ₴</span><span class="text-[10px] md:text-[12px] text-[var(--text-muted)] line-through ml-2 opacity-70">${priceFormatter.format(price)} ₴</span>`;
    }

    const safeId = escapeHtml(prod.id);
    const safeName = escapeHtml(getLoc(base.name)).replace(/'/g, "\\'"); 
    const safeVariant = escapeHtml(prod.variant || '').replace(/'/g, "\\'");
    
    const safeImg = escapeHtml((base.images && base.images.length > 0) ? base.images[0] : (base.img || base.image || ''));
    const priceDisplay = discount && Number(discount) > 0 ? discount : price;

    return `
        <div class="product-card group relative overflow-hidden flex flex-col w-full h-full bg-[#ffffff] transition-colors duration-300">
            <a href="product.html?id=${prod.id}" class="relative w-full aspect-square overflow-hidden bg-white block p-2 md:p-4">
                <img src="${safeImg}" class="product-img w-full h-full object-contain transition duration-700 group-hover:scale-105" loading="lazy">
            </a>
            
            <div class="px-3 md:px-4 pb-1 pt-2 flex flex-col gap-1 flex-grow bg-white border-t border-[#f5f5f5]">
                <a href="product.html?id=${prod.id}" class="text-[9px] md:text-[10px] uppercase tracking-widest text-[#888] hover:text-[var(--gold-muted)] transition-all duration-300">${safeVariant}</a>
                <a href="product.html?id=${prod.id}" class="text-[12px] md:text-[14px] font-medium text-[#222] leading-snug hover:text-[var(--gold-muted)] transition-all duration-300 line-clamp-2 mt-1 min-h-[36px] md:min-h-[44px]">${safeName}</a>
                <div class="mt-auto pt-2 mb-1 flex items-center">${priceHtml}</div>
            </div>

            <div class="px-3 md:px-4 py-3 border-t border-[#f5f5f5] flex justify-between items-center mt-auto bg-white">
                <div class="flex items-center gap-2">
                    ${!isOutOfStock ? `
                    <button onclick="addToCart('${safeId}', '${safeName}', '${safeVariant}', ${priceDisplay}, '${safeImg}')" class="btn-cross flex items-center gap-1 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#222] hover:text-[var(--gold-muted)] transition-all duration-300 active:scale-95 group/btn">
                        <span>${dictionary[lang].btn_buy}</span><span class="text-[14px] font-light mb-[2px] transition-transform group-hover/btn:rotate-90">+</span>
                    </button>
                    ` : `<span class="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#888]">${dictionary[lang].out_stock}</span>`}
                </div>
                <div class="flex items-center gap-3">
                    ${badgesHtml}
                    <button class="fav-btn-inline btn-cross ${isFav ? 'text-[var(--danger)]' : 'text-[#888] hover:text-[#222]'} transition-all duration-300 active:scale-95" data-id="${prod.id}" onclick="toggleFav('${prod.id}')">
                        <svg width="18" height="18" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.renderProductCard = renderProductCard;