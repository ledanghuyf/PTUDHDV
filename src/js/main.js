/**
 * Main JS - Điều khiển ứng dụng: routing, render trang và xử lý sự kiện phía khách hàng
 * (Trang quản lý nằm ở admin.js)
 */

import * as api from './api.js';
import * as cart from './cart.js';
import * as ui from './components.js';
import * as wishlist from './wishlist.js';
import * as auth from './auth.js';
import { calcTotals, couponError } from './pricing.js';
import { createAdmin } from './admin.js';
import { SHOP, DEFAULT_SETTINGS, isBankConfigured, isEmailConfigured, loadLocalConfig } from './config.js';

const app = document.getElementById('app');
const PRODUCTS_PER_PAGE = 12;    // 3 hàng x 4 cột
const FEATURED_THRESHOLD = 4.0;  // Điểm tối thiểu để được gắn nhãn "Nổi bật"
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cách sắp xếp tương ứng với SORT_OPTIONS trong components.js
const SORTERS = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'best-selling': (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
    'rating': (a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount,
    'discount': (a, b) => ui.discountPercent(b) - ui.discountPercent(a),
};

// ===================== Tiện ích giao diện =====================

/**
 * Hiện thông báo nhỏ góc màn hình (thay cho alert)
 * @param {'success'|'error'|'info'} type
 */
function toast(message, type = 'success') {
    const root = document.getElementById('toast-root');
    // Chỉ giữ 2 thông báo gần nhất để không che nút bấm
    while (root.children.length >= 2) root.firstElementChild.remove();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => el.classList.add('toast-hide'), 2800);
    setTimeout(() => el.remove(), 3200);
}

/**
 * Thông báo kiểm tra form bằng tiếng Việt (thay cho "Please fill out this field." của trình duyệt)
 */
function validationMessage(el) {
    const v = el.validity;
    if (v.valueMissing) {
        if (el.type === 'radio') return 'Vui lòng chọn một trong các lựa chọn này.';
        return el.tagName === 'SELECT' ? 'Vui lòng chọn một mục trong danh sách.' : 'Vui lòng điền vào trường này.';
    }
    if (v.typeMismatch && el.type === 'email') return 'Vui lòng nhập địa chỉ email hợp lệ (VD: ten@gmail.com).';
    if (v.typeMismatch) return 'Giá trị chưa đúng định dạng.';
    if (v.patternMismatch) return el.dataset.patternMessage || 'Giá trị chưa đúng định dạng yêu cầu.';
    if (v.tooLong) return `Vui lòng nhập tối đa ${el.maxLength} ký tự.`;
    if (v.tooShort) return `Vui lòng nhập ít nhất ${el.minLength} ký tự.`;
    if (v.rangeUnderflow) return `Giá trị phải lớn hơn hoặc bằng ${el.min}.`;
    if (v.rangeOverflow) return `Giá trị phải nhỏ hơn hoặc bằng ${el.max}.`;
    if (v.badInput) return 'Vui lòng nhập một số hợp lệ.';
    if (v.stepMismatch) return 'Giá trị không hợp lệ.';
    return '';
}

// Sự kiện invalid không nổi bọt → bắt ở pha capture cho mọi form
document.addEventListener('invalid', (e) => {
    const el = e.target;
    el.setCustomValidity('');
    el.setCustomValidity(validationMessage(el));
}, true);

['input', 'change'].forEach(type => document.addEventListener(type, (e) => {
    if (e.target.setCustomValidity) e.target.setCustomValidity('');
}, true));

// Số điện thoại: khách hay gõ "0912 345 678" hoặc "+84 912..." → tự bỏ ký tự thừa, đổi 84 đầu số thành 0
document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.type !== 'tel') return;
    let digits = el.value.replace(/\D/g, '');
    if (digits.startsWith('84') && digits.length >= 11) digits = `0${digits.slice(2)}`;
    if (digits !== el.value) el.value = digits;
}, true);

/**
 * Hiện lỗi ngay dưới ô nhập khi khách rời ô (không đợi tới lúc bấm đặt hàng)
 */
function showFieldError(el, force = false) {
    const group = el.closest('.form-group');
    if (!group || !el.willValidate) return;
    let msg = group.querySelector('.field-error');
    const text = (force || el.value) && !el.checkValidity() ? validationMessage(el) : '';
    if (!msg && text) {
        msg = document.createElement('small');
        msg.className = 'field-error';
        msg.setAttribute('role', 'alert');
        group.appendChild(msg);
    }
    if (msg) msg.textContent = text;
    el.setCustomValidity('');
    el.classList.toggle('is-invalid', Boolean(text));
}

function setTitle(title) {
    document.title = title ? `${title} | ${SHOP.name}` : `${SHOP.name} – Mỹ phẩm chính hãng`;
}

function updateCartIcon(bump = false) {
    cart.updateCartCount();
    const badge = document.getElementById('cartCount');
    if (bump && badge && !reduceMotion) {
        badge.classList.remove('bump');
        void badge.offsetWidth; // chạy lại animation
        badge.classList.add('bump');
    }
}

// ===================== Cấu hình nội dung trang =====================

let settings = { ...DEFAULT_SETTINGS };
const getSettings = () => settings;

/** Áp dụng nội dung do Quản lý chỉnh: thanh thông báo, thông tin liên hệ ở footer */
function applySettings(next) {
    settings = { ...DEFAULT_SETTINGS, ...next };
    const bar = document.getElementById('announcement-bar');
    bar.textContent = settings.announcement;
    bar.hidden = !settings.announcement;
    document.getElementById('footer-hotline').textContent = settings.hotline;
    const email = document.getElementById('footer-email');
    email.textContent = settings.contactEmail;
    email.href = `mailto:${settings.contactEmail}`;
}

// ===================== Dữ liệu =====================

/**
 * Tải sản phẩm + đánh giá, gắn điểm đánh giá trung bình và nhãn "Nổi bật".
 * Điểm = 50% lượt bán (quy về thang 5) + 50% đánh giá trung bình (mặc định 3 nếu chưa có); dùng để xếp hạng.
 */
