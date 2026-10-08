# Báo cáo tích hợp HUD production

Tích hợp trực tiếp trên project hiện tại. Giữ các thay đổi chưa commit có sẵn của workspace. Không thay combat engine, công thức Hero, Match-3, Enemy HUD/VFX hoặc stage data.

| Mục                 | Kết quả                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Sáu HUD asset    | Dùng đúng 6 PNG thực tế trong `public/assets/ui/`: `HUD_HERO_FRAME_NORMAL`, `HUD_HERO_FRAME_ULT_READY`, `HUD_HERO_ULT_GLOW_OVERLAY`, `HUD_HERO_BAR_BG`, `HUD_STATUS_ICON_SLOT`, `HUD_STATUS_BAR_BG`. Không rename hoặc tạo bản sao bitmap.     |
| 2. Files/components | Sửa `heroView.js`, asset manifest/preloader, test script trong package và assertions liên quan. Thêm `heroHudState.js`, `statusView.js`, `heroHudConfig.js`, `statusEffects.js`, `hero-hud.css`, HUD tests và scripts kiểm tra asset/baseline. |
| 3. Frame normal     | Dùng PNG production, phủ lên avatar; căn scale chung 1.28 để bù transparent padding. Giữ tỉ lệ ảnh, không chỉnh riêng từng Hero.                                                                                                               |
| 4. Frame ready      | Dùng PNG ready cùng wrapper, vị trí, kích thước và anchor với frame normal. Đổi trạng thái qua opacity, không đổi layout.                                                                                                                      |
| 5. Glow overlay     | Dùng PNG glow, cường độ tối đa 0.55. Idle pulse 3 giây, scale tối đa 1.015. One-shot 600 ms chỉ khi ready chuyển false→true. Render lặp không replay.                                                                                          |
| 6. HP text          | `currentHP / maxHP` nằm giữa thanh HP; hỗ trợ định dạng `12,845 / 12,845`, chữ sáng và shadow tối. Không có dòng HP riêng dưới thanh.                                                                                                          |
| 7. HP thresholds    | ≥60% xanh; ≥30% và <60% vàng; <30% đỏ. HP 0 chuyển Dead. Kiểm tra cả các điểm 60/59/30/29 và heal ngược qua threshold. Color/fill transition 220 ms.                                                                                           |
| 8. Mana             | Đọc Energy/Mana và cost từ skill data nếu có, fallback config hiện tại. Normal cyan/blue; ready + alive chuyển vàng sáng. Fill 260 ms, đổi màu và tắt ready 200 ms. Không hard-code cost 100 trong UI.                                         |
| 9. Status row       | 0 hiệu ứng: ẩn. 1 hoặc 4: hiển thị đầy đủ. Tối đa 4 slot, lớp icon nằm trên frame/glow.                                                                                                                                                        |
| 10. Overflow        | Khi >4, chọn 3 hiệu ứng đầu theo priority và thêm `+N`. Sáu hiệu ứng hiển thị 3 icon + `+3`. Có hỗ trợ stacks và durationTurns.                                                                                                                |
| 11. Dead override   | Dù mana full, Hero chết dùng frame normal dim, không ready/glow/gold mana và button disabled. Avatar/frame desaturate; HP hiển thị 0.                                                                                                          |
| 12. Layout shift    | Normal/ready/low HP/status/dead dùng cùng kích thước card. Status và glow là absolute overlay. Kiểm tra bounds trước/sau khi nhiều Hero ready và có 6 status.                                                                                  |
| 13. Responsive      | Kiểm tra 390×844, 360×800, 412×915: 5 Hero cùng hàng, status slot trong card, không page scroll hoặc overflow. Frame khoảng 70 px tại 390; HP ~9.9 px và Mana ~4.2 px.                                                                         |
| 14. HUD 404         | Các file thật trả HTTP 200. Test cố ý trả 404 cho frame normal xác nhận cảnh báo development và fallback CSS cho đúng asset, không thay avatar bằng placeholder hoặc crash battle.                                                             |
| 15. Regression      | Kiểm tra lại damage/heal/numbers, Enemy HUD/crossfade/VFX, random targeting, sequential attacks, cascade, shuffle/hint, Bomb/Prism/Line/Hazard, 3 Waves, Victory, touch và Pause. Không triển khai Stage 1-2.                                  |

HP damage trail: fill giảm trong 220 ms, trail chờ 150 ms rồi giảm trong 500 ms. Khi heal, trail tăng cùng fill, không giữ phần mất máu giả.

Status HUD chỉ đọc combat state. Các `statuses`/`statusEffects` hiện có được sắp xếp theo priority trong data; nếu thiếu priority thì dùng category definition tập trung. Shield và attack modifiers hiện tại được chuyển thành descriptor hiển thị, không tạo hoặc áp dụng effect mới vào engine. Asset icon được lấy qua manifest nếu effect cung cấp key; bộ HUD này chưa chứa icon riêng của từng effect, nên các effect không có art dùng symbol SVG theo category từ data.

Common HUD preload được memoize theo URL. Các frame/glow tạo một lần khi mount; render chỉ thay opacity, fill, text và status khi data thay đổi. Test gọi render nhiều lần và preload lại để xác nhận không phát sinh reload HUD.

`tests/artifacts/hud-baseline.json` ghi kích thước/bounds thật của PNG và hash các file combat/Enemy/Match-3 trước khi tích hợp. `hud-protected-files.json` xác nhận các file đó còn nguyên. Screenshot mới: `hud-ready-status-390.png`, `hud-ready-status-360.png`, `hud-ready-status-412.png`.

Kết quả xác nhận: build pass; **24 unit/interface tests** và **21 browser tests** pass. Nhóm HUD được chạy lại riêng sau khi hoàn thiện assertion preload/cache. Kiểm tra hash xác nhận 10 file combat/Enemy/Match-3/data được bảo vệ giữ nguyên so với lúc bắt đầu task.

Lệnh kiểm tra: `npm run build`, `npm test`, `npm run test:browser`.
