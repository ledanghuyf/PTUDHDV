# Đồ án cơ sở ngành

## Thông tin sinh viên
- **Họ tên:** Lê Đăng Huy
- **MSSV:** 110123013
- **Lớp:** DA23TTA
- **Email:** ledanghuy@student.tvu.edu.vn
- **GVHD:** Phạm Thị Trúc Mai

## Đề tài
**Xây dựng ứng dụng web đơn trang bán mỹ phẩm với dữ liệu ứng từ API JSON**

## Mô tả
Ứng dụng web bán mỹ phẩm dạng SPA (Single Page Application - không reload trang).

### Phía khách hàng
- Trang chủ: banner động (chữ đổi luân phiên, bộ mỹ phẩm bay nhẹ, vệt sáng, lấp lánh), dải thương hiệu chạy ngang,
  danh mục, **Đang giảm giá**, sản phẩm nổi bật, tất cả sản phẩm
- Thanh thông báo khuyến mãi đầu trang, ô tìm kiếm trên header
- Danh sách sản phẩm: tìm kiếm, lọc theo danh mục / **thương hiệu** / khoảng giá, sắp xếp (bán chạy, đánh giá,
  **giảm giá nhiều**, giá), nút **Xóa bộ lọc**
- Giá khuyến mãi: giá gốc gạch ngang + nhãn **-x%** + "Tiết kiệm ..."
- Chi tiết sản phẩm: mô tả đầy đủ, đánh giá, **Thêm vào giỏ** / **Mua ngay**, **Yêu thích**
- **Yêu thích** (trái tim): lưu trong trình duyệt, trang `#/wishlist`
- Giỏ hàng: thanh **"Mua thêm X để được miễn phí vận chuyển"**, xóa sản phẩm có **Hoàn tác**
- Thanh toán:
  - Địa chỉ theo đơn vị hành chính mới (Tỉnh/Thành phố → Phường/Xã, sau sáp nhập 01/07/2025) + Số nhà;
    **Tên đường không bắt buộc**; ghi chú cho cửa hàng
  - **Mã giảm giá** (giảm %, giảm tiền, miễn phí ship), phí vận chuyển + miễn phí ship theo ngưỡng
  - Báo lỗi ngay dưới ô nhập, nút "Xác nhận đặt hàng" chỉ bật khi đủ thông tin và ghi rõ còn thiếu gì
  - Số điện thoại tự bỏ dấu cách, đổi `+84` thành `0`
  - COD hoặc chuyển khoản: chọn chuyển khoản là hiện ngay mã **VietQR** đúng số tiền và nội dung `CS<mã đơn>`
- **Tra cứu đơn hàng** (`#/tra-cuu`) bằng mã đơn + số điện thoại, có thanh trạng thái Chờ duyệt → Đang giao → Đã giao
- Email xác nhận đơn và email khi đơn được duyệt/hủy (Google Apps Script)
- Giao diện điện thoại: thanh điều hướng nhanh, không tràn ngang

### Trang quản lý (`#/admin`, tài khoản **Quản lý**)
- **Đơn hàng**: duyệt (trừ kho chính thức) / từ chối / đã giao; thống kê; tự cập nhật mỗi 10 giây và báo đơn mới
  (thông báo trên trang, số đơn chờ trên tab, thông báo trình duyệt nếu bật) + email bản sao về Gmail cửa hàng
- **Sản phẩm**: thêm / sửa (tên, thương hiệu, danh mục, giá bán, giá gốc, tồn kho, ảnh, mô tả, nhãn Nổi bật) / xóa;
  tìm kiếm, lọc danh mục, lọc **sắp hết / hết hàng**
- **Mã giảm giá**: tạo mã (%, tiền, freeship; đơn tối thiểu; giảm tối đa; hạn dùng), bật/tắt, xóa
- **Nội dung trang**: thanh thông báo, chữ trên banner, các cụm từ đổi luân phiên, phí ship, ngưỡng freeship,
  hotline, email liên hệ — lưu là khách thấy ngay

