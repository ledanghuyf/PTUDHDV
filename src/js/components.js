/**
 * Components Module - Các hàm render component UI
 * Mỗi hàm trả về chuỗi HTML để chèn vào trang
 */

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
                    <p class="product-lead">${product.description_short || ''}</p>

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
                        <li>Thanh toán khi nhận hàng (COD)</li>
                        <li>Giao hàng toàn quốc</li>
                    </ul>
                </div>
            </div>

            <section class="product-description">
                <h2>Mô tả sản phẩm</h2>
                <p>${product.description_long || product.description_short || 'Không có mô tả'}</p>
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
export function CheckoutPage(cartItems, totalAmount) {
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
                <div class="form-group">
                    <label for="customer-phone">Số điện thoại <span class="required">*</span></label>
                    <input type="tel" id="customer-phone" name="phone" required pattern="[0-9]{10,11}" autocomplete="tel" placeholder="VD: 0901234567">
                    <small>Gồm 10–11 chữ số</small>
                </div>
                <div class="form-group">
                    <label for="customer-address">Địa chỉ giao hàng <span class="required">*</span></label>
                    <textarea id="customer-address" name="address" rows="3" required maxlength="300" autocomplete="street-address"
                              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"></textarea>
                </div>
                <div class="payment-note">
                    <strong>Phương thức thanh toán:</strong> Thanh toán khi nhận hàng (COD)
                </div>
                <div class="form-actions">
                    <a href="#/cart" class="btn btn-secondary">Quay lại giỏ hàng</a>
                    <button type="submit" class="btn btn-submit-order">Xác nhận đặt hàng</button>
                </div>
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
export function OrderSuccess(order) {
    const date = new Date(order.timestamp).toLocaleString('vi-VN');
    const info = order.customerInfo || {};
    return `
        <div class="order-success">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h1 class="page-title">Đặt hàng thành công!</h1>
            <p class="success-lead">Cảm ơn bạn đã mua sắm tại Cosmetics Store. Chúng tôi sẽ liên hệ để xác nhận đơn hàng trong thời gian sớm nhất.</p>

            <div class="order-detail-card">
                <div class="order-meta">
                    <div><span>Mã đơn hàng</span><strong id="order-code">#${escapeHtml(order.id)}</strong></div>
                    <div><span>Thời gian</span><strong>${date}</strong></div>
                    <div><span>Thanh toán</span><strong>COD</strong></div>
                </div>
                <div class="order-customer">
                    <p><strong>${escapeHtml(info.name)}</strong> · ${escapeHtml(info.phone)}</p>
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
 * Trang chủ
 */
export function HomePage() {
    return `
        <section class="hero-section">
            <div class="container hero-container">
                <div class="hero-content">
                    <span class="hero-eyebrow">Mỹ phẩm chính hãng</span>
                    <h1 class="hero-title">Chăm sóc làn da<br><em>theo cách của bạn</em></h1>
                    <p class="hero-subtitle">Tuyển chọn serum, kem dưỡng, chống nắng và làm sạch từ các thương hiệu được tin dùng: La Roche-Posay, CeraVe, Cetaphil, Innisfree, Laneige...</p>
                    <div class="hero-actions">
                        <a href="#/products" class="btn btn-lg hero-cta">Mua sắm ngay</a>
                        <a href="#/products?category=chong-nang" class="btn btn-lg btn-outline">Kem chống nắng</a>
                    </div>
                    <ul class="hero-features">
                        <li>Hàng chính hãng</li>
                        <li>Thanh toán khi nhận hàng</li>
                        <li>Giao hàng toàn quốc</li>
                    </ul>
                </div>
                <div class="hero-visual" aria-hidden="true">
                    <div class="hero-arch"></div>
                    <img class="hero-product hero-product-main" src="assets/images/product-1.jpg" alt="">
                    <img class="hero-product hero-product-left" src="assets/images/product-4.jpg" alt="">
                    <img class="hero-product hero-product-right" src="assets/images/product-6.jpg" alt="">
                </div>
            </div>
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
