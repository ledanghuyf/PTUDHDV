/**
 * API Module - Giao tiếp với json-server
 */

import { SHOP } from './config.js';

// Đổi cổng ở đây nếu chạy json-server ở cổng khác
const BASE_URL = 'http://localhost:3000';

/**
 * Gọi API và trả về JSON; lỗi mạng/HTTP được ghi log và đổi thành thông báo tiếng Việt
 * @param {string} path - Đường dẫn API (VD: '/products')
 * @param {string} errorMessage - Thông báo hiển thị cho người dùng khi lỗi
 * @param {Object} [options] - Tùy chọn fetch (method, body...)
 */
async function request(path, errorMessage, options) {
    try {
        const response = await fetch(`${BASE_URL}${path}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
}

// Tùy chọn fetch cho request gửi JSON
const sendJson = (method, data) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

// ===== Sản phẩm =====
export const getAllProducts = () =>
    request('/products', 'Không thể tải danh sách sản phẩm. Vui lòng kiểm tra kết nối hoặc json-server.');

export const getProductById = (id) =>
    request(`/products/${id}`, 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.');

/**
 * Cập nhật một phần thông tin sản phẩm (VD: { stock, soldCount } sau khi đặt hàng)
 */
export const updateProduct = (id, data) =>
    request(`/products/${id}`, `Không thể cập nhật sản phẩm ID ${id}.`, sendJson('PATCH', data));

export const createProduct = (data) =>
    request('/products', 'Không thể thêm sản phẩm.', sendJson('POST', data));

export const deleteProduct = (id) =>
    request(`/products/${id}`, 'Không thể xóa sản phẩm.', { method: 'DELETE' });

// ===== Tài khoản (khách hàng / quản lý) =====
/**
 * Tìm tài khoản theo email, số điện thoại hoặc tên đăng nhập
 * @returns {Promise<Object|null>}
 */
export async function findUser(identifier) {
    const value = identifier.trim();
    const email = value.toLowerCase();
    const phone = value.replace(/\D/g, '');
    // Lọc ở trình duyệt: json-server đổi "?phone=0911222333" thành số 911222333 nên không khớp SĐT có số 0 đầu.
    // shortcut: tải cả danh sách tài khoản mỗi lần đăng nhập, ổn với vài nghìn tài khoản; lớn hơn cần backend tìm kiếm.
    const users = await request('/users', 'Không thể kiểm tra tài khoản. Vui lòng thử lại.');
    return users.find(u => (u.email && u.email === email)
        || (phone.length >= 10 && u.phone === phone)
        || (u.username && u.username === value)) || null;
}

export const getUsers = () =>
    request('/users', 'Không thể tải danh sách tài khoản.');

export const createUser = (data) =>
    request('/users', 'Không thể tạo tài khoản. Vui lòng thử lại.', sendJson('POST', data));

export const updateUser = (id, data) =>
    request(`/users/${id}`, 'Không thể cập nhật tài khoản.', sendJson('PATCH', data));

// Lọc ở trình duyệt: json-server đổi giá trị toàn chữ số thành số nên ?userId= không đáng tin
export const getOrdersByUser = async (userId) =>
    (await request('/orders', 'Không thể tải đơn hàng của bạn.')).filter(o => String(o.userId) === String(userId));

// ===== Cấu hình nội dung trang (thanh thông báo, banner, phí ship...) =====
export const getSettings = () =>
    request('/settings', 'Không thể tải cấu hình cửa hàng.');

export const updateSettings = (data) =>
    request('/settings', 'Không thể lưu cấu hình cửa hàng.', sendJson('PATCH', data));

// ===== Mã giảm giá =====
export const getCoupons = () =>
    request('/coupons', 'Không thể tải mã giảm giá.');

/** @returns {Promise<Object|null>} Mã giảm giá theo code (không phân biệt hoa thường) hoặc null */
export async function findCoupon(code) {
    // Lọc ở trình duyệt: json-server đổi "?code=2024" thành số nên không khớp mã toàn chữ số
    const wanted = code.trim().toUpperCase();
    const list = await request('/coupons', 'Không thể kiểm tra mã giảm giá.');
    return list.find(c => String(c.code).toUpperCase() === wanted) || null;
}

export const createCoupon = (data) =>
    request('/coupons', 'Không thể thêm mã giảm giá.', sendJson('POST', data));

export const updateCoupon = (id, data) =>
    request(`/coupons/${id}`, 'Không thể cập nhật mã giảm giá.', sendJson('PATCH', data));

export const deleteCoupon = (id) =>
    request(`/coupons/${id}`, 'Không thể xóa mã giảm giá.', { method: 'DELETE' });

// ===== Đánh giá =====
export const getAllReviews = () =>
    request('/reviews', 'Không thể tải đánh giá. Vui lòng thử lại.');

// Lọc ở trình duyệt: json-server đổi "?productId=92" thành số, không khớp id dạng chuỗi
export const getReviewsByProductId = async (productId) =>
    (await getAllReviews()).filter(r => String(r.productId) === String(productId));

/**
 * @param {Object} reviewData - { productId, author, rating (1-5), comment, timestamp }
 */
export const postReview = (reviewData) =>
    request('/reviews', 'Không thể gửi đánh giá. Vui lòng thử lại.', sendJson('POST', reviewData));

// ===== Đơn hàng =====
/**
 * @param {Object} orderData - { customerInfo, items, totalAmount, timestamp }
 * @returns {Promise<Object>} Đơn hàng vừa tạo (có id)
 */
export const createOrder = (orderData) =>
    request('/orders', 'Không thể tạo đơn hàng. Vui lòng thử lại.', sendJson('POST', orderData));

export const getOrderById = (id) =>
    request(`/orders/${id}`, 'Không tìm thấy đơn hàng.');

export const getOrders = () =>
    request('/orders', 'Không thể tải danh sách đơn hàng.');

/**
 * Tìm đơn theo mã đơn (code) — đơn cũ không có code thì mã đơn chính là id
 * @returns {Promise<Object|null>}
 */
export async function findOrderByCode(code) {
    const byCode = await request(`/orders?code=${encodeURIComponent(code)}`, 'Không thể tra cứu đơn hàng.');
    if (byCode[0]) return byCode[0];
    const response = await fetch(`${BASE_URL}/orders/${encodeURIComponent(code)}`).catch(() => null);
    return response && response.ok ? response.json() : null;
}

// ===== Đơn vị hành chính Việt Nam (sau sáp nhập 01/07/2025: Tỉnh/Thành phố → Phường/Xã) =====
// API miễn phí, cho phép gọi từ trình duyệt: https://provinces.open-api.vn
const ADDRESS_API = 'https://provinces.open-api.vn/api/v2';

async function getAddressData(path) {
    const response = await fetch(`${ADDRESS_API}${path}`);
    if (!response.ok) throw new Error('Không tải được danh sách địa chỉ. Vui lòng thử lại.');
    return response.json();
}

/** @returns {Promise<Array<{code:number, name:string}>>} 34 tỉnh/thành phố */
export const getProvinces = () => getAddressData('/p/');

/** @returns {Promise<Array<{code:number, name:string}>>} Phường/xã thuộc tỉnh */
export const getWards = async (provinceCode) => (await getAddressData(`/p/${provinceCode}?depth=2`)).wards;

export const updateOrder = (id, data) =>
    request(`/orders/${id}`, 'Không thể cập nhật đơn hàng.', sendJson('PATCH', data));

// ===== Email xác nhận (Google Apps Script Web app) =====
/**
 * Gửi email xác nhận đơn hàng tới email khách (script: setup/email-script/Code.gs)
 * @param {Object} params - { to_email, to_name, order_id, items: [{name, quantity, total}], order_total, ... }
 */
export async function sendOrderEmail(params) {
    // text/plain để trình duyệt không gửi preflight CORS (Apps Script không trả lời OPTIONS)
    const response = await fetch(SHOP.emailScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(params)
    });
    const result = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` }));
    if (!result.ok) {
        throw new Error(`Gửi email lỗi: ${result.error}`);
    }
}
