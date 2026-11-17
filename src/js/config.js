/**
 * Cấu hình cửa hàng - ĐIỀN THÔNG TIN THẬT CỦA BẠN VÀO ĐÂY
 * Để trống thì web vẫn chạy: không hiện mã QR chuyển khoản / không gửi email.
 */
export const SHOP = {
    name: 'Cosmetics Store',

    // Tài khoản nhận chuyển khoản. Mã QR tạo bằng Quick Link của VietQR.io (https://vietqr.io):
    // miễn phí, không cần đăng ký/API key; khách quét bằng app ngân hàng nào cũng được (chuẩn NAPAS 247).
    bank: {
        bankId: '',                  // Mã ngân hàng VietQR, VD: 'MB', 'VCB', 'TCB', 'ACB', 'VPB', 'BIDV', 'ICB' (VietinBank)
        bankName: '',  // Tên hiển thị; để trống thì hiện bankId
        accountNo: '',        // Số tài khoản
        accountName: '',     // Tên chủ tài khoản, VIẾT HOA KHÔNG DẤU
    },

    // URL Web app Google Apps Script gửi email xác nhận đơn bằng Gmail của cửa hàng (miễn phí)
    // Cách lấy URL: xem setup/email-script/README.md. VD: 'https://script.google.com/macros/s/AKfy.../exec'
    emailScriptUrl: '',

    // Mật khẩu trang Quản trị (#/admin), lưu dạng SHA-256. Đã đổi mật khẩu mặc định.
    // Tạo mã mới: node -e "console.log(require('crypto').createHash('sha256').update('MAT_KHAU_MOI').digest('hex'))"
    // shortcut: chỉ chặn ở giao diện, json-server vẫn mở; muốn bảo mật thật cần backend có đăng nhập.
    adminPasswordHash: '',
};

export const isBankConfigured = () => Boolean(SHOP.bank.bankId && SHOP.bank.accountNo && SHOP.bank.accountName);
export const isEmailConfigured = () => Boolean(SHOP.emailScriptUrl);
