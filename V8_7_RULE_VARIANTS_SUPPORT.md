# Smart Reminder V8.7 - Rule Variants Support

## Cập nhật

- Hỗ trợ cột `Nói vào mic` có nhiều biến thể, ngăn cách bằng dấu `|`.
- Khi upload file rule, app tách từng biến thể và dùng chung một rule.
- Nếu một biến thể trùng với rule cũ, app thay thế rule cũ.
- So khớp được các dạng giờ gần giống như `22 giờ`, `22h`, `22:00`.
- App vẫn giữ cấu trúc file 3 cột: `STT - Nói vào mic - Rule`.

## Ví dụ

`22 giờ đi ngủ | 22h đi ngủ | 22:00 đi ngủ | nhắc tôi đi ngủ lúc 22h`

Tất cả biến thể trên sẽ áp dụng chung rule ở cùng hàng.
