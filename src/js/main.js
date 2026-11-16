/**
 * Main JS - File trung tâm điều khiển toàn bộ ứng dụng
 * Quản lý routing, render giao diện và xử lý sự kiện
 */

// Import các module cần thiết
import * as api from './api.js';
import * as cart from './cart.js';
import * as components from './components.js';

// Import thêm các hàm cần thiết cho checkout
import { createOrder } from './api.js';

// DOM References
const app = document.getElementById('app');

/**
 * Router - Xử lý định tuyến dựa trên URL hash
 */
async function router() {
    // Scroll về đầu trang ngay lập tức khi chuyển route
    window.scrollTo(0, 0);
    
    // Lấy hash từ URL
    const hash = window.location.hash || '#/';
    
    // Cập nhật active tab
    updateActiveNav(hash);
    
    // Hiển thị loading
    showLoading();
    
    try {
        // Xử lý các route khác nhau
        if (hash === '#/' || hash === '') {
            await renderHomePage();
        } else if (hash === '#/products' || hash.startsWith('#/products?')) {
            await renderProductsPage();
        } else if (hash.startsWith('#/product/')) {
            // Lấy ID từ hash (VD: #/product/1 -> id = 1)
            const id = hash.split('/')[2];
            await renderProductDetailPage(id);
        } else if (hash === '#/cart') {
            renderCartPage();
        } else if (hash === '#/checkout') {
            renderCheckoutPage();
        } else {
            // Route không tồn tại
            show404Page();
        }
    } catch (error) {
        console.error('Lỗi khi render trang:', error);
        showErrorPage(error.message);
    }
}

/**
 * Cập nhật trạng thái active cho navigation
 */
function updateActiveNav(hash) {
    // Xóa class active khỏi tất cả nav links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Thêm class active cho link tương ứng
    if (hash === '#/' || hash === '') {
        document.querySelector('.nav-links a[href="#/"]')?.classList.add('active');
    } else if (hash === '#/products' || hash.startsWith('#/products?') || hash.startsWith('#/product/')) {
        document.querySelector('.nav-links a[href="#/products"]')?.classList.add('active');
    } else if (hash === '#/cart' || hash === '#/checkout') {
        document.querySelector('.nav-links a[href="#/cart"]')?.classList.add('active');
    }
}

/**
 * Render trang chủ với Hero Banner
 */
async function renderHomePage() {
    // Render cấu trúc trang chủ
    app.innerHTML = components.HomePage();
    
    // Lấy và render sản phẩm nổi bật
    try {
        const products = await api.getAllProducts();
        const reviews = await api.getAllReviews();
        
        // Tính điểm nổi bật cho mỗi sản phẩm
        const featuredProducts = calculateFeaturedScore(products, reviews);
        
        const productListElement = document.getElementById('featured-product-list');
        if (productListElement) {
            productListElement.innerHTML = featuredProducts
                .map(product => components.ProductCard(product))
                .join('');
            
            // Khởi tạo carousel
            initCarousel(featuredProducts.length);
        }
        
        // Gắn event cho category cards
        initCategoryCards();
        
        // Khởi tạo section tất cả sản phẩm
        initAllProductsSection(products);
        
    } catch (error) {
        console.error('Không thể tải sản phẩm nổi bật:', error);
        const productListElement = document.getElementById('featured-product-list');
        if (productListElement) {
            productListElement.innerHTML = '<p style="text-align: center; color: var(--text-light);">Không thể tải sản phẩm. Vui lòng thử lại sau.</p>';
        }
    }
}

/**
 * Tính điểm nổi bật cho sản phẩm dựa trên lượt bán và đánh giá
 * Công thức: score = (normalizedSoldCount * 0.5) + (avgRating * 0.5)
 * Ngưỡng nổi bật: score >= 4.0
 * @param {Array} products - Danh sách sản phẩm
 * @param {Array} reviews - Danh sách đánh giá
 * @returns {Array} Danh sách sản phẩm nổi bật (score >= 4.0)
 */
