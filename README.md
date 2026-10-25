# Vòng quay may mắn

Mini app web responsive, có thể mở trong trình duyệt hoặc Zalo WebView. Node.js lưu mã, cấu hình quà và kết quả vào `data/store.json`; không cần cài package bên ngoài.

## Chạy trên máy

Yêu cầu Node.js 18 trở lên.

```powershell
npm start
```

Mở `http://localhost:3000`. Có thể đổi cổng bằng biến môi trường `PORT`.

## Dùng thử

Các mã mẫu nằm trong `data/store.json`:

- `LUCKY-2026-001`
- `LUCKY-2026-002`
- `LUCKY-2026-003`

Mỗi mã chỉ quay được một lần. Khi quay thành công, server ghi `usedAt`, `prizeId` và một bản ghi trong `spins`. Mã đã dùng không thể quay lại.

## Cấu hình

Sửa `prizes` trong `data/store.json` để đổi tên quà, màu và trọng số. Trọng số là số nguyên tương đối; ví dụ `weight: 20` có cơ hội gấp đôi `weight: 10`. Tổng trọng số phải lớn hơn 0.

Thêm mã vào `codes`, mỗi mã cần duy nhất và có dạng:

```json
{ "code": "MA-KHACH-HANG", "usedAt": null, "prizeId": null }
```

Sau khi thay đổi cấu hình, khởi động lại server. Sao lưu file JSON thường xuyên. Khi chạy trên hosting, cần dùng ổ đĩa có tính persistent; một số nền tảng serverless hoặc container sẽ xóa dữ liệu ghi cục bộ khi triển khai lại. JSON phù hợp cho chương trình nhỏ chạy một tiến trình, chưa phù hợp cho nhiều server chạy đồng thời.

## Đưa lên Zalo

Triển khai ứng dụng lên hosting có HTTPS và dùng URL đó để cấu hình Mini App trong Zalo Developers. URL `localhost` chỉ dùng trên máy phát triển, khách hàng không thể truy cập. Việc liên kết chính thức với Zalo Developers, khai báo domain và cấu hình SDK/đăng nhập Zalo cần thực hiện bằng tài khoản ứng dụng của bạn; phần vòng quay hiện không cần lưu App Secret hoặc access token.

Không đưa khóa bí mật vào HTML, JavaScript, hoặc Git. Nếu khóa đã được gửi/lộ ở nơi không riêng tư, hãy thu hồi và tạo khóa mới trong bảng điều khiển Zalo Developers.