/**
 * Pricing Module - Tính tiền đơn hàng: tạm tính, mã giảm giá, phí vận chuyển
 * Hàm thuần (không đụng DOM/API) để dùng chung cho giỏ hàng, thanh toán và kiểm tra tự động.
 */

export const DEFAULT_SHIPPING = { shippingFee: 30000, freeShipThreshold: 499000 };

/**
 * Kiểm tra mã giảm giá có dùng được cho đơn này không
 * @param {Object|null} coupon - { code, type: 'percent'|'fixed'|'freeship', value, minOrder, maxDiscount, active, expiresAt }
 * @param {number} subtotal - Tạm tính (chưa giảm, chưa ship)
 * @param {Date} [now]
 * @returns {string} Thông báo lỗi tiếng Việt; chuỗi rỗng nếu hợp lệ
 */
export function couponError(coupon, subtotal, now = new Date()) {
    if (!coupon || !coupon.active) return 'Mã giảm giá không tồn tại hoặc đã ngừng áp dụng.';
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return 'Mã giảm giá đã hết hạn.';
    if (subtotal < (Number(coupon.minOrder) || 0)) {
        return `Mã ${coupon.code} áp dụng cho đơn từ ${Number(coupon.minOrder).toLocaleString('vi-VN')}₫.`;
    }
    return '';
}

/**
 * @param {number} subtotal
 * @param {Object|null} coupon - Mã đã qua couponError (null = không dùng mã)
 * @param {{shippingFee:number, freeShipThreshold:number}} shipping
 * @returns {{subtotal:number, discount:number, shippingFee:number, total:number, freeShipRemaining:number}}
 */
export function calcTotals(subtotal, coupon = null, shipping = DEFAULT_SHIPPING) {
    const fee = Number(shipping.shippingFee) || 0;
    const threshold = Number(shipping.freeShipThreshold) || 0;

    let discount = 0;
    if (coupon && coupon.type === 'percent') {
        discount = Math.round(subtotal * (Number(coupon.value) || 0) / 100);
        if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else if (coupon && coupon.type === 'fixed') {
        discount = Number(coupon.value) || 0;
    }
    discount = Math.max(0, Math.min(discount, subtotal));

    const freeShip = subtotal === 0 || (threshold > 0 && subtotal >= threshold) || (coupon && coupon.type === 'freeship');
    const shippingFee = freeShip ? 0 : fee;

    return {
        subtotal,
        discount,
        shippingFee,
        total: subtotal - discount + shippingFee,
        freeShipRemaining: threshold > 0 ? Math.max(0, threshold - subtotal) : 0,
    };
}
