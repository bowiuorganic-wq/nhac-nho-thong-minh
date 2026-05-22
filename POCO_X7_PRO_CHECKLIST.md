# Checklist POCO X7 Pro - Smart Reminder V7.5

## Trên máy tính

- [ ] Đã giải nén Smart Reminder V7.5
- [ ] Đã chạy `npm install`
- [ ] Đã tạo `www/index.html`
- [ ] Đã chạy `npx cap add android` nếu làm từ đầu
- [ ] Đã chạy `bash scripts/install-loud-alarm.sh`
- [ ] Đã chạy `npx cap sync android`
- [ ] Đã mở Android Studio và Run app lên POCO

## Trong AndroidManifest.xml

- [ ] Có RECORD_AUDIO
- [ ] Có POST_NOTIFICATIONS
- [ ] Có SCHEDULE_EXACT_ALARM
- [ ] Có RECEIVE_BOOT_COMPLETED
- [ ] Có USE_FULL_SCREEN_INTENT
- [ ] Có WAKE_LOCK
- [ ] Có VIBRATE
- [ ] Có SmartAlarmActivity
- [ ] Có SmartAlarmReceiver

## Trên POCO

- [ ] Micrô: Cho phép
- [ ] Thông báo: Cho phép
- [ ] Âm thanh thông báo: Bật
- [ ] Hiển thị màn hình khóa: Bật
- [ ] Pin: Không hạn chế
- [ ] Tự khởi chạy: Bật nếu có
- [ ] Báo thức & lời nhắc: Cho phép nếu có
- [ ] Không bật Không làm phiền
- [ ] Âm lượng Báo thức/Thông báo đủ to

## Test

- [ ] `1 phút nữa test chuông to` khi app đang mở
- [ ] `2 phút nữa test khóa màn hình` rồi khóa máy
- [ ] `3 phút nữa test tắt app` rồi vuốt tắt app
- [ ] Danh sách hiện `Chuông to native: đã đặt`
- [ ] Đến giờ có màn hình báo chuông hoặc notification full-screen
- [ ] Bấm `Dừng chuông` tắt được âm thanh