function calculateFeaturedScore(products, reviews) {
    const FEATURED_THRESHOLD = 4.0; // Ngưỡng điểm để được coi là nổi bật
    
    // Tìm soldCount max để normalize
    const maxSoldCount = Math.max(...products.map(p => p.soldCount || 0));
    
    // Tính rating trung bình cho mỗi sản phẩm
    const productScores = products.map(product => {
        const productReviews = reviews.filter(r => String(r.productId) === String(product.id));
        const avgRating = productReviews.length > 0
            ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
            : 3; // Default rating nếu chưa có đánh giá
        
        // Normalize soldCount về thang 0-5
        const normalizedSoldCount = maxSoldCount > 0 
            ? ((product.soldCount || 0) / maxSoldCount) * 5 
            : 0;
        
        // Tính điểm tổng hợp (50% lượt bán + 50% đánh giá)
        const score = (normalizedSoldCount * 0.5) + (avgRating * 0.5);
        
        return {
            ...product,
            avgRating: avgRating.toFixed(1),
            score: score,
            isFeatured: score >= FEATURED_THRESHOLD
        };
    });
    
    // Lọc sản phẩm nổi bật (score >= ngưỡng) và sắp xếp theo điểm giảm dần
    const featuredProducts = productScores
        .filter(p => p.score >= FEATURED_THRESHOLD)
        .sort((a, b) => b.score - a.score);
    
    // Lưu danh sách ID sản phẩm nổi bật vào window để dùng ở nơi khác
    window.featuredProductIds = featuredProducts.map(p => p.id);
    
    return featuredProducts;
}

/**
 * Khởi tạo section tất cả sản phẩm với bộ lọc và nút xem thêm
 */
function initAllProductsSection(products) {
    // Đánh dấu sản phẩm nổi bật
    const productsWithFeatured = products.map(p => ({
        ...p,
        isFeatured: window.featuredProductIds?.includes(p.id) || false
    }));
    
    const PRODUCTS_PER_PAGE = 8; // 2 hàng x 4 cột
    let currentPage = 1;
    let filteredProducts = [...productsWithFeatured];
    
    // Lấy danh sách danh mục
    const categories = [...new Set(products.map(p => p.category))];
    const categoryNames = {
        'serum': 'Serum',
        'kem-duong': 'Kem Dưỡng',
        'sua-rua-mat': 'Sữa Rửa Mặt',
        'mat-na': 'Mặt Nạ',
        'chong-nang': 'Chống Nắng',
        'toner': 'Toner',
        'tay-trang': 'Tẩy Trang'
    };
    
    // Populate category filter
    const categoryFilter = document.getElementById('home-category-filter');
    if (categoryFilter) {
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = categoryNames[cat] || cat;
            categoryFilter.appendChild(option);
        });
    }
    
    // Toggle filter
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterCollapsible = document.querySelector('.filter-collapsible');
    
    if (filterToggleBtn && filterCollapsible) {
        filterToggleBtn.addEventListener('click', () => {
            filterCollapsible.classList.toggle('open');
        });
    }
    
    // Render products function
    function renderAllProducts() {
        const grid = document.getElementById('all-products-grid');
        const loadMoreWrapper = document.getElementById('load-more-wrapper');
        
        if (!grid) return;
        
        const displayProducts = filteredProducts.slice(0, currentPage * PRODUCTS_PER_PAGE);
        
        grid.innerHTML = displayProducts.length > 0
            ? displayProducts.map(product => components.ProductCard(product)).join('')
            : '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">Không tìm thấy sản phẩm nào phù hợp</p>';
        
        // Show/hide load more button
        if (loadMoreWrapper) {
            if (displayProducts.length >= filteredProducts.length) {
                loadMoreWrapper.classList.add('hidden');
            } else {
                loadMoreWrapper.classList.remove('hidden');
            }
        }
    }
    
    // Filter function
    function filterAllProducts() {
        const searchTerm = document.getElementById('home-search-input')?.value.toLowerCase().trim() || '';
        const selectedCategory = document.getElementById('home-category-filter')?.value || '';
        const minPrice = parseFloat(document.getElementById('home-min-price')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('home-max-price')?.value) || Infinity;
        
        filteredProducts = productsWithFeatured.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || product.category === selectedCategory;
            const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
            
            return matchesSearch && matchesCategory && matchesPrice;
        });
        
        currentPage = 1;
        renderAllProducts();
    }
    
    // Attach filter listeners
    document.getElementById('home-search-input')?.addEventListener('input', filterAllProducts);
    document.getElementById('home-category-filter')?.addEventListener('change', filterAllProducts);
    document.getElementById('home-min-price')?.addEventListener('input', filterAllProducts);
    document.getElementById('home-max-price')?.addEventListener('input', filterAllProducts);
    
    // Load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            renderAllProducts();
        });
    }
    
    // Initial render
    renderAllProducts();
}

/**
 * Khởi tạo carousel cho sản phẩm nổi bật
 */
