# Mã nguồn ứng dụng

## Cấu trúc thư mục

```
src/
├── index.html          # File HTML chính
├── db.json            # Dữ liệu cho JSON Server
├── css/
│   └── style.css      # CSS styling
├── js/
│   ├── main.js        # JavaScript chính, routing
│   ├── api.js         # Xử lý API calls
│   ├── components.js  # Render UI components
│   └── cart.js        # Logic giỏ hàng
└── assets/
    └── images/        # Hình ảnh sản phẩm
```

## Mô tả các file

### index.html
File HTML chính, chứa cấu trúc trang web SPA

### db.json
Dữ liệu giả lập cho JSON Server gồm:
- products: Danh sách sản phẩm mỹ phẩm
- reviews: Đánh giá của khách hàng
- orders: Đơn hàng

### css/style.css
CSS styling cho toàn bộ ứng dụng với thiết kế responsive

### js/main.js
- Xử lý routing (hash-based)
- Khởi tạo ứng dụng
- Điều hướng giữa các trang

### js/api.js
- Gọi API từ JSON Server
- Xử lý dữ liệu sản phẩm, đánh giá, đơn hàng

### js/components.js
- Render các component UI
- Hiển thị danh sách sản phẩm
- Hiển thị chi tiết sản phẩm
- Form đặt hàng

### js/cart.js
- Quản lý giỏ hàng với localStorage
- Thêm/xóa/cập nhật sản phẩm trong giỏ
- Tính tổng tiền

## Công nghệ sử dụng
- HTML5
- CSS3 (Flexbox, Grid, Animations)
- JavaScript ES6+ (Fetch API, LocalStorage)
- JSON Server (Mock API)
