# Smart Reminder V8.5 - App Improvements

Cập nhật theo yêu cầu:

1. Báo theo nhóm
- Click vào nhóm Tức thời / Lặp lại thường xuyên / Định kỳ dài hạn để chỉ xem công việc của nhóm đó.
- Nếu không click nhóm nào, danh sách mặc định chỉ hiện 3 công việc gần nhất.
- Click lại nhóm đang chọn để bỏ lọc.

2. Upload file quy ước riêng
- Thêm phần upload file trong Cài đặt.
- Hỗ trợ file .xlsx hoặc .csv theo mẫu: STT - Nói vào mic - Rule.
- Nếu cột “Nói vào mic” bị trùng, app thay thế rule cũ.
- Khi người dùng nói/gõ đúng câu trong cột “Nói vào mic”, app ưu tiên dùng rule riêng trước rule mặc định.
- Với file .xlsx, app dùng thư viện SheetJS qua CDN để đọc file. Nếu không có mạng, nên dùng .csv.

3. 5 slot nhạc chuông
- Người dùng có thể tải tối đa 5 file nhạc chuông.
- Mỗi slot có nút nghe thử và xóa riêng.
- Sau khi upload, tên nhạc tự cập nhật trong danh sách chọn nhạc chuông.

