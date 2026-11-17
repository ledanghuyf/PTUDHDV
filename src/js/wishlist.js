/**
 * Wishlist Module - Sản phẩm yêu thích, lưu id trong localStorage của trình duyệt
 */

const WISHLIST_KEY = 'wishlist';

export function getWishlist() {
    try {
        const ids = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
        return Array.isArray(ids) ? ids.map(String) : [];
    } catch {
        return [];
    }
}

export const isWished = id => getWishlist().includes(String(id));

/**
 * Thêm/bỏ sản phẩm khỏi danh sách yêu thích
 * @returns {boolean} true nếu sau thao tác sản phẩm đang được yêu thích
 */
export function toggleWish(id) {
    const ids = getWishlist();
    const key = String(id);
    const next = ids.includes(key) ? ids.filter(x => x !== key) : [...ids, key];
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(next)); } catch { /* chế độ ẩn danh: chỉ giữ trong phiên */ }
    updateWishCount();
    return next.includes(key);
}

export function updateWishCount() {
    const el = document.getElementById('wishCount');
    if (!el) return;
    const count = getWishlist().length;
    el.textContent = count;
    el.classList.toggle('is-empty', count === 0);
}
