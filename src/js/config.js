/**
 * Cấu hình cửa hàng.
 * Thông tin riêng (tài khoản ngân hàng, URL script email) KHÔNG ghi ở đây mà ở `config.local.js`
 * (không đưa lên GitHub) — sao chép từ `config.local.example.js`. main.js nạp file đó lúc khởi động.
 * Không có config.local.js thì web vẫn chạy: không hiện mã QR chuyển khoản / không gửi email.
 */
export const SHOP = {
    name: 'Cosmetics Store',

    // Tài khoản nhận chuyển khoản (điền trong config.local.js). Mã QR tạo bằng Quick Link của VietQR.io:
    // miễn phí, không cần đăng ký/API key; khách quét bằng app ngân hàng nào cũng được (chuẩn NAPAS 247).
    bank: { bankId: '', bankName: '', accountNo: '', accountName: '' },

    // URL Web app Google Apps Script gửi email xác nhận đơn (điền trong config.local.js)
    emailScriptUrl: '',
    // Tài khoản khách hàng & quản lý lưu trong db.json (bảng "users"), đăng nhập ở #/dang-nhap — xem auth.js
};

/** Ghép thông tin riêng từ config.local.js (nếu có) vào SHOP */
export async function loadLocalConfig() {
    try {
        const { LOCAL } = await import('./config.local.js');
        Object.assign(SHOP.bank, LOCAL.bank || {});
        if (LOCAL.emailScriptUrl) SHOP.emailScriptUrl = LOCAL.emailScriptUrl;
    } catch {
        // Chưa có config.local.js (VD: vừa tải code từ GitHub) → chạy không có QR chuyển khoản / email
    }
}

// Nội dung mặc định khi db.json chưa có "settings" (Quản lý sửa ở #/admin/settings)
export const DEFAULT_SETTINGS = {
    announcement: '',
    heroEyebrow: 'Mỹ phẩm · Skincare · Makeup',
    heroTitle: 'Mỹ phẩm chính hãng',
    heroRotating: ['làn da rạng rỡ'],
    heroSubtitle: 'Son môi, kem nền, serum, kem dưỡng, chống nắng, tẩy trang chính hãng. Thanh toán khi nhận hàng hoặc chuyển khoản.',
    shippingFee: 30000,
    freeShipThreshold: 499000,
    hotline: '1900-xxxx',
    contactEmail: 'contact@cosmeticsstore.com',
};

export const isBankConfigured = () => Boolean(SHOP.bank.bankId && SHOP.bank.accountNo && SHOP.bank.accountName);
export const isEmailConfigured = () => Boolean(SHOP.emailScriptUrl);