function initCarousel(totalProducts) {
    const container = document.getElementById('featured-product-list');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    
    if (!container || !prevBtn || !nextBtn) return;
    
    let currentIndex = 0;
    const itemsPerView = getItemsPerView();
    const maxIndex = Math.max(0, totalProducts - itemsPerView);
    
    function getItemsPerView() {
        if (window.innerWidth <= 480) return 1;
        if (window.innerWidth <= 768) return 2;
        if (window.innerWidth <= 1024) return 3;
        return 4;
    }
    
    function updateCarousel() {
        const itemWidth = container.children[0]?.offsetWidth || 280;
        const gap = 24; // 1.5rem gap
        const offset = currentIndex * (itemWidth + gap);
        container.style.transform = `translateX(-${offset}px)`;
        
        // Update button states
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIndex;
    }
    
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });
    
    // Update on resize
    window.addEventListener('resize', () => {
        currentIndex = 0;
        updateCarousel();
    });
    
    // Initial state
    updateCarousel();
}

/**
 * Khởi tạo event cho category cards
 */
function initCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            // Chuyển đến trang sản phẩm với filter theo category
            window.location.hash = `#/products?category=${category}`;
        });
    });
}

/**
 * Render trang danh sách sản phẩm với bộ lọc
 */
async function renderProductsPage() {
    // Lấy tất cả sản phẩm
    const products = await api.getAllProducts();
    
    // Lấy danh sách danh mục duy nhất
    const categories = [...new Set(products.map(p => p.category))];
    
    // Tạo tên hiển thị cho danh mục
    const categoryNames = {
        'serum': 'Serum',
        'kem-duong': 'Kem Dưỡng',
        'sua-rua-mat': 'Sữa Rửa Mặt',
        'mat-na': 'Mặt Nạ',
        'chong-nang': 'Chống Nắng',
        'toner': 'Toner',
        'tay-trang': 'Tẩy Trang'
    };
    
    // Lấy category từ URL nếu có
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const selectedCategory = urlParams.get('category') || '';
    
    // Tạo HTML với bộ lọc thu gọn
    app.innerHTML = `
        <div class="container">
            <h2 class="section-title">Tất Cả Sản Phẩm</h2>
            
            <!-- Bộ lọc thu gọn -->
            <div class="filter-collapsible" id="page-filter-collapsible">
                <button class="filter-toggle-btn" id="page-filter-toggle-btn">
                    <span class="filter-toggle-text">Bộ lọc sản phẩm</span>
                    <span class="filter-toggle-arrow">▼</span>
                </button>
                <div class="filter-content" id="page-filter-content">
                    <div class="filter-grid">
                        <div class="filter-item">
                            <label for="search-input">Tìm kiếm:</label>
                            <input type="text" id="search-input" placeholder="Nhập tên sản phẩm...">
                        </div>
                        <div class="filter-item">
                            <label for="category-filter">Danh mục:</label>
                            <select id="category-filter">
                                <option value="">Tất cả danh mục</option>
                                ${categories.map(cat => `<option value="${cat}" ${cat === selectedCategory ? 'selected' : ''}>${categoryNames[cat] || cat}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-item">
                            <label>Khoảng giá:</label>
                            <div class="price-inputs-inline">
                                <input type="number" id="min-price" placeholder="Từ" min="0">
                                <span>-</span>
                                <input type="number" id="max-price" placeholder="Đến" min="0">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Danh sách sản phẩm -->
            <div class="products-grid" id="products-grid">
                <!-- Sản phẩm sẽ được render bởi JS -->
            </div>
            
            <!-- Nút xem thêm -->
            <div class="load-more-wrapper" id="page-load-more-wrapper">
                <button class="btn load-more-btn" id="page-load-more-btn">Xem thêm sản phẩm</button>
            </div>
        </div>
    `;
    
    // Toggle filter cho trang sản phẩm
    const pageFilterToggle = document.getElementById('page-filter-toggle-btn');
    const pageFilterCollapsible = document.getElementById('page-filter-collapsible');
    if (pageFilterToggle && pageFilterCollapsible) {
        pageFilterToggle.addEventListener('click', () => {
            pageFilterCollapsible.classList.toggle('open');
        });
    }
    
    // Khởi tạo phân trang và bộ lọc
    initProductsPageWithPagination(products, selectedCategory);
}

/**
 * Khởi tạo trang sản phẩm với phân trang và bộ lọc
 */
function initProductsPageWithPagination(products, initialCategory) {
    const PRODUCTS_PER_PAGE = 6; // 2 hàng x 3 cột
    let currentPage = 1;
    let filteredProducts = [...products];
    
    // Nếu có category từ URL, lọc ngay
    if (initialCategory) {
        filteredProducts = products.filter(p => p.category === initialCategory);
    }
    
    // Render products function
    function renderProducts() {
        const grid = document.getElementById('products-grid');
        const loadMoreWrapper = document.getElementById('page-load-more-wrapper');
        
        if (!grid) return;
        
        const displayProducts = filteredProducts.slice(0, currentPage * PRODUCTS_PER_PAGE);
        
        grid.innerHTML = displayProducts.length > 0
            ? displayProducts.map(product => components.ProductCard(product)).join('')
            : '<p style="text-align: center; color: var(--text-light); grid-column: 1/-1;">Không tìm thấy sản phẩm nào phù hợp</p>';
        
        // Show/hide load more button
        if (loadMoreWrapper) {
            if (displayProducts.length >= filteredProducts.length) {
                loadMoreWrapper.classList.add('hidden');
            } else {
                loadMoreWrapper.classList.remove('hidden');
            }
        }
    }
    
    // Filter function
    function filterProducts() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
        const selectedCategory = document.getElementById('category-filter')?.value || '';
        const minPrice = parseFloat(document.getElementById('min-price')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('max-price')?.value) || Infinity;
        
        filteredProducts = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || product.category === selectedCategory;
            const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
            
            return matchesSearch && matchesCategory && matchesPrice;
        });
        
        currentPage = 1;
        renderProducts();
    }
    
    // Attach filter listeners
    document.getElementById('search-input')?.addEventListener('input', filterProducts);
    document.getElementById('category-filter')?.addEventListener('change', filterProducts);
    document.getElementById('min-price')?.addEventListener('input', filterProducts);
    document.getElementById('max-price')?.addEventListener('input', filterProducts);
    
    // Load more button
    const loadMoreBtn = document.getElementById('page-load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            renderProducts();
        });
    }
    
    // Initial render
    renderProducts();
}

/**
 * Render trang chi tiết sản phẩm
 */
async function renderProductDetailPage(id) {
    // Lấy thông tin sản phẩm và đánh giá
    const product = await api.getProductById(id);
    const reviews = await api.getReviewsByProductId(id);
    
    // Render HTML
    app.innerHTML = `
        <div class="container">
            ${components.ProductDetail(product, reviews)}
        </div>
    `;
    
    // Gắn event listener cho form đánh giá
    attachReviewFormListener(id);
    
    // Gắn event listener cho nút thêm vào giỏ hàng
    attachAddToCartListener(product);
}

/**
 * Gắn event listener cho form đánh giá
 */
function attachReviewFormListener(productId) {
    const reviewForm = document.getElementById('review-form');
    
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Lấy dữ liệu từ form
            const author = document.getElementById('review-author').value.trim();
            const rating = parseInt(document.getElementById('review-rating').value);
            const comment = document.getElementById('review-comment').value.trim();
            
            // Validate
            if (!author || !comment) {
                alert('Vui lòng điền đầy đủ thông tin!');
                return;
            }
            
            // Tạo object đánh giá
            const reviewData = {
                productId: parseInt(productId),
                author: author,
                rating: rating,
                comment: comment,
                timestamp: new Date().toISOString()
            };
            
            try {
                // Gửi đánh giá lên API
                await api.postReview(reviewData);
                
                // Lấy lại danh sách đánh giá mới
                const updatedReviews = await api.getReviewsByProductId(productId);
                
                // Cập nhật danh sách đánh giá
                const reviewsList = document.getElementById('reviews-list');
                if (reviewsList) {
                    reviewsList.innerHTML = updatedReviews.map(review => 
                        components.ReviewItem(review)
                    ).join('');
                }
                
                // Reset form
                reviewForm.reset();
                
                // Thông báo thành công
                alert('Cảm ơn bạn đã đánh giá sản phẩm!');
            } catch (error) {
                alert('Không thể gửi đánh giá. Vui lòng thử lại!');
            }
        });
    }
}

/**
 * Gắn event listener cho nút thêm vào giỏ hàng ở trang chi tiết
 */
function attachAddToCartListener(product) {
    const addToCartBtn = document.querySelector('.btn-add-to-cart');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const quantityInput = document.getElementById('quantity-input');
            const quantity = Number(quantityInput.value);

            // Thêm vào giỏ hàng (null = số lượng không hợp lệ hoặc vượt tồn kho)
            if (!cart.addToCart(product, quantity)) {
                const inCart = cart.getProductQuantityInCart(product.id);
                alert(`Số lượng không hợp lệ. Tồn kho: ${product.stock}, đã có trong giỏ: ${inCart}.`);
                return;
            }
            
            // Cập nhật icon giỏ hàng
            updateCartIcon();
            
            // Thông báo
            alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
        });
    }
}

/**
 * Render trang giỏ hàng
 */
function renderCartPage() {
    // Lấy giỏ hàng
    const cartItems = cart.getCart();
    const total = cart.getCartTotal();
    const itemCount = cart.getCartItemCount();
    
    // Kiểm tra giỏ hàng rỗng
    if (cartItems.length === 0) {
        app.innerHTML = `
            <div class="container">
                <div class="cart-container">
                    <h2 class="section-title">Giỏ Hàng</h2>
                    ${components.EmptyCart()}
                </div>
            </div>
        `;
        return;
    }
    
    // Render giỏ hàng có sản phẩm
    app.innerHTML = `
        <div class="container">
            <div class="cart-container">
                <h2 class="section-title">Giỏ Hàng Của Bạn</h2>
                
                <div class="cart-items" id="cart-items">
                    ${cartItems.map(item => components.CartItem(item)).join('')}
                </div>
                
                <div class="cart-summary">
                    <h3>Tóm Tắt Đơn Hàng</h3>
                    <div class="summary-row">
                        <span>Số lượng sản phẩm:</span>
                        <span>${itemCount}</span>
                    </div>
                    <div class="summary-row total-row">
                        <span>Tổng cộng:</span>
                        <span class="cart-total">${components.formatPrice(total)}</span>
                    </div>
                    <div class="cart-actions">
                        <button class="btn btn-secondary" id="clear-cart-btn">Xóa Giỏ Hàng</button>
                        <a href="#/checkout" class="btn btn-checkout">Tiến Hành Đặt Hàng</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Gắn event listeners cho giỏ hàng
    attachCartListeners();
}

