# Smart Reminder V8.1 - Full Screen Gentle Alarm

Bản này dùng báo thức native Android mức vừa đủ nghe, không ép âm lượng lớn.

Cài phần native:

```bash
bash scripts/install-loud-alarm.sh
cp index.html www/index.html
npx cap sync android
npx cap open android
```

Bản này không dùng `SmartAlarmService`, chỉ dùng `SmartAlarmReceiver + SmartAlarmActivity` để giảm lỗi crash và lỗi bấm Dừng không tắt.
