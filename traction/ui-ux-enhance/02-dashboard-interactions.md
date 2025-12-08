# 02. Dashboard & Interactions

## Mục tiêu
Biến hành động check-in thành một "nghi thức" (ritual) quan trọng và thỏa mãn, giảm thiểu nỗi sợ thao tác sai.

## Tasks

### 1. The "Hold-to-Check-in" Button
- [ ] Thay thế nút click đơn giản bằng **Hold Interaction**.
- [ ] UI: Vòng tròn progress chạy quanh nút khi giữ chuột/ngón tay.
- [ ] Feedback:
    - Haptic feedback (nếu trên mobile/supported browsers).
    - Sound effect tích tắc khi hold, và âm thanh "lock" khi hoàn thành.
    - Animation "Ripple" lan tỏa khi thành công.

### 2. Vault Health Visualization
- [ ] **Shield Component**: Biểu tượng khiên bảo vệ trạng thái vault.
    - Nứt vỡ dần theo thời gian còn lại (tính bằng % thời gian trôi qua).
    - Hiệu ứng "Repair" (hàn gắn) ngay lập tức khi check-in thành công.

### 3. Grace Period UI
- [ ] Hiển thị rõ ràng nếu vault đang trong trạng thái "Triggered" nhưng chưa release (nếu có logic này). (Hiện tại logic smart contract là release ngay, nhưng UI nên cảnh báo trước khi hết hạn).
- [ ] Đồng hồ đếm ngược chi tiết (Days : Hours : Minutes : Seconds) lớn, font monospace.

## Acceptance Criteria
- [ ] Nút check-in yêu cầu giữ 1.5s mới kích hoạt transaction.
- [ ] Hiệu ứng visual/sound đồng bộ với thao tác.
- [ ] Đồng hồ đếm ngược chính xác với thời gian trên blockchain (cần sync time chuẩn).
