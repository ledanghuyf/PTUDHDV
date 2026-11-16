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
Ứng dụng web bán mỹ phẩm dạng SPA (Single Page Application - không reload trang) với các chức năng:
- Trang chủ giới thiệu sản phẩm nổi bật
- Danh sách sản phẩm với tìm kiếm và lọc theo danh mục
- Trang chi tiết sản phẩm với thông tin đầy đủ
- Giỏ hàng với localStorage
- Form đặt hàng
- Hệ thống đánh giá sản phẩm

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
