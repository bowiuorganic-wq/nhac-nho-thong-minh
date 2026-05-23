# Smart Reminder V8.8 - Weekday One-Time Fix

Bản này sửa các lỗi sau:

- `chủ nhật tuần này đi đá bóng` được hiểu là nhắc một lần, không tự lặp lại hàng tuần.
- Chỉ khi người dùng nói rõ `hàng tuần`, `mỗi tuần`, `mỗi chủ nhật`, `chủ nhật nào cũng...` thì app mới xếp vào Lặp lại thường xuyên.
- Các câu có ngày trong tuần như `thứ 2 tuần này`, `chủ nhật này`, `thứ 5 tuần sau` được xử lý như mốc thời gian một lần.
- Dòng hiển thị Chuông không còn hiện ID dạng `uploaded:rt_...`, mà hiển thị tên file nhạc đã upload.
