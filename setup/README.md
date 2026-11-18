# Hướng dẫn cài đặt

Hướng dẫn đầy đủ nằm ở [README chính — mục Cài đặt & chạy dự án](../README.md#cài-đặt--chạy-dự-án). Tóm tắt:

1. Cài **Node.js 18 trở lên**: https://nodejs.org (kiểm tra: `node -v`)
2. Trong thư mục gốc dự án, chạy:
   ```bash
   npm install   # cài json-server (1 lần)
   npm start     # chạy API + trang web
   ```
3. Mở **http://localhost:3000**

Không cần cài json-server toàn máy, không cần Live Server hay Python.

## Thư mục này còn có
- [`email-script/`](email-script/README.md) — script Google Apps Script gửi email xác nhận đơn bằng Gmail (miễn phí)
  và hướng dẫn triển khai.
