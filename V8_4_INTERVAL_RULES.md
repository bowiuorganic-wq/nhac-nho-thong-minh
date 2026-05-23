# V8.4 - Bổ sung rule cứ/cách X đơn vị ... 1 lần

Đã thêm rule lặp lại thường xuyên dạng:

- `Cứ 10 phút gọi dậy 1 lần`
  - Báo lần đầu sau 10 phút
  - Sau đó cứ 10 phút báo lại

- `Cứ 1 giờ gọi dậy 1 lần`
  - Báo lần đầu sau 1 giờ
  - Sau đó cứ 1 giờ báo lại

- `Cứ 1 ngày gọi dậy 1 lần`
  - Báo lần đầu sau 1 ngày
  - Sau đó cứ 1 ngày báo lại

- `Cứ 1 năm gọi dậy 1 lần`
  - Báo lần đầu sau 1 năm
  - Sau đó cứ 1 năm báo lại

Hỗ trợ số dạng chữ, ví dụ:

- `cứ mười phút gọi dậy một lần`
- `cứ một nghìn phút gọi dậy một lần`

Lưu ý phân biệt với rule cũ:

- `5h cứ 2 ngày đi đá bóng 1 lần từ thứ 2`
  - Có giờ cụ thể và có mốc `từ thứ 2`
  - App hiểu theo rule cách ngày: bỏ qua 2 ngày, báo lại sau 3 ngày.

- `cứ 2 ngày gọi dậy 1 lần`
  - Không có giờ cụ thể/mốc thứ trong tuần
  - App hiểu là báo lần đầu sau 2 ngày, rồi cứ 2 ngày báo lại.