Tài khoản mặc định: `quanly`. Mật khẩu lưu dạng mã băm SHA-256 trong `adminAccounts` ở `src/js/config.js`
(muốn thêm tài khoản thì thêm một dòng; hướng dẫn tạo mã ngay trong file). Đây là chặn ở giao diện;
json-server không có đăng nhập nên API vẫn mở — đủ cho đồ án, không dùng cho cửa hàng thật.

## Quy trình đặt hàng & duyệt đơn

| Bước | Ai | Trạng thái | Kho |
|------|----|-----------|-----|
| Khách đặt hàng (từ giỏ hàng / Mua ngay) | Khách | Chờ duyệt | Chỉ kiểm tra còn đủ hàng, **chưa trừ** |
| Duyệt đơn (chuyển khoản: đối soát tiền về trước) | Quản lý | Đang giao hàng | **Trừ kho**, cộng lượt bán |
| Giao xong | Quản lý | Đã giao (đã thanh toán) | — |
| Từ chối đơn đang chờ | Quản lý | Đã hủy | Không đổi (đơn cũ đã trừ lúc đặt thì hoàn kho) |

Địa chỉ lấy từ API miễn phí [provinces.open-api.vn](https://provinces.open-api.vn) (v2: 34 tỉnh/thành, phường/xã
sau sáp nhập). Đơn lưu cả chuỗi địa chỉ (`customerInfo.address`) và mã tỉnh/phường (`customerInfo.addressDetail`),
cùng `subtotal`, `discount`, `couponCode`, `shippingFee`, `totalAmount`.

Dữ liệu cấu hình nằm trong `src/db.json`: `settings` (nội dung trang, phí ship) và `coupons` (mã giảm giá mẫu:
`WELCOME10`, `FREESHIP`, `GIAM50K`).

**Hiệu ứng banner:** nếu Windows tắt *Cài đặt → Trợ năng → Hiệu ứng hình ảnh → Hiệu ứng hoạt ảnh*, trình duyệt báo
"giảm chuyển động" và web chỉ giữ hiệu ứng nhẹ (đổi chữ, lấp lánh, vệt sáng). Bật lại để thấy đầy đủ.

## Kiểm tra tự động

```bash
npm test
```
Chạy kiểm tra tính tiền (mã giảm giá, phí ship) và script gửi email.