async function loadCatalog() {
    const [products, reviews] = await Promise.all([api.getAllProducts(), api.getAllReviews()]);
    const maxSold = Math.max(1, ...products.map(p => p.soldCount || 0));

    const enriched = products.map(product => {
        const productReviews = reviews.filter(r => String(r.productId) === String(product.id));
        const reviewCount = productReviews.length;
        const avgRating = reviewCount ? productReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
        const score = ((product.soldCount || 0) / maxSold) * 5 * 0.5 + (reviewCount ? avgRating : 3) * 0.5;
        // "Nổi bật" = cửa hàng tự chọn (featured) hoặc đủ điểm từ lượt bán + đánh giá
        return { ...product, avgRating, reviewCount, score, isFeatured: Boolean(product.featured) || score >= FEATURED_THRESHOLD };
    });

    return { products: enriched, reviews };
}

const brandsOf = products => [...new Set(products.map(p => p.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
const hashParams = () => new URLSearchParams(window.location.hash.split('?')[1] || '');

// ===================== Router =====================

const admin = createAdmin({
    app, toast,
    getSettings,
    applySettings,
    notifyCustomer: order => sendOrderEmail(order),
    logout: () => logout(),
});

// Mỗi trang: tải dữ liệu rồi trả về hàm mount() để vẽ giao diện
const routes = [
    [/^#\/$/, homeView],
    [/^#\/products(\?.*)?$/, productsView],
    [/^#\/product\/([^/?]+)$/, productDetailView],
    [/^#\/cart$/, cartView],
    [/^#\/checkout$/, checkoutView],
    [/^#\/order\/([^/?]+)$/, orderView],
    [/^#\/tra-cuu(\?.*)?$/, lookupView],
    [/^#\/wishlist$/, wishlistView],
    [/^#\/dang-nhap(\?.*)?$/, () => authView('login')],
    [/^#\/dang-ky(\?.*)?$/, () => authView('register')],
    [/^#\/tai-khoan$/, accountView],
    [/^#\/admin(?:\/(\w+))?$/, sub => admin.view(sub)],
];

let renderId = 0;
let pageTimer = null; // hiệu ứng chữ chạy ở banner

async function router() {
    const hash = window.location.hash || '#/';
    const currentRender = ++renderId;
    clearInterval(pageTimer);
    admin.stop(); // rời trang quản lý thì dừng tự cập nhật

    window.scrollTo(0, 0);
    updateActiveNav(hash);
    document.body.classList.toggle('is-admin', hash.startsWith('#/admin'));
    showLoading();

    const route = routes.find(([pattern]) => pattern.test(hash));
    try {
        const mount = route ? await route[1](...hash.match(route[0]).slice(1)) : show404Page;
        // Người dùng đã chuyển trang khác trong lúc chờ dữ liệu → bỏ kết quả cũ
        if (currentRender === renderId && mount) mount();
    } catch (error) {
        console.error('Lỗi khi render trang:', error);
        if (currentRender === renderId) showErrorPage(error.message);
    }
}

/**
 * Đánh dấu mục đang mở trên thanh danh mục / nút header (so khớp đúng địa chỉ)
 */
function updateActiveNav(hash) {
    // Trang sản phẩm: ưu tiên danh mục đang lọc, rồi tới "Khuyến mãi", còn lại là "Tất cả sản phẩm"
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const target = (hash === '#/checkout') ? '#/cart'
        : hash.startsWith('#/tra-cuu') ? '#/tra-cuu'
        : hash.startsWith('#/products') ? (params.get('category') ? `#/products?category=${params.get('category')}`
            : params.get('sort') === 'discount' ? '#/products?sort=discount' : '#/products')
        : hash;
    // Rời trang sản phẩm thì xóa chữ cũ trong ô tìm kiếm trên header
    if (!hash.startsWith('#/products')) document.getElementById('header-search-input').value = '';
    document.querySelectorAll('.category-bar a, .header-actions a').forEach(link => {
        const isActive = link.getAttribute('href') === target;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    // Mục đang mở trên thanh danh mục điện thoại luôn nằm trong tầm nhìn
    document.querySelector('.category-bar a.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

// ===================== Trang chủ =====================

async function homeView() {
    const { products } = await loadCatalog();

    return () => {
        setTitle('');
        app.innerHTML = ui.HomePage(settings, brandsOf(products), products);
        const fill = (id, list) => { document.getElementById(id).innerHTML = list.map(ui.ProductCard).join(''); };

        const onSale = products.filter(p => p.stock > 0 && ui.discountPercent(p) > 0)
            .sort((a, b) => ui.discountPercent(b) - ui.discountPercent(a)).slice(0, 12); // CSS chỉ hiện số vừa khít hàng
        fill('sale-product-list', onSale);
        document.querySelector('.sale-section').hidden = onSale.length === 0;

        startHeroRotator();

        // Gợi ý: sản phẩm Quản lý gắn "Nổi bật" lên trước, rồi theo điểm; còn hàng, không lặp lại Deal hot
        const saleIds = new Set(onSale.map(p => p.id));
        fill('recommend-list', products.filter(p => p.stock > 0 && !saleIds.has(p.id))
            .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.score - a.score).slice(0, 12));
    };
}

/**
 * Cụm từ sau chữ "cho" ở banner đổi luân phiên (mờ dần → đổi chữ → hiện lại)
 */
function startHeroRotator() {
    const el = document.getElementById('hero-rotator');
    const words = JSON.parse(el.dataset.words || '[]');
    if (words.length < 2) return; // chỉ đổi độ mờ, vẫn chạy khi máy bật "giảm chuyển động"
    let i = 0;
    pageTimer = setInterval(() => {
        el.classList.add('is-out');
        setTimeout(() => {
            i = (i + 1) % words.length;
            el.textContent = words[i];
            el.classList.remove('is-out');
        }, 350);
    }, 2800);
}

// ===================== Danh sách sản phẩm =====================

/**
 * Gắn bộ lọc cột trái, sắp xếp và "Xem thêm" cho trang sản phẩm
 * @param {Array} products - Sản phẩm đã qua loadCatalog
 */
function initProductListing(products) {
    const $ = id => document.getElementById(id);
    const checked = name => app.querySelector(`input[name="${name}"]:checked`)?.value || '';
    let currentPage = 1;
    let filtered = [];

    function render() {
        const shown = filtered.slice(0, currentPage * PRODUCTS_PER_PAGE);
        $('products-grid').innerHTML = shown.length ? shown.map(ui.ProductCard).join('') : ui.EmptyResult();
        $('result-count').innerHTML = `Hiển thị <strong>${shown.length}</strong> / ${filtered.length} sản phẩm`;
        $('load-more-wrapper').classList.toggle('hidden', shown.length >= filtered.length);
    }

    // Giữ bộ lọc chính trên địa chỉ trang (gửi link cho bạn bè vẫn đúng), không tải lại trang
    function syncHash(category, brand, sort) {
        const params = new URLSearchParams(hashParams());
        Object.entries({ category, brand, sort }).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
        const next = `#/products${params.toString() ? `?${params}` : ''}`;
        if (next !== window.location.hash) {
            history.replaceState(null, '', next);
            updateActiveNav(next);
        }
    }

    function applyFilters() {
        const term = $('search-input').value.trim().toLowerCase();
        const category = checked('f-category');
        const brand = $('brand-filter').value;
        let minPrice = parseFloat($('min-price').value) || 0;
        let maxPrice = parseFloat($('max-price').value) || Infinity;
        if (minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
        const saleOnly = $('sale-only').checked;
        const inStockOnly = $('instock-only').checked;

        filtered = products.filter(p =>
            `${p.name} ${p.brand}`.toLowerCase().includes(term) &&
            (!category || p.category === category) &&
            (!brand || p.brand === brand) &&
            p.price >= minPrice && p.price <= maxPrice &&
            (!saleOnly || ui.discountPercent(p) > 0) &&
            (!inStockOnly || p.stock > 0)
        );

        const sorter = SORTERS[$('sort').value];
        if (sorter) filtered.sort(sorter);

        syncHash(category, brand, $('sort').value);
        currentPage = 1;
        render();
    }

    // Chọn mốc giá nhanh → điền sẵn ô Từ/Đến
    app.querySelectorAll('input[name="f-price"]').forEach(r => r.addEventListener('change', () => {
        const [min = '', max = ''] = r.value.split('-');
        $('min-price').value = min === '0' ? '' : min;
        $('max-price').value = max;
        applyFilters();
    }));
    // Tự gõ giá → bỏ chọn mốc nhanh
    ['min-price', 'max-price'].forEach(id => $(id).addEventListener('input', () => {
        app.querySelector('input[name="f-price"][value=""]').checked = true;
        applyFilters();
    }));
    $('search-input').addEventListener('input', applyFilters);
    app.querySelectorAll('input[name="f-category"]').forEach(r => r.addEventListener('change', applyFilters));
    ['brand-filter', 'sort', 'sale-only', 'instock-only'].forEach(id => $(id).addEventListener('change', applyFilters));
    $('load-more-btn').addEventListener('click', () => { currentPage++; render(); });
    $('clear-filters').addEventListener('click', () => {
        ['search-input', 'min-price', 'max-price', 'brand-filter', 'sort'].forEach(id => { $(id).value = ''; });
        ['sale-only', 'instock-only'].forEach(id => { $(id).checked = false; });
        app.querySelector('input[name="f-category"][value=""]').checked = true;
        app.querySelector('input[name="f-price"][value=""]').checked = true;
        applyFilters();
    });
    // Chữ "Xóa bộ lọc" trong thông báo không tìm thấy
    $('products-grid').addEventListener('click', (e) => { if (e.target.closest('.empty-result strong')) $('clear-filters').click(); });

    applyFilters();
}

async function productsView() {
    const { products } = await loadCatalog();
    const params = hashParams();
    const selected = { category: params.get('category') || '', brand: params.get('brand') || '', query: params.get('q') || '', sort: params.get('sort') || '' };
    const counts = { '': products.length };
    products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });

    return () => {
        setTitle(selected.query ? `Tìm "${selected.query}"` : (ui.CATEGORY_NAMES[selected.category] || selected.brand || 'Sản phẩm'));
        app.innerHTML = ui.ProductsPage(selected, brandsOf(products), counts);
        initProductListing(products);
    };
}

// ===================== Chi tiết sản phẩm =====================

async function productDetailView(id) {
    const { products, reviews } = await loadCatalog();
    const product = products.find(p => String(p.id) === decodeURIComponent(id));
    if (!product) {
        throw new Error('Không tìm thấy sản phẩm. Sản phẩm có thể đã ngừng kinh doanh.');
    }

    const productReviews = sortNewestFirst(reviews.filter(r => String(r.productId) === String(product.id)));
    const related = products
        .filter(p => p.category === product.category && p.id !== product.id)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

    return () => {
        setTitle(product.name);
        app.innerHTML = `<div class="container">${ui.ProductDetail(product, productReviews)}</div>`;

        if (related.length) {
            document.getElementById('related-products').innerHTML = `
                <h2 class="section-title">Sản phẩm cùng danh mục</h2>
                <div class="products-grid">${related.map(ui.ProductCard).join('')}</div>
            `;
        }

        attachQuantityStepper(product);
        attachPurchaseButtons(product);
        attachReviewFormListener(product.id);
    };
}

const sortNewestFirst = reviews => [...reviews].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

function attachQuantityStepper(product) {
    const input = document.getElementById('quantity-input');
    if (!input) return;
    const clamp = () => { input.value = Math.min(product.stock, Math.max(1, parseInt(input.value) || 1)); };
    document.querySelectorAll('.qty-step').forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = (parseInt(input.value) || 1) + Number(btn.dataset.step);
            clamp();
        });
    });
    input.addEventListener('change', clamp);
}

function attachPurchaseButtons(product) {
    const addToCartBtn = document.querySelector('.btn-add-to-cart');
    if (!addToCartBtn) return;

    // Thêm vào giỏ; trả về true nếu thêm được hoặc sản phẩm đã có sẵn trong giỏ
    const add = () => {
        const quantity = Number(document.getElementById('quantity-input').value);
        if (cart.addToCart(product, quantity)) {
            updateCartIcon(true);
            return 'added';
        }
        const inCart = cart.getProductQuantityInCart(product.id);
        toast(`Trong kho còn ${product.stock}, giỏ của bạn đã có ${inCart}. Vui lòng giảm số lượng.`, 'error');
        return inCart > 0 ? 'in-cart' : null;
    };

    addToCartBtn.addEventListener('click', () => {
        if (add() === 'added') toast('Đã thêm vào giỏ hàng 🛍️');
    });
    document.querySelector('.btn-buy-now').addEventListener('click', () => {
        if (add()) window.location.hash = '#/checkout';
    });
}

function attachReviewFormListener(productId) {
    const reviewForm = document.getElementById('review-form');
    if (!reviewForm) return;
    const user = auth.currentUser();
    if (user?.name) document.getElementById('review-author').value = user.name; // thành viên khỏi gõ lại tên

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const author = document.getElementById('review-author').value.trim();
        const rating = parseInt(document.getElementById('review-rating').value);
        const comment = document.getElementById('review-comment').value.trim();

        // `required` vẫn cho qua chuỗi toàn khoảng trắng
        if (!author || !comment) {
            toast('Vui lòng điền đầy đủ tên và nhận xét!', 'error');
            return;
        }

        const submitBtn = reviewForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            await api.postReview({
                productId: String(productId), // id sản phẩm là chuỗi; lưu cùng kiểu cho thống nhất
                author,
                rating,
                comment,
                timestamp: new Date().toISOString()
            });

            const updated = sortNewestFirst(await api.getReviewsByProductId(productId));
            const avg = updated.reduce((sum, r) => sum + r.rating, 0) / updated.length;
            document.getElementById('reviews-list').innerHTML = ui.ReviewList(updated);
            document.getElementById('rating-summary').innerHTML = ui.RatingSummary(avg, updated.length);

            reviewForm.reset();
            if (user?.name) document.getElementById('review-author').value = user.name;
            toast('Cảm ơn bạn đã đánh giá sản phẩm! 💕');
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

// ===================== Giỏ hàng =====================

async function cartView() {
    return renderCart;
}

function renderCart() {
    setTitle('Giỏ hàng');
    const cartItems = cart.getCart();

    if (cartItems.length === 0) {
        app.innerHTML = `<div class="container"><h1 class="page-title">Giỏ hàng</h1>${ui.EmptyCart()}</div>`;
        return;
    }

    const totals = calcTotals(cart.getCartTotal(), null, settings);
    app.innerHTML = `<div class="container">${ui.CartPage(cartItems, totals, cart.getCartItemCount(), settings)}</div>`;
    attachCartListeners();
}

function attachCartListeners() {
    const on = (selector, handler) =>
        document.querySelectorAll(selector).forEach(btn => btn.addEventListener('click', () => handler(btn.dataset.id)));

    on('.increase-btn', id => {
        if (cart.updateQuantity(id, cart.getProductQuantityInCart(id) + 1) === false) {
            toast('Đã đạt số lượng tồn kho tối đa!', 'error');
            return;
        }
        renderCart();
    });

    on('.decrease-btn', id => {
        const qty = cart.getProductQuantityInCart(id);
        if (qty > 1) {
            cart.updateQuantity(id, qty - 1);
            renderCart();
        }
    });

    // Xóa ngay, cho phép hoàn tác thay vì hỏi xác nhận
    on('.remove-btn', id => {
        const item = cart.getCart().find(i => String(i.id) === String(id));
        cart.removeFromCart(id);
        renderCart();
        updateCartIcon();
        if (item) showUndo(`Đã xóa "${item.name}" khỏi giỏ.`, () => {
            cart.saveCart([...cart.getCart(), item]);
            if (window.location.hash === '#/cart') renderCart(); // khách đã sang trang khác thì chỉ cập nhật số trên icon
        });
    });

    document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
            cart.clearCart();
            renderCart();
        }
    });
}

/** Thông báo kèm nút "Hoàn tác" (6 giây) */
function showUndo(message, onUndo) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast toast-info toast-undo';
    el.setAttribute('role', 'status');
    el.innerHTML = `<span>${ui.escapeHtml(message)}</span><button type="button">Hoàn tác</button>`;
    el.querySelector('button').addEventListener('click', () => { onUndo(); el.remove(); });
    root.appendChild(el);
    setTimeout(() => el.classList.add('toast-hide'), 6000);
    setTimeout(() => el.remove(), 6400);
}

// ===================== Thanh toán =====================

// Bỏ 0/O, 1/I/L để khách không gõ nhầm khi tự nhập nội dung chuyển khoản
const ORDER_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
// Ký tự đầu luôn là chữ: json-server đổi "?code=12345678" thành số, mã toàn chữ số sẽ không tra cứu được
const newOrderCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)),
    (b, i) => ORDER_CODE_CHARS[b % (i === 0 ? 23 : ORDER_CODE_CHARS.length)]).join('');

const FIELD_LABELS = {
    name: 'Họ và tên', phone: 'Số điện thoại', email: 'Email', province: 'Tỉnh/Thành phố',
    ward: 'Phường/Xã', houseNumber: 'Số nhà', street: 'Tên đường',
};

async function checkoutView() {
    const cartItems = cart.getCart();

    if (cartItems.length === 0) {
        toast('Giỏ hàng của bạn đang trống!', 'info');
        window.location.hash = '#/products';
        return null;
    }

    // Cập nhật giá/tồn kho mới nhất vào giỏ để số tiền trên mã QR khớp với đơn sẽ tạo.
    // Sản phẩm không còn trên cửa hàng thì loại khỏi giỏ; không tải được sản phẩm nào = mất kết nối server → báo lỗi
    const latest = await Promise.all(cartItems.map(item => api.getProductById(item.id).catch(() => null)));
    if (latest.every(p => !p)) throw new Error('Không thể tải thông tin sản phẩm. Vui lòng kiểm tra kết nối và thử lại.');
    const kept = cartItems.map((item, i) => latest[i] && { ...item, price: latest[i].price, stock: latest[i].stock }).filter(Boolean);
    cart.saveCart(kept);
    if (kept.length < cartItems.length) toast('Một số sản phẩm đã ngừng bán nên được bỏ khỏi giỏ hàng.', 'info');

    return () => {
        setTitle('Thanh toán');
        const state = { orderCode: newOrderCode(), coupon: null, totals: calcTotals(cart.getCartTotal(), null, settings) };
        app.innerHTML = `<div class="container">${ui.CheckoutPage(cart.getCart(), state.totals, state.orderCode, settings)}</div>`;

        const form = document.getElementById('checkout-form');
        const submitButton = form.querySelector('.btn-submit-order');
        const hint = document.getElementById('submit-hint');
        const address = initAddressPicker(form);

        // Đã đăng nhập → tự điền thông tin; chưa → mời đăng nhập để lần sau đặt nhanh hơn
        const user = auth.currentUser();
        if (user) {
            if (user.name) form.name.value = user.name;
            if (user.phone) form.phone.value = user.phone;
            if (user.email) form.email.value = user.email;
        } else {
            form.insertAdjacentHTML('afterbegin',
                '<p class="login-nudge">Đã có tài khoản? <a href="#/dang-nhap?next=checkout">Đăng nhập</a> để tự điền thông tin và theo dõi đơn dễ hơn.</p>');
        }

        // Chỉ cho bấm "Xác nhận đặt hàng" khi mọi trường hợp lệ; nêu rõ còn thiếu gì
        const refreshSubmit = () => {
            const missing = [...form.elements]
                .filter(el => el.name in FIELD_LABELS && el.willValidate && !el.checkValidity())
                .map(el => FIELD_LABELS[el.name]);
            if (!missing.length && !address.isValid()) missing.push('Địa chỉ giao hàng');
            submitButton.disabled = missing.length > 0;
            hint.textContent = missing.length ? `Còn thiếu hoặc chưa đúng: ${[...new Set(missing)].join(', ')}.` : '';
        };
        address.onChange = refreshSubmit;
        form.addEventListener('input', (e) => { if (e.target.classList.contains('is-invalid')) showFieldError(e.target); refreshSubmit(); });
        form.addEventListener('change', refreshSubmit);
        form.addEventListener('focusout', (e) => { if (e.target.matches('input, select, textarea')) showFieldError(e.target); });

        // Vẽ lại tóm tắt đơn + mã QR khi tổng tiền đổi (áp mã giảm giá, giá mới)
        state.refresh = () => {
            state.totals = calcTotals(cart.getCartTotal(), state.coupon, settings);
            document.getElementById('checkout-summary').innerHTML = ui.CheckoutSummary(cart.getCart(), state.totals, state.coupon, settings);
            const qrPanel = document.getElementById('bank-qr-panel');
            if (qrPanel) qrPanel.innerHTML = ui.BankTransferBox({ code: state.orderCode, totalAmount: state.totals.total });
            bindCoupon(state);
        };
        bindCoupon(state);

        // Chọn chuyển khoản → hiện mã VietQR (đúng số tiền + nội dung CS<mã đơn>)
        form.addEventListener('change', (e) => {
            const qrPanel = document.getElementById('bank-qr-panel');
            if (e.target.name === 'payment' && qrPanel) qrPanel.hidden = e.target.value !== 'bank';
        });

        form.addEventListener('submit', (e) => handleCheckoutSubmit(e, state, address));
        refreshSubmit();
    };
}

function bindCoupon(state) {
    const input = document.getElementById('coupon-input');
    const applyBtn = document.getElementById('coupon-apply');
    document.getElementById('coupon-remove')?.addEventListener('click', () => {
        state.coupon = null;
        state.refresh();
        toast('Đã bỏ mã giảm giá.', 'info');
    });
    if (!applyBtn) return;

    const apply = async () => {
        const code = input.value.trim();
        if (!code) return input.focus();
        applyBtn.disabled = true;
        try {
            const coupon = await api.findCoupon(code);
            const error = couponError(coupon, cart.getCartTotal());
            if (error) {
                toast(error, 'error');
                return;
            }
            state.coupon = coupon;
            state.refresh();
            toast(`Đã áp dụng mã ${coupon.code} 🎉`);
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            applyBtn.disabled = false;
        }
    };
    applyBtn.addEventListener('click', apply);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
}

/**
 * Chọn Tỉnh/Thành phố → Phường/Xã từ API hành chính (dữ liệu sau sáp nhập 01/07/2025)
 * @returns {{ isValid: () => boolean, value: () => object|null, onChange: Function }}
 */
function initAddressPicker(form) {
    const provinceSelect = form.querySelector('#addr-province');
    const wardSelect = form.querySelector('#addr-ward');
    const errorBox = form.querySelector('#address-error');
    let provinces = [];
    let wards = [];
    const picker = { onChange: () => {} };

    const fill = (select, list, placeholder) => {
        select.innerHTML = `<option value="">${placeholder}</option>`
            + list.map(x => `<option value="${x.code}">${ui.escapeHtml(x.name)}</option>`).join('');
    };
    const showError = show => errorBox.classList.toggle('hidden', !show);

    async function loadProvinces() {
        showError(false);
        provinceSelect.disabled = true;
        try {
            provinces = await api.getProvinces();
            fill(provinceSelect, provinces, 'Chọn Tỉnh/Thành phố');
            provinceSelect.disabled = false;
        } catch (error) {
            console.error(error);
            fill(provinceSelect, [], 'Không tải được');
            showError(true);
        }
        picker.onChange();
    }

    let wardRequest = 0;
    async function loadWards() {
        const code = provinceSelect.value;
        const current = ++wardRequest;
        wards = [];
        wardSelect.disabled = true;
        fill(wardSelect, [], code ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố trước');
        picker.onChange();
        if (!code) return;
        try {
            const list = await api.getWards(code);
            if (current !== wardRequest) return; // người dùng đã đổi sang tỉnh khác
            wards = list;
            fill(wardSelect, wards, 'Chọn Phường/Xã');
            wardSelect.disabled = false;
            showError(false);
        } catch (error) {
            console.error(error);
            fill(wardSelect, [], 'Không tải được');
            showError(true);
        }
        picker.onChange();
    }

    provinceSelect.addEventListener('change', loadWards);
    form.querySelector('#address-retry').addEventListener('click', () => (provinces.length ? loadWards() : loadProvinces()));

    const houseRe = new RegExp(`^${ui.HOUSE_NUMBER_PATTERN}$`, 'u');
    const streetRe = new RegExp(`^${ui.STREET_PATTERN}$`, 'u');
    picker.value = () => {
        const province = provinces.find(p => String(p.code) === provinceSelect.value);
        const ward = wards.find(w => String(w.code) === wardSelect.value);
        const houseNumber = form.houseNumber.value.trim().replace(/\s+/g, ' ');
        const street = form.street.value.trim().replace(/\s+/g, ' ');
        // Tên đường không bắt buộc (nông thôn, ngõ/hẻm không tên); nếu nhập thì phải hợp lệ
        if (!province || !ward || !houseRe.test(houseNumber) || (street && !streetRe.test(street))) return null;
        return {
            houseNumber, street,
            wardCode: ward.code, wardName: ward.name,
            provinceCode: province.code, provinceName: province.name,
        };
    };
    picker.isValid = () => picker.value() !== null;

    loadProvinces();
    return picker;
}

async function handleCheckoutSubmit(event, state, address) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('.btn-submit-order');
    const addressDetail = address.value();

    const customerInfo = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        address: addressDetail
            ? [`${addressDetail.houseNumber}${addressDetail.street ? ` ${addressDetail.street}` : ''}`, addressDetail.wardName, addressDetail.provinceName].join(', ')
            : '',
        addressDetail,
        note: form.note.value.trim(),
    };
    const paymentMethod = form.payment.value === 'bank' && isBankConfigured() ? 'bank' : 'cod';

    // `required` vẫn cho qua chuỗi toàn khoảng trắng
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email || !addressDetail) {
        toast('Vui lòng điền đầy đủ thông tin và địa chỉ giao hàng hợp lệ!', 'error');
        return;
    }

    const setBusy = busy => {
        submitButton.disabled = busy;
        submitButton.textContent = busy ? 'Đang xử lý...' : 'Xác nhận đặt hàng';
    };
    setBusy(true);

    const items = cart.getCart();

    try {
        // Kiểm tra tồn kho mới nhất (chưa trừ kho: chỉ trừ khi Quản lý duyệt đơn)
        const latestProducts = await Promise.all(items.map(item => api.getProductById(item.id)));
        const shortIndex = items.findIndex((item, i) => latestProducts[i].stock < item.quantity);
        if (shortIndex !== -1) {
            toast(`Sản phẩm "${items[shortIndex].name}" chỉ còn ${latestProducts[shortIndex].stock} trong kho. Vui lòng cập nhật lại giỏ hàng!`, 'error');
            setBusy(false);
            return;
        }

        // Tính lại tiền theo giá hiện tại trên server và kiểm tra lại mã giảm giá
        const orderItems = items.map((item, i) => ({ id: item.id, name: item.name, price: latestProducts[i].price, quantity: item.quantity }));
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const coupon = state.coupon ? await api.findCoupon(state.coupon.code) : null;
        const error = state.coupon ? couponError(coupon, subtotal) : '';
        const totals = calcTotals(subtotal, error ? null : coupon, settings);

        // Giá/mã vừa đổi → số tiền trên mã QR đang hiện không còn đúng: cập nhật lại để khách xem trước khi đặt
        if (error || totals.total !== state.totals.total) {
            cart.saveCart(items.map((item, i) => ({ ...item, price: latestProducts[i].price, stock: latestProducts[i].stock })));
            if (error) state.coupon = null;
            state.refresh();
            toast(error || 'Giá sản phẩm vừa thay đổi, vui lòng kiểm tra lại tổng tiền trước khi đặt.', 'info');
            setBusy(false);
            return;
        }

        const order = await api.createOrder({
            code: state.orderCode,
            customerInfo,
            items: orderItems,
            subtotal: totals.subtotal,
            discount: totals.discount,
            couponCode: coupon ? coupon.code : null,
            shippingFee: totals.shippingFee,
            totalAmount: totals.total,
            paymentMethod,
            paymentStatus: 'Chưa thanh toán',
            status: ui.ORDER_STATUS.PENDING,
            stockApplied: false, // Quản lý duyệt mới trừ kho
            userId: auth.currentUser()?.id || null, // đơn của thành viên hiện ở trang Tài khoản
            timestamp: new Date().toISOString()
        });

        cart.clearCart();
        updateCartIcon();

        // Email xác nhận cho khách + bản sao báo đơn mới cho cửa hàng; lỗi gửi email không làm hỏng đơn đã tạo
        if (isEmailConfigured()) {
            submitButton.textContent = 'Đang gửi email xác nhận...';
            if (await sendOrderEmail(order)) await api.updateOrder(order.id, { emailSent: true }).catch(() => {});
            else toast('Đơn đã tạo nhưng chưa gửi được email xác nhận.', 'info');
        }

        toast('Đặt hàng thành công! Đơn đang chờ cửa hàng duyệt. 💖');
        window.location.hash = `#/order/${order.id}`;
    } catch (error) {
        console.error('Lỗi không thể gửi đơn hàng:', error);
        toast('Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!', 'error');
        setBusy(false);
    }
}

/**
 * Gửi email trạng thái đơn cho khách (đặt hàng, được duyệt, bị hủy)
 * @returns {Promise<boolean>} true nếu gửi được
 */
async function sendOrderEmail(order) {
    if (!isEmailConfigured() || !order?.customerInfo?.email) return false;
    try {
        await api.sendOrderEmail(orderEmailParams(order));
        return true;
    } catch (error) {
        console.error('Không gửi được email:', error);
        return false;
    }
}

/**
 * Dữ liệu gửi cho script email (setup/email-script/Code.gs dựng nội dung email từ đây)
 */
function orderEmailParams(order) {
    const { bankId, bankName, accountNo, accountName } = SHOP.bank;
    const total = ui.formatPrice(order.totalAmount);
    const code = ui.orderCodeOf(order);
    const lines = order.subtotal === undefined ? [] : [
        { label: 'Tạm tính', value: ui.formatPrice(order.subtotal) },
        ...(order.discount ? [{ label: `Giảm giá${order.couponCode ? ` (${order.couponCode})` : ''}`, value: `−${ui.formatPrice(order.discount)}` }] : []),
        { label: 'Phí vận chuyển', value: order.shippingFee ? ui.formatPrice(order.shippingFee) : 'Miễn phí' },
    ];
    return {
        to_email: order.customerInfo.email,
        to_name: order.customerInfo.name,
        shop_name: SHOP.name,
        order_id: code,
        order_date: new Date(order.timestamp).toLocaleString('vi-VN'),
        order_status: order.status,
        items: order.items.map(i => ({ name: i.name, quantity: i.quantity, total: ui.formatPrice(i.price * i.quantity) })),
        summary_lines: lines,
        order_total: total,
        phone: order.customerInfo.phone,
        shipping_address: order.customerInfo.address,
        payment_method: ui.PAYMENT_METHODS[order.paymentMethod],
        payment_instructions: order.paymentMethod === 'bank'
            ? (order.paymentStatus === 'Đã thanh toán' ? 'Cửa hàng đã nhận được tiền chuyển khoản. Cảm ơn bạn!'
                : `Vui lòng chuyển khoản ${total} tới ngân hàng ${bankName || bankId}, số tài khoản ${accountNo} (${accountName}), nội dung: ${ui.transferContent(code)}.`)
            : 'Bạn thanh toán bằng tiền mặt khi nhận hàng.',
    };
}

async function orderView(id) {
    const order = await api.getOrderById(id);
    // Vừa đặt xong (≤ 30 phút) → trang cảm ơn; xem lại đơn đã đặt (từ trang Tài khoản) → trang chi tiết đơn
    const justPlaced = Date.now() - new Date(order.timestamp) < 30 * 60 * 1000;
    return () => {
        const code = ui.escapeHtml(ui.orderCodeOf(order));
        setTitle(justPlaced ? 'Đặt hàng thành công' : `Đơn hàng #${ui.orderCodeOf(order)}`);
        app.innerHTML = `<div class="container">${justPlaced ? ui.OrderSuccess(order) : `
            <div class="lookup-page">
                <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/tai-khoan">Tài khoản</a><span>/</span><span aria-current="page">Đơn #${code}</span></nav>
                <h1 class="page-title">Đơn hàng #${code}</h1>
                ${ui.OrderLookupResult(order)}
            </div>`}</div>`;
    };
}

// ===================== Tra cứu đơn hàng =====================

const normalizePhone = s => String(s || '').replace(/\D/g, '');

async function lookupView() {
    const code = hashParams().get('code') || '';
    return () => {
        setTitle('Tra cứu đơn hàng');
        app.innerHTML = `<div class="container">${ui.OrderLookupPage(code)}</div>`;
        const form = document.getElementById('lookup-form');
        const user = auth.currentUser();
        if (user?.phone) form.phone.value = user.phone;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            const result = document.getElementById('lookup-result');
            try {
                const order = await api.findOrderByCode(form.code.value.trim().replace(/^#/, '').toUpperCase())
                    || await api.findOrderByCode(form.code.value.trim().replace(/^#/, ''));
                // Chỉ hiện đơn khi số điện thoại khớp để người khác không xem được đơn của bạn
                const match = order && normalizePhone(order.customerInfo?.phone) === normalizePhone(form.phone.value) ? order : null;
                result.innerHTML = ui.OrderLookupResult(match);
            } catch (error) {
                toast(error.message, 'error');
            } finally {
                btn.disabled = false;
            }
        });
    };
}

// ===================== Yêu thích =====================

async function wishlistView() {
    const { products } = await loadCatalog();
    return () => renderWishlist(products);
}

function renderWishlist(products) {
    setTitle('Yêu thích');
    const ids = wishlist.getWishlist();
    app.innerHTML = ui.WishlistPage(products.filter(p => ids.includes(String(p.id))));
}

// ===================== Đăng nhập / Đăng ký / Tài khoản =====================

// Trang được phép quay lại sau khi đăng nhập (?next=...), tránh chuyển hướng tới địa chỉ lạ
const NEXT_PAGES = { admin: '#/admin', checkout: '#/checkout', account: '#/tai-khoan' };

/** Nút tài khoản trên header: "Đăng nhập / Đăng ký" hoặc "Xin chào, <tên>" */
function updateAccountLink() {
    const user = auth.currentUser();
    const link = document.getElementById('account-link');
    const label = document.getElementById('account-label');
    if (user) {
        const firstName = String(user.name || '').trim().split(/\s+/).pop();
        link.href = '#/tai-khoan';
        link.setAttribute('aria-label', `Tài khoản của ${user.name}`);
        label.innerHTML = `Xin chào<br>${ui.escapeHtml(firstName)}`;
    } else {
        link.href = '#/dang-nhap';
        link.setAttribute('aria-label', 'Đăng nhập hoặc đăng ký');
        label.innerHTML = 'Đăng nhập<br>Đăng ký';
    }
}

function afterLogin(user) {
    auth.setSession(user);
    updateAccountLink();
    const next = NEXT_PAGES[hashParams().get('next')];
    window.location.hash = next && (next !== '#/admin' || auth.isManager()) ? next
        : auth.isManager() ? '#/admin' : '#/tai-khoan';
}

async function authView(mode) {
    if (auth.currentUser()) {
        window.location.hash = '#/tai-khoan';
        return null;
    }
    return () => {
        setTitle(mode === 'login' ? 'Đăng nhập' : 'Đăng ký');
        app.innerHTML = `<div class="container">${ui.AuthPage(mode)}</div>`;
        // Giữ ?next=... khi chuyển giữa 2 tab
        const next = hashParams().get('next');
        if (next) app.querySelectorAll('.auth-tabs a, .auth-switch a').forEach(a => { a.href += `?next=${encodeURIComponent(next)}`; });
        if (mode === 'login') bindLoginForm();
        else bindRegisterForm();
    };
}

function bindLoginForm() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            const user = await api.findUser(form.identifier.value);
            if (!(await auth.verifyPassword(form.password.value, user))) {
                toast('Sai tài khoản hoặc mật khẩu.', 'error');
                form.password.value = '';
                return;
            }
            toast(`Xin chào ${user.name}! 💕`);
            afterLogin(user);
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            btn.disabled = false;
        }
    });
}

function bindRegisterForm() {
    const form = document.getElementById('register-form');
    form.addEventListener('focusout', (e) => { if (e.target.matches('input')) showFieldError(e.target); });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: form.name.value.trim(),
            email: form.email.value.trim().toLowerCase(),
            phone: form.phone.value.trim(),
        };
        const password = form.password.value;
        const error = !data.name ? 'Vui lòng nhập họ và tên.'
            : auth.passwordError(password)
            || (password !== form.confirm.value ? 'Mật khẩu nhập lại chưa khớp.' : '');
        if (error) return toast(error, 'error');

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        try {
            if (await api.findUser(data.email)) return toast('Email này đã được đăng ký. Bạn đăng nhập nhé!', 'error');
            if (await api.findUser(data.phone)) return toast('Số điện thoại này đã được đăng ký.', 'error');
            const salt = auth.randomSalt();
            const user = await api.createUser({
                ...data,
                role: auth.ROLES.CUSTOMER, // đăng ký chỉ tạo khách hàng; quyền quản lý do Quản lý cấp
                salt,
                passwordHash: await auth.hashPassword(password, salt),
                createdAt: new Date().toISOString(),
            });
            toast('Tạo tài khoản thành công! 🎉');
            afterLogin(user);
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            btn.disabled = false;
        }
    });
}

