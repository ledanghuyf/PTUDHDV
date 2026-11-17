/**
 * Components Module - Các hàm render component UI
 * Mỗi hàm trả về chuỗi HTML để chèn vào trang
 */

import { SHOP, isBankConfigured } from './config.js';

export const PAYMENT_METHODS = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank: 'Chuyển khoản ngân hàng',
};

// Nội dung chuyển khoản để cửa hàng đối soát đơn (đơn mới dùng mã đơn `code`, đơn cũ dùng id)
export const transferContent = orderCode => `CS${orderCode}`;
export const orderCodeOf = order => order.code || order.id;

// Quy trình duyệt đơn: Chờ duyệt → (Admin duyệt, trừ kho) Đang giao hàng → Đã giao; hoặc Đã hủy
export const ORDER_STATUS = { PENDING: 'Chờ duyệt', SHIPPING: 'Đang giao hàng', DONE: 'Đã giao', CANCELLED: 'Đã hủy' };
// Đơn tạo trước khi có quy trình duyệt: đã trừ kho lúc đặt
const LEGACY_PENDING = ['Chờ xác nhận', 'Chờ chuyển khoản'];
export const isPendingOrder = order => order.status === ORDER_STATUS.PENDING || LEGACY_PENDING.includes(order.status);

// Số nhà phải có chữ số; tên đường phải có chữ cái. Dùng chung cho thuộc tính pattern (cờ v) và kiểm tra JS (cờ u)
export const HOUSE_NUMBER_PATTERN = String.raw`(?=.*\d)[\p{L}\d\s\/.,\-]{1,30}`;
export const STREET_PATTERN = String.raw`(?=.*\p{L})[\p{L}\d\s\/.,'\-]{2,80}`;

