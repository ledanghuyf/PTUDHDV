# Gửi email xác nhận đơn hàng bằng Gmail (Google Apps Script – miễn phí)

Sau khi khách đặt hàng, web gửi thông tin đơn tới một Web app Google Apps Script; script dùng **Gmail của cửa hàng**
gửi email xác nhận cho khách và gửi bản sao (BCC) về Gmail cửa hàng để báo có đơn mới.

- Miễn phí, không cần thẻ, không qua dịch vụ trung gian, email không có quảng cáo.
- Giới hạn của Google với tài khoản Gmail thường: **100 người nhận/ngày** (mỗi đơn dùng 2: khách + bản sao cửa hàng).
  Muốn tiết kiệm, đặt `NOTIFY_SHOP = false` trong `Code.gs`.

## Triển khai (khoảng 10 phút, làm 1 lần)

1. Đăng nhập Gmail của cửa hàng, mở https://script.google.com → **Dự án mới** (New project).
2. Xoá nội dung có sẵn, dán toàn bộ nội dung file [`Code.gs`](Code.gs) vào. Đặt tên dự án, VD `Cosmetics Store Email`. Bấm **Lưu**.
3. Bấm **Triển khai** (Deploy) → **Bản triển khai mới** (New deployment) → biểu tượng bánh răng → chọn **Ứng dụng web** (Web app):
   - *Thực thi dưới dạng* (Execute as): **Tôi** (Me)
   - *Người có quyền truy cập* (Who has access): **Bất kỳ ai** (Anyone)
4. Bấm **Triển khai** → **Cấp quyền truy cập** → chọn Gmail cửa hàng.
   Google báo "Google chưa xác minh ứng dụng này" → **Nâng cao** (Advanced) → **Đi tới ... (không an toàn)** → **Cho phép**.
   (Cảnh báo này bình thường vì script do chính bạn viết, chỉ xin quyền gửi email bằng tài khoản của bạn.)
5. Copy **URL ứng dụng web** dạng `https://script.google.com/macros/s/AKfy.../exec`.
6. Kiểm tra: dán URL vào trình duyệt, thấy `{"ok":true,"message":"Email script đang hoạt động",...}` là được.
7. Dán URL vào `emailScriptUrl` trong `src/js/config.local.js` (sao chép từ `config.local.example.js`; file này không lên GitHub vì ai có URL đều gửi được email qua Gmail của bạn).

Đặt thử một đơn với email của bạn: trang "Đặt hàng thành công" sẽ ghi "Email xác nhận đã được gửi tới ...".

## Khi sửa `Code.gs`

Sửa xong phải **Triển khai → Quản lý bản triển khai → Chỉnh sửa (bút chì) → Phiên bản: Phiên bản mới → Triển khai**
thì thay đổi mới có hiệu lực (URL giữ nguyên).

## Kiểm tra script trên máy

```bash
node setup/email-script/check.js
```

## Lưu ý bảo mật

URL Web app là công khai (nằm trong mã web), nên script chỉ gửi theo một mẫu cố định, escape mọi nội dung,
và giới hạn tối đa 5 email/giờ cho cùng một địa chỉ để hạn chế bị lợi dụng gửi spam.
