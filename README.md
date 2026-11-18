# Đồ án cơ sở ngành

## Thông tin sinh viên
- **Họ tên:** Lê Đăng Huy
- **MSSV:** 110123013
- **Lớp:** DA23TTA
- **Email:** ledanghuy@student.tvu.edu.vn
- **GVHD:** Phạm Thị Trúc Mai

## Đề tài
**Xây dựng ứng dụng web đơn trang bán mỹ phẩm với dữ liệu ứng từ API JSON**

## Cài đặt & chạy dự án

### Yêu cầu
- **Node.js 18 trở lên** — tải tại https://nodejs.org (kiểm tra bằng lệnh `node -v`)
- Trình duyệt Chrome / Edge / Firefox bản mới

### Chạy lần đầu
```bash
git clone https://github.com/ledanghuyf/PTUDHDV.git
cd PTUDHDV
npm install      # cài json-server — chỉ cần chạy 1 lần
npm start        # chạy API + trang web
```
Mở trình duyệt vào **http://localhost:3000** là dùng được. Dừng chương trình: bấm **Ctrl + C** trong cửa sổ lệnh.

Những lần sau chỉ cần `npm start`.

> `npm start` chạy `json-server src/db.json --port 3000 --static src`: một chương trình vừa phục vụ trang web
> (thư mục `src`) vừa làm API (`/products`, `/orders`, `/users`...). Mọi thay đổi (đơn hàng, đánh giá, tài khoản)
> được ghi thẳng vào `src/db.json`.

**Lưu ý:**
- Phải dùng cổng **3000** vì web gọi API ở `http://localhost:3000` (đổi cổng thì sửa `BASE_URL` trong `src/js/api.js`).
- **Không** mở `src/index.html` bằng cách nhấp đúp (địa chỉ `file:///...`): trình duyệt sẽ chặn, trang không tải được dữ liệu.

**Cách khác — dùng Live Server của VS Code:** chạy `npx json-server src/db.json --port 3000` để có API,
rồi chuột phải `src/index.html` → **Open with Live Server** (mở `http://127.0.0.1:5500/src/`).

### Tài khoản để dùng thử
| Vai trò | Cách có tài khoản |
|---------|-------------------|
| Khách hàng | Tự đăng ký ở nút **Đăng nhập / Đăng ký** trên header |
| Quản lý | Tài khoản `quanly` (mật khẩu chủ dự án giữ riêng). Người khác tải dự án về: đăng ký 1 tài khoản, mở `src/db.json`, tìm tài khoản đó trong `"users"`, đổi `"role": "customer"` thành `"role": "manager"`, lưu file, rồi đăng xuất và đăng nhập lại → vào được **Trang quản lý** (`#/admin`) |

Mã giảm giá mẫu: `WELCOME10` (giảm 10%, tối đa 50.000₫), `FREESHIP` (đơn từ 199.000₫), `GIAM50K` (đơn từ 500.000₫).

