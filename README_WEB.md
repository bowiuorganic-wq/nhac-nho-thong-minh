# Smart Reminder Web

Bản web test được tách từ bản app điện thoại mới nhất.

## Tính năng giữ lại
- Giao diện Smart Reminder.
- Rule ngủ/dậy, ngày tự nhiên, sáng/trưa/chiều/tối.
- Rule cách ngày/cứ X ngày, cứ X phút/giờ/ngày/tháng/năm.
- Quy ước riêng từ Google Sheet: `STT - Nói vào mic - Rule`.
- Nhiều biến thể trong cột `Nói vào mic`, ngăn cách bằng dấu `|`.
- Upload/tải/xóa rule.
- Upload nhạc, nghe thử/dừng, xóa nhạc.
- Tạo mẫu công việc và nhóm danh sách.

## Khác với Android native
Bản web dùng để test giao diện và logic. Trình duyệt không đảm bảo báo thức ổn định khi người dùng đóng tab, tắt trình duyệt hoặc khóa máy lâu. Muốn dùng báo thức ổn định cần dùng bản Android native.

## Chạy local
```bash
npm install
npm start
```
Mở: http://localhost:5173

## Deploy Render
- Build Command: `npm install`
- Start Command: `npm start`
- Root Directory: để trống nếu `package.json` nằm ngoài cùng repo.