async function accountView() {
    const session = auth.currentUser();
    if (!session) {
        window.location.hash = '#/dang-nhap?next=account';
        return null;
    }
    // Lấy bản mới nhất (Quản lý có thể vừa đổi quyền)
    const [user, orders] = await Promise.all([
        api.findUser(session.email || session.username || session.phone).catch(() => null),
        api.getOrdersByUser(session.id),
    ]);
    if (!user) {
        auth.clearSession();
        updateAccountLink();
        window.location.hash = '#/dang-nhap';
        return null;
    }
    auth.setSession(user);
    return () => {
        setTitle('Tài khoản');
        app.innerHTML = `<div class="container">${ui.AccountPage(user, sortNewestOrders(orders), auth.isManager())}</div>`;
        document.getElementById('logout-btn').addEventListener('click', logout);
    };
}

const sortNewestOrders = orders => [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

function logout() {
    auth.clearSession();
    updateAccountLink();
    toast('Đã đăng xuất. Hẹn gặp lại bạn! 👋', 'info');
    window.location.hash = '#/';
}

// ===================== Sự kiện chung trên các trang =====================

// Nút "Hiện/Ẩn" mật khẩu
app.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-password');
    if (!btn) return;
    const input = btn.previousElementSibling;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Ẩn' : 'Hiện';
    btn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
});

