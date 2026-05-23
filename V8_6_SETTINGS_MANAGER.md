# Smart Reminder V8.6 - Settings Manager

## Cập nhật

- Đưa **Quy ước riêng từ Google Sheet** lên đầu tab Cài đặt.
- Thêm nút **Tải rule hiện tại** để xuất CSV gồm: `STT, Nói vào mic, Rule`.
- Thêm nút **Xóa tất cả rule** để làm sạch rule trước khi upload bộ quy ước mới.
- Rút gọn phần nhạc chuông: chỉ còn **một khu vực upload nhạc chuông**.
- Có thể chọn một hoặc nhiều file nhạc cùng lúc.
- Nhạc upload tự động xuất hiện trong danh sách **Nhạc chuông thông báo**.
- Nhạc upload có thể nghe thử hoặc xóa ngay trong danh sách.
- Cập nhật lại phần **Hướng dẫn sử dụng** theo luồng mới.

## Mẫu file quy ước

File `.xlsx` hoặc `.csv` cần có 3 cột:

```text
STT | Nói vào mic | Rule
```

Nếu `Nói vào mic` trùng với rule cũ, app sẽ thay thế bằng rule mới.
