# Battle Screen / Match-3 Combat — Stage 1-1

## Kết quả theo 16 mục yêu cầu

1. **Nguyên nhân sprite Attack trông nhỏ:** hai PNG đều có canvas 1254×1254. Attack dành nhiều diện tích cho splash, lá và giọt nước, nên kích thước canvas không thể đại diện cho kích thước thân quái. Renderer cũ dùng `height:auto`, đổi `src` trực tiếp và không có metadata theo state. Renderer mới dùng root vuông cố định, ảnh tuyệt đối theo chân và hai lớp ảnh riêng. Không chỉnh sửa PNG hay manifest.
2. **Forest Slime scale:** `idleScale = 1.00`, `attackScale = 1.10`. Đã xem ảnh nguồn và screenshot Stage 1-1; attack không còn bị thu nhỏ bởi bố cục tự động. Sai số kích thước thân theo cảm nhận chưa có phép đo tự động riêng tách thân khỏi splash.
3. **Offsets:** Idle `(0%, 8.85%)`; Attack `(0%, 5.96%)`. Đây là phần trăm kích thước ảnh render, không phải pixel. Bù khoảng trống tới chân: alpha bounds Idle y=97…1142, Attack y=74…1185 ở ngưỡng alpha >30. Anchor `(0.5, 1)`; chuyển động lunge 8px nằm trên wrapper riêng.
4. **Idle:** breathing/squash 6.5s và 6.8s cho hai Slime; scale `(1.004, .996)` ở giữa chu kỳ. Drift 8.5s, sway 11s, phase lệch 2.3s. Không có vòng JS mỗi frame.
5. **Crossfade:** hai ảnh tồn tại đồng thời, opacity transition 150ms hai chiều. Idle motion pause trong attack và resume khi trở về. Test trình duyệt xác nhận opacity, pause/resume và root không đổi. Tổng attack khoảng 1.485s ở speed 1.
6. **Target ring/hitbox:** ring là con trực tiếp của enemy root, độc lập các wrapper motion. Test so sánh bounding rect root/ring trước và trong attack, không có layout shift. Ring được chọn vẫn giữ animation hiện có.
7. **Footer:** đã xóa footer và CSS của footer. Frame sát đáy viewport, sai số ≤1px tại 390×844, 360×800, 412×915. Hero HUD và board vẫn có 5 Hero / 7 cột / 6 hàng.
8. **Full cascade:** resolve lặp tới khi không còn clear, không cắt chuỗi ở maxCascades rồi shuffle. Chỉ sau fall cuối mới công bố `state.resolveResult`, chuyển phase `hero` và chạy hàng đợi Hero. Summary có tổng clear theo element, matchedGroups, cascadesCount, totalTilesCleared, specialTriggered, hazardsResolved và attacks; các entry có cascadeIndex. Initial index=0, cascadesCount không tính initial. Giữ công thức damage/energy và bonus theo từng nhóm của hệ thống cũ; không rebalance.
9. **Hazard / H / V:** chỉ overlay Hazard animate. General/Locked/Root pulse opacity .92→1 và scale 1→1.04, chu kỳ 2.8–3s; Burning brightness/flicker 2.2s; Frozen shimmer/glow 3.2s; Void pulse và quay 40s. H/V charged glow/scale 1.03 chu kỳ 2.5s, điểm sáng sweep đúng trục. Có phase lệch theo cell và hỗ trợ prefers-reduced-motion.
10. **Bomb center:** lấy vị trí Bomb sau swap, tức B khi kéo A→B. Test thật với board swapped xác nhận center 16 và đúng 9 cell lân cận, giữ clamp ở mép board.
11. **Bomb shake/hit-stop:** charge 220ms, hit-stop 75ms, radial shockwave 240ms và shake MEDIUM 240ms, biên độ 4px. Chỉ `.board-shell` rung. Helpers `playBoardShake({intensity,duration})` / `playHitStop(ms)` được expose; wait bất đồng bộ, không block main thread.
12. **Special destination:** ưu tiên phần tử đầu `swap=[destination,source]` nằm trong pattern. H/V, Bomb, Prism được render/animate tại ô creation trước gravity. Nếu không có destination hợp lệ thì giữ fallback hiện tại cho cascade. H clear 7 cell của row, V clear 6 cell của column. Line charge 180ms, sweep 350ms, stagger 20ms, shake LIGHT 160ms chạy cùng sweep; khoảng 560–580ms khi không chain.
13. **Prism creation:** hỗ trợ 5 ngang, 5 dọc, chữ L cả bốn hướng. T-shape vẫn tạo Bomb như thiết kế cũ. Test các pattern và vị trí creation đã thêm. Bomb/Prism vẫn dùng ảnh gem độc lập.
14. **Prism lightning:** chọn element của partner sau swap; charge 220ms → các tia SVG zigzag có nhánh, core trắng và glow tới mọi target → connect/flicker 280ms → glow target 180ms → hit-stop 55ms → explosion 280ms cùng shake LIGHT 180ms. Tổng khoảng 1015ms ở speed 1. Không xóa state trước trình diễn. Prism pair vẫn clear toàn board. Special chain dùng guard theo gem ID trong mỗi resolve chain.
15. **Cleanup:** rays remove trong finally; beam/radial shockwave remove sau animation; particles remove khi animation kết thúc. Test xác nhận board VFX layer rỗng sau Prism/chain. Không phát hiện transient tồn dư trong các luồng đã kiểm tra; đây không phải chứng minh không rò rỉ bộ nhớ cho mọi tình huống hay kiểm thử heap dài hạn.
16. **Regression:** kiểm tra invalid rollback, input lock, full cascade, một turn/một enemy phase, sequential/random target, shuffle/hint, Hero damage/energy/HP, Ultimate, death/heal VFX và ba waves Victory bằng bộ test hiện có và test bổ sung. Không tạo Stage 1-2, không sửa chỉ số combat hoặc architecture manifest. Hai thay đổi asset đã có trước task được giữ nguyên: GEM_DARK và Sylva FULL_BODY chưa tracked.

## Bằng chứng

- Unit tests: `npm.cmd test` — 20/20 passed (PowerShell không cho chạy npm.ps1 nên dùng npm.cmd).
- Production: `npm.cmd run build` — passed.
- Browser: `npm.cmd run test:browser` — 16/16 passed, Stage 1-1 trên Chromium headless.
- Test mới: `tests/browser/combat-update.spec.js`.
- Screenshot: `tests/artifacts/combat-enemy-idle.png`, `combat-enemy-attack.png`, `combat-prism-lightning.png`; screenshot mobile/ultimate hiện có được cập nhật khi chạy bộ test.
- Project là client Vite, không có API/backend trong flow combat này: gesture → match engine → battle state → board/Hero/Enemy/VFX DOM.

Kiểm tra bằng trình duyệt trên máy tính với viewport mobile; chưa đo FPS hoặc test trên điện thoại vật lý.