// Nút "Sao chép" số tài khoản / số tiền / nội dung chuyển khoản
app.addEventListener('click', async (e) => {
    const button = e.target.closest('.copy-btn');
    if (!button) return;
    try {
        await navigator.clipboard.writeText(button.dataset.copy);
        toast('Đã sao chép');
    } catch {
        toast('Trình duyệt không cho phép sao chép, vui lòng chép thủ công.', 'error');
    }
});

// Nút trái tim yêu thích
app.addEventListener('click', (e) => {
    const button = e.target.closest('[data-wish]');
    if (!button) return;
    e.preventDefault();
    const wished = wishlist.toggleWish(button.dataset.wish);
    document.querySelectorAll(`[data-wish="${CSS.escape(button.dataset.wish)}"]`).forEach(b => {
        b.classList.toggle('is-wished', wished);
        b.setAttribute('aria-pressed', wished);
        b.setAttribute('aria-label', wished ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích');
        const label = b.nextElementSibling;
        if (label?.classList.contains('wish-label')) label.textContent = wished ? 'Đã lưu vào yêu thích' : 'Lưu vào yêu thích';
    });
    toast(wished ? 'Đã lưu vào yêu thích 💗' : 'Đã bỏ khỏi yêu thích', 'info');
    if (!wished && window.location.hash === '#/wishlist') {
        button.closest('.product-card')?.remove();
        if (!app.querySelector('.product-card')) router(); // hết sản phẩm → hiện lời nhắc trống
    }
});

// Nút "Thêm vào giỏ" trên thẻ sản phẩm
app.addEventListener('click', async (e) => {
    const button = e.target.closest('.add-to-cart-btn');
    if (!button) return;
    e.preventDefault();

    button.disabled = true;
    try {
        // Lấy tồn kho mới nhất trước khi thêm
        const product = await api.getProductById(button.dataset.id);
        if (!cart.addToCart(product, 1)) {
            toast('Sản phẩm đã đạt số lượng tồn kho tối đa trong giỏ!', 'error');
            return;
        }
        updateCartIcon(true);
        button.textContent = 'Đã thêm ✓';
        setTimeout(() => { button.textContent = 'Thêm vào giỏ'; }, 1400);
        toast('Đã thêm vào giỏ hàng 🛍️');
    } catch (error) {
        toast('Không thể thêm sản phẩm vào giỏ hàng!', 'error');
    } finally {
        button.disabled = false;
    }
});

// Trang quản lý
app.addEventListener('click', (e) => {
    if (window.location.hash.startsWith('#/admin')) admin.handleClick(e);
});

// Ô tìm kiếm trên header
document.getElementById('header-search').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    window.location.hash = q ? `#/products?q=${encodeURIComponent(q)}` : '#/products';
    e.target.q.blur();
});

