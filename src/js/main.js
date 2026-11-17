/**
 * Main JS - Điều khiển ứng dụng: routing, render trang và xử lý sự kiện
 */

import * as api from './api.js';
import * as cart from './cart.js';
import * as ui from './components.js';
import { SHOP, isBankConfigured, isEmailConfigured } from './config.js';

const app = document.getElementById('app');
const PRODUCTS_PER_PAGE = 8;     // 2 hàng x 4 cột
const FEATURED_THRESHOLD = 4.0;  // Điểm tối thiểu để được gắn nhãn "Nổi bật"

// Cách sắp xếp tương ứng với SORT_OPTIONS trong components.js
const SORTERS = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'best-selling': (a, b) => (b.soldCount || 0) - (a.soldCount || 0),
    'rating': (a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount,
};

// ===================== Tiện ích giao diện =====================

/**
 * Hiện thông báo nhỏ góc màn hình (thay cho alert)
 * @param {'success'|'error'|'info'} type
 */
function toast(message, type = 'success') {
    const root = document.getElementById('toast-root');
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

function setTitle(title) {
    document.title = title ? `${title} | Cosmetics Store` : 'Cosmetics Store – Mỹ phẩm chính hãng';
}

function updateCartIcon() {
    cart.updateCartCount();
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

// ===================== Router =====================

// Mỗi trang: tải dữ liệu rồi trả về hàm mount() để vẽ giao diện
const routes = [
    [/^#\/$/, homeView],
    [/^#\/products(\?.*)?$/, productsView],
    [/^#\/product\/([^/?]+)$/, productDetailView],
    [/^#\/cart$/, cartView],
    [/^#\/checkout$/, checkoutView],
    [/^#\/order\/([^/?]+)$/, orderView],
    [/^#\/admin$/, adminView],
];

let renderId = 0;

async function router() {
    const hash = window.location.hash || '#/';
    const currentRender = ++renderId;
    clearInterval(adminPollTimer); // rời trang quản trị thì dừng tự cập nhật

    window.scrollTo(0, 0);
    updateActiveNav(hash);
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

function updateActiveNav(hash) {
    const section = hash.startsWith('#/product') ? '#/products'
        : (hash === '#/cart' || hash === '#/checkout') ? '#/cart'
        : hash === '#/' ? '#/' : null;
    document.querySelectorAll('.nav-links a').forEach(link => {
        const isActive = link.getAttribute('href') === section;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
}

// ===================== Trang chủ =====================

async function homeView() {
    const { products } = await loadCatalog();

    return () => {
        setTitle('');
        app.innerHTML = ui.HomePage();

        const featured = products.filter(p => p.isFeatured).sort((a, b) => b.score - a.score);
        document.getElementById('featured-product-list').innerHTML = featured.map(ui.ProductCard).join('');
        initCarousel();

        initProductListing(products, 'home-');
    };
}

/**
 * Carousel sản phẩm nổi bật: cuộn ngang bằng scroll-snap, nút trước/sau cuộn 1 khung
 */
function initCarousel() {
    const track = document.getElementById('featured-product-list');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    const update = () => {
        prevBtn.disabled = track.scrollLeft <= 2;
        nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };

    prevBtn.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    update();
}

// ===================== Danh sách sản phẩm (dùng chung) =====================

/**
 * Gắn bộ lọc, sắp xếp và "Xem thêm" cho khối ProductListing
 * @param {Array} products - Sản phẩm đã qua loadCatalog
 * @param {string} prefix - Tiền tố id của khối ('' hoặc 'home-')
 */
function initProductListing(products, prefix) {
    const $ = id => document.getElementById(prefix + id);
    let currentPage = 1;
    let filtered = [];

    function render() {
        const shown = filtered.slice(0, currentPage * PRODUCTS_PER_PAGE);
        $('products-grid').innerHTML = shown.length ? shown.map(ui.ProductCard).join('') : ui.EmptyResult();
        $('result-count').textContent = `${filtered.length} sản phẩm`;
        $('load-more-wrapper').classList.toggle('hidden', shown.length >= filtered.length);
    }

    function applyFilters() {
        const term = $('search-input').value.trim().toLowerCase();
        const category = $('category-filter').value;
        let minPrice = parseFloat($('min-price').value) || 0;
        let maxPrice = parseFloat($('max-price').value) || Infinity;
        if (minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

        filtered = products.filter(p =>
            `${p.name} ${p.brand}`.toLowerCase().includes(term) &&
            (!category || p.category === category) &&
            p.price >= minPrice && p.price <= maxPrice
        );

        const sorter = SORTERS[$('sort').value];
        if (sorter) filtered.sort(sorter);

        currentPage = 1;
        render();
    }

    ['search-input', 'min-price', 'max-price'].forEach(id => $(id).addEventListener('input', applyFilters));
    ['category-filter', 'sort'].forEach(id => $(id).addEventListener('change', applyFilters));
    $('load-more-btn').addEventListener('click', () => { currentPage++; render(); });

    applyFilters();
}

async function productsView() {
    const { products } = await loadCatalog();
    const category = new URLSearchParams(window.location.hash.split('?')[1] || '').get('category') || '';

    return () => {
        setTitle(ui.CATEGORY_NAMES[category] || 'Sản phẩm');
        app.innerHTML = ui.ProductsPage(category);
        initProductListing(products, '');
    };
}

// ===================== Chi tiết sản phẩm =====================

async function productDetailView(id) {
    const { products, reviews } = await loadCatalog();
    const product = products.find(p => String(p.id) === String(id));
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
        attachAddToCartListener(product);
        attachReviewFormListener(product.id);
    };
}

const sortNewestFirst = reviews => [...reviews].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

function attachQuantityStepper(product) {
    const input = document.getElementById('quantity-input');
    document.querySelectorAll('.qty-step').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = (parseInt(input.value) || 1) + Number(btn.dataset.step);
            input.value = Math.min(product.stock, Math.max(1, next));
        });
    });
}

function attachAddToCartListener(product) {
    const addToCartBtn = document.querySelector('.btn-add-to-cart');
    if (!addToCartBtn) return;

    addToCartBtn.addEventListener('click', () => {
        const quantity = Number(document.getElementById('quantity-input').value);

        // null = số lượng không hợp lệ hoặc vượt tồn kho
        if (!cart.addToCart(product, quantity)) {
            const inCart = cart.getProductQuantityInCart(product.id);
            toast(`Số lượng không hợp lệ. Tồn kho: ${product.stock}, đã có trong giỏ: ${inCart}.`, 'error');
            return;
        }

        updateCartIcon();
        toast(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
    });
}

function attachReviewFormListener(productId) {
    const reviewForm = document.getElementById('review-form');
    if (!reviewForm) return;

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
                productId: parseInt(productId),
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
            toast('Cảm ơn bạn đã đánh giá sản phẩm!');
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

    app.innerHTML = `<div class="container">${ui.CartPage(cartItems, cart.getCartTotal(), cart.getCartItemCount())}</div>`;
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

    on('.remove-btn', id => {
        if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
            cart.removeFromCart(id);
            renderCart();
        }
    });

    document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
            cart.clearCart();
            renderCart();
        }
    });
}

// ===================== Thanh toán =====================

// Mã đơn tạo sẵn khi mở trang thanh toán để mã VietQR có đúng nội dung chuyển khoản trước khi đặt
// Bỏ 0/O, 1/I/L để khách không gõ nhầm khi tự nhập nội dung chuyển khoản
const ORDER_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newOrderCode = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => ORDER_CODE_CHARS[b % ORDER_CODE_CHARS.length]).join('');

async function checkoutView() {
    const cartItems = cart.getCart();

    if (cartItems.length === 0) {
        toast('Giỏ hàng của bạn đang trống!', 'info');
        window.location.hash = '#/products';
        return null;
    }

    // Cập nhật giá/tồn kho mới nhất vào giỏ để số tiền trên mã QR khớp với đơn sẽ tạo
    const latest = await Promise.all(cartItems.map(item => api.getProductById(item.id)));
    cart.saveCart(cartItems.map((item, i) => ({ ...item, price: latest[i].price, stock: latest[i].stock })));
    const orderCode = newOrderCode();

    return () => {
        setTitle('Thanh toán');
        const total = cart.getCartTotal();
        app.innerHTML = `<div class="container">${ui.CheckoutPage(cart.getCart(), total, orderCode)}</div>`;

        const form = document.getElementById('checkout-form');
        const submitButton = form.querySelector('.btn-submit-order');
        const address = initAddressPicker(form);

        // Chỉ cho bấm "Xác nhận đặt hàng" khi mọi trường (kể cả địa chỉ) hợp lệ
        const refreshSubmit = () => {
            const ready = form.checkValidity() && address.isValid();
            submitButton.disabled = !ready;
            document.getElementById('submit-hint').classList.toggle('hidden', ready);
        };
        address.onChange = refreshSubmit;
        form.addEventListener('input', refreshSubmit);
        form.addEventListener('change', refreshSubmit);

        // Chọn chuyển khoản → hiện mã VietQR (đúng số tiền + nội dung CS<mã đơn>)
        const qrPanel = document.getElementById('bank-qr-panel');
        form.addEventListener('change', (e) => {
            if (e.target.name === 'payment' && qrPanel) qrPanel.hidden = e.target.value !== 'bank';
        });

        form.addEventListener('submit', (e) => handleCheckoutSubmit(e, { orderCode, shownTotal: total, address }));
    };
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
        if (!province || !ward || !houseRe.test(houseNumber) || !streetRe.test(street)) return null;
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

async function handleCheckoutSubmit(event, { orderCode, shownTotal, address }) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('.btn-submit-order');
    const addressDetail = address.value();

    const customerInfo = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        address: addressDetail
            ? `${addressDetail.houseNumber} ${addressDetail.street}, ${addressDetail.wardName}, ${addressDetail.provinceName}`
            : '',
        addressDetail,
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
        // Kiểm tra tồn kho mới nhất (chưa trừ kho: chỉ trừ khi Admin duyệt đơn)
        const latestProducts = await Promise.all(items.map(item => api.getProductById(item.id)));
        const shortIndex = items.findIndex((item, i) => latestProducts[i].stock < item.quantity);
        if (shortIndex !== -1) {
            toast(`Sản phẩm "${items[shortIndex].name}" chỉ còn ${latestProducts[shortIndex].stock} trong kho. Vui lòng cập nhật lại giỏ hàng!`, 'error');
            setBusy(false);
            return;
        }

        // Tính lại tiền theo giá hiện tại trên server
        const orderItems = items.map((item, i) => ({
            id: item.id,
            name: item.name,
            price: latestProducts[i].price,
            quantity: item.quantity
        }));
        const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Giá vừa đổi → số tiền trên mã QR đang hiện không còn đúng: tải lại trang thanh toán
        if (totalAmount !== shownTotal) {
            toast('Giá sản phẩm vừa thay đổi, vui lòng kiểm tra lại tổng tiền trước khi đặt.', 'info');
            router();
            return;
        }

        const order = await api.createOrder({
            code: orderCode,
            customerInfo,
            items: orderItems,
            totalAmount,
            paymentMethod,
            paymentStatus: 'Chưa thanh toán',
            status: ui.ORDER_STATUS.PENDING,
            stockApplied: false, // Admin duyệt mới trừ kho
            timestamp: new Date().toISOString()
        });

        cart.clearCart();
        updateCartIcon();

        // Email xác nhận cho khách + bản sao báo đơn mới cho Admin; lỗi gửi email không làm hỏng đơn đã tạo
        if (isEmailConfigured()) {
            submitButton.textContent = 'Đang gửi email xác nhận...';
            try {
                await api.sendOrderEmail(orderEmailParams(order));
                await api.updateOrder(order.id, { emailSent: true });
            } catch (emailError) {
                console.error('Không gửi được email xác nhận:', emailError);
                toast('Đơn đã tạo nhưng chưa gửi được email xác nhận.', 'info');
            }
        }

        toast('Đặt hàng thành công! Đơn đang chờ cửa hàng duyệt.');
        window.location.hash = `#/order/${order.id}`;
    } catch (error) {
        console.error('Lỗi không thể gửi đơn hàng:', error);
        toast('Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!', 'error');
        setBusy(false);
    }
}

/**
 * Dữ liệu gửi cho script email (setup/email-script/Code.gs dựng nội dung email từ đây)
 */
function orderEmailParams(order) {
    const { bankId, bankName, accountNo, accountName } = SHOP.bank;
    const total = ui.formatPrice(order.totalAmount);
    const code = ui.orderCodeOf(order);
    return {
        to_email: order.customerInfo.email,
        to_name: order.customerInfo.name,
        shop_name: SHOP.name,
        order_id: code,
        order_date: new Date(order.timestamp).toLocaleString('vi-VN'),
        order_status: order.status,
        items: order.items.map(i => ({ name: i.name, quantity: i.quantity, total: ui.formatPrice(i.price * i.quantity) })),
        order_total: total,
        phone: order.customerInfo.phone,
        shipping_address: order.customerInfo.address,
        payment_method: ui.PAYMENT_METHODS[order.paymentMethod],
        payment_instructions: order.paymentMethod === 'bank'
            ? `Vui lòng chuyển khoản ${total} tới ngân hàng ${bankName || bankId}, số tài khoản ${accountNo} (${accountName}), nội dung: ${ui.transferContent(code)}.`
            : 'Bạn thanh toán bằng tiền mặt khi nhận hàng.',
    };
}

async function orderView(id) {
    const order = await api.getOrderById(id);
    return () => {
        setTitle('Đặt hàng thành công');
        app.innerHTML = `<div class="container">${ui.OrderSuccess(order)}</div>`;
    };
}

// ===================== Quản trị: duyệt đơn =====================

const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_POLL_MS = 10000;
let adminPollTimer = null;
let adminTab = 'pending';
let adminOrders = [];

const isAdminLoggedIn = () => {
    try { return sessionStorage.getItem(ADMIN_SESSION_KEY) === SHOP.adminPasswordHash; } catch { return false; }
};

async function sha256Hex(text) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const sortNewestOrders = orders => [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
const canAskNotify = () => 'Notification' in window && Notification.permission === 'default';

async function adminView() {
    if (!isAdminLoggedIn()) {
        return () => {
            setTitle('Quản trị');
            app.innerHTML = `<div class="container">${ui.AdminLogin()}</div>`;
            document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const hash = await sha256Hex(document.getElementById('admin-password').value);
                if (hash !== SHOP.adminPasswordHash) {
                    toast('Sai mật khẩu quản trị.', 'error');
                    return;
                }
                try { sessionStorage.setItem(ADMIN_SESSION_KEY, hash); } catch { /* chế độ ẩn danh: đăng nhập lại mỗi lần */ }
                router();
            });
        };
    }

    adminOrders = sortNewestOrders(await api.getOrders());
    return () => {
        renderAdmin();
        // Tự cập nhật: phát hiện đơn mới "Chờ duyệt" → thông báo ngay cho Admin
        let knownPending = new Set(adminOrders.filter(ui.isPendingOrder).map(o => o.id));
        adminPollTimer = setInterval(async () => {
            try {
                adminOrders = sortNewestOrders(await api.getOrders());
            } catch (error) {
                console.error('Không tải được đơn hàng:', error);
                return;
            }
            const pending = adminOrders.filter(ui.isPendingOrder);
            const fresh = pending.filter(o => !knownPending.has(o.id));
            knownPending = new Set(pending.map(o => o.id));
            if (fresh.length) notifyNewOrders(fresh);
            renderAdmin();
        }, ADMIN_POLL_MS);
    };
}

function renderAdmin() {
    const pendingCount = adminOrders.filter(ui.isPendingOrder).length;
    document.title = `${pendingCount ? `(${pendingCount}) ` : ''}Quản trị đơn hàng | Cosmetics Store`;
    app.innerHTML = `<div class="container">${ui.AdminDashboard(adminOrders, adminTab, canAskNotify())}</div>`;
}

function notifyNewOrders(orders) {
    const message = orders.length === 1
        ? `Đơn mới #${ui.orderCodeOf(orders[0])} - ${ui.formatPrice(orders[0].totalAmount)}`
        : `Có ${orders.length} đơn hàng mới chờ duyệt`;
    toast(message, 'info');
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Cosmetics Store - Đơn chờ duyệt', { body: message });
    }
}

/**
 * Cộng/trừ tồn kho theo đơn (sign = -1 trừ kho khi duyệt, +1 hoàn kho khi hủy đơn cũ đã trừ)
 */
async function applyStock(order, sign) {
    const latest = await Promise.all(order.items.map(i => api.getProductById(i.id)));
    if (sign < 0) {
        const k = order.items.findIndex((item, idx) => latest[idx].stock < item.quantity);
        if (k !== -1) throw new Error(`"${order.items[k].name}" chỉ còn ${latest[k].stock} trong kho, không đủ để duyệt đơn.`);
    }
    await Promise.all(order.items.map((item, idx) => api.updateProduct(item.id, {
        stock: latest[idx].stock + sign * item.quantity,
        soldCount: Math.max(0, (latest[idx].soldCount || 0) - sign * item.quantity),
    })));
}

const ADMIN_ACTIONS = {
    async approve(order) {
        // Đơn theo quy trình mới (stockApplied === false) mới trừ kho; đơn cũ đã trừ lúc đặt
        if (order.stockApplied === false) await applyStock(order, -1);
        await api.updateOrder(order.id, {
            status: ui.ORDER_STATUS.SHIPPING,
            stockApplied: true,
            approvedAt: new Date().toISOString(),
            // Chuyển khoản: Admin đã đối soát tiền trước khi duyệt
            ...(order.paymentMethod === 'bank' ? { paymentStatus: 'Đã thanh toán' } : {}),
        });
        return `Đã duyệt đơn #${ui.orderCodeOf(order)}, chuyển sang giao hàng.`;
    },
    async cancel(order) {
        if (!confirm(`Từ chối và hủy đơn #${ui.orderCodeOf(order)}?`)) return null;
        if (order.stockApplied !== false) await applyStock(order, +1); // hoàn kho cho đơn cũ đã trừ lúc đặt
        await api.updateOrder(order.id, { status: ui.ORDER_STATUS.CANCELLED, stockApplied: false, cancelledAt: new Date().toISOString() });
        return `Đã hủy đơn #${ui.orderCodeOf(order)}.`;
    },
    async deliver(order) {
        await api.updateOrder(order.id, { status: ui.ORDER_STATUS.DONE, paymentStatus: 'Đã thanh toán', deliveredAt: new Date().toISOString() });
        return `Đơn #${ui.orderCodeOf(order)} đã giao thành công.`;
    },
};

app.addEventListener('click', async (e) => {
    if (!window.location.hash.startsWith('#/admin')) return;
    const target = e.target.closest('button');
    if (!target) return;

    if (target.dataset.tab) {
        adminTab = target.dataset.tab;
        renderAdmin();
    } else if (target.id === 'admin-logout-btn') {
        try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* bỏ qua */ }
        router();
    } else if (target.id === 'admin-notify-btn') {
        await Notification.requestPermission();
        renderAdmin();
    } else if (target.dataset.action) {
        app.querySelectorAll('.admin-action').forEach(b => { b.disabled = true; });
        try {
            // Lấy bản mới nhất của đơn để không duyệt/hủy trùng khi 2 tab cùng thao tác
            const order = await api.getOrderById(target.dataset.id);
            const allowed = target.dataset.action === 'deliver' ? order.status === ui.ORDER_STATUS.SHIPPING : ui.isPendingOrder(order);
            if (!allowed) throw new Error('Đơn đã được xử lý ở nơi khác, danh sách sẽ được tải lại.');
            const message = await ADMIN_ACTIONS[target.dataset.action](order);
            if (message) toast(message);
        } catch (error) {
            console.error(error);
            toast(error.message, 'error');
        }
        adminOrders = sortNewestOrders(await api.getOrders().catch(() => adminOrders));
        renderAdmin();
    }
});

// ===================== Nút "Thêm vào giỏ" trên thẻ sản phẩm =====================

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
        updateCartIcon();
        toast(`Đã thêm "${product.name}" vào giỏ hàng`);
    } catch (error) {
        toast('Không thể thêm sản phẩm vào giỏ hàng!', 'error');
    } finally {
        button.disabled = false;
    }
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
                <h2>Đã xảy ra lỗi</h2>
                <p>${ui.escapeHtml(message)}</p>
                <a href="#/" class="btn">Quay về trang chủ</a>
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

function init() {
    updateCartIcon();
    router();
    window.addEventListener('hashchange', router);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
