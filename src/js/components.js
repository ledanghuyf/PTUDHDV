/**
 * Components Module - Các hàm render component UI
 * File này chứa các hàm tạo chuỗi HTML cho các thành phần giao diện
 */

/**
 * Format giá tiền sang định dạng VNĐ
 * @param {number} price - Giá cần format
 * @returns {string} Chuỗi giá đã được format (VD: "750.000 ₫")
 */
export function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

/**
 * Tạo HTML cho một product card trong danh sách sản phẩm
 * @param {Object} product - Đối tượng sản phẩm
 * @param {number} product.id - ID sản phẩm
 * @param {string} product.name - Tên sản phẩm
 * @param {string} product.brand - Thương hiệu
 * @param {number} product.price - Giá sản phẩm
 * @param {string} product.image - Đường dẫn hình ảnh
 * @param {string} product.description_short - Mô tả ngắn
 * @param {boolean} product.isFeatured - Sản phẩm nổi bật
 * @returns {string} Chuỗi HTML của product card
 */
export function ProductCard(product) {
    const featuredBadge = product.isFeatured 
        ? '<span class="product-badge featured-badge">Nổi bật</span>' 
        : '';
    
    return `
        <div class="product-card" data-id="${product.id}">
            ${featuredBadge}
            <img 
                src="${product.image}" 
                alt="${product.name}" 
                class="product-image" 
                onclick="window.location.hash = '#/product/${product.id}'"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >
            <div class="product-image-fallback" style="display: none;">🧴</div>
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <h3 class="product-name" onclick="window.location.hash = '#/product/${product.id}'">${product.name}</h3>
                <p class="product-description-short">${product.description_short || ''}</p>
                <div class="product-price">${formatPrice(product.price)}</div>
                <button class="btn add-to-cart-btn" data-id="${product.id}">
                    Thêm vào giỏ
                </button>
            </div>
        </div>
    `;
}

/**
 * Tạo HTML cho trang chi tiết sản phẩm
 * @param {Object} product - Đối tượng sản phẩm
 * @param {Array} reviews - Mảng các đánh giá của sản phẩm
 * @returns {string} Chuỗi HTML của trang chi tiết sản phẩm
 */
