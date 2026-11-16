# Hướng dẫn cài đặt

## Yêu cầu hệ thống
- Node.js phiên bản 14 trở lên
- Trình duyệt web hiện đại (Chrome, Firefox, Edge)

## Các bước cài đặt

### Bước 1: Cài đặt Node.js
Tải và cài đặt Node.js từ: https://nodejs.org/

Kiểm tra cài đặt:
```bash
node --version
npm --version
```

### Bước 2: Cài đặt JSON Server
Mở terminal/cmd và chạy:
```bash
npm install -g json-server
```

### Bước 3: Cài đặt dependencies
Trong thư mục setup, chạy:
```bash
npm install
```

## Chạy ứng dụng

### Bước 1: Khởi động JSON Server
Trong thư mục gốc dự án, chạy:
```bash
json-server --watch src/db.json --port 3000
```

Server API sẽ chạy tại: http://localhost:3000

### Bước 2: Mở ứng dụng web
Có 3 cách:

**Cách 1: Sử dụng Live Server (VS Code)**
- Cài extension "Live Server"
- Mở file `src/index.html`
- Click chuột phải và chọn "Open with Live Server"

**Cách 2: Sử dụng Python**
```bash
cd src
python -m http.server 8000
```
Truy cập: http://localhost:8000

**Cách 3: Mở trực tiếp**
- Mở file `src/index.html` bằng trình duyệt
- Lưu ý: Một số tính năng có thể không hoạt động do CORS

## Kiểm tra API
Sau khi chạy JSON Server:
- Danh sách sản phẩm: http://localhost:3000/products
- Chi tiết sản phẩm: http://localhost:3000/products/1
- Đánh giá: http://localhost:3000/reviews

## Sơ đồ triển khai
```
[Trình duyệt] <---> [Ứng dụng Web SPA] <---> [JSON Server API]
                         (src/)                  (port 3000)
```

## Xử lý lỗi thường gặp

### Lỗi: Port 3000 đã được sử dụng
Giải pháp: Đổi port khác
```bash
json-server --watch src/db.json --port 3001
```
Và cập nhật port trong file `src/js/api.js`

### Lỗi: CORS
Giải pháp: Sử dụng Live Server hoặc http-server thay vì mở file trực tiếp

### Lỗi: Cannot find module
Giải pháp: Chạy lại `npm install` trong thư mục setup
