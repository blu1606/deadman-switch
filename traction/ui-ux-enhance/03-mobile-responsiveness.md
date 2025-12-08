# 03. Mobile & PWA Optimization

## Mục tiêu
Đảm bảo trải nghiệm "Cứu sinh" (Lifeline) luôn sẵn sàng trong túi người dùng.

## Tasks

### 1. PWA configuration
- [ ] Thêm `manifest.json` đầy đủ icons, colors.
- [ ] Config `meta theme-color` để thanh status bar mobile hòa vào app (void black).
- [ ] Service Worker basic để load được UI khi offline (dù không tương tác được với blockchain, nhưng app không được hiện "trắng trơn").

### 2. Touch Optimization
- [ ] Size của các nút quan trọng (Check-in, Extend) phải đạt tối thiểu 44x44pt.
- [ ] Vị trí nút Check-in đặt ở bottom screen (vùng ngón cái dễ với tới - Thumb zone).
- [ ] Loại bỏ hover interactions trên mobile, thay bằng active states rõ ràng.

## Acceptance Criteria
- [ ] App cài được lên Homescreen (Add to Home Screen) trên IOS/Android.
- [ ] Mở app lên giống Native App (ẩn thanh địa chỉ browser).
- [ ] Thao tác check-in bằng 1 tay dễ dàng.