// Danh mục sản phẩm (id khớp với trường category trong db.json)
export const CATEGORIES = [
    { id: 'serum', name: 'Serum', desc: 'Tinh chất dưỡng da',
      icon: '<path d="M32 8L28 20H36L32 8Z" fill="currentColor" opacity="0.3"/><rect x="24" y="20" width="16" height="4" rx="1" fill="currentColor"/><path d="M26 24H38V52C38 54.2 36.2 56 34 56H30C27.8 56 26 54.2 26 52V24Z" fill="currentColor" opacity="0.7"/><circle cx="32" cy="40" r="6" fill="currentColor" opacity="0.4"/>' },
    { id: 'kem-duong', name: 'Kem Dưỡng', desc: 'Dưỡng ẩm chuyên sâu',
      icon: '<ellipse cx="32" cy="44" rx="18" ry="12" fill="currentColor" opacity="0.7"/><ellipse cx="32" cy="36" rx="18" ry="8" fill="currentColor"/><path d="M20 36V44M44 36V44" stroke="currentColor" stroke-width="2" opacity="0.5"/>' },
    { id: 'sua-rua-mat', name: 'Sữa Rửa Mặt', desc: 'Làm sạch dịu nhẹ',
      icon: '<path d="M24 16H40L42 20H22L24 16Z" fill="currentColor"/><rect x="22" y="20" width="20" height="36" rx="4" fill="currentColor" opacity="0.7"/><circle cx="32" cy="38" r="8" fill="currentColor" opacity="0.4"/><path d="M28 28H36" stroke="white" stroke-width="2" stroke-linecap="round"/>' },
    { id: 'chong-nang', name: 'Chống Nắng', desc: 'Bảo vệ da',
      icon: '<circle cx="32" cy="24" r="12" fill="currentColor" opacity="0.4"/><path d="M32 8V12M32 36V40M44 24H48M16 24H20M41 15L44 12M20 36L23 33M44 36L41 33M20 12L23 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="24" y="42" width="16" height="14" rx="3" fill="currentColor" opacity="0.7"/><rect x="28" y="38" width="8" height="6" fill="currentColor"/>' },
    { id: 'mat-na', name: 'Mặt Nạ', desc: 'Chăm sóc đặc biệt',
      icon: '<ellipse cx="32" cy="36" rx="20" ry="16" fill="currentColor" opacity="0.7"/><ellipse cx="24" cy="32" rx="4" ry="3" fill="white" opacity="0.6"/><ellipse cx="40" cy="32" rx="4" ry="3" fill="white" opacity="0.6"/><path d="M28 42C28 42 30 44 32 44C34 44 36 42 36 42" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.6"/><path d="M16 28C16 28 20 20 32 20C44 20 48 28 48 28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
    { id: 'toner', name: 'Toner', desc: 'Cân bằng da',
      icon: '<rect x="22" y="12" width="20" height="8" rx="2" fill="currentColor"/><path d="M24 20H40V52C40 54.2 38.2 56 36 56H28C25.8 56 24 54.2 24 52V20Z" fill="currentColor" opacity="0.7"/><path d="M28 32L36 32M28 40L36 40" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/><circle cx="32" cy="48" r="3" fill="white" opacity="0.4"/>' },
    { id: 'tay-trang', name: 'Tẩy Trang', desc: 'Làm sạch lớp trang điểm',
      icon: '<rect x="12" y="20" width="16" height="6" rx="2" fill="currentColor"/><path d="M14 26H26V52C26 54.2 24.2 56 22 56H18C15.8 56 14 54.2 14 52V26Z" fill="currentColor" opacity="0.7"/><circle cx="44" cy="42" r="12" fill="currentColor" opacity="0.4"/><circle cx="44" cy="42" r="6" stroke="white" stroke-width="2" opacity="0.6"/>' },
    { id: 'son-moi', name: 'Son Môi', desc: 'Son thỏi, son kem, tint',
      icon: '<path d="M26 30V16L38 10V30Z" fill="currentColor" opacity="0.8"/><rect x="24" y="30" width="16" height="8" rx="1" fill="currentColor" opacity="0.4"/><rect x="21" y="38" width="22" height="18" rx="3" fill="currentColor"/>' },
    { id: 'trang-diem', name: 'Trang Điểm', desc: 'Cushion, kem nền, mascara',
      icon: '<circle cx="28" cy="38" r="16" fill="currentColor" opacity="0.7"/><circle cx="28" cy="38" r="10" fill="currentColor" opacity="0.35"/><rect x="44" y="12" width="6" height="30" rx="3" fill="currentColor" transform="rotate(20 47 27)"/><rect x="46" y="40" width="8" height="14" rx="2" fill="currentColor" opacity="0.6" transform="rotate(20 50 47)"/>' },
];

export const CATEGORY_NAMES = Object.fromEntries(CATEGORIES.map(c => [c.id, c.name]));

export const SORT_OPTIONS = [
    ['', 'Mặc định'],
    ['best-selling', 'Bán chạy nhất'],
    ['rating', 'Đánh giá cao'],
    ['price-asc', 'Giá thấp → cao'],
    ['price-desc', 'Giá cao → thấp'],
];

/**
 * Format giá tiền sang định dạng VNĐ (VD: "750.000 ₫")
 */
export function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Escape nội dung do người dùng nhập để chống XSS khi chèn vào innerHTML
export function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Dãy 5 sao, tô màu theo điểm trung bình (hỗ trợ sao lẻ)
 */
export function Stars(rating) {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    return `<span class="stars" style="--rating:${value}" role="img" aria-label="${value.toFixed(1)} trên 5 sao"></span>`;
}

/**
 * Tóm tắt đánh giá: sao + điểm + số lượt
 */
export function RatingSummary(avgRating, reviewCount) {
    if (!reviewCount) return '<span class="rating-empty">Chưa có đánh giá</span>';
    return `${Stars(avgRating)}<span class="rating-value">${avgRating.toFixed(1)}</span><span class="rating-count">(${reviewCount} đánh giá)</span>`;
}

/**
 * Thẻ sản phẩm trong danh sách
 */
export function ProductCard(product) {
    const soldOut = product.stock <= 0;
    const badge = soldOut
        ? '<span class="product-badge soldout-badge">Hết hàng</span>'
        : product.isFeatured ? '<span class="product-badge featured-badge">Nổi bật</span>' : '';
    const link = `#/product/${product.id}`;

    return `
        <article class="product-card${soldOut ? ' is-soldout' : ''}" data-id="${product.id}">
            ${badge}
            <a class="product-media" href="${link}" tabindex="-1" aria-hidden="true">
                <img src="${product.image}" alt="" class="product-image" loading="lazy"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="product-image-fallback" style="display: none;">🧴</div>
            </a>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <h3 class="product-name"><a href="${link}">${product.name}</a></h3>
                <div class="product-rating">${RatingSummary(product.avgRating || 0, product.reviewCount || 0)}</div>
                <p class="product-description-short">${product.description_short || ''}</p>
                <div class="product-price">${formatPrice(product.price)}</div>
                <button class="btn add-to-cart-btn" data-id="${product.id}" ${soldOut ? 'disabled' : ''}>
                    ${soldOut ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                </button>
            </div>
        </article>
    `;
}

/**
 * Thanh lọc + lưới sản phẩm + nút xem thêm (dùng chung cho trang chủ và trang sản phẩm)
 * @param {string} prefix - Tiền tố id để 2 trang không trùng id ('' hoặc 'home-')
 * @param {string} selectedCategory - Danh mục chọn sẵn
 */
export function ProductListing(prefix, selectedCategory = '') {
    return `
        <div class="filter-bar">
            <div class="filter-item filter-search">
                <label for="${prefix}search-input">Tìm kiếm</label>
                <input type="search" id="${prefix}search-input" placeholder="Tên sản phẩm hoặc thương hiệu...">
            </div>
            <div class="filter-item">
                <label for="${prefix}category-filter">Danh mục</label>
                <select id="${prefix}category-filter">
                    <option value="">Tất cả danh mục</option>
                    ${CATEGORIES.map(c => `<option value="${c.id}" ${c.id === selectedCategory ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="filter-item">
                <label for="${prefix}min-price">Khoảng giá (₫)</label>
                <div class="price-inputs-inline">
                    <input type="number" id="${prefix}min-price" placeholder="Từ" min="0" step="10000" aria-label="Giá từ">
                    <span>–</span>
                    <input type="number" id="${prefix}max-price" placeholder="Đến" min="0" step="10000" aria-label="Giá đến">
                </div>
            </div>
            <div class="filter-item">
                <label for="${prefix}sort">Sắp xếp</label>
                <select id="${prefix}sort">
                    ${SORT_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
                </select>
            </div>
        </div>
        <p class="result-count" id="${prefix}result-count" aria-live="polite"></p>
        <div class="products-grid" id="${prefix}products-grid"></div>
        <div class="load-more-wrapper" id="${prefix}load-more-wrapper">
            <button class="btn btn-outline load-more-btn" id="${prefix}load-more-btn">Xem thêm sản phẩm</button>
        </div>
    `;
}

export function EmptyResult() {
    return '<p class="empty-result">Không tìm thấy sản phẩm nào phù hợp. Hãy thử từ khóa hoặc khoảng giá khác.</p>';
}

/**
 * Trang danh sách sản phẩm
 */
export function ProductsPage(selectedCategory) {
    const title = CATEGORY_NAMES[selectedCategory] || 'Tất Cả Sản Phẩm';
    return `
        <div class="container">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="#/">Trang chủ</a><span>/</span><span aria-current="page">Sản phẩm</span>
            </nav>
            <h1 class="page-title">${title}</h1>
            ${ProductListing('', selectedCategory)}
        </div>
    `;
}

/**
 * Trang chi tiết sản phẩm
 */
export function ProductDetail(product, reviews) {
    const categoryName = CATEGORY_NAMES[product.category] || 'Sản phẩm';
    const inStock = product.stock > 0;

    return `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="#/">Trang chủ</a><span>/</span>
            <a href="#/products?category=${product.category}">${categoryName}</a><span>/</span>
            <span aria-current="page">${product.name}</span>
        </nav>

        <div class="product-detail">
            <div class="product-detail-content">
                <div class="product-detail-image-wrapper">
                    <img src="${product.image}" alt="${product.name}" class="product-detail-image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="product-detail-image product-image-fallback" style="display: none;">🧴</div>
                </div>

                <div class="product-detail-info">
                    <div class="product-brand">${product.brand}</div>
                    <h1 class="product-name">${product.name}</h1>
                    <div class="product-rating" id="rating-summary">${RatingSummary(product.avgRating || 0, product.reviewCount || 0)}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    ${product.description_short && product.description_short !== product.description_long
                        ? `<p class="product-lead">${product.description_short}</p>` : ''}

                    <div class="stock-info">
                        ${inStock
                            ? `<span class="in-stock">Còn ${product.stock} sản phẩm</span>`
                            : '<span class="out-of-stock">Tạm hết hàng</span>'}
                        ${product.soldCount ? `<span class="sold-count">Đã bán ${product.soldCount}</span>` : ''}
                    </div>

                    ${inStock ? `
                        <div class="purchase-row">
                            <div class="quantity-selector">
                                <label for="quantity-input" class="visually-hidden">Số lượng</label>
                                <button type="button" class="qty-step" data-step="-1" aria-label="Giảm số lượng">−</button>
                                <input type="number" id="quantity-input" value="1" min="1" max="${product.stock}">
                                <button type="button" class="qty-step" data-step="1" aria-label="Tăng số lượng">+</button>
                            </div>
                            <button class="btn btn-add-to-cart" data-id="${product.id}">Thêm vào giỏ hàng</button>
                        </div>
                    ` : ''}

                    <ul class="product-perks">
                        <li>Hàng chính hãng</li>
                        <li>Thanh toán khi nhận hàng (COD) hoặc chuyển khoản ngân hàng</li>
                        <li>Xác nhận đơn hàng qua email</li>
                    </ul>
                    ${product.sourceUrl ? `
                        <p class="product-source">Thông tin, hình ảnh và giá tham khảo từ
                            <a href="${product.sourceUrl}" target="_blank" rel="noopener noreferrer">${product.sourceName || 'Pharmacity'}</a></p>` : ''}
                </div>
            </div>

            <section class="product-description">
                <h2>Mô tả sản phẩm</h2>
                ${DescriptionBody(product.description_long || product.description_short || 'Không có mô tả')}
            </section>

            <section class="reviews-section">
                <h2>Đánh giá của khách hàng</h2>
                <div class="reviews-layout">
                    <div class="reviews-list" id="reviews-list">${ReviewList(reviews)}</div>

                    <div class="review-form">
                        <h3>Viết đánh giá của bạn</h3>
                        <form id="review-form" data-product-id="${product.id}">
                            <div class="form-group">
                                <label for="review-author">Tên của bạn <span class="required">*</span></label>
                                <input type="text" id="review-author" name="author" required maxlength="60" placeholder="Nhập tên của bạn">
                            </div>
                            <div class="form-group">
                                <label for="review-rating">Đánh giá <span class="required">*</span></label>
                                <select id="review-rating" name="rating" required>
                                    <option value="5">★★★★★ — Xuất sắc</option>
                                    <option value="4">★★★★ — Tốt</option>
                                    <option value="3">★★★ — Trung bình</option>
                                    <option value="2">★★ — Kém</option>
                                    <option value="1">★ — Rất kém</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="review-comment">Nhận xét <span class="required">*</span></label>
                                <textarea id="review-comment" name="comment" required maxlength="1000" rows="4"
                                          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."></textarea>
                            </div>
                            <button type="submit" class="btn">Gửi đánh giá</button>
                        </form>
                    </div>
                </div>
            </section>
        </div>

        <section class="related-products" id="related-products"></section>
    `;
}

// Mô tả trong db.json là văn bản thường hoặc HTML đã làm sạch (h3, p, ul, li, strong) do cửa hàng soạn
function DescriptionBody(text) {
    return `<div class="description-body">${text.trim().startsWith('<') ? text : `<p>${text}</p>`}</div>`;
}

export function ReviewList(reviews) {
    return reviews.length > 0
        ? reviews.map(ReviewItem).join('')
        : '<p class="no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>';
}

/**
 * Một đánh giá
 */
export function ReviewItem(review) {
    const date = new Date(review.timestamp).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    const author = escapeHtml(review.author);

    return `
        <div class="review-item">
            <div class="review-header">
                <span class="review-avatar" aria-hidden="true">${escapeHtml(String(review.author || '?').trim().charAt(0).toUpperCase())}</span>
                <div>
                    <span class="review-author">${author}</span>
                    <div class="review-meta">${Stars(review.rating)}<span class="review-date">${date}</span></div>
                </div>
            </div>
            <p class="review-comment">${escapeHtml(review.comment)}</p>
        </div>
    `;
}

/**
 * Một dòng trong giỏ hàng
 */
export function CartItem(item) {
    const atStockLimit = item.stock !== undefined && item.quantity >= item.stock;

    return `
        <div class="cart-item" data-id="${item.id}">
            <a href="#/product/${item.id}" class="cart-item-media">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="cart-item-image-fallback" style="display: none;">🧴</div>
            </a>

            <div class="cart-item-info">
                <div class="cart-item-brand">${item.brand}</div>
                <h3 class="cart-item-name"><a href="#/product/${item.id}">${item.name}</a></h3>
                <div class="cart-item-price">${formatPrice(item.price)}</div>
            </div>

            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn decrease-btn" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''} aria-label="Giảm">−</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-id="${item.id}" ${atStockLimit ? 'disabled' : ''} aria-label="Tăng">+</button>
                </div>
                <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
                <button class="remove-btn" data-id="${item.id}">Xóa</button>
            </div>
        </div>
    `;
}

export function EmptyCart() {
    return `
        <div class="cart-empty">
            <div class="empty-cart-icon">
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 16H12C9.79 16 8 17.79 8 20V22L13 52C13.37 54.95 15.85 57 18.83 57H45.17C48.15 57 50.63 54.95 51 52L56 22V20C56 17.79 54.21 16 52 16H48" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                    <path d="M24 16V12C24 7.58 27.58 4 32 4C36.42 4 40 7.58 40 12V16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                    <path d="M16 16H48" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                </svg>
            </div>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
            <a href="#/products" class="btn">Khám phá sản phẩm</a>
        </div>
    `;
}

/**
 * Trang giỏ hàng có sản phẩm
 */
export function CartPage(cartItems, total, itemCount) {
    return `
        <h1 class="page-title">Giỏ hàng của bạn</h1>
        <div class="cart-layout">
            <div class="cart-items" id="cart-items">
                ${cartItems.map(CartItem).join('')}
                <a href="#/products" class="continue-link">← Tiếp tục mua sắm</a>
            </div>
            <aside class="cart-summary">
                <h3>Tóm tắt đơn hàng</h3>
                <div class="summary-row"><span>Số lượng sản phẩm</span><span>${itemCount}</span></div>
                <div class="summary-row total-row"><span>Tổng cộng</span><span class="cart-total">${formatPrice(total)}</span></div>
                <a href="#/checkout" class="btn btn-checkout">Tiến hành đặt hàng</a>
                <button class="btn btn-secondary" id="clear-cart-btn">Xóa giỏ hàng</button>
            </aside>
        </div>
    `;
}

/**
 * Trang thanh toán
 */
export function CheckoutPage(cartItems, totalAmount, orderCode) {
    const bankReady = isBankConfigured();
    return `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="#/cart">Giỏ hàng</a><span>/</span><span aria-current="page">Thanh toán</span>
        </nav>
        <h1 class="page-title">Thông tin đặt hàng</h1>

        <div class="checkout-content">
            <form id="checkout-form" class="checkout-form">
                <h3>Thông tin giao hàng</h3>
                <div class="form-group">
                    <label for="customer-name">Họ và tên <span class="required">*</span></label>
                    <input type="text" id="customer-name" name="name" required maxlength="80" autocomplete="name" placeholder="Nhập họ và tên của bạn">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="customer-phone">Số điện thoại <span class="required">*</span></label>
                        <input type="tel" id="customer-phone" name="phone" required pattern="0[0-9]{9,10}" autocomplete="tel" placeholder="VD: 0901234567"
                               data-pattern-message="Số điện thoại phải bắt đầu bằng 0 và gồm 10–11 chữ số (VD: 0901234567).">
                    </div>
                    <div class="form-group">
                        <label for="customer-email">Email nhận xác nhận <span class="required">*</span></label>
                        <input type="email" id="customer-email" name="email" required maxlength="100" autocomplete="email" placeholder="ten@gmail.com">
                    </div>
                </div>
                <fieldset class="address-fields">
                    <legend>Địa chỉ giao hàng <span class="required">*</span></legend>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="addr-province">Tỉnh/Thành phố <span class="required">*</span></label>
                            <select id="addr-province" name="province" required disabled>
                                <option value="">Đang tải...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="addr-ward">Phường/Xã <span class="required">*</span></label>
                            <select id="addr-ward" name="ward" required disabled>
                                <option value="">Chọn Tỉnh/Thành phố trước</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="addr-house">Số nhà <span class="required">*</span></label>
                            <input type="text" id="addr-house" name="houseNumber" required maxlength="30" autocomplete="address-line1"
                                   pattern="${HOUSE_NUMBER_PATTERN}" placeholder="VD: 12A, 45/7"
                                   data-pattern-message="Số nhà phải có chữ số, chỉ gồm chữ, số và các ký tự / . , - (VD: 12A, 45/7).">
                        </div>
                        <div class="form-group">
                            <label for="addr-street">Tên đường <span class="required">*</span></label>
                            <input type="text" id="addr-street" name="street" required maxlength="80" autocomplete="address-line2"
                                   pattern="${STREET_PATTERN}" placeholder="VD: Nguyễn Huệ"
                                   data-pattern-message="Tên đường cần ít nhất 2 ký tự và có chữ cái (VD: Nguyễn Huệ, Đường số 7).">
                        </div>
                    </div>
                    <p class="address-note">Theo đơn vị hành chính mới (từ 01/07/2025): 34 tỉnh/thành, không còn cấp quận/huyện.</p>
                    <p class="address-error hidden" id="address-error" role="alert">
                        Không tải được danh sách địa chỉ. <button type="button" class="link-btn" id="address-retry">Thử lại</button>
                    </p>
                </fieldset>

                <fieldset class="payment-methods">
                    <legend>Phương thức thanh toán</legend>
                    <label class="payment-option">
                        <input type="radio" name="payment" value="cod" checked>
                        <span class="payment-title">Thanh toán khi nhận hàng (COD)</span>
                        <span class="payment-desc">Trả tiền mặt cho nhân viên giao hàng.</span>
                    </label>
                    <label class="payment-option${bankReady ? '' : ' is-disabled'}">
                        <input type="radio" name="payment" value="bank" ${bankReady ? '' : 'disabled'}>
                        <span class="payment-title">Chuyển khoản ngân hàng</span>
                        <span class="payment-desc">${bankReady
                            ? 'Hiện ngay mã VietQR với đúng số tiền và nội dung đơn để quét bằng app ngân hàng.'
                            : 'Cửa hàng chưa thiết lập tài khoản nhận tiền.'}</span>
                    </label>
                </fieldset>
                ${bankReady ? `<div id="bank-qr-panel" hidden>${BankTransferBox({ code: orderCode, totalAmount })}</div>` : ''}
                <div class="form-actions">
                    <a href="#/cart" class="btn btn-secondary">Quay lại giỏ hàng</a>
                    <button type="submit" class="btn btn-submit-order" disabled>Xác nhận đặt hàng</button>
                </div>
                <p class="submit-hint" id="submit-hint">Điền đầy đủ thông tin và địa chỉ giao hàng để đặt hàng.</p>
                <p class="approval-note">Đơn hàng sẽ ở trạng thái <strong>Chờ duyệt</strong>; cửa hàng kiểm tra và duyệt xong mới đóng gói, giao hàng.</p>
            </form>

            <aside class="order-summary">
                <h3>Đơn hàng (${cartItems.length} sản phẩm)</h3>
                <div class="order-items">${cartItems.map(OrderLine).join('')}</div>
                <div class="order-total">
                    <span>Tổng cộng</span>
                    <span class="total-amount">${formatPrice(totalAmount)}</span>
                </div>
            </aside>
        </div>
    `;
}

function OrderLine(item) {
    return `
        <div class="order-item">
            <div class="order-item-info">
                <span class="order-item-name">${escapeHtml(item.name)}</span>
                <span class="order-item-quantity">${formatPrice(item.price)} × ${item.quantity}</span>
            </div>
            <span class="order-item-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `;
}

/**
 * Trang xác nhận đặt hàng thành công
 */
/**
 * Ô hướng dẫn chuyển khoản kèm mã VietQR (đã điền sẵn số tiền + nội dung)
 */
export function BankTransferBox(order) {
    if (!isBankConfigured()) {
        return '<div class="bank-box"><p>Cửa hàng chưa thiết lập tài khoản nhận tiền. Vui lòng liên hệ hotline để được hướng dẫn thanh toán.</p></div>';
    }
    const { bankId, bankName, accountNo, accountName } = SHOP.bank;
    const content = transferContent(orderCodeOf(order));
    // Quick Link của VietQR.io: ảnh QR chuẩn NAPAS 247, miễn phí, không cần API key
    const qr = `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNo)}-compact2.png`
        + `?amount=${order.totalAmount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
    const copy = value => `<button type="button" class="copy-btn" data-copy="${escapeHtml(value)}">Sao chép</button>`;

    return `
        <div class="bank-box">
            <img class="bank-qr" src="${qr}" alt="Mã VietQR chuyển khoản ${formatPrice(order.totalAmount)}" width="220" height="220">
            <div class="bank-info">
                <h3>Quét mã để chuyển khoản</h3>
                <dl>
                    <dt>Ngân hàng</dt><dd>${escapeHtml(bankName || bankId)}</dd>
                    <dt>Số tài khoản</dt><dd><strong>${escapeHtml(accountNo)}</strong> ${copy(accountNo)}</dd>
                    <dt>Chủ tài khoản</dt><dd>${escapeHtml(accountName)}</dd>
                    <dt>Số tiền</dt><dd><strong>${formatPrice(order.totalAmount)}</strong> ${copy(order.totalAmount)}</dd>
                    <dt>Nội dung</dt><dd><strong id="transfer-content">${escapeHtml(content)}</strong> ${copy(content)}</dd>
                </dl>
                <p class="bank-note">Mở app ngân hàng bất kỳ → Quét QR: số tiền và nội dung được điền sẵn. Chuyển khoản nhanh 24/7 qua NAPAS,
                    hầu hết ngân hàng miễn phí khi chuyển qua app. Vui lòng giữ đúng nội dung để cửa hàng đối soát đơn.</p>
            </div>
        </div>
    `;
}

export function OrderSuccess(order) {
    const date = new Date(order.timestamp).toLocaleString('vi-VN');
    const info = order.customerInfo || {};
    const isBank = order.paymentMethod === 'bank';
    const unpaidBank = isBank && order.paymentStatus !== 'Đã thanh toán' && order.status !== ORDER_STATUS.CANCELLED;
    return `
        <div class="order-success">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h1 class="page-title">Đặt hàng thành công!</h1>
            <p class="success-lead">Cảm ơn bạn đã mua sắm tại ${SHOP.name}.
                ${isPendingOrder(order) ? 'Đơn hàng đang <strong>chờ cửa hàng duyệt</strong>, duyệt xong sẽ được đóng gói và giao ngay.' : ''}
                ${unpaidBank ? 'Vui lòng quét mã bên dưới để chuyển khoản (nếu chưa chuyển).' : ''}</p>
            ${order.emailSent ? `<p class="email-status" id="email-status">Email xác nhận đã được gửi tới <strong>${escapeHtml(info.email)}</strong>.</p>` : ''}

            ${unpaidBank ? BankTransferBox(order) : ''}

            <div class="order-detail-card">
                <div class="order-meta">
                    <div><span>Mã đơn hàng</span><strong id="order-code">#${escapeHtml(orderCodeOf(order))}</strong></div>
                    <div><span>Thời gian</span><strong>${date}</strong></div>
                    <div><span>Thanh toán</span><strong id="order-payment">${PAYMENT_METHODS[order.paymentMethod] || PAYMENT_METHODS.cod}</strong></div>
                    <div><span>Trạng thái</span><strong>${escapeHtml(order.status || ORDER_STATUS.PENDING)}</strong></div>
                </div>
                <div class="order-customer">
                    <p><strong>${escapeHtml(info.name)}</strong> · ${escapeHtml(info.phone)}${info.email ? ` · ${escapeHtml(info.email)}` : ''}</p>
                    <p>${escapeHtml(info.address)}</p>
                </div>
                <div class="order-items">${(order.items || []).map(OrderLine).join('')}</div>
                <div class="order-total">
                    <span>Tổng cộng</span>
                    <span class="total-amount">${formatPrice(order.totalAmount)}</span>
                </div>
            </div>

            <a href="#/products" class="btn">Tiếp tục mua sắm</a>
        </div>
    `;
}

/**
 * Hình minh hoạ banner: bộ mỹ phẩm (son, serum, chai dưỡng, hũ kem, tuýp) trên bục, kèm hoa lá lấp lánh.
 * SVG tự vẽ để khách nhìn là biết cửa hàng bán mỹ phẩm.
 */
function HeroArt() {
    const petals = n => Array.from({ length: n }, (_, i) => `<use href="#petal" transform="rotate(${(360 / n) * i})"/>`).join('');
    // Lớp ngoài giữ vị trí (transform attribute), lớp trong mang animation CSS
    const sparkle = (x, y, s, cls = '') =>
        `<g transform="translate(${x} ${y}) scale(${s})"><path class="sparkle ${cls}" d="M0-20C2-6 6-2 20 0 6 2 2 6 0 20-2 6-6 2-20 0-6-2-2-6 0-20z"/></g>`;
    const flower = (x, y, s, cls) => `
        <g transform="translate(${x} ${y}) scale(${s})">
            <g class="${cls}">
                <g fill="url(#petalFill)">${petals(5)}</g>
                <circle r="16" fill="#FFE7A8"/>
            </g>
        </g>`;

    return `
        <svg viewBox="0 0 560 430" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <path id="petal" d="M0 0C26-20 30-60 0-86-30-60-26-20 0 0z"/>
                <path id="leaf" d="M0 0C30-20 70-20 100 0 70 20 30 20 0 0z"/>
                <linearGradient id="petalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD3E2"/><stop offset="1" stop-color="#F06C9B"/></linearGradient>
                <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
                <linearGradient id="leafFill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8FC3A3"/><stop offset="1" stop-color="#D5EBDD"/></linearGradient>
                <linearGradient id="podium" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFD0E1"/><stop offset="0.5" stop-color="#FFF1F6"/><stop offset="1" stop-color="#F7B5CD"/></linearGradient>
                <linearGradient id="roseGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9A57F"/><stop offset="0.45" stop-color="#FBD9C2"/><stop offset="1" stop-color="#D88C66"/></linearGradient>
                <linearGradient id="silver" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9B4BC"/><stop offset="0.5" stop-color="#F4F2F5"/><stop offset="1" stop-color="#A9A3AD"/></linearGradient>
                <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBB9D1"/><stop offset="1" stop-color="#E0528A"/></linearGradient>
                <linearGradient id="milk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFD9E7"/></linearGradient>
                <linearGradient id="bullet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F0578E"/><stop offset="1" stop-color="#A81E55"/></linearGradient>
            </defs>

            <circle cx="290" cy="225" r="205" fill="url(#glow)"/>
            <circle cx="290" cy="225" r="178" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 10" opacity="0.8"/>

            <!-- Lá mọc sau bộ sản phẩm -->
            <g fill="url(#leafFill)">
                <use href="#leaf" transform="translate(300 330) rotate(-62) scale(1.75)"/>
                <use href="#leaf" transform="translate(300 330) rotate(-118) scale(1.55)"/>
                <use href="#leaf" transform="translate(300 330) rotate(-90) scale(1.25)"/>
            </g>

            <!-- Bục trưng bày -->
            <ellipse cx="290" cy="388" rx="200" ry="26" fill="#F3A9C5"/>
            <rect x="90" y="352" width="400" height="36" fill="url(#podium)"/>
            <ellipse cx="290" cy="352" rx="200" ry="26" fill="#fff"/>

            <g class="cosmetics">
                <!-- Chai sữa dưỡng có vòi nhấn -->
                <rect x="166" y="150" width="32" height="22" rx="4" fill="url(#roseGold)"/>
                <rect x="178" y="124" width="8" height="28" fill="url(#roseGold)"/>
                <rect x="160" y="108" width="44" height="18" rx="6" fill="url(#roseGold)"/>
                <rect x="198" y="112" width="34" height="9" rx="3" fill="url(#roseGold)"/>
                <rect x="148" y="170" width="68" height="182" rx="20" fill="url(#milk)" stroke="#F4C3D6" stroke-width="2"/>
                <rect x="160" y="230" width="44" height="76" rx="6" fill="#fff" stroke="#F06C9B" stroke-width="1.5"/>
                <text x="182" y="262" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="700" fill="#C92F6F">BODY</text>
                <text x="182" y="278" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="#C92F6F">LOTION</text>

                <!-- Lọ serum ống nhỏ giọt -->
                <rect x="262" y="128" width="28" height="56" rx="14" fill="#FFF4F8" stroke="#EBB6CA" stroke-width="2"/>
                <rect x="252" y="180" width="48" height="20" rx="5" fill="url(#silver)"/>
                <rect x="258" y="198" width="36" height="14" fill="url(#silver)"/>
                <rect x="234" y="210" width="84" height="142" rx="22" fill="url(#glass)" opacity="0.95"/>
                <rect x="244" y="224" width="10" height="104" rx="5" fill="#fff" opacity="0.45"/>
                <rect x="252" y="262" width="56" height="48" rx="6" fill="#fff" opacity="0.92"/>
                <text x="280" y="285" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-weight="700" fill="#C92F6F">SERUM</text>
                <text x="280" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="8" fill="#7D5F6D">Vitamin C</text>

                <!-- Hũ kem -->
                <rect x="338" y="300" width="122" height="52" rx="12" fill="url(#milk)" stroke="#F4C3D6" stroke-width="2"/>
                <rect x="338" y="316" width="122" height="18" fill="#C92F6F" opacity="0.88"/>
                <text x="399" y="329" text-anchor="middle" font-family="Georgia, serif" font-size="10" letter-spacing="3" fill="#fff">CREAM</text>
                <rect x="332" y="274" width="134" height="30" rx="10" fill="url(#roseGold)"/>

                <!-- Thỏi son -->
                <path d="M108 284V246l26-16v54z" fill="url(#bullet)"/>
                <rect x="104" y="280" width="34" height="22" rx="2" fill="#F2C29E"/>
                <rect x="98" y="300" width="46" height="54" rx="5" fill="url(#roseGold)"/>
                <rect x="98" y="312" width="46" height="4" fill="#fff" opacity="0.5"/>

                <!-- Tuýp kem chống nắng nằm phía trước -->
                <g transform="rotate(-6 420 372)">
                    <path d="M352 360h124a12 12 0 0 1 0 24H352l-10-4v-16z" fill="#fff" stroke="#F4C3D6" stroke-width="2"/>
                    <rect x="476" y="362" width="26" height="20" rx="4" fill="#F06C9B"/>
                    <text x="410" y="376" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-weight="700" fill="#C92F6F">SPF 50+</text>
                </g>
            </g>

            ${flower(470, 110, 0.5, 'flower-small')}
            ${flower(72, 190, 0.42, 'flower-small flower-delay')}
            ${flower(520, 300, 0.32, 'flower-small')}

            <g fill="none" stroke="#fff" stroke-width="2.5" opacity="0.85">
                <circle class="bubble" cx="110" cy="96" r="16"/>
                <circle class="bubble bubble-delay" cx="400" cy="200" r="20"/>
                <circle class="bubble" cx="60" cy="300" r="10"/>
                <circle class="bubble bubble-delay" cx="360" cy="70" r="8"/>
            </g>

            <g fill="#fff">
                ${sparkle(230, 90, 0.9)}
                ${sparkle(440, 240, 0.7, 'sparkle-delay')}
                ${sparkle(340, 130, 0.5)}
                ${sparkle(60, 380, 0.6, 'sparkle-delay')}
            </g>
        </svg>
    `;
}

/**
 * Trang chủ
 */
export function HomePage() {
    return `
        <section class="hero-section">
            <div class="container hero-container">
                <div class="hero-content">
                    <span class="hero-eyebrow">Mỹ phẩm · Skincare · Makeup</span>
                    <h1 class="hero-title">Mỹ phẩm chính hãng<br><em>cho làn da rạng rỡ</em></h1>
                    <p class="hero-subtitle">Son môi, kem nền, serum, kem dưỡng, chống nắng, tẩy trang từ CeraVe, La Roche-Posay, Bioderma, Anessa, Cetaphil... Giá niêm yết rõ ràng, thanh toán khi nhận hàng hoặc chuyển khoản.</p>
                    <div class="hero-actions">
                        <a href="#/products" class="btn btn-lg hero-cta">Mua sắm ngay</a>
                        <a href="#/products?category=son-moi" class="btn btn-lg btn-light">Son &amp; trang điểm</a>
                    </div>
                    <ul class="hero-features">
                        <li>Hàng chính hãng</li>
                        <li>COD hoặc chuyển khoản</li>
                        <li>Xác nhận đơn qua email</li>
                    </ul>
                </div>
                <div class="hero-art" aria-hidden="true">${HeroArt()}</div>
            </div>
            <svg class="hero-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 40c240 40 480 40 720 10s480-50 720-10v40H0z" fill="currentColor"/>
            </svg>
        </section>

        <section class="category-section">
            <div class="container">
                <h2 class="section-title">Danh mục sản phẩm</h2>
                <div class="category-grid" id="category-grid">
                    ${CATEGORIES.map(c => `
                        <a class="category-card" data-category="${c.id}" href="#/products?category=${c.id}">
                            <span class="category-icon"><svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">${c.icon}</svg></span>
                            <h3 class="category-name">${c.name}</h3>
                            <p class="category-count">${c.desc}</p>
                        </a>
                    `).join('')}
                </div>
            </div>
        </section>

        <section class="featured-products container">
            <div class="section-head">
                <h2 class="section-title">Sản phẩm nổi bật</h2>
                <div class="carousel-controls">
                    <button class="carousel-nav prev" id="carousel-prev" aria-label="Xem sản phẩm trước">‹</button>
                    <button class="carousel-nav next" id="carousel-next" aria-label="Xem sản phẩm tiếp theo">›</button>
                </div>
            </div>
            <div class="featured-products-container" id="featured-product-list"></div>
        </section>

        <section class="all-products-section container">
            <h2 class="section-title">Tất cả sản phẩm</h2>
            ${ProductListing('home-')}
        </section>
    `;
}

// ===================== Trang quản trị đơn hàng =====================

export function AdminLogin() {
    return `
        <div class="admin-login">
            <h1 class="page-title">Quản trị</h1>
            <form id="admin-login-form" class="checkout-form">
                <div class="form-group">
                    <label for="admin-password">Mật khẩu quản trị</label>
                    <input type="password" id="admin-password" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn">Đăng nhập</button>
            </form>
        </div>
    `;
}

// Tab lọc đơn: [khóa, nhãn, điều kiện]
export const ADMIN_TABS = [
    ['pending', 'Chờ duyệt', isPendingOrder],
    ['shipping', 'Đang giao', o => o.status === ORDER_STATUS.SHIPPING],
    ['done', 'Đã giao', o => o.status === ORDER_STATUS.DONE],
    ['cancelled', 'Đã hủy', o => o.status === ORDER_STATUS.CANCELLED],
    ['all', 'Tất cả', () => true],
];

/**
 * @param {Array} orders - Đơn hàng mới nhất trước
 * @param {string} tab - Khóa trong ADMIN_TABS
 * @param {boolean} canNotify - Trình duyệt hỗ trợ và chưa hỏi quyền thông báo
 */
export function AdminDashboard(orders, tab, canNotify) {
    const [, , filter] = ADMIN_TABS.find(([key]) => key === tab) || ADMIN_TABS[0];
    const shown = orders.filter(filter);
    return `
        <div class="admin-head">
            <h1 class="page-title">Quản trị đơn hàng</h1>
            <div class="admin-head-actions">
                ${canNotify ? '<button type="button" class="btn btn-secondary" id="admin-notify-btn">Bật thông báo trình duyệt</button>' : ''}
                <button type="button" class="btn btn-secondary" id="admin-logout-btn">Đăng xuất</button>
            </div>
        </div>
        <p class="admin-live" aria-live="polite">Tự cập nhật mỗi 10 giây · đơn mới sẽ hiện thông báo.</p>
        <div class="admin-tabs" role="tablist">
            ${ADMIN_TABS.map(([key, label, f]) => {
                const count = orders.filter(f).length;
                return `<button type="button" role="tab" class="admin-tab${key === tab ? ' active' : ''}" data-tab="${key}" aria-selected="${key === tab}">
                    ${label} <span class="admin-count${key === 'pending' && count ? ' has-pending' : ''}">${count}</span></button>`;
            }).join('')}
        </div>
        <div class="admin-orders">
            ${shown.length ? shown.map(AdminOrderCard).join('') : '<p class="empty-result">Không có đơn hàng nào.</p>'}
        </div>
    `;
}

function AdminOrderCard(order) {
    const info = order.customerInfo || {};
    const isBank = order.paymentMethod === 'bank';
    const pending = isPendingOrder(order);
    const action = (name, label, cls = '') => `<button type="button" class="btn ${cls} admin-action" data-action="${name}" data-id="${escapeHtml(order.id)}">${label}</button>`;

    return `
        <article class="admin-order${pending ? ' is-pending' : ''}">
            <header class="admin-order-head">
                <strong>#${escapeHtml(orderCodeOf(order))}</strong>
                <span class="status-badge">${escapeHtml(order.status || ORDER_STATUS.PENDING)}</span>
                <time>${new Date(order.timestamp).toLocaleString('vi-VN')}</time>
            </header>
            <p><strong>${escapeHtml(info.name)}</strong> · ${escapeHtml(info.phone)} · ${escapeHtml(info.email)}</p>
            <p>${escapeHtml(info.address)}</p>
            <ul class="admin-items">
                ${(order.items || []).map(i => `<li>${escapeHtml(i.name)} × ${i.quantity}<span>${formatPrice(i.price * i.quantity)}</span></li>`).join('')}
            </ul>
            <p class="admin-total">Tổng: <strong>${formatPrice(order.totalAmount)}</strong> ·
                ${PAYMENT_METHODS[order.paymentMethod] || PAYMENT_METHODS.cod} · ${escapeHtml(order.paymentStatus || 'Chưa thanh toán')}</p>
            ${pending && isBank ? `<p class="admin-warn">Kiểm tra tài khoản đã nhận <strong>${formatPrice(order.totalAmount)}</strong>
                với nội dung <strong>${escapeHtml(transferContent(orderCodeOf(order)))}</strong> trước khi duyệt.</p>` : ''}
            <div class="admin-actions">
                ${pending ? action('approve', 'Duyệt đơn & trừ kho') + action('cancel', 'Từ chối', 'btn-secondary') : ''}
                ${order.status === ORDER_STATUS.SHIPPING ? action('deliver', 'Đã giao hàng') : ''}
            </div>
        </article>
    `;
}
