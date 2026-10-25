# Vòng quay may mắn

Ứng dụng tĩnh chỉ dùng HTML, CSS và JavaScript. Không cần Node.js hoặc bước build. Giao diện đọc cấu hình ban đầu từ `data/store.json`; lượt quay mới được lưu trong localStorage của trình duyệt và có thể tải xuống thành JSON.

## Chạy thử

Mở project bằng tiện ích Live Server trong VS Code hoặc deploy GitHub Pages. Không mở `index.html` bằng `file://`, vì trình duyệt chặn JavaScript đọc file JSON cục bộ.

## Deploy GitHub Pages

Trong GitHub repository, mở **Settings → Pages**, chọn **Deploy from a branch**, chọn nhánh `main` và thư mục `/(root)`, sau đó lưu. Có thể khai báo domain riêng ở mục **Custom domain** và bật HTTPS khi DNS đã trỏ đúng.

Entry page ở `index.html`. Thẻ xác minh site Zalo được đặt trong trang gốc; cập nhật giá trị đó theo hướng dẫn Zalo Developers nếu Zalo cấp mã khác.

## Cấu hình quà và mã

Sửa danh sách `prizes` và `codes` trong `data/store.json`, rồi commit/push thay đổi. Trọng số `weight` là số nguyên tương đối; ví dụ 20 có cơ hội gấp đôi 10. Mỗi code cần duy nhất, ở dạng:

```json
{ "code": "MA-KHACH-HANG", "usedAt": null, "prizeId": null }
```

## Giới hạn bản tĩnh

GitHub Pages chỉ cung cấp file đọc. Trình duyệt không thể cập nhật `data/store.json` trên hosting. Danh sách code trong JSON được tải về máy khách và có thể xem trong DevTools; mã đã quay chỉ được ghi trong localStorage của trình duyệt đó. Xóa dữ liệu trình duyệt hoặc dùng thiết bị khác có thể cho quay lại cùng mã. Nút **Tải kết quả JSON** xuất các lượt quay đang lưu trên thiết bị hiện tại, không gom kết quả từ khách hàng khác.

Bản này phù hợp để demo hoặc chạy chương trình ít rủi ro. Muốn bảo đảm mỗi mã chỉ dùng một lần trên nhiều thiết bị và gom kết quả chung, cần một backend hoặc dịch vụ database/serverless; không thể bảo đảm việc đó chỉ với HTML/CSS/JS tĩnh.

Không đưa Zalo App Secret hoặc access token vào mã frontend. Nếu khóa bí mật từng bị chia sẻ công khai, hãy thu hồi và tạo khóa mới trong Zalo Developers.