export function ProductDetail(product, reviews) {
    return `
        <div class="product-detail">
            <div class="product-detail-content">
                <!-- Cột trái: Hình ảnh sản phẩm -->
                <div class="product-detail-image-wrapper">
                    <img 
                        src="${product.image}" 
                        alt="${product.name}" 
                        class="product-detail-image"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    >
                    <div class="product-detail-image" style="display: none;">🧴</div>
                </div>
                
                <!-- Cột phải: Thông tin sản phẩm -->
                <div class="product-detail-info">
                    <div class="product-brand">${product.brand}</div>
                    <h1 class="product-name">${product.name}</h1>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    
                    <div class="product-description">
                        <h3>Mô tả sản phẩm</h3>
                        <p>${product.description_long || product.description_short || 'Không có mô tả'}</p>
                    </div>
                    
                    <div class="stock-info">
                        ${product.stock > 0
            ? `<span class="in-stock">✓ Còn ${product.stock} sản phẩm</span>`
            : `<span class="out-of-stock">✗ Hết hàng</span>`
        }
                    </div>
                    
                    ${product.stock > 0 ? `
                        <div class="quantity-selector">
                            <label for="quantity-input">Số lượng:</label>
                            <input 
                                type="number" 
                                id="quantity-input" 
                                value="1" 
                                min="1" 
                                max="${product.stock}"
                            >
                        </div>
                        
                        <button class="btn btn-add-to-cart" data-id="${product.id}">
                            Thêm vào giỏ hàng
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Khu vực đánh giá -->
            <div class="reviews-section">
                <h2>Đánh Giá Của Khách Hàng</h2>
                
                <div class="reviews-list" id="reviews-list">
                    ${reviews.length > 0
            ? reviews.map(review => ReviewItem(review)).join('')
            : '<p class="no-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>'
        }
                </div>
                
                <!-- Form gửi đánh giá -->
                <div class="review-form">
                    <h3>Viết Đánh Giá Của Bạn</h3>
                    <form id="review-form" data-product-id="${product.id}">
                        <div class="form-group">
                            <label for="review-author">Tên của bạn: <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="review-author" 
                                name="author" 
                                required 
                                placeholder="Nhập tên của bạn"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="review-rating">Đánh giá: <span class="required">*</span></label>
                            <select id="review-rating" name="rating" required>
                                <option value="5">⭐⭐⭐⭐⭐ (5 sao - Xuất sắc)</option>
                                <option value="4">⭐⭐⭐⭐ (4 sao - Tốt)</option>
                                <option value="3">⭐⭐⭐ (3 sao - Trung bình)</option>
                                <option value="2">⭐⭐ (2 sao - Kém)</option>
                                <option value="1">⭐ (1 sao - Rất kém)</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="review-comment">Nhận xét: <span class="required">*</span></label>
                            <textarea 
                                id="review-comment" 
                                name="comment" 
                                required 
                                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                                rows="5"
                            ></textarea>
                        </div>
                        
                        <button type="submit" class="btn">Gửi Đánh Giá</button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

/**
 * Tạo HTML cho một item đánh giá
 * @param {Object} review - Đối tượng đánh giá
 * @param {string} review.author - Tên người đánh giá
 * @param {number} review.rating - Số sao (1-5)
 * @param {string} review.comment - Nội dung đánh giá
 * @param {string} review.timestamp - Thời gian đánh giá
 * @returns {string} Chuỗi HTML của review item
 */
// Escape nội dung do người dùng nhập để chống XSS khi chèn vào innerHTML
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function ReviewItem(review) {
    const stars = '⭐'.repeat(review.rating);
    const date = new Date(review.timestamp).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="review-item">
            <div class="review-header">
                <span class="review-author">${escapeHtml(review.author)}</span>
                <span class="review-rating">${stars}</span>
            </div>
            <p class="review-comment">${escapeHtml(review.comment)}</p>
            <div class="review-date">${date}</div>
        </div>
    `;
}

/**
 * Tạo HTML cho một item trong giỏ hàng
 * @param {Object} item - Đối tượng sản phẩm trong giỏ hàng
 * @param {number} item.id - ID sản phẩm
 * @param {string} item.name - Tên sản phẩm
 * @param {string} item.brand - Thương hiệu
 * @param {number} item.price - Giá sản phẩm
 * @param {number} item.quantity - Số lượng trong giỏ
 * @param {string} item.image - Đường dẫn hình ảnh
 * @returns {string} Chuỗi HTML của cart item
 */
export function CartItem(item) {
    const itemTotal = item.price * item.quantity;

    return `
        <div class="cart-item" data-id="${item.id}">
            <img 
                src="${item.image}" 
                alt="${item.name}" 
                class="cart-item-image" 
                onclick="window.location.hash = '#/product/${item.id}'"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >
            <div class="cart-item-image-fallback" style="display: none;">🧴</div>
            
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <div class="cart-item-brand">${item.brand}</div>
                <div class="cart-item-price">${formatPrice(item.price)} / sản phẩm</div>
            </div>
            
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn decrease-btn" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>
                        -
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-id="${item.id}">
                        +
                    </button>
                </div>
                
                <div class="cart-item-total">
                    <strong>${formatPrice(itemTotal)}</strong>
                </div>
                
                <button class="btn btn-danger remove-btn" data-id="${item.id}">
                    Xóa
                </button>
            </div>
        </div>
    `;
}

/**
 * Tạo HTML cho trang giỏ hàng trống
 * @returns {string} Chuỗi HTML của giỏ hàng trống
 */
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
 * Tạo HTML cho phần tóm tắt giỏ hàng
 * @param {number} total - Tổng tiền giỏ hàng
 * @param {number} itemCount - Tổng số sản phẩm
 * @returns {string} Chuỗi HTML của cart summary
 */
export function CartSummary(total, itemCount) {
    return `
        <div class="cart-summary">
            <h3>Tóm Tắt Đơn Hàng</h3>
            <div class="summary-row">
                <span>Số lượng sản phẩm:</span>
                <span>${itemCount}</span>
            </div>
            <div class="summary-row total-row">
                <span>Tổng cộng:</span>
                <span class="cart-total">${formatPrice(total)}</span>
            </div>
            <div class="cart-actions">
                <button class="btn btn-secondary" id="clear-cart-btn">Xóa Giỏ Hàng</button>
                <button class="btn" id="checkout-btn">Đặt Hàng</button>
            </div>
        </div>
    `;
}

/**
 * Tạo HTML cho trang thanh toán
 * @param {Array} cartItems - Danh sách sản phẩm trong giỏ hàng
 * @param {number} totalAmount - Tổng tiền đơn hàng
 * @returns {string} Chuỗi HTML của trang thanh toán
 */
export function CheckoutPage(cartItems, totalAmount) {
    return `
        <div class="checkout-container">
            <h2 class="section-title">Thông Tin Thanh Toán</h2>
            
            <div class="checkout-content">
                <!-- Tóm tắt đơn hàng -->
                <div class="order-summary">
                    <h3>Tóm Tắt Đơn Hàng</h3>
                    <div class="order-items">
                        ${cartItems.map(item => `
                            <div class="order-item">
                                <div class="order-item-info">
                                    <span class="order-item-name">${item.name}</span>
                                    <span class="order-item-quantity">x${item.quantity}</span>
                                </div>
                                <span class="order-item-price">${formatPrice(item.price * item.quantity)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-total">
                        <span>Tổng cộng:</span>
                        <span class="total-amount">${formatPrice(totalAmount)}</span>
                    </div>
                </div>
                
                <!-- Form thông tin giao hàng -->
                <div class="checkout-form-wrapper">
                    <form id="checkout-form" class="checkout-form">
                        <h3>Thông Tin Giao Hàng</h3>
                        
                        <div class="form-group">
                            <label for="customer-name">Họ và Tên <span class="required">*</span></label>
                            <input 
                                type="text" 
                                id="customer-name" 
                                name="name" 
                                required
                                placeholder="Nhập họ và tên của bạn"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label for="customer-phone">Số Điện Thoại <span class="required">*</span></label>
                            <input 
                                type="tel" 
                                id="customer-phone" 
                                name="phone" 
                                required
                                placeholder="Nhập số điện thoại"
                                pattern="[0-9]{10,11}"
                            >
                            <small>Vui lòng nhập 10-11 chữ số</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="customer-address">Địa Chỉ Giao Hàng <span class="required">*</span></label>
                            <textarea 
                                id="customer-address" 
                                name="address" 
                                rows="3" 
                                required
                                placeholder="Nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                            ></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <a href="#/cart" class="btn btn-secondary">Quay Lại Giỏ Hàng</a>
                            <button type="submit" class="btn btn-submit-order">Xác Nhận Đặt Hàng</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}


/**
 * Tạo HTML cho trang chủ với Hero Banner
 * @returns {string} Chuỗi HTML của trang chủ
 */
export function HomePage() {
    return `
        <section class="hero-section">
            <div class="hero-decoration hero-decoration-1">🌸</div>
            <div class="hero-decoration hero-decoration-2">🌿</div>
            <div class="hero-decoration hero-decoration-3">💫</div>
            
            <div class="container hero-container">
                <div class="hero-content">
                    <div class="hero-badge">✨ Natural Beauty</div>
                    <h1 class="hero-title">Vẻ&nbsp;Đẹp Thuần&nbsp;Khiết<br>Từ&nbsp;Thiên&nbsp;Nhiên</h1>
                    <p class="hero-subtitle">Khám phá bộ sưu tập mỹ phẩm được tinh chế từ những thành phần tự nhiên, mang lại vẻ đẹp rạng rỡ và bền vững cho làn da của bạn.</p>
                    <div class="hero-features">
                        <div class="hero-feature">
                            <span class="feature-icon">🌱</span>
                            <span class="feature-text">100% Tự Nhiên</span>
                        </div>
                        <div class="hero-feature">
                            <span class="feature-icon">✓</span>
                            <span class="feature-text">Chính Hãng</span>
                        </div>
                        <div class="hero-feature">
                            <span class="feature-icon">🚚</span>
                            <span class="feature-text">Giao Hàng Nhanh</span>
                        </div>
                    </div>
                    <a href="#/products" class="btn hero-cta">Khám Phá Bộ Sưu Tập</a>
                </div>
                <div class="hero-image-container">
                    <div class="hero-visual">
                        <div class="hero-circle hero-circle-1"></div>
                        <div class="hero-circle hero-circle-2"></div>
                        <div class="hero-circle hero-circle-3"></div>
                        <div class="hero-icon">✨</div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Section Danh Mục Sản Phẩm -->
        <section class="category-section">
            <div class="container">
                <h2 class="section-title">Danh Mục Sản Phẩm</h2>
                <div class="category-grid" id="category-grid">
                    <div class="category-card" data-category="serum">
                        <span class="category-icon">
                            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M32 8L28 20H36L32 8Z" fill="currentColor" opacity="0.3"/>
                                <rect x="24" y="20" width="16" height="4" rx="1" fill="currentColor"/>
                                <path d="M26 24H38V52C38 54.2091 36.2091 56 34 56H30C27.7909 56 26 54.2091 26 52V24Z" fill="currentColor" opacity="0.7"/>
                                <circle cx="32" cy="40" r="6" fill="currentColor" opacity="0.4"/>
                            </svg>
                        </span>
                        <h3 class="category-name">Serum</h3>
                        <p class="category-count">Tinh chất dưỡng da</p>
                    </div>
                    <div class="category-card" data-category="kem-duong">
                        <span class="category-icon">
                            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="32" cy="44" rx="18" ry="12" fill="currentColor" opacity="0.7"/>
                                <ellipse cx="32" cy="36" rx="18" ry="8" fill="currentColor"/>
                                <path d="M20 36V44" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                                <path d="M44 36V44" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                            </svg>
                        </span>
                        <h3 class="category-name">Kem Dưỡng</h3>
                        <p class="category-count">Dưỡng ẩm chuyên sâu</p>
                    </div>
                    <div class="category-card" data-category="sua-rua-mat">
                        <span class="category-icon">
                            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 16H40L42 20H22L24 16Z" fill="currentColor"/>
                                <rect x="22" y="20" width="20" height="36" rx="4" fill="currentColor" opacity="0.7"/>
                                <circle cx="32" cy="38" r="8" fill="currentColor" opacity="0.4"/>
                                <path d="M28 28H36" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </span>
                        <h3 class="category-name">Sữa Rửa Mặt</h3>
                        <p class="category-count">Làm sạch dịu nhẹ</p>
                    </div>
                    <div class="category-card" data-category="chong-nang">
                        <span class="category-icon">
                            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="32" cy="24" r="12" fill="currentColor" opacity="0.4"/>
                                <path d="M32 8V12M32 36V40M44 24H48M16 24H20M41 15L44 12M20 36L23 33M44 36L41 33M20 12L23 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <rect x="24" y="42" width="16" height="14" rx="3" fill="currentColor" opacity="0.7"/>
                                <rect x="28" y="38" width="8" height="6" fill="currentColor"/>
                            </svg>
                        </span>
                        <h3 class="category-name">Chống Nắng</h3>
                        <p class="category-count">Bảo vệ da</p>
                    </div>
                    <div class="category-card" data-category="mat-na">
                        <span class="category-icon">
                            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="32" cy="36" rx="20" ry="16" fill="currentColor" opacity="0.7"/>
                                <ellipse cx="24" cy="32" rx="4" ry="3" fill="white" opacity="0.6"/>
                                <ellipse cx="40" cy="32" rx="4" ry="3" fill="white" opacity="0.6"/>
                                <path d="M28 42C28 42 30 44 32 44C34 44 36 42 36 42" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
                                <path d="M16 28C16 28 20 20 32 20C44 20 48 28 48 28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </span>
                        <h3 class="category-name">Mặt Nạ</h3>
                        <p class="category-count">Chăm sóc đặc biệt</p>
                    </div>
                    <div class="category-card" data-category="toner">
                        <span class="category-icon">
                            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="22" y="12" width="20" height="8" rx="2" fill="currentColor"/>
                                <path d="M24 20H40V52C40 54.2091 38.2091 56 36 56H28C25.7909 56 24 54.2091 24 52V20Z" fill="currentColor" opacity="0.7"/>
                                <path d="M28 32L36 32M28 40L36 40" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
                                <circle cx="32" cy="48" r="3" fill="white" opacity="0.4"/>
                            </svg>
                        </span>
                        <h3 class="category-name">Toner</h3>
                        <p class="category-count">Cân bằng da</p>
                    </div>
                    <div class="category-card" data-category="tay-trang">
                        <span class="category-icon">
                            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="12" y="20" width="16" height="6" rx="2" fill="currentColor"/>
                                <path d="M14 26H26V52C26 54.2091 24.2091 56 22 56H18C15.7909 56 14 54.2091 14 52V26Z" fill="currentColor" opacity="0.7"/>
                                <circle cx="44" cy="42" r="12" fill="currentColor" opacity="0.4"/>
                                <circle cx="44" cy="42" r="6" stroke="white" stroke-width="2" opacity="0.6"/>
                            </svg>
                        </span>
                        <h3 class="category-name">Tẩy Trang</h3>
                        <p class="category-count">Làm sạch lớp trang điểm</p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Section Sản Phẩm Nổi Bật với Carousel -->
        <section class="featured-products container">
            <h2 class="section-title">Sản Phẩm Nổi Bật</h2>
            <div class="featured-products-wrapper">
                <button class="carousel-nav prev" id="carousel-prev" aria-label="Xem sản phẩm trước">❮</button>
                <div class="featured-products-container" id="featured-product-list">
                    <!-- Danh sách sản phẩm nổi bật sẽ được JS render vào đây -->
                </div>
                <button class="carousel-nav next" id="carousel-next" aria-label="Xem sản phẩm tiếp theo">❯</button>
            </div>
        </section>
        
        <!-- Section Tất Cả Sản Phẩm -->
        <section class="all-products-section container">
            <h2 class="section-title">Tất Cả Sản Phẩm</h2>
            
            <!-- Bộ lọc thu gọn -->
            <div class="filter-collapsible">
                <button class="filter-toggle-btn" id="filter-toggle-btn">
                    <span class="filter-toggle-text">Bộ lọc sản phẩm</span>
                    <span class="filter-toggle-arrow">▼</span>
                </button>
                <div class="filter-content" id="filter-content">
                    <div class="filter-grid">
                        <div class="filter-item">
                            <label for="home-search-input">Tìm kiếm:</label>
                            <input type="text" id="home-search-input" placeholder="Nhập tên sản phẩm...">
                        </div>
                        <div class="filter-item">
                            <label for="home-category-filter">Danh mục:</label>
                            <select id="home-category-filter">
                                <option value="">Tất cả danh mục</option>
                            </select>
                        </div>
                        <div class="filter-item">
                            <label>Khoảng giá:</label>
                            <div class="price-inputs-inline">
                                <input type="number" id="home-min-price" placeholder="Từ" min="0">
                                <span>-</span>
                                <input type="number" id="home-max-price" placeholder="Đến" min="0">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Danh sách sản phẩm -->
            <div class="all-products-grid" id="all-products-grid">
                <!-- Sản phẩm sẽ được render bởi JS -->
            </div>
            
            <!-- Nút xem thêm -->
            <div class="load-more-wrapper" id="load-more-wrapper">
                <button class="btn load-more-btn" id="load-more-btn">Xem thêm sản phẩm</button>
            </div>
        </section>
    `;
}