### Cấu hình riêng (không bắt buộc): mã QR chuyển khoản & email xác nhận
Không cấu hình thì web vẫn chạy đầy đủ, chỉ là lựa chọn "Chuyển khoản ngân hàng" bị khóa và không gửi email.
Muốn bật, sao chép file mẫu rồi điền thông tin (file này **không bị đưa lên GitHub**):
```bash
copy src\js\config.local.example.js src\js\config.local.js     # Windows (CMD)
cp src/js/config.local.example.js src/js/config.local.js       # macOS / Linux / Git Bash
```
Chi tiết điền tài khoản ngân hàng và URL script email: xem mục [Cấu hình thanh toán chuyển khoản](#cấu-hình-thanh-toán-chuyển-khoản-miễn-phí)
và [Cấu hình gửi email](#cấu-hình-gửi-email-xác-nhận-về-gmail-google-apps-script--miễn-phí) bên dưới.

### Kiểm tra tự động
```bash
npm test
```
Chạy kiểm tra tính tiền (mã giảm giá, phí ship), băm mật khẩu / quy tắc mật khẩu và script gửi email.

### Lỗi thường gặp
| Hiện tượng | Cách xử lý |
|------------|------------|
| Trang báo "Không thể tải danh sách sản phẩm..." | Chưa chạy `npm start`, hoặc đang mở bằng `file:///` / sai cổng |
| `npm start` báo `EADDRINUSE` (cổng 3000 bận) | Tắt chương trình khác đang dùng cổng 3000 (thường là một json-server cũ) rồi chạy lại |
| `npm` / `node` không được nhận diện | Chưa cài Node.js hoặc chưa mở lại cửa sổ lệnh sau khi cài |
| Sửa code mà trình duyệt không thấy thay đổi | Bấm **Ctrl + Shift + R** để tải lại hẳn |
| Banner đứng yên, không có hiệu ứng | Windows đang tắt *Cài đặt → Trợ năng → Hiệu ứng hình ảnh → Hiệu ứng hoạt ảnh* |
| Muốn xóa dữ liệu thử, về dữ liệu gốc | Tắt `npm start`, chạy `git checkout src/db.json` |

## Mô tả
Ứng dụng web bán mỹ phẩm dạng SPA (Single Page Application - không reload trang).

### Phía khách hàng
- Trang chủ: banner động (chữ đổi luân phiên, bộ mỹ phẩm bay nhẹ, vệt sáng, lấp lánh) → dải cam kết dịch vụ
  → 3 ô khuyến mãi theo nhóm → **Deal hot** → dải thương hiệu chạy ngang → **Gợi ý cho bạn**
  (sản phẩm Quản lý gắn "Nổi bật" lên trước)
- Header 2 tầng: logo, ô tìm kiếm, tài khoản, tra cứu đơn, yêu thích, giỏ hàng + thanh danh mục; thanh thông báo khuyến mãi
- **Đăng nhập / Đăng ký** (`#/dang-nhap`, `#/dang-ky`): đăng nhập bằng email, số điện thoại hoặc tên tài khoản;
  trang **Tài khoản** (`#/tai-khoan`) xem thông tin và lịch sử đơn hàng; khi đã đăng nhập, thanh toán tự điền
  họ tên / SĐT / email và đơn được gắn với tài khoản
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

### Trang quản lý (`#/admin`, tài khoản vai trò **Quản lý**)
- **Đơn hàng**: duyệt (trừ kho chính thức) / từ chối / đã giao; thống kê; tự cập nhật mỗi 10 giây và báo đơn mới
  (thông báo trên trang, số đơn chờ trên tab, thông báo trình duyệt nếu bật) + email bản sao về Gmail cửa hàng
- **Sản phẩm**: thêm / sửa (tên, thương hiệu, danh mục, giá bán, giá gốc, tồn kho, ảnh, mô tả, nhãn Nổi bật) / xóa;
  tìm kiếm, lọc danh mục, lọc **sắp hết / hết hàng**
- **Mã giảm giá**: tạo mã (%, tiền, freeship; đơn tối thiểu; giảm tối đa; hạn dùng), bật/tắt, xóa
- **Nội dung trang**: thanh thông báo, chữ trên banner, các cụm từ đổi luân phiên, phí ship, ngưỡng freeship,
  hotline, email liên hệ — lưu là khách thấy ngay

- **Tài khoản**: danh sách khách hàng & quản lý, số đơn của từng người; **cấp / gỡ quyền quản lý**
  (không tự gỡ quyền của chính mình)

### Tài khoản & bảo mật
- Tài khoản lưu ở bảng `users` trong `src/db.json`; vai trò `customer` (khách) hoặc `manager` (quản lý).
  Khách tự đăng ký; quyền quản lý chỉ do Quản lý cấp.
- Quản lý mặc định: tài khoản **`quanly`** (mật khẩu do chủ dự án giữ riêng, không ghi trong mã nguồn). Đăng nhập ở
  trang Đăng nhập chung, xong vào thẳng trang quản lý. Muốn đổi: tạo tài khoản mới, cấp quyền quản lý, rồi gỡ quyền
  tài khoản cũ.
- Mật khẩu băm **PBKDF2-SHA256** (100.000 vòng) với muối riêng từng tài khoản, không lưu mật khẩu gốc;
  mật khẩu cần ít nhất 8 ký tự, có cả chữ và số.
- Hạn chế: kiểm tra mật khẩu và phân quyền chạy ở trình duyệt vì json-server không có đăng nhập — API `/users`,
  `/orders` vẫn đọc/ghi được trực tiếp. Đủ cho đồ án; cửa hàng thật cần backend kiểm tra mật khẩu và cấp token.

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
PTUDHDV/
├── src/                         # Mã nguồn web (npm start phục vụ thư mục này)
│   ├── index.html               # Khung trang: header, thanh danh mục, footer
│   ├── db.json                  # Dữ liệu json-server: products, orders, users, reviews, coupons, settings
│   ├── css/style.css            # Giao diện
│   ├── assets/images/           # Ảnh sản phẩm 800×800
│   └── js/
│       ├── main.js              # Điều hướng (SPA) và các trang phía khách
│       ├── components.js        # HTML các trang / thành phần giao diện
│       ├── admin.js             # Trang quản lý
│       ├── api.js               # Gọi json-server + API đơn vị hành chính
│       ├── auth.js              # Đăng nhập / đăng ký, băm mật khẩu
│       ├── cart.js              # Giỏ hàng (localStorage)
│       ├── wishlist.js          # Yêu thích (localStorage)
│       ├── pricing.js           # Tính tiền: mã giảm giá, phí ship
│       ├── config.js            # Cấu hình chung
│       └── config.local.example.js   # Mẫu thông tin riêng (ngân hàng, email) → chép thành config.local.js
├── setup/email-script/          # Script Google Apps Script gửi email + hướng dẫn triển khai
├── tests/                       # Kiểm tra tự động (npm test)
├── progress-report/             # Báo cáo tiến độ hàng tuần
├── thesis/                      # Tài liệu đồ án (doc, pdf, html, abs, refs)
├── package.json                 # Lệnh npm start / npm test
└── README.md
```

## Cấu hình chi tiết

### Cấu hình thanh toán chuyển khoản (miễn phí)
Dùng **VietQR Quick Link** (`img.vietqr.io`): ảnh QR chuẩn NAPAS 247 tạo trực tiếp từ URL, **không cần đăng ký,
không cần API key, không mất phí**. Khách quét bằng app của bất kỳ ngân hàng nào; nhận tiền vào tài khoản cá nhân
không mất phí, và hầu hết ngân hàng (MB, Vietcombank, Techcombank, ACB, VPBank, TPBank...) miễn phí chuyển khoản qua app.
Không dùng cổng thanh toán (VNPay, MoMo...) hay dịch vụ tự xác nhận (SePay, Casso...) vì các dịch vụ này cần đăng ký
doanh nghiệp/thu phí hoặc cần server backend HTTPS nhận webhook.

Thông tin riêng (tài khoản ngân hàng, URL script email) để trong `src/js/config.local.js` — file này nằm trong
`.gitignore` nên **không bị đưa lên GitHub**. Sao chép `src/js/config.local.example.js` thành `config.local.js`
rồi điền tài khoản nhận tiền:
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
Lấy được URL Web app thì điền vào `emailScriptUrl` trong `src/js/config.local.js` (file riêng, không lên GitHub).
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
✅ Đã hoàn thành các chức năng chính (xem mục [Mô tả](#mô-tả)); đang kiểm thử và viết báo cáo.

Xem chi tiết: [progress-report/](progress-report/)

## Liên hệ
- **Email:** ledanghuy@student.tvu.edu.vn
- **GitHub:** https://github.com/ledanghuyf/PTUDHDV

---
*Cập nhật lần cuối: 18/11/2026*