/**
 * Render trang thanh toán
 */
function renderCheckoutPage() {
    const cartItems = cart.getCart();
    
    // Nếu giỏ hàng trống, chuyển về trang sản phẩm
    if (cartItems.length === 0) {
        alert('Giỏ hàng của bạn đang trống!');
        window.location.hash = '#/products';
        return;
    }
    
    const totalAmount = cart.getCartTotal();
    
    // Render trang checkout
    app.innerHTML = `
        <div class="container">
            ${components.CheckoutPage(cartItems, totalAmount)}
        </div>
    `;
    
    // Gắn event listener cho form
    attachCheckoutFormListener();
}

/**
 * Gắn event listener cho form thanh toán
 */
function attachCheckoutFormListener() {
    const checkoutForm = document.getElementById('checkout-form');
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

/**
 * Xử lý submit form thanh toán
 */
async function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('.btn-submit-order');

    // Lấy thông tin khách hàng từ form
    const customerInfo = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        address: form.address.value.trim()
    };

    // `required` vẫn cho qua chuỗi toàn khoảng trắng
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        alert('Vui lòng điền đầy đủ thông tin giao hàng!');
        return;
    }

    // Disable button để tránh submit nhiều lần
    submitButton.disabled = true;
    submitButton.textContent = 'Đang xử lý...';
    
    // Lấy thông tin giỏ hàng
    const items = cart.getCart();
    const totalAmount = cart.getCartTotal();
    
    // Tạo object đơn hàng
    const orderData = {
        customerInfo,
        items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        totalAmount,
        timestamp: new Date().toISOString()
    };
    
    try {
        // Lấy tồn kho mới nhất từ server (giỏ trong localStorage có thể đã cũ)
        const latestProducts = await Promise.all(items.map(item => api.getProductById(item.id)));
        const shortIndex = items.findIndex((item, i) => latestProducts[i].stock < item.quantity);
        if (shortIndex !== -1) {
            alert(`Sản phẩm "${items[shortIndex].name}" chỉ còn ${latestProducts[shortIndex].stock} trong kho. Vui lòng cập nhật lại giỏ hàng!`);
            submitButton.disabled = false;
            submitButton.textContent = 'Xác Nhận Đặt Hàng';
            return;
        }

        // Gửi đơn hàng lên server
        await createOrder(orderData);

        // Trừ tồn kho; lỗi ở bước này không báo "đặt hàng lỗi" để khách không đặt trùng đơn
        try {
            await Promise.all(items.map((item, i) =>
                api.updateProductStock(item.id, latestProducts[i].stock - item.quantity)));
        } catch (stockError) {
            console.error('Đơn đã tạo nhưng không cập nhật được tồn kho:', stockError);
        }

        // Thành công
        alert('Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại Cosmetics Store.\n\nChúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.');
        
        // Xóa giỏ hàng
        cart.clearCart();
        
        // Cập nhật icon giỏ hàng
        updateCartIcon();
        
        // Chuyển về trang chủ
        window.location.hash = '#/';
        
    } catch (error) {
        // Lỗi
        alert('Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
        console.error('Lỗi không thể gửi đơn hàng:', error);
        
        // Enable lại button
        submitButton.disabled = false;
        submitButton.textContent = 'Xác Nhận Đặt Hàng';
    }
}

