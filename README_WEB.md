# Smart Reminder V8.5 Web Ready

Bản này tối ưu để đưa lên web cho mọi người dùng bằng Google Chrome.

## Điểm khác so với bản Android

- Không chứa Android native alarm, không cần Android Studio.
- Dùng Web Speech / mic của Chrome.
- Dùng Web Notification và timer trong tab trình duyệt.
- Có manifest + service worker để hỗ trợ cài như PWA.

## Lưu ý quan trọng

Bản web chỉ báo ổn định khi trang app còn mở trên Chrome. Nếu người dùng tắt tab, tắt trình duyệt, tắt máy hoặc điện thoại khóa lâu, web app không thể đảm bảo báo như app Android native.

## Chạy local

```bash
npm install
npm start
```

Mở:

```text
http://localhost:5173
```

## Deploy Render

- Build Command: `npm install`
- Start Command: `npm start`
- Node version: 18+

Nếu có OpenAI API key, thêm biến môi trường `OPENAI_API_KEY`. Không có key thì app dùng bộ phân tích local.


## V8.6 - Web Rules Fixed

- Bản web dùng parser trong trình duyệt để giữ đúng múi giờ của người dùng.
- Sửa lỗi giờ bị lệch khi deploy Render dùng UTC.
- Đồng bộ rule bản điện thoại: ngủ/dậy chỉ báo chính, cách/cứ X ngày, từ thứ 2 - chủ nhật.
- Giữ cụm ‘ăn sáng’ trong tên công việc, không xóa nhầm chữ sáng.
