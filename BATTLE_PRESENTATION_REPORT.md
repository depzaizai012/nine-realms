# Battle presentation và production asset update

Update trực tiếp trên project hiện tại; giữ các thay đổi đã có trong workspace. Không tạo stage mới hoặc đổi stats Hero/Enemy. Hero HUD production giữ nguyên component/CSS. Match-3 core không được sửa trong task này.

## Inventory và asset binding

Scan toàn bộ `public/assets`: **79 file nguồn**, **56 derivative đã có**, tổng **135 bitmap**. Catalog đăng ký **92 key**, gồm 13 derivative cũ giữ làm fallback tương thích. Không tạo bitmap mới, không rename hàng loạt. Inventory, đường dẫn thực đang dùng, kích thước và thời gian thay đổi nằm trong `tests/artifacts/current-asset-inventory.json`.

| Nhóm                      | File nguồn |
| ------------------------- | ---------: |
| Heroes                    |         25 |
| Enemies                   |         16 |
| Backgrounds               |          6 |
| Boss phases               |          3 |
| Gems / specials / hazards |         15 |
| Board frame               |          1 |
| UI                        |         13 |

Asset cũ không đổi so với checkpoint tiếp tục dùng derivative sẵn có. Asset mới hoặc đã đổi dùng file nguồn thật; vì vậy `GEM_DARK` và `HERO_004_SYLVA_FULL_BODY` mới cũng đã được cập nhật. Sylva giờ dùng full-body thật, không còn phải fallback cut-in.

`battleAssetBindings.js` giữ gameplay ID hiện tại và map 5 enemy Verdant sang 10 PNG mới: Blight Ooze, Thornfang Wolf, Briarborn Marauder, Venomroot Spider và Ancient Briar Guardian. File idle Marauder có tên lặp `...IDLEENEMY_W01_003_BRIARBORN_MARAUDER_IDLE.png`; dùng đúng file đó, không rename. Có **10 file UUID chưa rõ vai trò** (9 Crimson và 1 UI): đã đăng ký/inventory, chưa gán role bằng phỏng đoán.

## Background mapping

| Dải stage Verdant | Background thật                        |
| ----------------- | -------------------------------------- |
| 1-1 đến 1-6       | `BG_W01_COMMON_WHISPERING_WILDS.png`   |
| 1-7 đến 1-9       | `BG_W01_ELITE_THORNROOT_CROSSING.png`  |
| 1-10              | `BG_W01_BOSS_BRIARHEART_SANCTUARY.png` |

Nguồn duy nhất: `src/data/battleBackgroundRules.js`. Renderer/preloader cùng gọi resolver. Stage 1-1 đang dùng background normal mới. Elite/boss được kiểm tra bằng presentation fixture; không thêm playable stage 1-7 hoặc 1-10 vào registry.

## Ground plane và Enemy HUD

Enemy root là anchor cố định. Bên trong lần lượt có contact shadow (z0), target ring (z1), sprite anchor/idle/motion wrappers (z2), local HUD (z3). Breathing/sway chỉ tác động sprite, không kéo shadow/ring.

Sprite được chuẩn hóa theo alpha bounds đo từ PNG thật, giữ aspect ratio và canh đáy footprint. Sprite anchor nâng 16 px, để ring còn thấy phía dưới. Field nằm trên foreground qua `--ground-bottom`; nhóm 1/2/3 enemy căn giữa với gap 8 px. Root normal khoảng 24vw, giới hạn 74–99 px.

Shadow ellipse rộng 58% root, cao 9%, opacity 0.24, blur 6 px, đáy cách root 10 px. Tier scale: **NORMAL 1.00, ELITE 1.17, BOSS 1.45**. Ring NORMAL vàng/xanh vàng, ELITE tím/hồng, BOSS crimson/gold; selected sáng hơn và pulse opacity 3.5 giây, không đổi geometry.

Normal/Elite không có top enemy HUD hoặc name/level dưới chân. Local HP bar 4 px nằm dưới sprite/ring; status icon nhỏ đọc combat state. Elite có Mana bar nếu data cung cấp `maxMana`/`maxEnergy`. Chỉ boss đang sống (`isBoss` hoặc tier BOSS) có top HUD: Gem element icon tròn, stage/title/wave, tên Boss, HP đỏ lớn và Mana tùy data. Dev fixture dùng Thornheart phase 1 thật; không tạo boss encounter mới.

## Controls, timing và overlays