/**
 * Gắn event listeners cho các nút trong giỏ hàng
 */
function attachCartListeners() {
    // Nút tăng số lượng
    document.querySelectorAll('.increase-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            const currentQty = cart.getProductQuantityInCart(productId);
            if (cart.updateQuantity(productId, currentQty + 1) === false) {
                alert('Đã đạt số lượng tồn kho tối đa!');
                return;
            }
            renderCartPage(); // Re-render
        });
    });
    
    // Nút giảm số lượng
    document.querySelectorAll('.decrease-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            const currentQty = cart.getProductQuantityInCart(productId);
            if (currentQty > 1) {
                cart.updateQuantity(productId, currentQty - 1);
                renderCartPage(); // Re-render
            }
        });
    });
    
    // Nút xóa sản phẩm
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.dataset.id);
            if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                cart.removeFromCart(productId);
                renderCartPage(); // Re-render
            }
        });
    });
    
    // Nút xóa toàn bộ giỏ hàng
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
                cart.clearCart();
                renderCartPage(); // Re-render
            }
        });
    }
    
    // Nút đặt hàng
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            alert('Đặt hàng thành công! Cảm ơn bạn đã mua hàng tại Cosmetics Store.');
            cart.clearCart();
            window.location.hash = '#/';
        });
    }
}

