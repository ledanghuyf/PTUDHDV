// Kiểm tra tính tiền đơn hàng. Chạy: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcTotals, couponError } from '../src/js/pricing.js';

const ship = { shippingFee: 30000, freeShipThreshold: 499000 };

test('không mã: dưới ngưỡng tính phí ship, đủ ngưỡng thì miễn phí', () => {
    assert.deepEqual(calcTotals(300000, null, ship), { subtotal: 300000, discount: 0, shippingFee: 30000, total: 330000, freeShipRemaining: 199000 });
    assert.equal(calcTotals(499000, null, ship).shippingFee, 0);
});

test('giảm % có trần tối đa', () => {
    const c = { code: 'WELCOME10', type: 'percent', value: 10, maxDiscount: 50000, active: true };
    assert.equal(calcTotals(300000, c, ship).discount, 30000);
    assert.equal(calcTotals(900000, c, ship).discount, 50000);
});

test('giảm tiền cố định không vượt tạm tính; freeship bỏ phí ship', () => {
    assert.equal(calcTotals(40000, { type: 'fixed', value: 50000, active: true }, ship).discount, 40000);
    const r = calcTotals(200000, { type: 'freeship', active: true }, ship);
    assert.equal(r.shippingFee, 0);
    assert.equal(r.total, 200000);
});

test('couponError: hết hạn, ngừng áp dụng, chưa đủ giá trị đơn', () => {
    const base = { code: 'GIAM50K', type: 'fixed', value: 50000, minOrder: 500000, active: true };
    assert.equal(couponError(base, 600000), '');
    assert.match(couponError(base, 100000), /500\.000₫/);
    assert.match(couponError({ ...base, active: false }, 600000), /không tồn tại|ngừng/);
    assert.match(couponError({ ...base, expiresAt: '2020-01-01' }, 600000), /hết hạn/);
    assert.match(couponError(null, 600000), /không tồn tại/);
});
