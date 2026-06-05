// assets/js/api/mock-data.js

export const INITIAL_MOCK_DB = {
    products: [
        {
            id: 'prod_1', sku: 'R-1001', category: 'rings', status: 'in-stock', badge: 'new',
            variant: 'Золото 585', stones: 'Діамант 0.05ct',
            blocks: ['hits'], sizes: ['16', '16.5', '17'],
            variations: {
                base: {
                    name: { uk: 'Каблучка "Вічність"', ru: 'Кольцо "Вечность"', en: 'Eternity Ring' },
                    desc: { uk: 'Елегантна каблучка.', ru: 'Элегантное кольцо.', en: 'Elegant ring.' },
                    price: 14500, discount: null, weight: 2.5, workCost: 3000, priceType: 'manual',
                    images: ['https://images.unsplash.com/photo-1605100804763-247f67b2548e?q=80&w=600']
                }
            }
        }
    ],
    categories: [
        { id: 'rings', name: { uk: 'Каблучки', ru: 'Кольца', en: 'Rings' }, parentId: null },
        { id: 'earrings', name: { uk: 'Сережки', ru: 'Серьги', en: 'Earrings' }, parentId: null }
    ],
    homeBlocks: [
        { id: 'hits', name: {uk: 'Хіти місяця', ru: 'Хиты', en: 'Hits'}, active: true },
        { id: 'weekly', name: {uk: 'Вибір тижня', ru: 'Выбор недели', en: 'Weekly Choice'}, active: true }
    ],
    settings: {
        phone: '+38 063 45 40 901',
        goldRate: 3500,
        bannerRatio: '21/9',
        addresses: ['м. Ізмаїл, вул. Торгова, 68']
    },
    banners: [
        { id: 1, img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1600', link: 'catalog.html' }
    ]
};