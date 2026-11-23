/**
 * Auth Module - Đăng nhập / đăng ký cho khách hàng và quản lý
 * Mật khẩu băm PBKDF2-SHA256 với muối (salt) riêng từng tài khoản; phiên đăng nhập lưu trong trình duyệt.
 *
 * Lưu ý: xác thực chạy ở trình duyệt vì json-server không có đăng nhập — API /users vẫn đọc được
 * (lộ email, SĐT, mã băm). Đủ cho đồ án; cửa hàng thật cần backend tự kiểm mật khẩu và cấp token.
 */

const SESSION_KEY = 'auth_session';
const PBKDF2_ITERATIONS = 100000;

export const ROLES = { CUSTOMER: 'customer', MANAGER: 'manager' };
export const ROLE_NAMES = { customer: 'Khách hàng', manager: 'Quản lý' };

const toHex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');

export const randomSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));

/** Băm mật khẩu bằng PBKDF2-SHA256 (chậm có chủ đích để khó dò mật khẩu) */
export async function hashPassword(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: PBKDF2_ITERATIONS },
        key, 256);
    return toHex(bits);
}

export async function verifyPassword(password, user) {
    return Boolean(user && user.salt && user.passwordHash) && (await hashPassword(password, user.salt)) === user.passwordHash;
}

/** @returns {string} Lỗi tiếng Việt, rỗng nếu mật khẩu đạt yêu cầu */
export function passwordError(password) {
    if (password.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
    if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'Mật khẩu cần có cả chữ và số.';
    return '';
}

// ===== Phiên đăng nhập =====

/** Thông tin công khai của người đang đăng nhập (không chứa mã băm) hoặc null */
export function currentUser() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
        return null;
    }
}

export function setSession(user) {
    const { id, name, email, phone, username, role } = user;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ id, name, email, phone, username, role })); } catch { /* ẩn danh */ }
}

export function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* bỏ qua */ }
}

export const isManager = () => currentUser()?.role === ROLES.MANAGER;
