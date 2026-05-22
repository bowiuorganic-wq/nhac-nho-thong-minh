# Smart Reminder V8.3 - Single Sound Alarm Stable

Bản này dùng báo thức native Android mức âm lượng vừa đủ nghe, không ép âm lượng lớn.

## Điểm chính

- App name: Smart Reminder
- App ID: smart.reminder
- Có màn hình báo thức cơ bản
- Có nút Dừng
- Có nút Báo lại
- Số phút báo lại chỉnh trong Cài đặt
- Nhạc người dùng upload được thêm vào danh sách và truyền sang báo thức native nếu chọn “Nhạc của tôi đã tải lên”
- Không dùng foreground service phát chuông mạnh như V7.8, giảm rủi ro crash/không dừng được

## Cài từ đầu

```bash
npm install
mkdir -p www
cp index.html www/index.html
npx cap init "Smart Reminder" "smart.reminder" --web-dir=www
npx cap add android
bash scripts/install-loud-alarm.sh
cp index.html www/index.html
npx cap sync android
npx cap open android
```

Sau đó Run trong Android Studio.


## V8.3

- Thêm rule ngủ/đi ngủ và dậy/thức dậy: chỉ báo chính, không nhắc sớm.
- Thêm rule cách ngày/cách X ngày với mốc bắt đầu từ thứ 2 đến chủ nhật.
- Cải thiện giao diện UX/UI chuyên nghiệp hơn.


## V8.4

- Bổ sung cách nói `cứ X ngày` tương tự `cách X ngày`.
- `cứ 2 ngày` / `cách 2 ngày` đều hiểu là bỏ qua 2 ngày, báo tiếp sau 3 ngày.
- `thứ` trong `từ thứ 2`, `từ thứ 3`... luôn hiểu là ngày trong tuần.