Đủ 6 file controls/panels được preload: HELP, SPEED_X2, SPEED_X2_ACTIVE, PAUSE, PAUSE_MENU_BG, ELEMENTAL_ADVANTAGE_BG. Help bên trái; x2/Pause bên phải; hitbox 44 px. Hai ảnh speed cùng wrapper, crossfade 130 ms, không thay DOM hoặc shift layout.

State `battleSpeedMultiplier` nằm trong `battleStore` và được quản lý bởi `battleClock.js`. `state.speed` chỉ là alias tương thích cho các công cụ test hiện có, không có state speed thứ hai. Clock dùng playbackRate và delay theo multiplier cho swap/back-swap, fall/refill, special/hazard resolve, hero/ultimate/enemy action, projectile, floating numbers, death, action gaps và wave transition. Transition HP/Mana/local HP và ready one-shot cũng đọc clock; idle/hint pulse chậm được giữ nhẹ nhàng. Không tăng damage/mana, bỏ cascade hoặc đổi thứ tự/RNG. Test seeded 4 cascades so sánh 1x/2x: gameplay kết quả và thứ tự actor giống nhau; số đo lưu trong `controls-speed-comparison.json`.

Một state `activeBattleOverlay`: null / ELEMENT_HELP / PAUSE. Native modal dialog chặn pointer/keyboard xuống board, Hero, Enemy và x2; inside không đóng, backdrop/Escape đóng. Help/Pause loại trừ nhau. Queue dùng pause gate và Web Animations pause/resume; không để enemy action tiếp theo bắt đầu trong lúc đọc Help. X2 được giữ khi resume và qua wave.

Pause có đúng hai action: **REPLAY** và **BACK TO TOWN**. Replay gọi router `startBattle(stageId)`, dispose instance cũ rồi dùng `createBattle(stage)` để reset wave/board/enemy/HP/mana/death. Abort guards ngăn queue cũ tiếp tục sửa board hoặc lấy RNG sau khi dispose. Clock timers, hints, input capture/listeners, pending animation và dialog được cleanup.

Back to Town điều hướng tới **Town placeholder trong app** (`appRouter.screen = TOWN`), không tạo URL mới. Nút Return quay lại cùng stage. Project trước đó chưa có Town/router.

Help đọc `src/data/elementalMatchups.js`, cùng config được combat dùng. Project chưa có canonical matchup; config hiện **neutral ×1, không bonus khắc hệ**. Panel hiển thị đủ WOOD/FIRE/WATER/EARTH/LIGHT/DARK bằng Gem art. Không tự dựng vòng khắc hệ. Khi có bảng canonical, rule rows có thể render icon→icon từ config đó.

## Files chính và verification

Các nhóm sửa/thêm: asset catalog/manifest/preloader/bindings; background và enemy presentation config; Enemy renderer/tier helper/CSS; Battle clock/lifecycle guards; controls/overlays; Battle screen, app router, Town placeholder; tests và inventory. Không chỉnh file Hero HUD production hoặc Match-3 engine.

Kiểm tra ở **390×844, 360×800, 412×915**: normal/elite/boss fixtures, ring colors/foot anchors, Hero HUD, panels centered, outside/inside/Escape, no click-through, pause trong cascade và enemy phase, replay khi action đang chạy, old timer count 0, chuyển overlays lặp lại, x2 1→2→1, tốc độ khoảng một nửa và kết quả RNG/state giống nhau. Common stage preload gồm 36 URL; asset thật không 404. Mô phỏng riêng 404 chứng minh fallback từng nút/panel với warning tên file.

`npm test`, `npm run test:browser`, `npm run build` là các lệnh xác nhận. Screenshot mới trong `tests/artifacts/grounding-*.png` và `controls-*.png`.

Kết quả: **28 unit/interface tests và 31 browser tests được xác nhận pass; build pass**. Trong đó 30 regression tests chạy toàn bộ, test Replay khi killing Ultimate đang exit được chạy bổ sung cùng nhóm controls. Cả 3 kích thước và presentation fixtures normal/elite/boss đều đã xác nhận; các URL đang dùng cho Stage 1-1 không có 404.

Không còn thiếu asset cần cho Stage 1-1. Điểm còn cần thông tin là mapping 10 file UUID; Town vẫn là placeholder và các stage 1-7/1-10 chưa được xây dựng. Có thể duyệt cảm giác scale/shadow trên thiết bị thật; các bounds và flows đã được kiểm tra trong browser.
