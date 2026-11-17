/**
 * Components Module - Các hàm render component UI phía khách hàng
 * Mỗi hàm trả về chuỗi HTML để chèn vào trang. Mọi dữ liệu từ API đều được escape (sản phẩm do admin sửa được).
 */

import { SHOP, isBankConfigured } from './config.js';
import { isWished } from './wishlist.js';

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

// Số nhà phải có chữ số; tên đường (không bắt buộc) nếu nhập phải có chữ cái.
// Dùng chung cho thuộc tính pattern (cờ v) và kiểm tra JS (cờ u)
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
    ['discount', 'Giảm giá nhiều'],
    ['price-asc', 'Giá thấp → cao'],
    ['price-desc', 'Giá cao → thấp'],
];

/**
 * Format giá tiền sang định dạng VNĐ (VD: "750.000 ₫")
 */
export function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Escape nội dung để chống XSS khi chèn vào innerHTML
export function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Mô tả sản phẩm cho phép định dạng cơ bản; mọi thẻ/thuộc tính khác bị loại bỏ
const ALLOWED_TAGS = new Set(['H3', 'H4', 'P', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'BR']);
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE']);
export function sanitizeHtml(html) {
    const tpl = document.createElement('template'); // nội dung template không chạy script, không tải ảnh
    tpl.innerHTML = html;
    const clean = node => {
        for (const child of [...node.children]) {
            if (DROP_TAGS.has(child.tagName)) { child.remove(); continue; }
            clean(child);
            if (ALLOWED_TAGS.has(child.tagName)) [...child.attributes].forEach(a => child.removeAttribute(a.name));
            else child.replaceWith(...child.childNodes);
        }
    };
    clean(tpl.content);
    return tpl.innerHTML;
}

// % giảm so với giá gốc (0 nếu không giảm)
export const discountPercent = p => (p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0);

function PriceTag(product) {
    const off = discountPercent(product);
    return `<span class="price-now">${formatPrice(product.price)}</span>`
        + (off ? `<span class="price-old">${formatPrice(product.originalPrice)}</span>` : '');
}

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.6 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>';

export function WishButton(id, extraClass = '') {
    const wished = isWished(id);
    return `<button type="button" class="wish-btn ${extraClass}${wished ? ' is-wished' : ''}" data-wish="${escapeHtml(id)}"
                aria-pressed="${wished}" aria-label="${wished ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}">${HEART}</button>`;
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
    const off = discountPercent(product);
    const badges = soldOut
        ? '<span class="product-badge soldout-badge">Hết hàng</span>'
        : (off ? `<span class="product-badge sale-badge">-${off}%</span>` : '')
          + (product.isFeatured ? '<span class="product-badge featured-badge">Nổi bật</span>' : '');
    const link = `#/product/${encodeURIComponent(product.id)}`;

    return `
        <article class="product-card${soldOut ? ' is-soldout' : ''}" data-id="${escapeHtml(product.id)}">
            <div class="product-badges">${badges}</div>
            ${WishButton(product.id, 'wish-on-card')}
            <a class="product-media" href="${link}" tabindex="-1" aria-hidden="true">
                <img src="${escapeHtml(product.image)}" alt="" class="product-image" loading="lazy"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="product-image-fallback" style="display: none;">🧴</div>
            </a>
            <div class="product-info">
                <div class="product-brand">${escapeHtml(product.brand)}</div>
                <h3 class="product-name"><a href="${link}">${escapeHtml(product.name)}</a></h3>
                <div class="product-rating">${RatingSummary(product.avgRating || 0, product.reviewCount || 0)}</div>
                <p class="product-description-short">${escapeHtml(product.description_short)}</p>
                <div class="product-price">${PriceTag(product)}</div>
                <button class="btn add-to-cart-btn" data-id="${escapeHtml(product.id)}" ${soldOut ? 'disabled' : ''}>
                    ${soldOut ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                </button>
            </div>
        </article>
    `;
}

