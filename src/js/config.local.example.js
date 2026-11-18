/**
 * MẪU thông tin riêng của cửa hàng.
 * Sao chép file này thành `config.local.js` (cùng thư mục) rồi điền thông tin thật.
 * `config.local.js` đã nằm trong .gitignore nên không bị đưa lên GitHub.
 * Không có file config.local.js thì web vẫn chạy: không hiện mã QR chuyển khoản, không gửi email.
 */
export const LOCAL = {
    // Tài khoản nhận chuyển khoản (mã QR tạo bằng VietQR Quick Link, miễn phí)
    bank: {
        bankId: '',        // Mã ngân hàng VietQR, VD: 'MB', 'VCB', 'TCB', 'ACB', 'VPB', 'BIDV', 'ICB' (VietinBank)
        bankName: '',      // Tên hiển thị, VD: 'Vietcombank (VCB)'
        accountNo: '',     // Số tài khoản
        accountName: '',   // Tên chủ tài khoản, VIẾT HOA KHÔNG DẤU, VD: 'NGUYEN VAN A'
    },
    // URL Web app Google Apps Script gửi email xác nhận đơn (xem setup/email-script/README.md)
    emailScriptUrl: '',
};
