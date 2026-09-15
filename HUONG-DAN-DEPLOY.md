# Hướng dẫn Deploy — Phật Pháp Tâm An (phatphaptaman.vercel.app)

Đã soạn sẵn 2 file trong thư mục này từ `Skill_AI_supermarket_H.A.I`, điền sẵn toàn bộ config theo mô hình: **web thu tiền qua QR chuyển khoản như bình thường, mỗi sản phẩm có thêm nút "Xem Trên Shopee" để tham khảo** (không phải web chỉ dẫn link, khách vẫn mua + nhận hàng qua chính web này).

- `index.html` — trang web (deploy lên Vercel dưới domain phatphaptaman.vercel.app)
- `apps-script.gs` — backend (dán vào Google Apps Script gắn với 1 Google Sheet mới)

## Giá trị đã điền sẵn (để đối chiếu, không cần gõ lại)

| Giá trị | Đã điền |
|---|---|
| Thương hiệu | Phật Pháp Tâm An |
| ORDER_TOKEN (khớp cả 2 file) | `457e1bf247d143859a9ed759155ee5945f4343bb` |
| Admin — username | `phin` |
| Admin — email | `phinnvi001@gmail.com` |
| Admin — password | `281091aA@@` ⚠️ **xem cảnh báo bên dưới** |
| Ngân hàng nhận tiền | BIDV (BIN `970418`) · STK `6910172225` · NGUYEN VIET PHIN |
| SĐT/Zalo liên hệ | `0973140777` |
| `APPS_SCRIPT_URL` | **CÒN TRỐNG** — chỉ có sau khi deploy Apps Script ở Bước 2 |

⚠️ **Mật khẩu Admin trùng ngày sinh của anh Phin (28/10/91) — dễ đoán nếu ai biết ngày sinh.** Nên đổi sang mật khẩu khác trước khi bàn giao thật (sửa ở 2 chỗ: `ADMIN_PASSWORD` trong `apps-script.gs` VÀ `index.html`, phải khớp y hệt nhau).

## Các bước làm (làm đúng thứ tự)

### Bước 1 — Tạo Google Sheet (bằng tài khoản Gmail của anh Phin: phinnvi001@gmail.com)

1. Đăng nhập `phinnvi001@gmail.com` → tạo 1 Google Sheet mới, đặt tên "DATA WEB Phật Pháp Tâm An".
2. **Tiện ích mở rộng → Apps Script** → xoá code mặc định → dán toàn bộ nội dung file `apps-script.gs` vào → Lưu (Ctrl+S).
3. Chạy hàm `fixHeaderNow` một lần (dropdown chọn hàm → ▷ Chạy) — Google sẽ hỏi cấp quyền, bấm chấp nhận. Việc này tạo dòng tiêu đề cho tab "Data Khách Hàng".

### Bước 2 — Deploy Web App

1. Nút **Triển khai** (góc trên phải) → **Triển khai mới**.
2. Loại: **Ứng dụng web**. Người thực thi: **Tôi**. Người có quyền truy cập: **Bất kỳ ai**.
3. Bấm Triển khai → chấp nhận cảnh báo quyền nếu có → copy URL dạng `https://script.google.com/macros/s/AKfycb.../exec`.

### Bước 3 — Dán URL vào index.html

Mở `index.html`, tìm dòng `const APPS_SCRIPT_URL = '';` (Ctrl+F "CẤU HÌNH BACKEND") → dán URL vừa copy vào giữa 2 dấu nháy.

### Bước 4 — Deploy web lên Vercel (domain phatphaptaman.vercel.app)

Deploy thư mục này (chỉ cần file `index.html`) lên dự án Vercel đã có domain `phatphaptaman.vercel.app`. Nếu dự án Vercel chưa tồn tại, tạo mới rồi gắn domain này vào.

### Bước 5 — Test kết nối

1. Mở `phatphaptaman.vercel.app` → phải thấy 6 nhóm sản phẩm mẫu (Sách Kinh Phật, Tượng Phật & Pháp Khí...).
2. Bấm "Đăng Nhập" → nhập đúng `phin` / `phinnvi001@gmail.com` / `281091aA@@` → phải vào được, thấy huy hiệu ADMIN + nút quản trị ở sidebar trái.
3. Nếu không đăng nhập được: mở `<APPS_SCRIPT_URL>?action=get_catalog` trực tiếp trên trình duyệt — phải thấy JSON, không phải trang lỗi. Nếu lỗi, 90% do quên dán đúng `APPS_SCRIPT_URL` hoặc `ORDER_TOKEN` giữa 2 file bị lệch.

### Bước 6 — Nhập catalog sản phẩm thật

