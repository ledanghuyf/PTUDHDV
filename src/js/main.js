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
];

let renderId = 0;

async function router() {
    const hash = window.location.hash || '#/';
    const currentRender = ++renderId;

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

async function checkoutView() {
    const cartItems = cart.getCart();

    if (cartItems.length === 0) {
        toast('Giỏ hàng của bạn đang trống!', 'info');
        window.location.hash = '#/products';
        return null;
    }

    return () => {
        setTitle('Thanh toán');
        app.innerHTML = `<div class="container">${ui.CheckoutPage(cartItems, cart.getCartTotal())}</div>`;
        document.getElementById('checkout-form').addEventListener('submit', handleCheckoutSubmit);
    };
}

async function handleCheckoutSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('.btn-submit-order');

    const customerInfo = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        address: form.address.value.trim()
    };
    const paymentMethod = form.payment.value === 'bank' && isBankConfigured() ? 'bank' : 'cod';

    // `required` vẫn cho qua chuỗi toàn khoảng trắng
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email || !customerInfo.address) {
        toast('Vui lòng điền đầy đủ thông tin giao hàng!', 'error');
        return;
    }

    const setBusy = busy => {
        submitButton.disabled = busy;
        submitButton.textContent = busy ? 'Đang xử lý...' : 'Xác nhận đặt hàng';
    };
    setBusy(true);

    const items = cart.getCart();

    try {
        // Lấy tồn kho mới nhất từ server (giỏ trong localStorage có thể đã cũ)
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

        const order = await api.createOrder({
            customerInfo,
            items: orderItems,
            totalAmount: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
            paymentMethod,
            paymentStatus: 'Chưa thanh toán',
            status: paymentMethod === 'bank' ? 'Chờ chuyển khoản' : 'Chờ xác nhận',
            timestamp: new Date().toISOString()
        });

        // Trừ tồn kho, cộng lượt bán; lỗi ở bước này không báo "đặt hàng lỗi" để khách không đặt trùng đơn
        try {
            await Promise.all(items.map((item, i) => api.updateProduct(item.id, {
                stock: latestProducts[i].stock - item.quantity,
                soldCount: (latestProducts[i].soldCount || 0) + item.quantity
            })));
        } catch (stockError) {
            console.error('Đơn đã tạo nhưng không cập nhật được tồn kho:', stockError);
        }

        cart.clearCart();
        updateCartIcon();

        // Gửi email xác nhận; lỗi gửi email không làm hỏng đơn đã tạo
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

        toast('Đặt hàng thành công!');
        window.location.hash = `#/order/${order.id}`;
    } catch (error) {
        console.error('Lỗi không thể gửi đơn hàng:', error);
        toast('Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!', 'error');
        setBusy(false);
    }
}

/**
 * Biến truyền vào template EmailJS (xem README.md để tạo template)
 */
function orderEmailParams(order) {
    const { bankId, bankName, accountNo, accountName } = SHOP.bank;
    const total = ui.formatPrice(order.totalAmount);
    return {
        to_email: order.customerInfo.email,
        to_name: order.customerInfo.name,
        shop_name: SHOP.name,
        order_id: order.id,
        order_date: new Date(order.timestamp).toLocaleString('vi-VN'),
        // Dùng {{{order_items}}} trong template để giữ thẻ <br>
        order_items: order.items.map(i => `- ${ui.escapeHtml(i.name)} x${i.quantity}: ${ui.formatPrice(i.price * i.quantity)}`).join('<br>'),
        order_total: total,
        phone: order.customerInfo.phone,
        shipping_address: order.customerInfo.address,
        payment_method: ui.PAYMENT_METHODS[order.paymentMethod],
        payment_instructions: order.paymentMethod === 'bank'
            ? `Vui lòng chuyển khoản ${total} tới ngân hàng ${bankName || bankId}, số tài khoản ${accountNo} (${accountName}), nội dung: ${ui.transferContent(order.id)}.`
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
