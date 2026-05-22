# Smart Reminder V8.3 - Sleep/Wake + Skip Day Rules + UX Polish

## Rule mới

- Khi câu có `ngủ` hoặc `đi ngủ`: chỉ báo đúng giờ chính, không nhắc sớm.
- Khi câu có `dậy` hoặc `thức dậy`: chỉ báo đúng giờ chính, không nhắc sớm.
- `cách ngày` = cách 1 ngày: báo xong bỏ qua 1 ngày, báo tiếp sau 2 ngày.
- `cách X ngày` = báo xong bỏ qua X ngày, báo tiếp sau X+1 ngày.
- `từ thứ 2 ... chủ nhật` được hiểu là ngày bắt đầu trong tuần.

Ví dụ:

- `22 giờ đi ngủ` → Tức thời, báo chính 22:00, không nhắc sớm.
- `5 giờ thức dậy` → Tức thời, báo chính 05:00, không nhắc sớm.
- `5h cách ngày đi đá bóng 1 lần từ thứ 2` → Lặp lại thường xuyên, báo lần đầu 5h thứ 2, sau đó mỗi 2 ngày.
- `5h cách 2 ngày đi đá bóng 1 lần từ thứ 2` → Lặp lại thường xuyên, báo lần đầu 5h thứ 2, sau đó mỗi 3 ngày: thứ 2 → thứ 5 → chủ nhật...

## UX/UI

- Làm lại lớp giao diện theo hướng chuyên nghiệp hơn: header nổi bật, card mềm hơn, nút rõ hơn, spacing thoáng hơn.
- Giữ cơ chế V8.2: chỉ một âm thanh báo thức, tránh chồng âm notification và âm app.