Đăng nhập Admin → mỗi sản phẩm thật đã có sẵn Nhóm (6 nhóm đã tạo sẵn) → "➕ Thêm Sản Phẩm":
- Điền đầy đủ Tên/Ngành/Mô tả/Giá.
- **Ô "Link Shopee (tham khảo)"**: dán link sản phẩm gốc trên Shopee — sẽ tự hiện nút "🛒 Xem Trên Shopee" trên thẻ sản phẩm và trang chi tiết. Để trống nếu chưa có link Shopee tương ứng.
- Ảnh: dán link ảnh trực tiếp hoặc link "Chia sẻ" Google Drive vào ô Thumbnail.

Xong thì xoá hết 12 sản phẩm mẫu (mã bắt đầu bằng "DEMO-") qua nút 🗑️ Xoá trên từng thẻ.

### Bước 7 — Bật Bot Telegram

1. Chat **@BotFather** → `/newbot` → lấy token.
2. Trong Apps Script: **⚙️ Cài đặt dự án → Thuộc tính của tập lệnh** → thêm `TG_BOT_TOKEN` = token vừa lấy. Để `TG_CHAT_ID` trống.
3. Mở 1 lần trên trình duyệt (thay đúng token + URL thật):
   `https://api.telegram.org/bot<TG_BOT_TOKEN>/setWebhook?url=<APPS_SCRIPT_URL>`
   — phải thấy `{"ok":true,"result":true,...}`.
4. Anh Phin tự nhắn 1 tin bất kỳ cho bot (để bot tự lưu Chat ID của anh).
5. Chạy hàm `setupDailyReportTrigger` một lần → bật báo cáo doanh thu tự động 22h mỗi ngày.
6. Test: mở `<APPS_SCRIPT_URL>?action=tgtest` — phải nhận tin nhắn xác nhận trên Telegram.

### Bước 8 (tuỳ chọn) — Thêm Video Reel tự phát ở khung Hero

Khung ảnh đầu trang (9:16) đã dựng sẵn 1 trình phát video có đủ nút: video trước (⏮), tua lùi 30s/10s, tạm dừng/phát, tua tới 10s/30s, video sau (⏭) — tự phát khi mở trang, hết bài tự chuyển bài kế tiếp. Trình phát này cần **file video thật (.mp4)**, không dùng được link `facebook.com/reel/...` trực tiếp (trình duyệt chỉ phát được file video, không phát được link trang xem).

**Lấy file .mp4 từ chính fanpage của anh Phin** (vì là chủ trang nên có quyền tải video mình đã đăng):
1. Vào bài Reel trên fanpage → bấm "..." (3 chấm) → **Tải xuống video** (hoặc dùng Meta Business Suite → Nội dung → chọn video → Tải xuống nếu không thấy nút này trên giao diện thường).
2. Đặt tên file dễ nhớ, VD `reel-01.mp4`, `reel-02.mp4`.

**Thêm vào web:**
1. Copy các file `.mp4` vào 1 thư mục `videos/` ngay cạnh `index.html` (tạo thư mục nếu chưa có).
2. Mở `index.html`, tìm `let REEL_VIDEOS = [` (Ctrl+F) → thêm mỗi video 1 dòng, **video mới nhất để lên ĐẦU mảng** để phát trước:
   ```javascript
   let REEL_VIDEOS = [
     { title:'Tên video mới nhất', src:'videos/reel-02.mp4', poster:'' },
     { title:'Tên video cũ hơn',   src:'videos/reel-01.mp4', poster:'' },
   ];
   ```
3. Lưu lại, deploy kèm cả thư mục `videos/` lên Vercel (không chỉ mỗi `index.html`).

Facebook không cấp API miễn phí để web tự động lấy "video mới nhất" — nên đây là danh sách anh Phin tự cập nhật tay mỗi khi có Reel mới muốn đưa lên web.

## Lưu ý vận hành quan trọng

- **Khi khách đặt hàng và xác nhận đã chuyển khoản**: bot Telegram báo ngay, anh Phin tự kiểm tra ngân hàng rồi gõ `/xacnhan <mã đơn>` trên Telegram → hệ thống tự đánh dấu đã xác nhận + **gửi email cảm ơn + báo sẽ giao hàng** cho khách (KHÔNG gửi file/link tải, vì đây là hàng vật lý — anh Phin tự đóng gói và ship tay).
- **Sửa code `apps-script.gs` sau này**: LUÔN vào Triển khai → Quản lý triển khai → ✏️ sửa bản CÓ SẴN → Phiên bản: Mới. KHÔNG bấm "Triển khai mới" (sẽ tạo URL khác, web vẫn gọi URL cũ nên code mới vô tác dụng).
- Mức hoa hồng Affiliate hiện để mặc định 30% trên đơn có mã giới thiệu hợp lệ, điều kiện tối thiểu người giới thiệu phải tự mua ≥199.000đ trước — xem lại 2 giá trị `AFF_COMMISSION_RATE`/`AFF_MIN_PURCHASE` trong `apps-script.gs` (khối CONFIG) trước khi chạy thật, đổi nếu anh Phin muốn mức khác.