/**
 * Thanh lọc + lưới sản phẩm + nút xem thêm (dùng chung cho trang chủ và trang sản phẩm)
 * @param {string} prefix - Tiền tố id để 2 trang không trùng id ('' hoặc 'home-')
 * @param {{category?:string, brand?:string, query?:string}} selected - Bộ lọc chọn sẵn
 * @param {string[]} brands - Danh sách thương hiệu
 */
export function ProductListing(prefix, selected = {}, brands = []) {
    return `
        <div class="filter-bar">
            <div class="filter-item filter-search">
                <label for="${prefix}search-input">Tìm kiếm</label>
                <input type="search" id="${prefix}search-input" placeholder="Tên sản phẩm hoặc thương hiệu..." value="${escapeHtml(selected.query || '')}">
            </div>
            <div class="filter-item">
                <label for="${prefix}category-filter">Danh mục</label>
                <select id="${prefix}category-filter">
                    <option value="">Tất cả danh mục</option>
                    ${CATEGORIES.map(c => `<option value="${c.id}" ${c.id === selected.category ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="filter-item">
                <label for="${prefix}brand-filter">Thương hiệu</label>
                <select id="${prefix}brand-filter">
                    <option value="">Tất cả thương hiệu</option>
                    ${brands.map(b => `<option value="${escapeHtml(b)}" ${b === selected.brand ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('')}
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
                    ${SORT_OPTIONS.map(([value, label]) => `<option value="${value}" ${value === selected.sort ? 'selected' : ''}>${label}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="result-bar">
            <p class="result-count" id="${prefix}result-count" aria-live="polite"></p>
            <button type="button" class="link-btn hidden" id="${prefix}clear-filters">Xóa bộ lọc</button>
        </div>
        <div class="products-grid" id="${prefix}products-grid"></div>
        <div class="load-more-wrapper" id="${prefix}load-more-wrapper">
            <button class="btn btn-outline load-more-btn" id="${prefix}load-more-btn">Xem thêm sản phẩm</button>
        </div>
    `;
}

export function EmptyResult() {
    return `<div class="empty-result">
        <p>Chưa tìm thấy sản phẩm phù hợp 🌸</p>
        <p>Thử từ khóa ngắn hơn (VD: "serum", "son"), hoặc bấm <strong>Xóa bộ lọc</strong> để xem tất cả.</p>
    </div>`;
}

/**
 * Trang danh sách sản phẩm
 */
export function ProductsPage(selected, brands) {
    const title = selected.query ? `Kết quả cho "${escapeHtml(selected.query)}"` : (CATEGORY_NAMES[selected.category] || 'Tất Cả Sản Phẩm');
    return `
        <div class="container">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="#/">Trang chủ</a><span>/</span><span aria-current="page">Sản phẩm</span>
            </nav>
            <h1 class="page-title">${title}</h1>
            ${ProductListing('', selected, brands)}
        </div>
    `;
}

/**
 * Trang chi tiết sản phẩm
 */
export function ProductDetail(product, reviews) {
    const categoryName = CATEGORY_NAMES[product.category] || 'Sản phẩm';
    const inStock = product.stock > 0;
    const off = discountPercent(product);
    const name = escapeHtml(product.name);

    return `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="#/">Trang chủ</a><span>/</span>
            <a href="#/products?category=${encodeURIComponent(product.category)}">${categoryName}</a><span>/</span>
            <span aria-current="page">${name}</span>
        </nav>

        <div class="product-detail">
            <div class="product-detail-content">
                <div class="product-detail-image-wrapper">
                    ${off ? `<span class="product-badge sale-badge detail-sale">-${off}%</span>` : ''}
                    <img src="${escapeHtml(product.image)}" alt="${name}" class="product-detail-image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="product-detail-image product-image-fallback" style="display: none;">🧴</div>
                </div>

                <div class="product-detail-info">
                    <div class="product-brand">${escapeHtml(product.brand)}</div>
                    <h1 class="product-name">${name}</h1>
                    <div class="product-rating" id="rating-summary">${RatingSummary(product.avgRating || 0, product.reviewCount || 0)}</div>
                    <div class="product-price">${PriceTag(product)}
                        ${off ? `<span class="save-chip">Tiết kiệm ${formatPrice(product.originalPrice - product.price)}</span>` : ''}</div>
                    ${product.description_short && product.description_short !== product.description_long
                        ? `<p class="product-lead">${escapeHtml(product.description_short)}</p>` : ''}

                    <div class="stock-info">
                        ${inStock
                            ? `<span class="in-stock">${product.stock <= 5 ? `Chỉ còn ${product.stock} sản phẩm` : 'Còn hàng'}</span>`
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
                            <button class="btn btn-outline btn-add-to-cart" data-id="${escapeHtml(product.id)}">Thêm vào giỏ</button>
                            <button class="btn btn-buy-now" data-id="${escapeHtml(product.id)}">Mua ngay</button>
                        </div>
                    ` : ''}
                    <div class="detail-actions">${WishButton(product.id, 'wish-inline')}<span class="wish-label">Lưu vào yêu thích</span></div>

                    <ul class="product-perks">
                        <li>Hàng chính hãng</li>
                        <li>Thanh toán khi nhận hàng (COD) hoặc quét mã VietQR</li>
                        <li>Xác nhận đơn qua email · tra cứu đơn bằng mã đơn + số điện thoại</li>
                    </ul>
                    ${product.sourceUrl ? `
                        <p class="product-source">Thông tin, hình ảnh và giá tham khảo từ
                            <a href="${escapeHtml(product.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(product.sourceName || 'Pharmacity')}</a></p>` : ''}
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
                        <form id="review-form" data-product-id="${escapeHtml(product.id)}">
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

// Mô tả trong db.json là văn bản thường hoặc HTML (h3, p, ul, li, strong...) do cửa hàng soạn
function DescriptionBody(text) {
    const body = text.trim().startsWith('<') ? sanitizeHtml(text) : `<p>${escapeHtml(text)}</p>`;
    return `<div class="description-body">${body}</div>`;
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
    const id = escapeHtml(item.id);
    const link = `#/product/${encodeURIComponent(item.id)}`;

    return `
        <div class="cart-item" data-id="${id}">
            <a href="${link}" class="cart-item-media">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="cart-item-image-fallback" style="display: none;">🧴</div>
            </a>

            <div class="cart-item-info">
                <div class="cart-item-brand">${escapeHtml(item.brand)}</div>
                <h3 class="cart-item-name"><a href="${link}">${escapeHtml(item.name)}</a></h3>
                <div class="cart-item-price">${formatPrice(item.price)}</div>
            </div>

            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn decrease-btn" data-id="${id}" ${item.quantity <= 1 ? 'disabled' : ''} aria-label="Giảm">−</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-id="${id}" ${atStockLimit ? 'disabled' : ''} aria-label="Tăng">+</button>
                </div>
                <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
                <button class="remove-btn" data-id="${id}">Xóa</button>
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
            <p>Hãy thêm vài món xinh xắn vào giỏ nhé 💄</p>
            <a href="#/products" class="btn">Khám phá sản phẩm</a>
        </div>
    `;
}

/**
 * Thanh tiến độ miễn phí vận chuyển — khuyến khích mua thêm cho đủ ngưỡng
 */
function FreeShipProgress(totals, threshold) {
    if (!threshold) return '';
    const pct = Math.min(100, Math.round((totals.subtotal / threshold) * 100));
    return `
        <div class="freeship">
            <p>${totals.freeShipRemaining > 0
                ? `Mua thêm <strong>${formatPrice(totals.freeShipRemaining)}</strong> để được <strong>miễn phí vận chuyển</strong> 🚚`
                : '🎉 Đơn của bạn được <strong>miễn phí vận chuyển</strong>!'}</p>
            <div class="freeship-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
        </div>
    `;
}

function TotalsRows(totals, couponCode = '') {
    return `
        <div class="summary-row"><span>Tạm tính</span><span>${formatPrice(totals.subtotal)}</span></div>
        ${totals.discount ? `<div class="summary-row discount-row"><span>Giảm giá${couponCode ? ` (${escapeHtml(couponCode)})` : ''}</span><span>−${formatPrice(totals.discount)}</span></div>` : ''}
        <div class="summary-row"><span>Phí vận chuyển</span><span>${totals.shippingFee ? formatPrice(totals.shippingFee) : '<span class="free-text">Miễn phí</span>'}</span></div>
        <div class="summary-row total-row"><span>Tổng cộng</span><span class="cart-total">${formatPrice(totals.total)}</span></div>
    `;
}

/**
 * Trang giỏ hàng có sản phẩm
 */
export function CartPage(cartItems, totals, itemCount, settings) {
    return `
        <h1 class="page-title">Giỏ hàng của bạn</h1>
        <div class="cart-layout">
            <div class="cart-items" id="cart-items">
                ${cartItems.map(CartItem).join('')}
                <a href="#/products" class="continue-link">← Tiếp tục mua sắm</a>
            </div>
            <aside class="cart-summary">
                <h3>Tóm tắt đơn hàng (${itemCount} sản phẩm)</h3>
                ${FreeShipProgress(totals, settings.freeShipThreshold)}
                ${TotalsRows(totals)}
                <p class="summary-note">Có mã giảm giá? Nhập ở bước đặt hàng.</p>
                <a href="#/checkout" class="btn btn-checkout">Tiến hành đặt hàng</a>
                <button class="btn btn-secondary" id="clear-cart-btn">Xóa giỏ hàng</button>
            </aside>
        </div>
    `;
}

/**
 * Khung tóm tắt đơn ở trang thanh toán (vẽ lại khi áp dụng/bỏ mã giảm giá)
 */
export function CheckoutSummary(cartItems, totals, coupon, settings) {
    return `
        <h3>Đơn hàng (${cartItems.length} sản phẩm)</h3>
        <div class="order-items">${cartItems.map(OrderLine).join('')}</div>
        <div class="coupon-box">
            ${coupon
                ? `<div class="coupon-applied"><span>🎟️ <strong>${escapeHtml(coupon.code)}</strong> — ${escapeHtml(coupon.description || 'Đã áp dụng')}</span>
                       <button type="button" class="link-btn" id="coupon-remove">Bỏ mã</button></div>`
                : `<label for="coupon-input">Mã giảm giá</label>
                   <div class="coupon-row">
                       <input type="text" id="coupon-input" maxlength="30" placeholder="VD: WELCOME10" autocomplete="off">
                       <button type="button" class="btn btn-outline" id="coupon-apply">Áp dụng</button>
                   </div>`}
        </div>
        ${FreeShipProgress(totals, settings.freeShipThreshold)}
        <div class="order-totals">${TotalsRows(totals, coupon && coupon.code)}</div>
    `;
}

/**
 * Trang thanh toán
 */
export function CheckoutPage(cartItems, totals, orderCode, settings) {
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
                        <input type="tel" id="customer-phone" name="phone" required pattern="0[0-9]{9,10}" inputmode="numeric" autocomplete="tel" placeholder="VD: 0901234567"
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
                                   pattern="${HOUSE_NUMBER_PATTERN}" placeholder="VD: 12A, 45/7, Tổ 3"
                                   data-pattern-message="Số nhà cần có chữ số, chỉ gồm chữ, số và các ký tự / . , - (VD: 12A, 45/7, Tổ 3).">
                        </div>
                        <div class="form-group">
                            <label for="addr-street">Tên đường <span class="optional">(không bắt buộc)</span></label>
                            <input type="text" id="addr-street" name="street" maxlength="80" autocomplete="address-line2"
                                   pattern="${STREET_PATTERN}" placeholder="VD: Nguyễn Huệ"
                                   data-pattern-message="Tên đường cần ít nhất 2 ký tự và có chữ cái (VD: Nguyễn Huệ, Đường số 7).">
                        </div>
                    </div>
                    <p class="address-note">Theo đơn vị hành chính mới (từ 01/07/2025): 34 tỉnh/thành, không còn cấp quận/huyện.</p>
                    <p class="address-error hidden" id="address-error" role="alert">
                        Không tải được danh sách địa chỉ. <button type="button" class="link-btn" id="address-retry">Thử lại</button>
                    </p>
                </fieldset>

                <div class="form-group">
                    <label for="customer-note">Ghi chú cho cửa hàng <span class="optional">(không bắt buộc)</span></label>
                    <textarea id="customer-note" name="note" rows="2" maxlength="300" placeholder="VD: Giao giờ hành chính, gọi trước khi giao..."></textarea>
                </div>

                <fieldset class="payment-methods">
                    <legend>Phương thức thanh toán</legend>
                    <label class="payment-option">
                        <input type="radio" name="payment" value="cod" checked>
                        <span class="payment-title">Thanh toán khi nhận hàng (COD)</span>
                        <span class="payment-desc">Trả tiền mặt cho nhân viên giao hàng.</span>
                    </label>
                    <label class="payment-option${bankReady ? '' : ' is-disabled'}">
                        <input type="radio" name="payment" value="bank" ${bankReady ? '' : 'disabled'}>
                        <span class="payment-title">Chuyển khoản ngân hàng (VietQR)</span>
                        <span class="payment-desc">${bankReady
                            ? 'Hiện ngay mã VietQR với đúng số tiền và nội dung đơn để quét bằng app ngân hàng.'
                            : 'Cửa hàng chưa thiết lập tài khoản nhận tiền.'}</span>
                    </label>
                </fieldset>
                ${bankReady ? `<div id="bank-qr-panel" hidden>${BankTransferBox({ code: orderCode, totalAmount: totals.total })}</div>` : ''}
                <div class="form-actions">
                    <a href="#/cart" class="btn btn-secondary">Quay lại giỏ hàng</a>
                    <button type="submit" class="btn btn-submit-order">Xác nhận đặt hàng</button>
                </div>
                <p class="submit-hint" id="submit-hint" aria-live="polite"></p>
                <p class="approval-note">Đơn hàng sẽ ở trạng thái <strong>Chờ duyệt</strong>; cửa hàng kiểm tra và duyệt xong mới đóng gói, giao hàng.
                    Bạn có thể <a href="#/tra-cuu">tra cứu đơn</a> bất cứ lúc nào.</p>
            </form>

            <aside class="order-summary" id="checkout-summary">${CheckoutSummary(cartItems, totals, null, settings)}</aside>
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

/**
 * Thanh tiến trình trạng thái đơn: Chờ duyệt → Đang giao → Đã giao
 */
export function OrderTimeline(order) {
    if (order.status === ORDER_STATUS.CANCELLED) {
        return '<div class="order-timeline is-cancelled"><span class="timeline-cancel">Đơn hàng đã bị hủy. Liên hệ hotline nếu bạn cần hỗ trợ.</span></div>';
    }
    const steps = ['Đã đặt hàng', ORDER_STATUS.PENDING, ORDER_STATUS.SHIPPING, ORDER_STATUS.DONE];
    const current = order.status === ORDER_STATUS.DONE ? 3 : order.status === ORDER_STATUS.SHIPPING ? 2 : 1;
    return `
        <ol class="order-timeline" aria-label="Trạng thái đơn hàng">
            ${steps.map((s, i) => `<li class="${i < current ? 'done' : i === current ? 'current' : ''}"${i === current ? ' aria-current="step"' : ''}>
                <span class="dot" aria-hidden="true">${i < current ? '✓' : i + 1}</span><span>${s}</span></li>`).join('')}
        </ol>
    `;
}

function OrderDetailCard(order) {
    const date = new Date(order.timestamp).toLocaleString('vi-VN');
    const info = order.customerInfo || {};
    const subtotal = order.subtotal ?? order.totalAmount;
    return `
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
                ${info.note ? `<p class="order-note">Ghi chú: ${escapeHtml(info.note)}</p>` : ''}
            </div>
            <div class="order-items">${(order.items || []).map(OrderLine).join('')}</div>
            <div class="order-totals">
                ${order.subtotal !== undefined ? TotalsRows({ subtotal, discount: order.discount || 0, shippingFee: order.shippingFee || 0, total: order.totalAmount }, order.couponCode) : `
                <div class="summary-row total-row"><span>Tổng cộng</span><span class="cart-total">${formatPrice(order.totalAmount)}</span></div>`}
            </div>
        </div>
    `;
}

export function OrderSuccess(order) {
    const info = order.customerInfo || {};
    const isBank = order.paymentMethod === 'bank';
    const unpaidBank = isBank && order.paymentStatus !== 'Đã thanh toán' && order.status !== ORDER_STATUS.CANCELLED;
    return `
        <div class="order-success">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h1 class="page-title">Đặt hàng thành công!</h1>
            <p class="success-lead">Cảm ơn bạn đã mua sắm tại ${escapeHtml(SHOP.name)} 💖
                ${isPendingOrder(order) ? 'Đơn hàng đang <strong>chờ cửa hàng duyệt</strong>, duyệt xong sẽ được đóng gói và giao ngay.' : ''}
                ${unpaidBank ? 'Vui lòng quét mã bên dưới để chuyển khoản (nếu chưa chuyển).' : ''}</p>
            ${order.emailSent ? `<p class="email-status" id="email-status">Email xác nhận đã được gửi tới <strong>${escapeHtml(info.email)}</strong>.</p>` : ''}
            ${OrderTimeline(order)}

            ${unpaidBank ? BankTransferBox(order) : ''}
            ${OrderDetailCard(order)}

            <p class="lookup-hint">Lưu lại mã đơn <strong>#${escapeHtml(orderCodeOf(order))}</strong> để <a href="#/tra-cuu">tra cứu đơn hàng</a> bằng số điện thoại.</p>
            <a href="#/products" class="btn">Tiếp tục mua sắm</a>
        </div>
    `;
}

/**
 * Trang tra cứu đơn: nhập mã đơn + số điện thoại đặt hàng
 */
export function OrderLookupPage(code = '') {
    return `
        <div class="lookup-page">
            <h1 class="page-title">Tra cứu đơn hàng</h1>
            <p class="lookup-lead">Nhập mã đơn (trong email xác nhận hoặc trang đặt hàng thành công) và số điện thoại đã dùng khi đặt.</p>
            <form id="lookup-form" class="checkout-form lookup-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="lookup-code">Mã đơn hàng</label>
                        <input type="text" id="lookup-code" name="code" required maxlength="30" value="${escapeHtml(code)}" placeholder="VD: K7M2QXAB" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label for="lookup-phone">Số điện thoại</label>
                        <input type="tel" id="lookup-phone" name="phone" required pattern="0[0-9]{9,10}" inputmode="numeric" placeholder="VD: 0901234567"
                               data-pattern-message="Số điện thoại phải bắt đầu bằng 0 và gồm 10–11 chữ số.">
                    </div>
                </div>
                <button type="submit" class="btn">Tra cứu</button>
            </form>
            <div id="lookup-result" aria-live="polite"></div>
        </div>
    `;
}

export function OrderLookupResult(order) {
    if (!order) return '<p class="empty-result">Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại. Bạn kiểm tra lại giúp nhé.</p>';
    const unpaidBank = order.paymentMethod === 'bank' && order.paymentStatus !== 'Đã thanh toán' && order.status !== ORDER_STATUS.CANCELLED;
    return `${OrderTimeline(order)}${unpaidBank ? BankTransferBox(order) : ''}${OrderDetailCard(order)}`;
}

/**
 * Trang sản phẩm yêu thích
 */
export function WishlistPage(products) {
    return `
        <div class="container">
            <h1 class="page-title">Sản phẩm yêu thích</h1>
            ${products.length
                ? `<div class="products-grid">${products.map(ProductCard).join('')}</div>`
                : `<div class="cart-empty">
                       <div class="empty-cart-icon wish-empty">${HEART}</div>
                       <h2>Chưa có sản phẩm yêu thích</h2>
                       <p>Bấm vào biểu tượng trái tim trên sản phẩm để lưu lại và mua sau nhé.</p>
                       <a href="#/products" class="btn">Khám phá sản phẩm</a>
                   </div>`}
        </div>
    `;
}

/**
 * Hình minh hoạ banner: bộ mỹ phẩm (son, serum, chai dưỡng, hũ kem, tuýp) trên bục, kèm hoa lá lấp lánh.
 * Mỗi món có lớp riêng để bay nhẹ lệch nhịp; lọ serum có vệt sáng lướt qua.
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
                <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
                <clipPath id="serumClip"><rect x="234" y="210" width="84" height="142" rx="22"/></clipPath>
            </defs>

            <circle cx="290" cy="225" r="205" fill="url(#glow)"/>
            <circle class="hero-ring" cx="290" cy="225" r="178" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 10" opacity="0.8"/>

            <!-- Lá mọc sau bộ sản phẩm -->
            <g class="hero-leaves" fill="url(#leafFill)">
                <use href="#leaf" transform="translate(300 330) rotate(-62) scale(1.75)"/>
                <use href="#leaf" transform="translate(300 330) rotate(-118) scale(1.55)"/>
                <use href="#leaf" transform="translate(300 330) rotate(-90) scale(1.25)"/>
            </g>

            <!-- Bục trưng bày -->
            <ellipse cx="290" cy="388" rx="200" ry="26" fill="#F3A9C5"/>
            <rect x="90" y="352" width="400" height="36" fill="url(#podium)"/>
            <ellipse cx="290" cy="352" rx="200" ry="26" fill="#fff"/>

            <!-- Chai sữa dưỡng có vòi nhấn -->
            <g class="hero-item item-lotion">
                <rect x="166" y="150" width="32" height="22" rx="4" fill="url(#roseGold)"/>
                <rect x="178" y="124" width="8" height="28" fill="url(#roseGold)"/>
                <rect x="160" y="108" width="44" height="18" rx="6" fill="url(#roseGold)"/>
                <rect x="198" y="112" width="34" height="9" rx="3" fill="url(#roseGold)"/>
                <rect x="148" y="170" width="68" height="182" rx="20" fill="url(#milk)" stroke="#F4C3D6" stroke-width="2"/>
                <rect x="160" y="230" width="44" height="76" rx="6" fill="#fff" stroke="#F06C9B" stroke-width="1.5"/>
                <text x="182" y="262" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="700" fill="#C92F6F">BODY</text>
                <text x="182" y="278" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="#C92F6F">LOTION</text>
            </g>

            <!-- Lọ serum ống nhỏ giọt + vệt sáng lướt qua thân chai -->
            <g class="hero-item item-serum">
                <rect x="262" y="128" width="28" height="56" rx="14" fill="#FFF4F8" stroke="#EBB6CA" stroke-width="2"/>
                <rect x="252" y="180" width="48" height="20" rx="5" fill="url(#silver)"/>
                <rect x="258" y="198" width="36" height="14" fill="url(#silver)"/>
                <rect x="234" y="210" width="84" height="142" rx="22" fill="url(#glass)" opacity="0.95"/>
                <g clip-path="url(#serumClip)"><rect class="serum-shine" x="200" y="200" width="36" height="170" fill="url(#shine)" transform="skewX(-18)"/></g>
                <rect x="252" y="262" width="56" height="48" rx="6" fill="#fff" opacity="0.92"/>
                <text x="280" y="285" text-anchor="middle" font-family="Georgia, serif" font-size="12" font-weight="700" fill="#C92F6F">SERUM</text>
                <text x="280" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="8" fill="#7D5F6D">Vitamin C</text>
            </g>

            <!-- Hũ kem -->
            <g class="hero-item item-cream">
                <rect x="338" y="300" width="122" height="52" rx="12" fill="url(#milk)" stroke="#F4C3D6" stroke-width="2"/>
                <rect x="338" y="316" width="122" height="18" fill="#C92F6F" opacity="0.88"/>
                <text x="399" y="329" text-anchor="middle" font-family="Georgia, serif" font-size="10" letter-spacing="3" fill="#fff">CREAM</text>
                <rect x="332" y="274" width="134" height="30" rx="10" fill="url(#roseGold)"/>
            </g>

            <!-- Thỏi son -->
            <g class="hero-item item-lipstick">
                <path d="M108 284V246l26-16v54z" fill="url(#bullet)"/>
                <rect x="104" y="280" width="34" height="22" rx="2" fill="#F2C29E"/>
                <rect x="98" y="300" width="46" height="54" rx="5" fill="url(#roseGold)"/>
                <rect x="98" y="312" width="46" height="4" fill="#fff" opacity="0.5"/>
            </g>

            <!-- Tuýp kem chống nắng nằm phía trước -->
            <g class="hero-item item-tube">
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
 * @param {Object} settings - Nội dung banner do Quản lý chỉnh (db.json → settings)
 * @param {string[]} brands - Thương hiệu cho dải chạy ngang
 */
export function HomePage(settings, brands = []) {
    const words = (settings.heroRotating || []).filter(Boolean);
    const freeShip = settings.freeShipThreshold ? `Freeship từ ${Math.round(settings.freeShipThreshold / 1000)}K` : 'Giao hàng toàn quốc';
    // Dải thương hiệu nhân đôi để chạy vòng liền mạch
    const marquee = brands.map(b => `<a href="#/products?brand=${encodeURIComponent(b)}">${escapeHtml(b)}</a>`).join('<span aria-hidden="true">✦</span>');

    return `
        <section class="hero-section">
            <span class="hero-blob blob-1" aria-hidden="true"></span>
            <span class="hero-blob blob-2" aria-hidden="true"></span>
            <span class="hero-blob blob-3" aria-hidden="true"></span>
            <div class="container hero-container">
                <div class="hero-content">
                    <span class="hero-eyebrow">${escapeHtml(settings.heroEyebrow)}</span>
                    <h1 class="hero-title">${escapeHtml(settings.heroTitle)}<br>
                        <em>cho <span class="hero-rotator" id="hero-rotator" data-words="${escapeHtml(JSON.stringify(words))}">${escapeHtml(words[0] || 'làn da rạng rỡ')}</span></em></h1>
                    <p class="hero-subtitle">${escapeHtml(settings.heroSubtitle)}</p>
                    <div class="hero-actions">
                        <a href="#/products" class="btn btn-lg hero-cta">Mua sắm ngay</a>
                        <a href="#/products?category=son-moi" class="btn btn-lg btn-light">Son &amp; trang điểm</a>
                    </div>
                    <ul class="hero-features">
                        <li>Hàng chính hãng</li>
                        <li>${escapeHtml(freeShip)}</li>
                        <li>COD hoặc quét VietQR</li>
                    </ul>
                </div>
                <div class="hero-visual" aria-hidden="true">
                    <div class="hero-art">${HeroArt()}</div>
                    <span class="hero-chip chip-1">💯 Chính hãng</span>
                    <span class="hero-chip chip-2">🚚 ${escapeHtml(freeShip)}</span>
                    <span class="hero-chip chip-3">✨ Ưu đãi mỗi ngày</span>
                </div>
            </div>
            <svg class="hero-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 40c240 40 480 40 720 10s480-50 720-10v40H0z" fill="currentColor"/>
            </svg>
        </section>

        ${brands.length ? `
        <section class="brand-strip" aria-label="Thương hiệu đang bán">
            <div class="brand-track"><div class="brand-row">${marquee}</div><div class="brand-row" aria-hidden="true">${marquee}</div></div>
        </section>` : ''}

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

        <section class="sale-section container">
            <div class="section-head">
                <h2 class="section-title">Đang giảm giá</h2>
                <a href="#/products?sort=discount" class="see-all">Xem tất cả ưu đãi →</a>
            </div>
            <div class="products-grid" id="sale-product-list"></div>
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
            ${ProductListing('home-', {}, brands)}
        </section>
    `;
}