/**
 * Event Delegation - Xử lý click trên các nút "Thêm vào giỏ" trong danh sách sản phẩm
 */
app.addEventListener('click', async (e) => {
    // Kiểm tra nếu click vào nút "Thêm vào giỏ"
    if (e.target.classList.contains('add-to-cart-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        const productId = parseInt(e.target.dataset.id);
        console.log('Thêm sản phẩm ID:', productId);
        
        try {
            // Lấy thông tin sản phẩm
            const product = await api.getProductById(productId);
            console.log('Sản phẩm:', product);
            
            // Thêm vào giỏ hàng
            if (!cart.addToCart(product, 1)) {
                alert('Sản phẩm đã đạt số lượng tồn kho tối đa trong giỏ!');
                return;
            }
            console.log('Giỏ hàng sau khi thêm:', cart.getCart());
            
            // Cập nhật icon
            updateCartIcon();
            
            // Thông báo
            alert('Đã thêm sản phẩm vào giỏ hàng!');
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Không thể thêm sản phẩm vào giỏ hàng!');
        }
    }
});

/**
 * Cập nhật số lượng trên icon giỏ hàng
 */
function updateCartIcon() {
    cart.updateCartCount();
}

/**
 * Hiển thị loading
 */
function showLoading() {
    app.innerHTML = `
        <div class="container">
            <div class="loading">Đang tải...</div>
        </div>
    `;
}

/**
 * Hiển thị trang lỗi
 */
function showErrorPage(message) {
    app.innerHTML = `
        <div class="container">
            <div class="error-message">
                <h2>Đã xảy ra lỗi</h2>
                <p>${message}</p>
                <a href="#/" class="btn">Quay về trang chủ</a>
            </div>
        </div>
    `;
}

/**
 * Hiển thị trang 404
 */
function show404Page() {
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

/**
 * Khởi tạo ứng dụng
 */
function init() {
    // Cập nhật icon giỏ hàng lần đầu
    updateCartIcon();
    
    // Gọi router lần đầu
    router();
    
    // Lắng nghe sự thay đổi hash
    window.addEventListener('hashchange', router);
}

// Khởi động ứng dụng khi DOM đã sẵn sàng
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