## Nguồn dữ liệu
100 sản phẩm thuộc 9 danh mục (serum, kem dưỡng, sữa rửa mặt, chống nắng, mặt nạ, toner, tẩy trang, son môi, trang điểm)
trong `src/db.json`:
- Sản phẩm 1–30: từ [Pharmacity](https://www.pharmacity.vn).
- Sản phẩm 31–100: từ [Thế Giới Skinfood](https://thegioiskinfood.com) (tên, thương hiệu, giá, mô tả chi tiết gồm
  thành phần, công dụng, cách dùng, bảo quản; ảnh). Với son môi, tên và giá ứng với đúng màu trên ảnh.

Mỗi sản phẩm có `sourceUrl` (trang gốc) và `sourceName` (tên nhà bán), trang chi tiết hiện link tham khảo. Ảnh chọn loại
nền đồng màu (không chữ quảng cáo), căn về khung 800×800. Mô tả đã bỏ phần quảng cáo của nhà bán.
Giá bán và giá gốc (`originalPrice`, dùng hiển thị % giảm) lấy tại thời điểm thu thập (11/2026), có thể thay đổi. Hình ảnh thuộc bản quyền thương hiệu/nhà bán lẻ,
chỉ dùng cho mục đích học tập. Tồn kho, lượt bán và đánh giá là dữ liệu của cửa hàng demo (ban đầu chưa có đánh giá/lượt bán).

## Công nghệ sử dụng
- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **API:** JSON Server (Mock API)
- **Storage:** LocalStorage
- **Version Control:** Git, GitHub

## Cấu trúc thư mục

```
csn-da23tta-ledanghuy-spamyphamjson/
├── setup/              # Hướng dẫn cài đặt, dependencies
├── src/                # Mã nguồn ứng dụng
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── db.json
├── progress-report/    # Báo cáo tiến độ hàng tuần
├── thesis/             # Tài liệu đồ án
│   ├── doc/           # File .DOC
│   ├── pdf/           # File .PDF
│   ├── html/          # Tài liệu web
│   ├── abs/           # Báo cáo PPT, video
│   └── refs/          # Tài liệu tham khảo
└── README.md          # File này
```

## Hướng dẫn sử dụng

### Cài đặt
Xem chi tiết trong [setup/README.md](setup/README.md)

### Chạy ứng dụng
1. Khởi động JSON Server:
```bash
json-server src/db.json --port 3000
```

2. Mở file `src/index.html` bằng Live Server hoặc trình duyệt

### Cấu hình thanh toán chuyển khoản (miễn phí)
Dùng **VietQR Quick Link** (`img.vietqr.io`): ảnh QR chuẩn NAPAS 247 tạo trực tiếp từ URL, **không cần đăng ký,
không cần API key, không mất phí**. Khách quét bằng app của bất kỳ ngân hàng nào; nhận tiền vào tài khoản cá nhân
không mất phí, và hầu hết ngân hàng (MB, Vietcombank, Techcombank, ACB, VPBank, TPBank...) miễn phí chuyển khoản qua app.
Không dùng cổng thanh toán (VNPay, MoMo...) hay dịch vụ tự xác nhận (SePay, Casso...) vì các dịch vụ này cần đăng ký
doanh nghiệp/thu phí hoặc cần server backend HTTPS nhận webhook.

Mở `src/js/config.js`, điền tài khoản nhận tiền:
```js
bank: { bankId: 'MB', bankName: 'MB Bank (Quân Đội)', accountNo: '0123456789', accountName: 'NGUYEN VAN A' },
```
`bankId` là mã ngân hàng theo VietQR (MB, VCB, TCB, ACB, BIDV, ICB...). Khi để trống, lựa chọn
"Chuyển khoản ngân hàng" bị khóa. Sau khi đặt hàng, trang xác nhận hiện mã VietQR đã điền sẵn số tiền
và nội dung `CS<mã đơn>` (có nút sao chép số tài khoản, số tiền, nội dung). Cửa hàng tự đối soát tiền về
rồi cập nhật trạng thái đơn trong `db.json`.

### Cấu hình gửi email xác nhận về Gmail (Google Apps Script – miễn phí)
Email gửi bằng chính Gmail của cửa hàng qua Google Apps Script: miễn phí, không qua dịch vụ trung gian,
khách nhận email xác nhận và cửa hàng nhận bản sao báo đơn mới (giới hạn 100 người nhận/ngày với Gmail thường).

Hướng dẫn triển khai từng bước: [setup/email-script/README.md](setup/email-script/README.md).
Lấy được URL Web app thì điền vào `emailScriptUrl` trong `src/js/config.js`.
Mỗi lần sửa `setup/email-script/Code.gs` cần dán lại vào Apps Script và **Triển khai → Quản lý bản triển khai →
Phiên bản mới** (URL giữ nguyên) thì email mới (dòng giảm giá/phí ship, email khi đơn được duyệt/hủy) mới có hiệu lực.

Khi để trống, đơn hàng vẫn tạo bình thường nhưng không gửi email.

## Kế hoạch thực hiện

| Tuần | Thời gian | Nội dung |
|------|-----------|----------|
| 1 | 03/11-09/11 | Tìm hiểu đề tài, viết đề cương |
| 2 | 17/11-23/11 | Nghiên cứu SPA, thiết kế giao diện, setup API |
| 3 | 01/12-07/12 | Code hiển thị sản phẩm, tìm kiếm, lọc |
| 4 | 15/12-21/12 | Code giỏ hàng, đặt hàng, đánh giá |
| 5 | 29/12-04/01 | Hoàn thiện, kiểm thử, viết báo cáo |

## Tiến độ hiện tại
🔄 **Tuần 1:** Đang trong giai đoạn chuẩn bị

Xem chi tiết: [progress-report/](progress-report/)

## Liên hệ
- **Email:** ledanghuy@student.tvu.edu.vn
- **GitHub:** https://github.com/ledanghuyf/csn-da23tta-ledanghuy-spamyphamjson

---
*Cập nhật lần cuối: 09/11/2025*
