# 01. Visual Identity & Atmosphere

## Mục tiêu
Thiết lập một ngôn ngữ thiết kế "Visceral Reliability" (Sự tin cậy hiện hữu). Giao diện cần tạo cảm giác chắc chắn, an toàn nhưng không vô hồn.

## Tasks

### 1. Typography & Colors
- [ ] Cập nhật Font: Sử dụng **JetBrains Mono** cho data/numbers (tạo cảm giác kỹ thuật) và **Inter** cho UI text (dễ đọc).
- [ ] Color Palette:
    - **Void Black**: Background chính.
    - **Safe Green**: Tín hiệu an toàn (Pulse).
    - **Alert Amber**: Cảnh báo.
    - **Signal White**: Text chính.
- [ ] Glassmorphism: Áp dụng hiệu ứng mờ kính cho các card/modal để tạo chiều sâu trên nền tối.

### 2. The "Alive" Signal (Pulse)
- [ ] Tạo component `AliveIndicator`: Một vòng tròn có hiệu ứng "breathing" (CS animation).
- [ ] Logic màu sắc:
    - Healthy (> 7 ngày): Breath chậm, màu xanh.
    - Warning (< 3 ngày): Breath nhanh hơn, màu cam.
    - Critical (< 24h): Nhấp nháy loạn nhịp, màu đỏ.

## Acceptance Criteria
- [ ] Font chữ được load và áp dụng toàn site.
- [ ] Pulse animation hoạt động mượt mà (60fps), không gây lag.
- [ ] Dark mode là mặc định và duy nhất (để đảm bảo atmosphere).