// ===================== Trạng thái trang =====================

function showLoading() {
    app.innerHTML = '<div class="container"><div class="loading">Đang tải</div></div>';
}

function showErrorPage(message) {
    setTitle('Lỗi');
    app.innerHTML = `
        <div class="container">
            <div class="error-message">
                <h2>Ối, có chút trục trặc</h2>
                <p>${ui.escapeHtml(message)}</p>
                <div class="error-actions">
                    <button type="button" class="btn" onclick="location.reload()">Thử lại</button>
                    <a href="#/" class="btn btn-secondary">Về trang chủ</a>
                </div>
            </div>
        </div>
    `;
}

function show404Page() {
    setTitle('Không tìm thấy trang');
    app.innerHTML = `
        <div class="container">
            <div class="error-message">
                <h2>404 - Trang không tồn tại</h2>
                <p>Xin lỗi, trang bạn tìm kiếm không tồn tại.</p>
                <a href="#/" class="btn">Quay về trang chủ</a>
            </div>
        </div>
    `;
}

// ===================== Khởi động =====================

async function init() {
    await loadLocalConfig(); // tài khoản ngân hàng, URL script email (file riêng, không lên GitHub)
    document.getElementById('category-bar').innerHTML = ui.CategoryBar();
    // Màn hình nhỏ: chữ gợi ý ngắn để không bị cắt
    if (window.innerWidth < 768) document.getElementById('header-search-input').placeholder = 'Tìm son, serum, thương hiệu...';
    updateCartIcon();
    wishlist.updateWishCount();
    updateAccountLink();
    // Nội dung do Quản lý chỉnh; lỗi tải thì dùng mặc định để trang vẫn chạy
    applySettings(await api.getSettings().catch(() => ({})));
    router();
    window.addEventListener('hashchange', router);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
