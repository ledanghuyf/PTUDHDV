/**
 * Cart Module - Quản lý giỏ hàng với localStorage
 * File này chứa tất cả logic liên quan đến giỏ hàng
 */

// Key để lưu trữ giỏ hàng trong localStorage
const CART_STORAGE_KEY = 'shopping_cart';

/**
 * Lấy giỏ hàng từ localStorage
 * @returns {Array} Mảng các sản phẩm trong giỏ hàng, hoặc mảng rỗng nếu chưa có
 */
export function getCart() {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        
        // Nếu không có dữ liệu, trả về mảng rỗng
        if (!cartData) {
            return [];
        }
        
        // Parse dữ liệu JSON
        const cart = JSON.parse(cartData);
        
        // Đảm bảo trả về mảng
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        console.error('Lỗi khi đọc giỏ hàng từ localStorage:', error);
        return [];
    }
}

/**
 * Lưu giỏ hàng vào localStorage
 * @param {Array} cart - Mảng các sản phẩm trong giỏ hàng
 */
export function saveCart(cart) {
    try {
        // Đảm bảo cart là mảng
        if (!Array.isArray(cart)) {
            console.error('Cart phải là một mảng');
            return;
        }
        
        // Stringify và lưu vào localStorage
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        
        // Cập nhật số lượng hiển thị trên icon giỏ hàng
        updateCartCount();
    } catch (error) {
        console.error('Lỗi khi lưu giỏ hàng vào localStorage:', error);
    }
}

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {Object} product - Đối tượng sản phẩm cần thêm
 * @param {number} quantity - Số lượng cần thêm (mặc định là 1)
 * @returns {Array} Giỏ hàng sau khi thêm sản phẩm
 */
export function addToCart(product, quantity = 1) {
    // Validate input
    if (!product || !product.id) {
        console.error('Sản phẩm không hợp lệ');
        return getCart();
    }
    
    if (!Number.isInteger(quantity) || quantity <= 0) {
        console.error('Số lượng phải lớn hơn 0');
        return null;
    }

    // Lấy giỏ hàng hiện tại
    const cart = getCart();

    // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
    const existingItemIndex = cart.findIndex(item => item.id === product.id);

    // Không cho tổng số lượng trong giỏ vượt tồn kho
    const currentQty = existingItemIndex !== -1 ? cart[existingItemIndex].quantity : 0;
    if (product.stock !== undefined && currentQty + quantity > product.stock) {
        return null;
    }

    if (existingItemIndex !== -1) {
        // Sản phẩm đã có trong giỏ → tăng số lượng
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Sản phẩm chưa có → thêm mới
        cart.push({
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.image,
            stock: product.stock,
            quantity: quantity
        });
    }
    
    // Lưu giỏ hàng
    saveCart(cart);
    
    return cart;
}

/**
 * Cập nhật số lượng của một sản phẩm trong giỏ hàng
 * @param {number|string} productId - ID của sản phẩm cần cập nhật
 * @param {number} quantity - Số lượng mới
 */
export function updateQuantity(productId, quantity) {
    // Lấy giỏ hàng hiện tại
    const cart = getCart();
    
    // Tìm sản phẩm trong giỏ hàng
    const itemIndex = cart.findIndex(item => item.id == productId);
    
    if (itemIndex === -1) {
        console.error(`Không tìm thấy sản phẩm với ID ${productId} trong giỏ hàng`);
        return;
    }
    
    // Nếu số lượng <= 0, xóa sản phẩm
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    // Không vượt tồn kho (item cũ chưa lưu stock thì bỏ qua)
    if (cart[itemIndex].stock !== undefined && quantity > cart[itemIndex].stock) {
        return false;
    }

    // Cập nhật số lượng
    cart[itemIndex].quantity = quantity;
    
    // Lưu giỏ hàng
    saveCart(cart);
}

/**
 * Xóa một sản phẩm khỏi giỏ hàng
 * @param {number|string} productId - ID của sản phẩm cần xóa
 */
export function removeFromCart(productId) {
    // Lấy giỏ hàng hiện tại
    let cart = getCart();
    
    // Lọc bỏ sản phẩm có ID tương ứng
    cart = cart.filter(item => item.id != productId);
    
    // Lưu giỏ hàng
    saveCart(cart);
}

/**
 * Tính tổng số lượng các mặt hàng trong giỏ
 * @returns {number} Tổng số lượng sản phẩm (không phải số loại sản phẩm)
 */
export function getCartItemCount() {
    const cart = getCart();
    
    // Tính tổng số lượng của tất cả sản phẩm
    return cart.reduce((total, item) => {
        return total + (item.quantity || 0);
    }, 0);
}

/**
 * Xóa toàn bộ giỏ hàng
 */
export function clearCart() {
    try {
        // Xóa dữ liệu khỏi localStorage
        localStorage.removeItem(CART_STORAGE_KEY);
        
        // Cập nhật số lượng hiển thị
        updateCartCount();
    } catch (error) {
        console.error('Lỗi khi xóa giỏ hàng:', error);
    }
}

/**
 * Tính tổng tiền của giỏ hàng
 * @returns {number} Tổng tiền
 */
export function getCartTotal() {
    const cart = getCart();
    
    return cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

/**
 * Cập nhật số lượng hiển thị trên icon giỏ hàng trong header
 */
export function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    
    if (cartCountElement) {
        const count = getCartItemCount();
        cartCountElement.textContent = count;
        // Ẩn badge khi giỏ trống
        cartCountElement.classList.toggle('is-empty', count === 0);
    }
}

/**
 * Kiểm tra xem một sản phẩm có trong giỏ hàng không
 * @param {number|string} productId - ID của sản phẩm cần kiểm tra
 * @returns {boolean} True nếu sản phẩm có trong giỏ hàng
 */
export function isInCart(productId) {
    const cart = getCart();
    return cart.some(item => item.id == productId);
}

/**
 * Lấy số lượng của một sản phẩm trong giỏ hàng
 * @param {number|string} productId - ID của sản phẩm
 * @returns {number} Số lượng sản phẩm trong giỏ (0 nếu không có)
 */
export function getProductQuantityInCart(productId) {
    const cart = getCart();
    const item = cart.find(item => item.id == productId);
    return item ? item.quantity : 0;
}
