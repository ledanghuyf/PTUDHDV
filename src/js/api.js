/**
 * API Module - Quản lý tất cả các API calls với json-server
 * File này chứa các hàm để giao tiếp với API giả lập
 */

// Định nghĩa URL cơ sở của API
const BASE_URL = 'http://localhost:3000';

/**
 * Lấy tất cả sản phẩm từ API
 * @returns {Promise<Array>} Mảng chứa tất cả sản phẩm
 * @throws {Error} Nếu không thể tải danh sách sản phẩm
 */
export async function getAllProducts() {
    try {
        const response = await fetch(`${BASE_URL}/products`);
        
        // Kiểm tra response có thành công không
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        throw new Error('Không thể tải danh sách sản phẩm. Vui lòng kiểm tra kết nối hoặc json-server.');
    }
}

/**
 * Lấy thông tin chi tiết một sản phẩm theo ID
 * @param {number|string} id - ID của sản phẩm cần lấy
 * @returns {Promise<Object>} Đối tượng chứa thông tin chi tiết sản phẩm
 * @throws {Error} Nếu không tìm thấy sản phẩm hoặc có lỗi kết nối
 */
export async function getProductById(id) {
    try {
        const response = await fetch(`${BASE_URL}/products/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Không tìm thấy sản phẩm');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Lỗi khi lấy sản phẩm ID ${id}:`, error);
        throw new Error('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
    }
}

/**
 * Lấy tất cả đánh giá của một sản phẩm
 * @param {number|string} productId - ID của sản phẩm cần lấy đánh giá
 * @returns {Promise<Array>} Mảng chứa tất cả đánh giá của sản phẩm
 * @throws {Error} Nếu không thể tải đánh giá
 */
export async function getReviewsByProductId(productId) {
    try {
        const response = await fetch(`${BASE_URL}/reviews?productId=${productId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Lỗi khi lấy đánh giá cho sản phẩm ID ${productId}:`, error);
        throw new Error('Không thể tải đánh giá. Vui lòng thử lại.');
    }
}

/**
 * Lấy tất cả đánh giá
 * @returns {Promise<Array>} Mảng chứa tất cả đánh giá
 * @throws {Error} Nếu không thể tải đánh giá
 */
export async function getAllReviews() {
    try {
        const response = await fetch(`${BASE_URL}/reviews`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi khi lấy tất cả đánh giá:', error);
        throw new Error('Không thể tải đánh giá. Vui lòng thử lại.');
    }
}

/**
 * Thêm một đánh giá mới cho sản phẩm
 * @param {Object} reviewData - Dữ liệu đánh giá cần thêm
 * @param {number} reviewData.productId - ID của sản phẩm được đánh giá
 * @param {string} reviewData.author - Tên người đánh giá
 * @param {number} reviewData.rating - Số sao (1-5)
 * @param {string} reviewData.comment - Nội dung đánh giá
 * @param {string} reviewData.timestamp - Thời gian đánh giá (ISO string)
 * @returns {Promise<Object>} Đối tượng đánh giá vừa được tạo (bao gồm ID)
 * @throws {Error} Nếu không thể gửi đánh giá
 */
export async function postReview(reviewData) {
    try {
        const response = await fetch(`${BASE_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi khi gửi đánh giá:', error);
        throw new Error('Không thể gửi đánh giá. Vui lòng thử lại.');
    }
}

/**
 * Hàm helper để kiểm tra kết nối với API server
 * @returns {Promise<boolean>} True nếu server đang hoạt động
 */
export async function checkServerConnection() {
    try {
        const response = await fetch(`${BASE_URL}/products?_limit=1`);
        return response.ok;
    } catch (error) {
        console.error('Không thể kết nối với server:', error);
        return false;
    }
}

/**
 * Cập nhật tồn kho của sản phẩm
 * @param {number|string} id - ID sản phẩm
 * @param {number} stock - Số lượng tồn kho mới
 * @returns {Promise<Object>} Sản phẩm sau khi cập nhật
 */
export async function updateProductStock(id, stock) {
    const response = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock })
    });
    if (!response.ok) {
        throw new Error(`Không thể cập nhật tồn kho sản phẩm ID ${id}`);
    }
    return response.json();
}

/**
 * Tạo đơn hàng mới
 * @param {Object} orderData - Dữ liệu đơn hàng
 * @param {Object} orderData.customerInfo - Thông tin khách hàng
 * @param {Array} orderData.items - Danh sách sản phẩm trong đơn hàng
 * @param {number} orderData.totalAmount - Tổng tiền đơn hàng
 * @param {string} orderData.timestamp - Thời gian đặt hàng
 * @returns {Promise<Object>} Đơn hàng vừa được tạo (bao gồm ID)
 * @throws {Error} Nếu không thể tạo đơn hàng
 */
export async function createOrder(orderData) {
    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
}
