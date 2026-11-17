// Tự kiểm tra Code.gs bằng Node (giả lập các dịch vụ của Google). Chạy: node setup/email-script/check.js
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const sent = [];
const store = {};
const ctx = {
    MailApp: { sendEmail: o => sent.push(o), getRemainingDailyQuota: () => 100 },
    CacheService: { getScriptCache: () => ({ get: k => store[k] ?? null, put: (k, v) => { store[k] = v; } }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'shop@gmail.com' }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ setMimeType: () => JSON.parse(s) }) },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/Code.gs', 'utf8'), ctx);

const post = body => ctx.doPost({ postData: { contents: JSON.stringify(body) } });
const order = {
    to_email: 'khach@gmail.com', to_name: '<b>Lan</b>', shop_name: 'Cosmetics Store', order_id: 'abc', order_date: '17/11/2026',
    items: [{ name: 'Son <script>', quantity: 2, total: '318.000 ₫' }], order_total: '318.000 ₫',
    payment_method: 'COD', payment_instructions: '', shipping_address: 'HCM', phone: '0901234567',
};

// gửi thành công, có BCC về cửa hàng, nội dung đã escape
assert.deepStrictEqual(post(order), { ok: true });
assert.strictEqual(sent[0].to, 'khach@gmail.com');
assert.strictEqual(sent[0].bcc, 'shop@gmail.com');
assert.ok(sent[0].htmlBody.includes('&lt;b&gt;Lan&lt;/b&gt;') && !sent[0].htmlBody.includes('<script>'));

// dữ liệu sai bị từ chối, không gửi
assert.strictEqual(post({ ...order, to_email: 'not-an-email' }).ok, false);
assert.strictEqual(post({ ...order, items: [] }).ok, false);
assert.strictEqual(ctx.doPost({ postData: { contents: '{bad json' } }).ok, false);
assert.strictEqual(sent.length, 1);

// giới hạn 5 email/giờ cho cùng một địa chỉ
for (let i = 0; i < 4; i++) assert.strictEqual(post(order).ok, true);
assert.strictEqual(post(order).ok, false);
assert.strictEqual(sent.length, 5);

console.log('Code.gs: tất cả kiểm tra đều qua');
