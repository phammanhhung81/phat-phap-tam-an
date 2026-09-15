/**
 * ══════════════════════════════════════════════════════════════════════════
 * Skill-sieuthiso-ai — Apps Script ĐẦY ĐỦ: đơn hàng + Bot Telegram + Kho Của Tôi
 *                      + tài khoản (đăng ký/đăng nhập) + Affiliate tự động + quà tặng có điều kiện
 *                      + báo cáo ngày — đóng gói từ kiến trúc đã chạy thật trên NGỌC HIÊN AI.
 * ══════════════════════════════════════════════════════════════════════════
 * Nếu KHÔNG cần tài khoản/Affiliate: xoá mục "TÀI KHOẢN" + "AFFILIATE" bên dưới và bỏ 2 dòng
 * route 'register'/'login' trong doPost — phần đơn hàng/Telegram/Kho Của Tôi vẫn chạy độc lập.
 * Nếu KHÔNG cần quà tặng có điều kiện: để CONFIG.BONUS_TRIGGER_CODES = [] (rỗng).
 *
 * 1 URL duy nhất phục vụ:
 *   - doPost nhận đơn hàng thật từ website (kiểm tra token — xem CONFIG.ORDER_TOKEN)
 *   - doPost nhận đăng ký/đăng nhập tài khoản (action: 'register'/'login')
 *   - doPost CŨNG nhận webhook Telegram (phân biệt bằng field "update_id")
 *   - Lệnh Telegram "/xacnhan <mã đơn hoặc SĐT>" — chủ shop tự kiểm tra ngân hàng rồi gõ lệnh
 *     này để: (1) đánh dấu đơn "Đã xác nhận", (2) tự tra link sản phẩm theo mã, (3) tự gửi email,
 *     (4) cộng hoa hồng affiliate nếu đơn có mã giới thiệu hợp lệ, (5) gộp gửi quà tặng có điều
 *     kiện nếu đơn mua đúng sản phẩm kích hoạt.
 *
 * KHÔNG có ngân hàng nào phổ biến ở VN cho API tự phục vụ công khai để code tự kiểm tra biến
 * động số dư (muốn tự động thật cần dịch vụ trung gian như Casso.vn/SePay.vn — có thể nâng cấp
 * sau). Hiện tại: chủ shop tự mở app ngân hàng kiểm tra, rồi gõ 1 lệnh Telegram để xác nhận.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * HƯỚNG DẪN SETUP (làm ĐÚNG THỨ TỰ — chi tiết đầy đủ ở SKILL.md Bước 4):
 * 1. Tạo Google Sheet mới, đặt tên theo thương hiệu.
 * 2. Tiện ích mở rộng → Apps Script → xoá code mặc định → dán TOÀN BỘ file này vào → 💾 Lưu.
 * 3. Sửa khối CONFIG bên dưới: BUSINESS_NAME, sinh 1 ORDER_TOKEN MỚI (không tái dùng token dự
 *    án khác) — phải khớp CHÍNH XÁC với ORDER_TOKEN trong index.html. Điền AFF_COMMISSION_RATE
 *    và BONUS_TRIGGER_CODES/BONUS_GIFT_CODE nếu có dùng (để trống nếu không cần).
 * 4. ⚙️ Project Settings → Script Properties → thêm:
 *      TG_BOT_TOKEN = token lấy từ @BotFather (Telegram, lệnh /newbot)
 *      TG_CHAT_ID   = để TRỐNG, bot tự điền khi bạn nhắn tin đầu tiên cho bot
 * 5. Triển khai → Loại: Web App → Người thực thi: Tôi → Người có quyền truy cập: Bất kỳ ai →
 *    Triển khai → copy URL, dán vào APPS_SCRIPT_URL trong index.html.
 * 6. ⚠️ BẮT BUỘC — Đăng ký Telegram Webhook (bước hay bị quên nhất, xem cảnh báo chi tiết trong
 *    references/backend-appsscript.md): mở URL sau 1 lần trong trình duyệt (thay đúng token/URL):
 *      https://api.telegram.org/bot<TG_BOT_TOKEN>/setWebhook?url=<APPS_SCRIPT_URL>
 *    Không làm bước này thì bot KHÔNG BAO GIỜ nhận được tin nhắn dù mọi thứ khác đều đúng.
 * 7. Chạy hàm "fixHeaderNow" MỘT LẦN — tạo dòng tiêu đề Sheet, Google sẽ hỏi cấp quyền, bấm chấp nhận.
 * 8. Tạo tab SAN_PHAM — CHỌN 1 TRONG 2 CÁCH:
 *    (a) Chưa có dữ liệu thật: chạy hàm "setupProductCatalog" — tự tạo tab SAN_PHAM với sản phẩm mẫu.
 *    (b) ĐÃ có dữ liệu thật ở tab khác trong CÙNG Sheet: sửa SRC_SHEET_NAME trong hàm
 *        "taoSheetSanPham" rồi chạy — tự dò cột theo tiêu đề, không cần đúng thứ tự.
 *    Sau đó điền cột "Link giao hàng"/"Link San Pham" cho từng sản phẩm — thiếu link thì bot
 *    không có gì để gửi. Có thể tách nhiều tab SAN_PHAM_* theo Nhóm, không bắt buộc gộp 1 tab.
 * 9. Nhắn bất kỳ tin nào cho bot Telegram để nó tự đăng ký TG_CHAT_ID, rồi chạy hàm
 *    "setupDailyReportTrigger" MỘT LẦN để bật báo cáo tự động.
 * 10. Test: đặt 1 đơn hàng thật trên web → xác nhận Telegram báo ngay → gõ /xacnhan <mã đơn> →
 *     xác nhận Sheet đổi trạng thái + email gửi đúng + (nếu có) hoa hồng/quà tặng cộng đúng.
 *
 * QUAN TRỌNG khi sửa code sau này: KHÔNG bấm "Triển khai mới" (New deployment) khi chỉnh sửa —
 * sẽ tạo URL khác, website/Telegram vẫn gọi URL cũ nên code mới coi như không có tác dụng. Vào
 * Triển khai → Quản lý triển khai → ✏️ sửa bản CÓ SẴN → Phiên bản: Mới → Triển khai.
 */

// ══════════════ 0. CONFIG ══════════════
const CONFIG = {
  SHEET_ORDERS: 'Data Khách Hàng',
  SHEET_SAN_PHAM: 'SAN_PHAM',
  SHEET_USERS: 'Users', // tab lưu tài khoản đăng ký (đăng nhập bằng Email + mật khẩu)
  SHEET_AFF: 'HOA_HONG_AFF', // tab ghi nhận hoa hồng affiliate (đã có sẵn trong Sheet)
  AFF_COMMISSION_RATE: 0.30, // % giá trị đơn hàng cộng hoa hồng khi admin /xacnhan đơn có mã giới thiệu — HỎI Hùng mức thật, đây chỉ là ví dụ mặc định
  // Affiliate phải TỰ mua tổng tối thiểu số tiền này trên web (tính trên các đơn ĐÃ XÁC NHẬN) thì
  // mới bắt đầu được cộng hoa hồng khi có người mua qua mã giới thiệu của họ — chặn tình trạng lập
  // tài khoản ảo chỉ để đi giới thiệu ăn hoa hồng mà chưa từng là khách hàng thật (Hùng 2026-08-18).
  AFF_MIN_PURCHASE: 199000,
  REPORT_HOUR: 22, // giờ gửi báo cáo doanh thu mỗi tối, tính doanh thu trong ngày hôm đó
  BUSINESS_NAME: 'Phật Pháp Tâm An',
  CONTACT_PHONE: '0973140777', // SĐT/Zalo liên hệ — dùng trong email xác nhận đơn gửi khách
  // Phải khớp CHÍNH XÁC với ORDER_TOKEN trong index.html.
  ORDER_TOKEN: '457e1bf247d143859a9ed759155ee5945f4343bb', // PHẢI khớp CHÍNH XÁC với ORDER_TOKEN trong index.html
  // "Quà Tặng Đặc Biệt": KHÔNG hiện công khai trên web — chỉ tự động gửi kèm qua email khi đơn
  // đã xác nhận thanh toán có chứa 1 trong các mã BONUS_TRIGGER_CODES bên dưới.
  BONUS_TRIGGER_CODES: [], // VD ['KH-01','KH-02'] — để trống [] nếu không có quà tặng điều kiện
  BONUS_GIFT_CODE: '', // VD 'QT-01' — mã sản phẩm quà tặng tự động gộp gửi khi mua đúng BONUS_TRIGGER_CODES
  // Quyền Admin quản trị Nhóm/Sản phẩm trên web — PHẢI khớp CHÍNH XÁC với ADMIN_USERNAME/EMAIL/PASSWORD
  // trong index.html. Đây là 1 tài khoản Admin DUY NHẤT (không phải tài khoản trong tab Users), kiểm
  // tra lại ở ĐÂY (server) cho MỌI thao tác ghi dữ liệu — dù ai đó bypass giao diện web (gọi thẳng
  // Apps Script bằng Postman/console) vẫn không ghi được nếu không đúng cả 3 giá trị.
  ADMIN_USERNAME: 'phin',
  ADMIN_EMAIL: 'phinnvi001@gmail.com',
  ADMIN_PASSWORD: '281091aA@@', // TODO(Phin): nên đổi mật khẩu khác — trùng ngày sinh (28/10/91) nên dễ đoán
  SHEET_NHOM: 'DANH_MUC_NHOM', // tab lưu metadata 6 Nhóm sản phẩm (tên, icon, màu, thứ tự, ẩn/hiện)
  SHEET_REELS: 'VIDEO_REEL', // tab Phin tự dán link Reel — xem _getReelsSheet_/handleGetReels_ bên dưới
};

const HEADERS = [
  'STT',
  'Mã đơn hàng',                              // để lệnh /xacnhan tra đúng đơn
  'Tên khách hàng',
  'Tuổi',
  'Số điện thoại',
  'Gmail',
  'Mã sản phẩm đã mua',
  'Tên sản phẩm đã mua',
  'Thời gian mua hàng',
  'Xác nhận đã thanh toán chuyển khoản',
  'Mã QR tổng tiền đã thanh toán',
  'Tổng tiền đơn hàng',
  'Mã Giới Thiệu (AFF)', // mã affiliate đã giới thiệu đơn này (rỗng nếu khách tự vào mua, không qua ai giới thiệu)
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_ORDERS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_ORDERS);
  return sheet;
}

// Tự sửa dòng tiêu đề (row 1) nếu thiếu/khác HEADERS — không đụng tới các dòng dữ liệu bên dưới.
function ensureHeader_(sheet) {
  const width = HEADERS.length;
  const lastCol = Math.max(width, sheet.getLastColumn());
  const current = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const isUpToDate = HEADERS.every((h, i) => current[i] === h);
  if (!isUpToDate) {
    sheet.getRange(1, 1, 1, width).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#EEF2FF');
    sheet.setFrozenRows(1);
  }
}
function fixHeaderNow() { ensureHeader_(getSheet_()); }

// ══════════════ 1. doGet — test kết nối Telegram + tra cứu Kho sản phẩm đã mua ══════════════
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'tgtest') {
    tgSend('✅ Test: Bot đã kết nối thành công với ' + CONFIG.BUSINESS_NAME + ' lúc ' + new Date().toLocaleString('vi-VN') + '.');
    return ContentService.createTextOutput(JSON.stringify({ ok: true, action: 'tgtest' })).setMimeType(ContentService.MimeType.JSON);
  }
  if (p.action === 'my_orders') {
    return handleMyOrders_(p.email, p.phone, p.token);
  }
  if (p.action === 'order_status') {
    return handleOrderStatus_(p.orderCode, p.token);
  }
  if (p.action === 'get_catalog') {
    return handleGetCatalog_(p);
  }
  if (p.action === 'get_reels') {
    return handleGetReels_();
  }
  return ContentService.createTextOutput(CONFIG.BUSINESS_NAME + ' webhook đang chạy (đơn hàng + bot Telegram).');
}

// ---- 1b. Tra trạng thái 1 đơn hàng cụ thể — dùng để web tự động đóng thẻ "chờ xác nhận" ngay
// khi chủ shop đã /xacnhan trên Telegram, không cần khách tự bấm F5 hay chờ email.
function handleOrderStatus_(orderCode, token) {
  if (token !== CONFIG.ORDER_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ confirmed: false, error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const codeNorm = _tgNorm(orderCode).replace(/\s+/g, '');
    if (!codeNorm) {
      return ContentService.createTextOutput(JSON.stringify({ confirmed: false })).setMimeType(ContentService.MimeType.JSON);
    }
    const sheet = getSheet_();
    const V = sheet.getDataRange().getValues();
    const hitMaDon   = _findCol(V, 5, h => h.indexOf('ma don') >= 0);
    const hitXacNhan = _findCol(V, 5, h => h.indexOf('xac nhan') >= 0 && h.indexOf('thanh toan') >= 0);
    if (!hitMaDon || !hitXacNhan) {
      return ContentService.createTextOutput(JSON.stringify({ confirmed: false })).setMimeType(ContentService.MimeType.JSON);
    }
    for (let r = hitMaDon.row + 1; r < V.length; r++) {
      if (_tgNorm(String(V[r][hitMaDon.col] || '')).replace(/\s+/g, '') === codeNorm) {
        const trangThai = String(V[r][hitXacNhan.col] || '').trim();
        const confirmed = _tgNorm(trangThai).indexOf('da xac nhan') >= 0;
        return ContentService.createTextOutput(JSON.stringify({ confirmed: confirmed })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ confirmed: false })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ confirmed: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- 1a. "Kho sản phẩm đã mua" — khách "đăng nhập" bằng Gmail + SĐT để xem lại sản phẩm
// ĐÃ ĐƯỢC XÁC NHẬN THANH TOÁN (chưa xác nhận thì chưa hiện, tránh lộ đơn đang xử lý dở).
function handleMyOrders_(email, phone, token) {
  if (token !== CONFIG.ORDER_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ orders: [], error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const emailNorm = _tgNorm(email).trim();
    const phoneDigits = _phoneKey_(phone);
    if (!emailNorm || !phoneDigits) {
      return ContentService.createTextOutput(JSON.stringify({ orders: [] })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getSheet_();
    const V = sheet.getDataRange().getValues();
    const hitEmail    = _findCol(V, 5, h => h === 'gmail' || h === 'email');
    const hitPhone    = _findCol(V, 5, h => h.indexOf('dien thoai') >= 0);
    const hitMaSp     = _findCol(V, 5, h => h.indexOf('ma san pham') >= 0);
    const hitXacNhan  = _findCol(V, 5, h => h.indexOf('xac nhan') >= 0 && h.indexOf('thanh toan') >= 0);
    if (!hitEmail || !hitPhone) {
      return ContentService.createTextOutput(JSON.stringify({ orders: [] })).setMimeType(ContentService.MimeType.JSON);
    }

    // Gom mã sản phẩm (không trùng) từ mọi đơn ĐÃ XÁC NHẬN khớp đúng cả Gmail lẫn SĐT.
    const codesSeen = {};
    for (let r = hitEmail.row + 1; r < V.length; r++) {
      const rowEmail = _tgNorm(String(V[r][hitEmail.col] || '')).trim();
      const rowPhone = _phoneKey_(V[r][hitPhone.col]);
      const trangThai = hitXacNhan ? String(V[r][hitXacNhan.col] || '').trim() : '';
      if (rowEmail !== emailNorm || rowPhone !== phoneDigits) continue;
      if (_tgNorm(trangThai).indexOf('da xac nhan') < 0) continue; // chưa xác nhận -> chưa hiện trong Kho
      const codes = hitMaSp ? String(V[r][hitMaSp.col] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
      codes.forEach(function (c) { codesSeen[c] = true; }); // key giữ nguyên hoa/thường gốc để hiển thị đúng mã
    }

    // Tổng tiền đã mua (đã xác nhận) — dùng ở web để hiện nút "Đăng Ký Affiliate" khi đủ ≥199.000đ
    // (xem AFFILIATE_MIN_PURCHASE trong index.html). Tính riêng, KHÔNG phụ thuộc "codes" ở trên vì
    // _totalConfirmedPurchaseOf_ đã tự quét lại đúng theo email, không cần gom trùng mã sản phẩm.
    const total = _totalConfirmedPurchaseOf_(email);

    const codes = Object.keys(codesSeen);
    const items = codes.map(function (code) { return { code: code, name: code, link: '' }; });
    if (!codes.length) {
      return ContentService.createTextOutput(JSON.stringify({ orders: [], total: total })).setMimeType(ContentService.MimeType.JSON);
    }

    // Tra tên đầy đủ + link giao hàng thật — gộp từ MỌI tab SAN_PHAM* (hỗ trợ tách theo Nhóm).
    const map = _buildSanPhamMap_();
    items.forEach(function (item) {
      const found = map[item.code.toUpperCase()];
      if (found) { item.name = found.name || item.code; item.link = found.link || ''; }
    });

    return ContentService.createTextOutput(JSON.stringify({ orders: items, total: total })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ orders: [], error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══════════════ 2. doPost — phân luồng: Telegram update vs đơn hàng từ website ══════════════
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON' })).setMimeType(ContentService.MimeType.JSON);
  }
  // Mọi update Telegram đều có "update_id" — đơn hàng từ website thì không bao giờ có field này.
  if (data.update_id !== undefined) {
    return handleTelegramUpdate_(data);
  }
  if (data.action === 'register') return handleRegister_(data);
  if (data.action === 'login') return handleLogin_(data);
  if (data.action === 'admin_login') return handleAdminLogin_(data);
  if (data.action === 'admin_save_group') return handleAdminSaveGroup_(data);
  if (data.action === 'admin_delete_group') return handleAdminDeleteGroup_(data);
  if (data.action === 'admin_save_product') return handleAdminSaveProduct_(data);
  if (data.action === 'admin_delete_product') return handleAdminDeleteProduct_(data);
  return handleOrderSubmit_(data);
}

// ---- 2a. Đơn hàng thật từ website ----
function handleOrderSubmit_(data) {
  // Chặn request không kèm đúng token — không cho ghi rác vào Sheet / spam Telegram.
  if (data.token !== CONFIG.ORDER_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const sheet = getSheet_();
    ensureHeader_(sheet);
    const stt = sheet.getLastRow();

    sheet.appendRow([
      stt,
      data.orderCode || '',
      data.name || '',
      data.age || '',
      data.phone || '',
      data.email || '',
      data.productCodes || '',
      data.productNames || '',
      new Date(),                            // Thời gian mua hàng
      'Khách báo đã chuyển khoản',           // Chờ chủ gõ /xacnhan để xác nhận thật + tự gửi sản phẩm
      data.qrUrl || '',
      Number(data.total) || 0,
      data.refCode || '',
    ]);

    // Báo ngay qua Telegram, kèm sẵn lệnh xác nhận để copy-paste cho nhanh.
    try {
      tgSend(
        '🛒 <b>ĐƠN HÀNG MỚI</b> — ' + CONFIG.BUSINESS_NAME + '\n' +
        'Mã đơn: <b>' + (data.orderCode || '') + '</b>\n' +
        'Khách: ' + (data.name || '') + ' (' + (data.age || '?') + ' tuổi)\n' +
        'SĐT: ' + (data.phone || '') + '\n' +
        'Gmail: ' + (data.email || '') + '\n' +
        'Sản phẩm: ' + (data.productNames || '') + '\n' +
        'Tổng tiền: <b>' + (Number(data.total) || 0).toLocaleString('vi-VN') + 'đ</b>\n' +
        '⏳ Khách báo đã chuyển khoản — vui lòng kiểm tra ngân hàng.\n' +
        '👉 Đúng rồi thì gõ: <code>/xacnhan ' + (data.orderCode || '') + '</code>'
      );
    } catch (tgErr) { /* lỗi gửi Telegram không được làm hỏng việc ghi đơn hàng */ }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', stt: stt })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══════════════ 2c. TÀI KHOẢN — Đăng ký / Đăng nhập bằng Email + mật khẩu ══════════════
// Mật khẩu KHÔNG BAO GIỜ lưu dạng thô — chỉ lưu salt ngẫu nhiên + hash SHA-256(mật khẩu + salt).
// Mỗi tài khoản đăng ký xong TỰ ĐỘNG có 1 mã Affiliate riêng (xem mục 2d) — đăng ký = vừa có tài
// khoản vừa thành thành viên affiliate, không cần đăng ký affiliate riêng.
const USER_HEADERS = ['STT', 'Email', 'Ho Ten', 'So Dien Thoai', 'Mat Khau Hash', 'Salt', 'Ngay Dang Ky', 'Ma Affiliate'];

function getUsersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_USERS);
  return sh;
}
function ensureUserHeader_(sheet) {
  const width = USER_HEADERS.length;
  const current = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
  const isUpToDate = USER_HEADERS.every(function (h, i) { return current[i] === h; });
  if (!isUpToDate) {
    sheet.getRange(1, 1, 1, width).setValues([USER_HEADERS]);
    sheet.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#EEF2FF');
    sheet.setFrozenRows(1);
  }
}
function _genSalt_() { return Utilities.getUuid(); }
function _hashPassword_(password, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'); }).join('');
}
// Sinh mã Affiliate 6 ký tự (chữ hoa + số), thử lại nếu trùng với mã đã có trong V (dữ liệu Users hiện tại).
function _genUniqueAffCode_(existingCodesUpper) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ ký tự dễ nhầm: 0/O, 1/I
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = 'AFF-';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (existingCodesUpper.indexOf(code) < 0) return code;
  }
  return 'AFF-' + Date.now().toString(36).toUpperCase(); // fallback cực hiếm khi 20 lần đều trùng
}

function handleRegister_(data) {
  if (data.token !== CONFIG.ORDER_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const emailNorm = _tgNorm(data.email || '').trim();
    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const password = String(data.password || '');
    if (!emailNorm || !password || password.length < 6) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Thiếu thông tin hoặc mật khẩu quá ngắn (tối thiểu 6 ký tự).' })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getUsersSheet_();
    ensureUserHeader_(sheet);
    const V = sheet.getDataRange().getValues();
    for (let r = 1; r < V.length; r++) {
      if (_tgNorm(String(V[r][1] || '')).trim() === emailNorm) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Email này đã được đăng ký, vui lòng đăng nhập.' })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    const salt = _genSalt_();
    const hash = _hashPassword_(password, salt);
    const stt = sheet.getLastRow();
    // KHÔNG cấp mã Affiliate ngay lúc đăng ký nữa (cột "Ma Affiliate" để trống) — theo yêu cầu
    // Hùng 2026-08-18: chỉ trở thành Affiliate sau khi đã MUA ít nhất 1 sản phẩm và được xác nhận
    // thanh toán thật. Mã sẽ tự cấp trong _confirmAndDeliver_ ngay lần xác nhận đơn ĐẦU TIÊN của
    // đúng email này (xem ghi chú ở đó).
    sheet.appendRow([stt, String(data.email || '').trim(), name, phone, hash, salt, new Date(), '']);

    return ContentService.createTextOutput(JSON.stringify({ success: true, name: name, email: String(data.email || '').trim(), phone: phone, affCode: '' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
// Cấp mã Affiliate cho 1 tài khoản đã đăng ký nhưng chưa có mã — gọi khi đơn hàng ĐẦU TIÊN của
// đúng email đó được xác nhận thanh toán thật (xem _confirmAndDeliver_). Trả về mã mới cấp, hoặc
// mã đã có sẵn nếu tài khoản đó đã là Affiliate từ trước, hoặc '' nếu email chưa từng đăng ký
// tài khoản (khách mua hàng không cần đăng ký, không tự động thành Affiliate).
function _grantAffiliateIfEligible_(email) {
  const emailNorm = _tgNorm(email || '').trim();
  if (!emailNorm) return '';
  const sheet = getUsersSheet_();
  const V = sheet.getDataRange().getValues();
  const existingAffCodes = [];
  for (let r = 1; r < V.length; r++) {
    if (V[r][7]) existingAffCodes.push(String(V[r][7]).toUpperCase());
  }
  for (let r = 1; r < V.length; r++) {
    if (_tgNorm(String(V[r][1] || '')).trim() === emailNorm) {
      const current = String(V[r][7] || '').trim();
      if (current) return current; // đã là Affiliate từ trước
      const newCode = _genUniqueAffCode_(existingAffCodes);
      sheet.getRange(r + 1, 8).setValue(newCode); // cột "Ma Affiliate"
      return newCode;
    }
  }
  return ''; // không tìm thấy tài khoản khớp email này
}
// Tổng tiền TẤT CẢ đơn ĐÃ XÁC NHẬN thanh toán của 1 email — dùng để kiểm tra điều kiện tối thiểu
// 199.000đ trước khi cộng hoa hồng cho Affiliate đó (xem _creditAffiliateCommission_).
function _totalConfirmedPurchaseOf_(email) {
  const emailNorm = _tgNorm(email || '').trim();
  if (!emailNorm) return 0;
  const sheet = getSheet_();
  const V = sheet.getDataRange().getValues();
  const hitGmail = _findCol(V, 5, h => h.indexOf('gmail') >= 0 || h === 'email');
  const hitXacNhan = _findCol(V, 5, h => h.indexOf('xac nhan') >= 0 && h.indexOf('thanh toan') >= 0);
  const hitTongTien = _findCol(V, 5, h => h.indexOf('tong tien don hang') >= 0);
  if (!hitGmail || !hitXacNhan || !hitTongTien) return 0;
  let total = 0;
  for (let r = hitGmail.row + 1; r < V.length; r++) {
    if (_tgNorm(String(V[r][hitGmail.col] || '')).trim() !== emailNorm) continue;
    if (_tgNorm(String(V[r][hitXacNhan.col] || '')).indexOf('da xac nhan') < 0) continue;
    total += parseFloat(V[r][hitTongTien.col]) || 0;
  }
  return total;
}

function handleLogin_(data) {
  if (data.token !== CONFIG.ORDER_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const emailNorm = _tgNorm(data.email || '').trim();
    const password = String(data.password || '');
    if (!emailNorm || !password) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Vui lòng nhập email và mật khẩu.' })).setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getUsersSheet_();
    const V = sheet.getDataRange().getValues();
    for (let r = 1; r < V.length; r++) {
      if (_tgNorm(String(V[r][1] || '')).trim() === emailNorm) {
        const hash = _hashPassword_(password, String(V[r][5] || ''));
        if (hash === String(V[r][4] || '')) {
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            name: String(V[r][2] || ''),
            email: String(V[r][1] || ''),
            phone: String(V[r][3] || ''),
            affCode: String(V[r][7] || ''),
          })).setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Sai mật khẩu.' })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Email chưa được đăng ký.' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══════════════ 3. Gửi tin nhắn Telegram (kèm retry chống lỗi mạng tạm thời) ══════════════
function tgSendTo(chatId, text) {
  const token = PropertiesService.getScriptProperties().getProperty('TG_BOT_TOKEN');
  if (!token || !chatId) return;
  const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  const opts = {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' }),
    muteHttpExceptions: true,
  };
  let lastErr;
  for (let i = 1; i <= 3; i++) {
    try { UrlFetchApp.fetch(url, opts); return; } catch (err) { lastErr = err; if (i < 3) Utilities.sleep(1500 * i); }
  }
  throw lastErr;
}
function tgSend(text) {
  const chatId = PropertiesService.getScriptProperties().getProperty('TG_CHAT_ID');
  tgSendTo(chatId, text);
}

function _tgNorm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

// Chuẩn hoá SĐT về 9 số cuối để so khớp — vì Google Sheets tự nhận cột SĐT là number và LÀM
// RỤNG số 0 đầu khi ghi (VD "0877498111" -> lưu thành "877498111"), trong khi khách luôn nhập
// đủ 10 số trên web. So khớp toàn chuỗi sẽ luôn trật; so 9 số cuối thì khớp đúng dù có/không có
// số 0 đầu hoặc mã quốc gia 84.
function _phoneKey_(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length > 9 ? d.slice(-9) : d;
}

// Dò cột theo TÊN TIÊU ĐỀ thay vì giả định vị trí cố định.
function _findCol(V, maxRows, matchFn) {
  for (let i = 0; i < Math.min(maxRows, V.length); i++) {
    for (let j = 0; j < V[i].length; j++) {
      if (matchFn(_tgNorm(String(V[i][j] || '')))) return { row: i, col: j };
    }
  }
  return null;
}

// Trả về TẤT CẢ tab có tên bắt đầu bằng "SAN_PHAM" — hỗ trợ tách sản phẩm thành nhiều tab theo
// Nhóm (VD SAN_PHAM_TRO_LY, SAN_PHAM_QUY_TRINH, SAN_PHAM_SKILL, SAN_PHAM_KHOA_HOC) thay vì bắt
// buộc gộp chung 1 tab "SAN_PHAM" duy nhất.
function _getSanPhamSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets().filter(function (sh) { return /^SAN_PHAM/i.test(sh.getName()); });
}

// Gộp { MÃ SP (CHỮ HOA) -> {name, link} } từ MỌI tab SAN_PHAM* tìm thấy. Dùng chung cho cả
// _sendProductEmail_ (gửi email khi /xacnhan) và handleMyOrders_ (Kho Của Tôi).
function _buildSanPhamMap_() {
  const map = {};
  _getSanPhamSheets_().forEach(function (sh) {
    const V = sh.getDataRange().getValues();
    const hitMa = _findCol(V, 3, function (h) { return h.indexOf('ma sp') >= 0 || h.indexOf('ma san pham') >= 0; });
    const hitTen = _findCol(V, 3, function (h) { return h.indexOf('ten san pham') >= 0 || h.indexOf('ten sp') >= 0; });
    const hitLink = _findCol(V, 3, function (h) { return h.indexOf('link') >= 0; });
    if (!hitMa) return;
    for (let r = hitMa.row + 1; r < V.length; r++) {
      const ma = String(V[r][hitMa.col] || '').trim();
      if (!ma) continue;
      map[ma.toUpperCase()] = {
        name: hitTen ? String(V[r][hitTen.col] || '').trim() : '',
        link: hitLink ? String(V[r][hitLink.col] || '').trim() : '',
      };
    }
  });
  return map;
}

// ══════════════ 4. Đọc dữ liệu đơn hàng — 1 dòng = 1 đơn (có thể nhiều sản phẩm, ngăn cách bởi dấu phẩy) ══════════════
function _ordersByDate_(targetDate) {
  const sheet = getSheet_();
  const V = sheet.getDataRange().getValues();
  const hitNgay     = _findCol(V, 5, h => h.indexOf('thoi gian') >= 0);
  const hitTen      = _findCol(V, 5, h => h.indexOf('khach hang') >= 0 || h.indexOf('ten khach') >= 0);
  const hitSdt      = _findCol(V, 5, h => h.indexOf('dien thoai') >= 0);
  const hitMaSp     = _findCol(V, 5, h => h.indexOf('ma san pham') >= 0);
  const hitTenSp    = _findCol(V, 5, h => h.indexOf('ten san pham') >= 0);
  // "tong tien don hang" (không chỉ "tong tien") để không dò nhầm sang cột "Mã QR tổng tiền đã
  // thanh toán" — cột đó cũng chứa cụm "tổng tiền" nên khớp nhầm nếu chỉ so "tong tien".
  const hitTongTien = _findCol(V, 5, h => h.indexOf('tong tien don hang') >= 0);
  if (!hitNgay) return null;

  const tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
  const targetKey = Utilities.formatDate(targetDate, tz, 'yyyy-MM-dd');
  const rows = [];
  for (let r = hitNgay.row + 1; r < V.length; r++) {
    const d = V[r][hitNgay.col];
    if (!(d instanceof Date)) continue;
    if (Utilities.formatDate(d, tz, 'yyyy-MM-dd') !== targetKey) continue;
    rows.push({
      ten: hitTen ? String(V[r][hitTen.col] || '').trim() : '',
      sdt: hitSdt ? String(V[r][hitSdt.col] || '').trim() : '',
      maSp: hitMaSp ? String(V[r][hitMaSp.col] || '').trim() : '',
      tenSp: hitTenSp ? String(V[r][hitTenSp.col] || '').trim() : '',
      tongTien: hitTongTien ? (parseFloat(V[r][hitTongTien.col]) || 0) : 0,
    });
  }
  return { rows: rows };
}

// Khách "MỚI" = SĐT chưa từng xuất hiện ở dòng có ngày SỚM HƠN targetDate.
function _newCustomers_(targetDate) {
  const sheet = getSheet_();
  const V = sheet.getDataRange().getValues();
  const hitNgay = _findCol(V, 5, h => h.indexOf('thoi gian') >= 0);
  const hitTen  = _findCol(V, 5, h => h.indexOf('khach hang') >= 0 || h.indexOf('ten khach') >= 0);
  const hitSdt  = _findCol(V, 5, h => h.indexOf('dien thoai') >= 0);
  if (!hitNgay || !hitSdt) return [];
  const tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
  const targetKey = Utilities.formatDate(targetDate, tz, 'yyyy-MM-dd');
  const seenBefore = {}, todayCustomers = {};
  for (let r = hitNgay.row + 1; r < V.length; r++) {
    const d = V[r][hitNgay.col];
    if (!(d instanceof Date)) continue;
    const key = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    const sdt = String(V[r][hitSdt.col] || '').trim();
    if (!sdt) continue;
    const ten = hitTen ? String(V[r][hitTen.col] || '').trim() : '';
    if (key < targetKey) seenBefore[sdt] = true;
    else if (key === targetKey) todayCustomers[sdt] = ten;
  }
  const moi = [];
  for (const k in todayCustomers) if (!seenBefore[k]) moi.push(todayCustomers[k] + ' - ' + k);
  return moi;
}

// Đơn đang chờ xác nhận thanh toán — KHÔNG lọc theo ngày (luôn hiện toàn bộ pending hiện tại).
function _pendingOrders_() {
  const sheet = getSheet_();
  const V = sheet.getDataRange().getValues();
  const hitTen      = _findCol(V, 5, h => h.indexOf('khach hang') >= 0 || h.indexOf('ten khach') >= 0);
  const hitSdt      = _findCol(V, 5, h => h.indexOf('dien thoai') >= 0);
  const hitTenSp    = _findCol(V, 5, h => h.indexOf('ten san pham') >= 0);
  const hitTongTien = _findCol(V, 5, h => h.indexOf('tong tien don hang') >= 0);
  const hitXacNhan  = _findCol(V, 5, h => h.indexOf('xac nhan') >= 0 && h.indexOf('thanh toan') >= 0);
  if (!hitXacNhan) return [];
  const list = [];
  for (let r = hitXacNhan.row + 1; r < V.length; r++) {
    const trangThai = String(V[r][hitXacNhan.col] || '').trim();
    if (trangThai && _tgNorm(trangThai).indexOf('da xac nhan') < 0) {
      list.push({
        ten: hitTen ? String(V[r][hitTen.col] || '').trim() : '',
        sdt: hitSdt ? String(V[r][hitSdt.col] || '').trim() : '',
        tenSp: hitTenSp ? String(V[r][hitTenSp.col] || '').trim() : '',
        tongTien: hitTongTien ? (parseFloat(V[r][hitTongTien.col]) || 0) : 0,
      });
    }
  }
  return list;
}

// ══════════════ 5. XÁC NHẬN THANH TOÁN + TỰ ĐỘNG GỬI SẢN PHẨM QUA GMAIL ══════════════
// Gọi khi chủ shop gõ "/xacnhan <mã đơn hoặc SĐT>" trong Telegram, sau khi đã tự kiểm tra ngân hàng.
function _confirmAndDeliver_(identifier) {
  const sheet = getSheet_();
  const V = sheet.getDataRange().getValues();
  const hitMaDon   = _findCol(V, 5, h => h.indexOf('ma don') >= 0);
  const hitTen     = _findCol(V, 5, h => h.indexOf('khach hang') >= 0 || h.indexOf('ten khach') >= 0);
  const hitSdt     = _findCol(V, 5, h => h.indexOf('dien thoai') >= 0);
  const hitGmail   = _findCol(V, 5, h => h.indexOf('gmail') >= 0 || h === 'email');
  const hitMaSp    = _findCol(V, 5, h => h.indexOf('ma san pham') >= 0);
  const hitXacNhan = _findCol(V, 5, h => h.indexOf('xac nhan') >= 0 && h.indexOf('thanh toan') >= 0);
  const hitTongTien = _findCol(V, 5, h => h.indexOf('tong tien don hang') >= 0);
  const hitRefCode = _findCol(V, 5, h => h.indexOf('gioi thieu') >= 0 || h.indexOf('aff') >= 0);
  if (!hitXacNhan) return '⚠️ Không tìm thấy cột "Xác nhận đã thanh toán chuyển khoản" trong Sheet.';

  const idNorm = _tgNorm(identifier).replace(/\s+/g, '');
  const idDigits = _phoneKey_(identifier);

  let targetRow = -1;
  // Ưu tiên khớp đúng Mã đơn hàng — luôn chính xác 100%, không cần đoán.
  if (hitMaDon) {
    for (let r = hitMaDon.row + 1; r < V.length; r++) {
      if (_tgNorm(String(V[r][hitMaDon.col] || '')).replace(/\s+/g, '') === idNorm) { targetRow = r; break; }
    }
  }
  // Không thấy theo mã đơn -> thử khớp theo SĐT. Nếu SĐT này có NHIỀU đơn đang chờ xác nhận,
  // KHÔNG tự chọn đại 1 đơn (dễ xác nhận/giao nhầm sản phẩm nếu khách mua nhiều lần) — liệt
  // kê để chủ tự chọn đúng mã đơn.
  if (targetRow < 0 && hitSdt && idDigits) {
    const candidates = [];
    for (let r = hitSdt.row + 1; r < V.length; r++) {
      const sdt = _phoneKey_(V[r][hitSdt.col]);
      const trangThai = String(V[r][hitXacNhan.col] || '').trim();
      if (sdt === idDigits && _tgNorm(trangThai).indexOf('da xac nhan') < 0) candidates.push(r);
    }
    if (candidates.length === 1) {
      targetRow = candidates[0];
    } else if (candidates.length > 1) {
      const list = candidates.map(function (r) {
        const ma = hitMaDon ? String(V[r][hitMaDon.col] || '') : '(không có mã)';
        const tenSp = hitMaSp ? String(V[r][hitMaSp.col] || '') : '';
        return '• <code>' + ma + '</code> — ' + tenSp;
      }).join('\n');
      return '⚠️ SĐT này có ' + candidates.length + ' đơn đang chờ xác nhận, chưa rõ bạn muốn xác nhận đơn nào:\n' +
        list + '\n\n👉 Gõ lại chính xác theo mã đơn: <code>/xacnhan [mã đơn]</code>.';
    }
  }
  if (targetRow < 0) return '❌ Không tìm thấy đơn hàng khớp "' + identifier + '" (thử lại bằng đúng Mã đơn hoặc SĐT khách).';

  const trangThaiHienTai = String(V[targetRow][hitXacNhan.col] || '').trim();
  if (_tgNorm(trangThaiHienTai).indexOf('da xac nhan') >= 0) {
    return 'ℹ️ Đơn này đã được xác nhận và gửi sản phẩm trước đó rồi.';
  }

  sheet.getRange(targetRow + 1, hitXacNhan.col + 1).setValue('Đã xác nhận');

  const tenKhach = hitTen ? String(V[targetRow][hitTen.col] || '').trim() : '';
  const gmail = hitGmail ? String(V[targetRow][hitGmail.col] || '').trim() : '';
  const maSp = hitMaSp ? String(V[targetRow][hitMaSp.col] || '').trim() : '';
  const tongTien = hitTongTien ? (parseFloat(V[targetRow][hitTongTien.col]) || 0) : 0;
  const maDon = hitMaDon ? String(V[targetRow][hitMaDon.col] || '').trim() : '';
  const refCode = hitRefCode ? String(V[targetRow][hitRefCode.col] || '').trim() : '';

  // Đơn hàng ĐẦU TIÊN của email này được xác nhận -> nếu email trùng 1 tài khoản đã đăng ký mà
  // chưa có mã Affiliate, tự cấp mã ngay bây giờ (điều kiện: đã mua ít nhất 1 sản phẩm — chính
  // là đơn đang xác nhận đây). Tài khoản đã có mã từ trước thì hàm chỉ trả lại mã cũ, không cấp lại.
  let newAffMsg = '';
  if (gmail) {
    try {
      const beforeSheet = getUsersSheet_();
      const beforeV = beforeSheet.getDataRange().getValues();
      let hadCodeBefore = false;
      for (let r = 1; r < beforeV.length; r++) {
        if (_tgNorm(String(beforeV[r][1] || '')).trim() === _tgNorm(gmail).trim()) { hadCodeBefore = !!String(beforeV[r][7] || '').trim(); break; }
      }
      const grantedCode = _grantAffiliateIfEligible_(gmail);
      if (grantedCode && !hadCodeBefore) newAffMsg = '\n🎯 Đơn đầu tiên của ' + gmail + ' — đã tự cấp mã Affiliate <code>' + grantedCode + '</code>.';
    } catch (grantErr) { /* lỗi cấp mã Affiliate không được làm hỏng việc xác nhận/gửi sản phẩm */ }
  }

  // Đơn có mã giới thiệu hợp lệ -> cộng hoa hồng affiliate ngay lúc xác nhận thanh toán thật.
  let affMsg = '';
  if (refCode) {
    try { affMsg = _creditAffiliateCommission_(refCode, maDon, tenKhach, tongTien); } catch (affErr) { affMsg = '\n⚠️ Lỗi ghi hoa hồng affiliate: ' + affErr; }
  }
  affMsg += newAffMsg;

  // "Quà Tặng Đặc Biệt": đơn có mua 1 trong 3 khoá học kích hoạt (CONFIG.BONUS_TRIGGER_CODES) thì
  // tự động gộp thêm mã quà (CONFIG.BONUS_GIFT_CODE) vào danh sách gửi email — khách không cần
  // yêu cầu, quà không hiện công khai trên web như các Quà Tặng miễn phí khác.
  const boughtCodes = maSp.split(',').map(function (s) { return s.trim().toUpperCase(); });
  const gotBonus = CONFIG.BONUS_TRIGGER_CODES.some(function (c) { return boughtCodes.indexOf(c.toUpperCase()) >= 0; });
  const maSpToSend = gotBonus ? (maSp + ', ' + CONFIG.BONUS_GIFT_CODE) : maSp;

  if (!gmail) return '✅ Đã đánh dấu XÁC NHẬN cho ' + tenKhach + ', nhưng KHÔNG có Gmail trong đơn — vui lòng gửi sản phẩm thủ công.' + affMsg;

  let result;
  try {
    result = _sendProductEmail_(gmail, tenKhach, maSpToSend);
  } catch (err) {
    return '✅ Đã xác nhận thanh toán cho ' + tenKhach + ', nhưng GỬI EMAIL LỖI: ' + err + ' — vui lòng gửi thủ công.' + affMsg;
  }

  let msg = '✅ Đã xác nhận thanh toán và gửi sản phẩm qua Gmail (' + gmail + ') cho <b>' + tenKhach + '</b>.\n' +
    'Đã gửi: ' + (result.found.length ? result.found.map(function (p) { return p.code; }).join(', ') : '(không có)');
  if (gotBonus) msg += '\n🎁 Đơn có mua khoá học kích hoạt Quà Tặng Đặc Biệt — đã tự động gộp gửi kèm ' + CONFIG.BONUS_GIFT_CODE + '.';
  if (result.missing.length) {
    msg += '\n⚠️ CHƯA có link trong tab SAN_PHAM cho: ' + result.missing.join(', ') + ' — cần bổ sung rồi gửi tay cho khách.';
  }
  return msg + affMsg;
}

// Cộng hoa hồng affiliate cho đơn đã xác nhận thanh toán, nếu mã giới thiệu (refCode) khớp 1
// affiliate có thật trong tab Users. Ghi 1 dòng mới vào tab HOA_HONG_AFF — KHÔNG cộng nếu mã
// không tồn tại (tránh rác dữ liệu do khách tự gõ mã bừa vào URL).
function _creditAffiliateCommission_(refCode, orderCode, buyerName, total) {
  const usersSheet = getUsersSheet_();
  const UV = usersSheet.getDataRange().getValues();
  const refUpper = String(refCode || '').trim().toUpperCase();
  let ownerEmail = '';
  for (let r = 1; r < UV.length; r++) {
    if (String(UV[r][7] || '').trim().toUpperCase() === refUpper) { ownerEmail = String(UV[r][1] || '').trim(); break; }
  }
  if (!ownerEmail) return '\nℹ️ Mã giới thiệu "' + refCode + '" không khớp affiliate nào, không cộng hoa hồng.';

  // Điều kiện tối thiểu: Affiliate phải TỰ mua tổng đủ CONFIG.AFF_MIN_PURCHASE (tính trên các đơn
  // ĐÃ XÁC NHẬN của chính họ) mới được cộng hoa hồng khi giới thiệu người khác — chặn tài khoản ảo
  // lập ra chỉ để giới thiệu ăn hoa hồng mà chưa từng là khách hàng thật.
  const ownerTotal = _totalConfirmedPurchaseOf_(ownerEmail);
  if (ownerTotal < CONFIG.AFF_MIN_PURCHASE) {
    return '\nℹ️ Mã giới thiệu "' + refCode + '" hợp lệ nhưng chủ mã mới mua tổng ' + ownerTotal.toLocaleString('vi-VN') +
      'đ (chưa đạt tối thiểu ' + CONFIG.AFF_MIN_PURCHASE.toLocaleString('vi-VN') + 'đ) — CHƯA cộng hoa hồng lần này.';
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let affSheet = ss.getSheetByName(CONFIG.SHEET_AFF);
  if (!affSheet) affSheet = ss.insertSheet(CONFIG.SHEET_AFF);
  const stt = affSheet.getLastRow() < 1 ? 1 : affSheet.getLastRow();
  const hoaHong = Math.round(total * CONFIG.AFF_COMMISSION_RATE);
  affSheet.appendRow([stt, orderCode, refUpper, buyerName, total, (CONFIG.AFF_COMMISSION_RATE * 100) + '%', hoaHong, new Date()]);
  return '\n💰 Đã cộng hoa hồng affiliate ' + hoaHong.toLocaleString('vi-VN') + 'đ cho mã ' + refUpper + '.';
}

// Hàng ở đây là hàng VẬT LÝ (sách kinh, đồ thờ cúng...), không phải file số — nên KHÔNG gửi link tải
// như bản gốc. Chỉ dùng _buildSanPhamMap_() để tra TÊN sản phẩm cho đẹp trong email, rồi gửi email
// cảm ơn + báo sẽ đóng gói giao hàng. "found/missing" giữ nguyên để không phải sửa chỗ gọi hàm này
// (_confirmAndDeliver_), nhưng giờ missing luôn rỗng vì không còn phụ thuộc link giao hàng nữa.
function _sendProductEmail_(toEmail, tenKhach, productCodesStr) {
  const linkMap = _buildSanPhamMap_();
  const codes = String(productCodesStr || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  const found = codes.map(function (code) {
    const info = linkMap[code.toUpperCase()];
    return { code: code, ten: (info && info.name) ? info.name : code };
  });
  const itemsHtml = found.map(function (it) { return '<li>' + it.ten + '</li>'; }).join('');

  const html = '<p>Chào ' + (tenKhach || 'bạn') + ',</p>' +
    '<p>Cảm ơn bạn đã đặt hàng tại ' + CONFIG.BUSINESS_NAME + '. Chúng tôi đã xác nhận thanh toán cho đơn hàng gồm:</p>' +
    '<ul>' + itemsHtml + '</ul>' +
    '<p>Đơn hàng sẽ được đóng gói và giao đến bạn trong thời gian sớm nhất. Mọi thắc mắc vui lòng liên hệ Zalo/SĐT <b>' + CONFIG.CONTACT_PHONE + '</b>.</p>' +
    '<p>Trân trọng,<br>' + CONFIG.BUSINESS_NAME + '</p>';
  GmailApp.sendEmail(toEmail, 'Xác nhận đơn hàng — ' + CONFIG.BUSINESS_NAME, '', { htmlBody: html });
  return { found: found, missing: [] };
}

// ---- 2b. Webhook Telegram — bot trả lời 2 chiều ----
function handleTelegramUpdate_(update) {
  let chatId;
  try {
    const msg = update.message || update.edited_message;
    if (msg && msg.text) {
      chatId = msg.chat.id;
      // Tự đăng ký Chat ID ngay lần đầu tiên có người nhắn cho bot (thường là chủ shop lúc
      // setup) — CHỈ đăng ký 1 LẦN, không ghi đè nếu TG_CHAT_ID đã có sẵn, để tránh 1 khách
      // hàng nhắn tin ngẫu nhiên sau này vô tình cướp mất chat nhận báo cáo doanh thu.
      const props = PropertiesService.getScriptProperties();
      if (!props.getProperty('TG_CHAT_ID')) props.setProperty('TG_CHAT_ID', String(chatId));
      const reply = answerTelegramQuestion(msg.text);
      tgSendTo(chatId, reply);
    }
  } catch (err) {
    if (chatId) tgSendTo(chatId, '⚠️ Lỗi xử lý: ' + err);
  }
  return HtmlService.createHtmlOutput('ok');
}

// ══════════════ 6. BÁO CÁO 22H — tính TRONG NGÀY (00h00 -> lúc gửi) ══════════════
function sendDailyReport() {
  const tz = Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh';
  const today = new Date();
  const todayStr = Utilities.formatDate(today, tz, 'dd/MM/yyyy');

  let dh = null; try { dh = _ordersByDate_(today); } catch (err) {}
  let soDon = 0, doanhThu = 0;
  const byMa = {};
  if (dh) {
    soDon = dh.rows.length;
    dh.rows.forEach(function (r) {
      doanhThu += r.tongTien;
      (r.maSp || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (ma) {
        byMa[ma] = (byMa[ma] || 0) + 1;
      });
    });
  }
  const topSp = Object.keys(byMa).sort(function (a, b) { return byMa[b] - byMa[a]; }).slice(0, 5)
    .map(function (k) { return k + ': ' + byMa[k] + ' đơn'; });

  let khachMoi = []; try { khachMoi = _newCustomers_(today); } catch (err) {}
  let pending = []; try { pending = _pendingOrders_(); } catch (err) {}

  const noteEmpty = dh && dh.rows.length === 0 ? ' <i>(chưa có đơn hàng hôm nay)</i>' : '';
  const pendingLines = pending.slice(0, 10).map(function (p) {
    return p.ten + ' (' + p.sdt + ') — ' + p.tongTien.toLocaleString('vi-VN') + 'đ';
  });

  const msg = '📊 <b>BÁO CÁO DOANH THU ' + todayStr + ' — ' + CONFIG.BUSINESS_NAME + '</b>\n\n' +
    '<i>Số liệu trong ngày hôm nay (tính đến ' + CONFIG.REPORT_HOUR + 'h00):</i>\n\n' +
    '1️⃣ Đơn hàng: <b>' + soDon + ' đơn</b>' + noteEmpty + '\n\n' +
    '2️⃣ Doanh thu: <b>' + doanhThu.toLocaleString('vi-VN') + ' đ</b>\n\n' +
    '3️⃣ Top sản phẩm bán chạy:' + (topSp.length ? '\n      ' + topSp.join('\n      ') : ' <i>(chưa có dữ liệu)</i>') + '\n\n' +
    '4️⃣ Khách hàng mới: <b>' + khachMoi.length + ' khách</b>' + (khachMoi.length ? '\n      ' + khachMoi.join('\n      ') : '') + '\n\n' +
    '5️⃣ Đơn chờ xác nhận thanh toán (tính đến hiện tại): <b>' + pending.length + ' đơn</b>' +
    (pendingLines.length ? '\n      ' + pendingLines.join('\n      ') : ' <i>(không có đơn tồn đọng)</i>') +
    (pending.length > 10 ? '\n      ...và ' + (pending.length - 10) + ' đơn khác' : '') + '\n\n' +
    '<b>*** BÁO CÁO KẾT THÚC ***</b>';
  tgSend(msg);
}

function setupDailyReportTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDailyReport') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyReport').timeBased().atHour(CONFIG.REPORT_HOUR).everyDays(1).create();
  tgSend('🔔 Đã bật báo cáo doanh thu tự động ' + CONFIG.REPORT_HOUR + 'h-' + (CONFIG.REPORT_HOUR + 1) + 'h mỗi ngày cho ' + CONFIG.BUSINESS_NAME + '.');
}

// ══════════════ 7. Hỏi đáp lệnh cố định (bản lõi — không có AI Gemini) ══════════════
function answerTelegramQuestion(text) {
  const normText = _tgNorm(text).replace(/^\/+/, '').trim();
  // Hỗ trợ nhiều cách gõ: "/xacnhan DH123", "xac nhan DH123", "Xác nhận - DH123", "xacnhan: DH123"...
  const xnMatch = /^xac\s*nhan[\s:-]+(\S+)/.exec(normText);
  if (xnMatch) return _confirmAndDeliver_(xnMatch[1]);

  const n = _tgNorm(text);
  const words = n.split(/\s+/).filter(Boolean);
  const has = function (w) { return words.indexOf(w) >= 0; };

  if (!n || n === '/start' || has('menu') || has('help')) {
    return '👋 Chào anh/chị! Em là Trợ lý ' + CONFIG.BUSINESS_NAME + '.\n\nCác lệnh em hiểu:\n' +
      '• /xacnhan [mã đơn hoặc SĐT] — xác nhận đã kiểm tra ngân hàng, tự gửi sản phẩm cho khách\n' +
      '• đơn hàng — số đơn & doanh thu hôm nay\n' +
      '• doanh thu — doanh thu hôm nay\n' +
      '• đơn chờ xác nhận — danh sách đơn khách báo đã CK nhưng chưa xác nhận\n' +
      '• báo cáo — gửi lại báo cáo hôm nay ngay bây giờ\n' +
      '• menu — xem lại danh sách này';
  }

  if (has('bao') && has('cao')) { sendDailyReport(); return '✅ Đã gửi báo cáo.'; }

  if (has('cho') && has('xac') && has('nhan')) {
    let pending = []; try { pending = _pendingOrders_(); } catch (err) {}
    if (!pending.length) return '✅ Không có đơn nào đang chờ xác nhận thanh toán.';
    return '⏳ <b>' + pending.length + ' đơn chờ xác nhận:</b>\n' +
      pending.map(function (p) { return '• ' + p.ten + ' (' + p.sdt + ') — ' + p.tenSp + ' — ' + p.tongTien.toLocaleString('vi-VN') + 'đ'; }).join('\n') +
      '\n\nGõ /xacnhan [SĐT] sau khi đã kiểm tra ngân hàng đúng để gửi sản phẩm.';
  }

  if ((has('don') && has('hang') && words.length === 2) || (has('doanh') && has('thu') && words.length === 2)) {
    let dh = null; try { dh = _ordersByDate_(new Date()); } catch (err) {}
    if (!dh) return '⚠️ Chưa tìm thấy tab "' + CONFIG.SHEET_ORDERS + '" hoặc cột "Thời gian mua hàng".';
    let dt = 0; dh.rows.forEach(function (r) { dt += r.tongTien; });
    return '🧾 Hôm nay: ' + dh.rows.length + ' đơn · doanh thu ' + dt.toLocaleString('vi-VN') + ' đ.';
  }

  return '🤔 Em chưa hiểu câu hỏi này. Gõ "menu" để xem các lệnh em hỗ trợ.';
}

// ══════════════ 7b. ADMIN — quản trị Nhóm & Sản phẩm (đăng nhập đúng Tên + Email + Mật khẩu cố định) ══════════════
function _isAdmin_(data) {
  return String(data.adminUser || '').trim() === CONFIG.ADMIN_USERNAME &&
    String(data.adminEmail || '').trim().toLowerCase() === CONFIG.ADMIN_EMAIL.toLowerCase() &&
    String(data.adminPass || '') === CONFIG.ADMIN_PASSWORD;
}
function _adminDenied_() {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Sai thông tin quản trị (tên đăng nhập/email/mật khẩu).' })).setMimeType(ContentService.MimeType.JSON);
}
function handleAdminLogin_(data) {
  if (!_isAdmin_(data)) return _adminDenied_();
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

// ---- Tab "DANH_MUC_NHOM" — metadata của 6 Nhóm (khác tab SAN_PHAM_* chỉ chứa sản phẩm). Tự tạo +
// gieo đúng 6 Nhóm hiện có trong index.html nếu tab chưa tồn tại (lần đầu gọi get_catalog/admin_*).
const NHOM_HEADERS = ['Slug', 'Ten Nhom', 'Icon', 'Mau Sac', 'Thu Tu', 'An'];
const NHOM_SEED = [
  ['sach-kinh', 'Sách Kinh Phật', '📖', '#92400e', 1, ''],
  ['tuong-phat-phap-khi', 'Tượng Phật & Pháp Khí', '🛕', '#b45309', 2, ''],
  ['vong-trang-suc', 'Vòng Tay Phong Thủy', '📿', '#a16207', 3, ''],
  ['nhang-tram-xong-huong', 'Nhang Trầm - Xông Hương', '🕯️', '#854d0e', 4, ''],
  ['do-tho-cung', 'Đồ Thờ Cúng', '🙏', '#7c2d12', 5, ''],
  ['phap-phuc', 'Pháp Phục', '👘', '#c2410c', 6, ''],
  ['do-an-chay', 'Đồ Ăn Chay', '🥗', '#4d7c0f', 7, ''],
  ['qua-tang-tam-linh', 'Quà Tặng Tâm Linh', '🎁', '#991b1b', 8, ''],
];
function _getNhomSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NHOM);
  if (!sh) {
    // Khoá lại trong lúc tạo tab lần đầu — phòng 2 request cùng lúc (VD trang tự tải dữ liệu +
    // Admin đang lưu 1 thao tác khác) đều thấy "chưa có tab" và cùng tạo, sinh trùng/lệch dữ liệu.
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sh = ss.getSheetByName(CONFIG.SHEET_NHOM); // kiểm tra lại lần nữa TRONG lock, phòng request khác vừa tạo xong
      if (!sh) {
        sh = ss.insertSheet(CONFIG.SHEET_NHOM);
        sh.getRange(1, 1, 1, NHOM_HEADERS.length).setValues([NHOM_HEADERS]);
        sh.getRange(1, 1, 1, NHOM_HEADERS.length).setFontWeight('bold').setBackground('#EEF2FF');
        sh.setFrozenRows(1);
        sh.getRange(2, 1, NHOM_SEED.length, NHOM_HEADERS.length).setValues(NHOM_SEED);
      }
    } finally {
      lock.releaseLock();
    }
  }
  return sh;
}
// includeHidden=false (khách xem web bình thường) -> bỏ qua Nhóm đã "xoá mềm" (cột An có giá trị).
// includeHidden=true (Admin) -> trả về TẤT CẢ, kèm cờ hidden để giao diện Admin có thể "khôi phục".
function _readGroups_(includeHidden) {
  const sh = _getNhomSheet_();
  const V = sh.getDataRange().getValues();
  const list = [];
  for (let r = 1; r < V.length; r++) {
    const slug = String(V[r][0] || '').trim();
    if (!slug) continue;
    const hidden = String(V[r][5] || '').trim() !== '';
    if (hidden && !includeHidden) continue;
    list.push({ slug: slug, label: String(V[r][1] || ''), icon: String(V[r][2] || ''), color: String(V[r][3] || ''), order: Number(V[r][4]) || 0, hidden: hidden });
  }
  list.sort(function (a, b) { return a.order - b.order; });
  return list;
}

// ══════════════ VIDEO_REEL — Phin tự dán link Reel Facebook, web tự đọc lại danh sách này ══════════════
// Web KHÔNG tải được file video từ đây (link Reel không phải file .mp4) — chỉ hiển thị qua khung
// nhúng chính chủ của Facebook, nên chỉ nút Video Trước/Sau hoạt động (đổi sang link khác), các nút
// tua ±10s/±30s và tạm dừng/phát KHÔNG hoạt động ở chế độ này (Facebook không cho JS bên ngoài điều
// khiển sâu vào trình phát của họ) — muốn đủ các nút đó phải dùng REEL_VIDEOS (file .mp4 thật) trong
// index.html thay vì tab này. Dán link Reel MỚI NHẤT lên dòng TRÊN CÙNG (ngay dưới tiêu đề) để phát
// trước — web đọc đúng thứ tự dòng trong Sheet, không tự sắp xếp lại theo ngày/gì khác.
const REEL_HEADERS = ['STT', 'Tieu De', 'Link Video Reel'];
function _getReelsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_REELS);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_REELS);
    sh.getRange(1, 1, 1, REEL_HEADERS.length).setValues([REEL_HEADERS]);
    sh.getRange(1, 1, 1, REEL_HEADERS.length).setFontWeight('bold').setBackground('#EEF2FF');
    sh.setFrozenRows(1);
  }
  return sh;
}
function _readReels_() {
  const sh = _getReelsSheet_();
  const V = sh.getDataRange().getValues();
  const list = [];
  for (let r = 1; r < V.length; r++) {
    const link = String(V[r][2] || '').trim();
    if (!link) continue;
    list.push({ title: String(V[r][1] || '').trim(), url: link });
  }
  return list;
}
function handleGetReels_() {
  try {
    return ContentService.createTextOutput(JSON.stringify({ reels: _readReels_() })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ reels: [], error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Tên tab sản phẩm của 1 Nhóm — theo ĐÚNG quy ước đã dùng sẵn trong Sheet thật của khách hàng
// (VD slug "skill-tai-lieu" -> tab "SAN_PHAM_SKILL_TAI_LIEU").
function _slugToTabName_(slug) {
  return 'SAN_PHAM_' + String(slug || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
const CATALOG_PRODUCT_HEADERS = ['Mã sản phẩm', 'Tên sản phẩm', 'Nhóm sản phẩm', 'Ngành sản phẩm', 'Mô tả sản phẩm', 'Giá bán sản phẩm', 'Link sản phẩm', 'Thumbnails sản phẩm', 'Video giới thiệu sản phẩm'];
function _getProductSheet_(slug, createIfMissing) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabName = _slugToTabName_(slug);
  let sh = ss.getSheetByName(tabName);
  if (!sh && createIfMissing) {
    // Khoá lại trong lúc tạo tab — ĐÃ TỪNG xảy ra thật: trang tự tải dữ liệu (get_catalog) và
    // Admin lưu sản phẩm chạy gần như cùng lúc, cả 2 đều thấy "chưa có tab" -> cùng insertSheet()
    // cùng tên -> Google Sheets tự đổi tên bản thứ 2 thành "..._conflict<id>" (tab rác trùng lặp).
    // waitLock+kiểm tra lại lần nữa bên trong lock đảm bảo chỉ 1 request thực sự tạo tab.
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sh = ss.getSheetByName(tabName);
      if (!sh) {
        sh = ss.insertSheet(tabName);
        sh.getRange(1, 1, 1, CATALOG_PRODUCT_HEADERS.length).setValues([CATALOG_PRODUCT_HEADERS]);
        sh.getRange(1, 1, 1, CATALOG_PRODUCT_HEADERS.length).setFontWeight('bold').setBackground('#EEF2FF');
        sh.setFrozenRows(1);
      }
    } finally {
      lock.releaseLock();
    }
  }
  return sh;
}
function _parsePrice_(v) {
  if (typeof v === 'number') return v;
  const digits = String(v || '').replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}
// Đọc toàn bộ sản phẩm của 1 tab Nhóm — dò cột theo TÊN TIÊU ĐỀ (không phụ thuộc đúng thứ tự cột).
function _readProductsOfGroup_(slug) {
  const sh = _getProductSheet_(slug, false);
  if (!sh) return [];
  const V = sh.getDataRange().getValues();
  if (V.length < 2) return [];
  const header = V[0].map(function (h) { return _tgNorm(String(h || '')); });
  const idx = function (keywords) {
    for (let j = 0; j < header.length; j++) if (keywords.some(function (k) { return header[j].indexOf(k) >= 0; })) return j;
    return -1;
  };
  const col = {
    code: idx(['ma san pham']), name: idx(['ten san pham']), industry: idx(['nganh']),
    desc: idx(['mo ta']), price: idx(['gia']), link: idx(['link san pham']),
    thumb: idx(['thumbnail']), video: idx(['video']),
  };
  const list = [];
  for (let r = 1; r < V.length; r++) {
    const code = col.code >= 0 ? String(V[r][col.code] || '').trim() : '';
    if (!code) continue;
    list.push({
      code: code,
      name: col.name >= 0 ? String(V[r][col.name] || '').trim() : '',
      group: slug,
      industry: col.industry >= 0 ? String(V[r][col.industry] || '').trim() : '',
      desc: col.desc >= 0 ? String(V[r][col.desc] || '').trim() : '',
      price: col.price >= 0 ? _parsePrice_(V[r][col.price]) : 0,
      link: col.link >= 0 ? String(V[r][col.link] || '').trim() : '',
      thumb: col.thumb >= 0 ? String(V[r][col.thumb] || '').trim() : '',
      video: col.video >= 0 ? String(V[r][col.video] || '').trim() : '',
      badges: [],
    });
  }
  return list;
}

// ---- action=get_catalog (doGet) — nút "Làm Mới": trả TOÀN BỘ Nhóm (+ sản phẩm thật trong Sheet)
// để web thay thế dữ liệu mẫu đang có. Gửi kèm adminUser/adminEmail/adminPass (query string) thì
// mới thấy được cả các Nhóm đã "xoá mềm" (để Admin có thể khôi phục lại).
function handleGetCatalog_(p) {
  try {
    const isAdmin = _isAdmin_({ adminUser: p.adminUser, adminEmail: p.adminEmail, adminPass: p.adminPass });
    const groups = _readGroups_(isAdmin);
    const products = [];
    // CHỈ ĐỌC — không tự tạo tab ở đây nữa (đã bỏ, xem ghi chú trong _getProductSheet_): get_catalog
    // được gọi RẤT thường xuyên (mỗi lần mở trang), biến nó thành thao tác GHI dễ đụng độ với Admin
    // đang lưu cùng lúc, sinh tab rác "..._conflict...". Việc tạo tab cho Nhóm mới đã có sẵn ở
    // handleAdminSaveGroup_/handleAdminSaveProduct_ (đúng lúc thật sự cần), ở đây không cần nữa.
    groups.forEach(function (g) { products.push.apply(products, _readProductsOfGroup_(g.slug)); });
    return ContentService.createTextOutput(JSON.stringify({ groups: groups, products: products })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ groups: [], products: [], error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- action=admin_save_group (doPost) — Thêm MỚI hoặc SỬA (upsert theo slug). Gửi lại đúng slug
// của 1 Nhóm đã "xoá mềm" trước đó -> tự bỏ ẩn (khôi phục), không tạo trùng dòng.
function handleAdminSaveGroup_(data) {
  if (!_isAdmin_(data)) return _adminDenied_();
  try {
    // BẮT BUỘC qua _tgNorm() trước khi bỏ ký tự lạ — nếu không, chữ có dấu tiếng Việt (VD "Quà
    // Tặng") bị coi là "ký tự lạ" luôn chứ không phải bỏ dấu, sinh slug méo kiểu "qu-t-ng" thay vì
    // "qua-tang" đúng mong muốn (lỗi thật đã gặp — sinh tab "SAN_PHAM_QU_T_NG" sai tên).
    const slugSource = String(data.slug || '').trim() || String(data.label || '').trim();
    const slug = _tgNorm(slugSource).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const label = String(data.label || '').trim();
    if (!slug || !label) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Thiếu tên hoặc slug nhóm.' })).setMimeType(ContentService.MimeType.JSON);
    }
    const sh = _getNhomSheet_();
    const V = sh.getDataRange().getValues();
    let targetRow = -1;
    for (let r = 1; r < V.length; r++) { if (String(V[r][0] || '').trim() === slug) { targetRow = r + 1; break; } }
    const icon = String(data.icon || '📦').trim() || '📦';
    const color = String(data.color || '#2563eb').trim() || '#2563eb';
    const order = Number(data.order) || (targetRow > 0 ? V[targetRow - 1][4] : V.length);
    const rowVals = [slug, label, icon, color, order, '']; // cột "An" luôn để trống -> tự bỏ ẩn nếu đang ẩn
    if (targetRow > 0) sh.getRange(targetRow, 1, 1, NHOM_HEADERS.length).setValues([rowVals]);
    else sh.appendRow(rowVals);
    _getProductSheet_(slug, true); // đảm bảo có sẵn tab sản phẩm cho Nhóm (mới tạo hoặc phục hồi)
    return ContentService.createTextOutput(JSON.stringify({ success: true, slug: slug })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- action=admin_delete_group (doPost) — XOÁ MỀM: chỉ đánh dấu ẩn khỏi web, KHÔNG xoá tab/sản
// phẩm thật trong Sheet (theo yêu cầu Hùng 2026-08-17 — tránh mất dữ liệu không thể khôi phục).
function handleAdminDeleteGroup_(data) {
  if (!_isAdmin_(data)) return _adminDenied_();
  try {
    const slug = String(data.slug || '').trim();
    const sh = _getNhomSheet_();
    const V = sh.getDataRange().getValues();
    for (let r = 1; r < V.length; r++) {
      if (String(V[r][0] || '').trim() === slug) {
        sh.getRange(r + 1, 6).setValue('x'); // cột "An"
        return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Không tìm thấy nhóm.' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- action=admin_save_product (doPost) — Thêm MỚI hoặc SỬA theo Mã sản phẩm (khoá chính, duy
// nhất trên toàn catalog). Đổi sang Nhóm khác -> tự chuyển dòng từ tab Nhóm cũ sang tab Nhóm mới.
function handleAdminSaveProduct_(data) {
  if (!_isAdmin_(data)) return _adminDenied_();
  try {
    const code = String(data.code || '').trim();
    const group = String(data.group || '').trim();
    if (!code || !group) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Thiếu mã sản phẩm hoặc nhóm.' })).setMimeType(ContentService.MimeType.JSON);
    }
    const oldGroup = String(data.oldGroup || '').trim(); // nhóm cũ trước khi sửa (rỗng nếu đang THÊM MỚI)
    // THÊM MỚI (không phải sửa) -> chặn trùng mã với BẤT KỲ sản phẩm nào trên toàn catalog — mã
    // sản phẩm là khoá chính duy nhất (dùng để bot tự tra link giao hàng), trùng mã sẽ vô tình
    // SỬA ĐÈ sản phẩm cũ khác thay vì tạo sản phẩm mới nếu không chặn ở đây.
    if (!oldGroup) {
      const existingMap = _buildSanPhamMap_();
      if (existingMap[code.toUpperCase()]) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Mã sản phẩm "' + code + '" đã tồn tại (ở nhóm khác hoặc đã có sẵn) — vui lòng đổi mã khác.' })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    if (oldGroup && oldGroup !== group) {
      const oldSh = _getProductSheet_(oldGroup, false);
      if (oldSh) {
        const OV = oldSh.getDataRange().getValues();
        for (let r = OV.length - 1; r >= 1; r--) {
          if (String(OV[r][0] || '').trim() === code) { oldSh.deleteRow(r + 1); break; }
        }
      }
    }
    const sh = _getProductSheet_(group, true);
    const V = sh.getDataRange().getValues();
    let targetRow = -1;
    for (let r = 1; r < V.length; r++) { if (String(V[r][0] || '').trim() === code) { targetRow = r + 1; break; } }
    const rowVals = [
      code, String(data.name || '').trim(), group, String(data.industry || '').trim(),
      String(data.desc || '').trim(), Number(data.price) || 0, String(data.link || '').trim(),
      String(data.thumb || '').trim(), String(data.video || '').trim(),
    ];
    if (targetRow > 0) sh.getRange(targetRow, 1, 1, rowVals.length).setValues([rowVals]);
    else sh.appendRow(rowVals);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- action=admin_delete_product (doPost) — xoá HẲN 1 dòng sản phẩm khỏi tab Nhóm tương ứng
// (khác xoá Nhóm — sản phẩm lẻ xoá cứng vì không kéo theo mất dữ liệu của cả nhóm).
function handleAdminDeleteProduct_(data) {
  if (!_isAdmin_(data)) return _adminDenied_();
  try {
    const code = String(data.code || '').trim();
    const group = String(data.group || '').trim();
    const sh = _getProductSheet_(group, false);
    if (!sh) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Không tìm thấy tab của nhóm này.' })).setMimeType(ContentService.MimeType.JSON);
    }
    const V = sh.getDataRange().getValues();
    for (let r = V.length - 1; r >= 1; r--) {
      if (String(V[r][0] || '').trim() === code) {
        sh.deleteRow(r + 1);
        return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Không tìm thấy sản phẩm.' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ══════════════ 7c. SỬA SLUG 1 NHÓM BỊ SAI (chạy 1 lần, KHÔNG xoá dữ liệu) ══════════════
// Dùng khi 1 Nhóm bị sinh slug méo (VD gõ dấu tiếng Việt vào ô Slug lúc tạo -> ra tab kiểu
// "SAN_PHAM_QU_T_NG" thay vì "SAN_PHAM_QUA_TANG" mong muốn). Hàm này CHỈ đổi giá trị cột "Slug"
// trong tab DANH_MUC_NHOM — KHÔNG đụng tới/xoá tab sản phẩm nào. Sau khi chạy, sản phẩm MỚI lưu
// cho Nhóm này sẽ tự ghi vào đúng tab khớp NEW_SLUG (VD đã đổi tên tab thành "SAN_PHAM_QUA_TANG"
// thì NEW_SLUG phải là "qua-tang" — đúng công thức: bỏ "SAN_PHAM_" + chữ thường + gạch ngang).
function fixGroupSlug() {
  // Tìm theo SLUG HIỆN TẠI (cột "Slug", cột A) — đáng tin hơn tìm theo tên hiển thị (cột "Ten
  // Nhom"), vì tên hiển thị có thể dính ký tự lạ (VD gõ nhầm/dán nhầm ký tự full-width) làm so
  // sánh chuỗi trật dù nhìn giống hệt nhau bằng mắt thường. Đã xác nhận qua API: slug hiện tại
  // của nhóm "Quà Tặng" đang là "y-i-i-u-n" (sai, do gõ dấu vào ô Slug lúc tạo).
  const OLD_SLUG_TO_FIND = 'y-i-i-u-n'; // <-- đổi đúng slug SAI đang có (xem cột "Slug" tab DANH_MUC_NHOM)
  const NEW_SLUG = 'qua-tang';          // <-- slug ĐÚNG muốn đổi sang, PHẢI khớp tên tab đã đổi (SAN_PHAM_QUA_TANG)
  const sh = _getNhomSheet_();
  const V = sh.getDataRange().getValues();
  let found = false;
  for (let r = 1; r < V.length; r++) {
    if (String(V[r][0] || '').trim() === OLD_SLUG_TO_FIND) {
      sh.getRange(r + 1, 1).setValue(NEW_SLUG);
      found = true;
      break;
    }
  }
  const msg = found
    ? 'Đã đổi slug "' + OLD_SLUG_TO_FIND + '" thành "' + NEW_SLUG + '". Sản phẩm mới lưu cho nhóm này từ giờ sẽ vào đúng tab "' + _slugToTabName_(NEW_SLUG) + '".'
    : 'Không tìm thấy dòng nào có Slug = "' + OLD_SLUG_TO_FIND + '" trong tab DANH_MUC_NHOM — kiểm tra lại cột A (Slug) trong Sheet.';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  Logger.log(msg);
}

// ══════════════ 7d. LẤY MÔ TẢ THẬT TỪ FILE DRIVE (chạy khi cần, KHÔNG tự động) ══════════════
// Mai có thói quen viết mô tả chi tiết trong 1 file riêng trên Drive (.md/.txt) rồi dán LINK file
// đó vào cột "Mô tả sản phẩm" thay vì gõ thẳng chữ — web sẽ chỉ hiện ra đúng cái link đó nếu không
// xử lý gì thêm. Hàm này quét mọi tab SAN_PHAM_*, phát hiện ô Mô tả đang là link Drive, đọc nội
// dung chữ thật trong file đó rồi GHI ĐÈ lại đúng ô đó bằng chữ thật — chỉ cần chạy khi Mai vừa
// thêm 1 loạt sản phẩm kiểu này (dropdown Apps Script editor -> chọn resolveDescriptionLinksFromDrive
// -> ▷ Chạy). Từ đó trang web đọc thẳng chữ có sẵn trong Sheet, không phải gọi Drive mỗi lần khách
// mở trang (tránh chậm/vượt hạn mức Drive API khi có hàng trăm sản phẩm).
// LƯU Ý: file mô tả PHẢI được chia sẻ ít nhất "Bất kỳ ai có đường liên kết" (hoặc share riêng cho
// đúng tài khoản đang chạy Apps Script này) thì mới đọc được — nếu không sẽ báo lỗi ở dòng đó trong
// bản tóm tắt cuối cùng, ô đó GIỮ NGUYÊN link cũ (không xoá/mất dữ liệu nếu đọc lỗi).
function resolveDescriptionLinksFromDrive() {
  let converted = 0, emptyFile = 0, failed = 0;
  const failedList = [];
  _getSanPhamSheets_().forEach(function (sh) {
    const V = sh.getDataRange().getValues();
    if (!V.length) return;
    const header = V[0].map(function (h) { return _tgNorm(String(h || '')); });
    let descCol = -1;
    for (let j = 0; j < header.length; j++) {
      if (header[j].indexOf('mo ta') >= 0) { descCol = j; break; }
    }
    if (descCol < 0) return;
    for (let r = 1; r < V.length; r++) {
      const cellVal = String(V[r][descCol] || '').trim();
      const m = cellVal.match(/drive\.google\.com\/file\/d\/([^/]+)/);
      if (!m) continue; // không phải link Drive -> để nguyên (đã là chữ thật hoặc đang trống)
      try {
        const text = DriveApp.getFileById(m[1]).getBlob().getDataAsString('UTF-8').trim();
        if (!text) { emptyFile++; continue; }
        sh.getRange(r + 1, descCol + 1).setValue(text);
        converted++;
      } catch (err) {
        failed++;
        failedList.push(sh.getName() + ' dòng ' + (r + 1) + ': ' + err);
      }
    }
  });
  const msg = 'Đã chuyển ' + converted + ' mô tả từ link Drive thành chữ thật.' +
    (emptyFile ? ' Bỏ qua ' + emptyFile + ' file rỗng.' : '') +
    (failed ? '\n⚠️ Lỗi ' + failed + ' dòng (thường do file chưa bật chia sẻ):\n' + failedList.join('\n') : '');
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  Logger.log(msg);
}

// ══════════════ 8. Tạo tab SAN_PHAM khớp dữ liệu mẫu trong index.html (chạy 1 lần lúc setup) ══════════════
// Sửa lại thành đúng sản phẩm thật của khách hàng trước khi bán thật.
function setupProductCatalog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_SAN_PHAM);
  if (!sh) sh = ss.insertSheet(CONFIG.SHEET_SAN_PHAM);
  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['Mã SP', 'Tên sản phẩm', 'Giá', 'Link giao hàng (Google Drive)']]);
  sh.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#EEF2FF');
  sh.setFrozenRows(1);

  const seed = [
    ['DEMO-SK-01', 'Skill ChatGPT Mẫu 1', 199000],
    ['DEMO-SK-02', 'Tài Liệu/Template Mẫu 2', 149000],
    ['DEMO-SK-03', 'Prompt Mẫu 3', 99000],
    ['DEMO-WF-01', 'Workflow Tự Động Mẫu 1', 299000],
    ['DEMO-WF-02', 'Workflow Tự Động Mẫu 2', 299000],
    ['DEMO-WF-03', 'Workflow Tự Động Mẫu 3', 349000],
    ['DEMO-APP-01', 'App/Công Cụ AI Mẫu 1', 399000],
    ['DEMO-APP-02', 'App/Công Cụ AI Mẫu 2', 499000],
    ['DEMO-APP-03', 'App/Công Cụ AI Mẫu 3', 299000],
    ['DEMO-KH-01', 'Khoá Học AI Mẫu 1', 599000],
    ['DEMO-KH-02', 'Khoá Học AI Mẫu 2', 799000],
    ['DEMO-KH-03', 'Khoá Học AI Mẫu 3', 999000],
    ['DEMO-YC-01', 'Gói Yêu Cầu AI Khởi Điểm', 299000],
    ['DEMO-YC-02', 'Gói Yêu Cầu AI Nâng Cao', 599000],
    ['DEMO-CG-01', 'Gói Chuyển Giao Công Nghệ Khởi Điểm', 999000],
    ['DEMO-CG-02', 'Gói Chuyển Giao Công Nghệ Nâng Cao', 1999000],
  ];
  const rows = seed.map(function (r) { return [r[0], r[1], r[2], '']; });
  sh.getRange(2, 1, rows.length, 4).setValues(rows);

  tgSend('✅ Đã tạo tab "' + CONFIG.SHEET_SAN_PHAM + '" với ' + rows.length + ' sản phẩm mẫu. Vào Sheet sửa lại đúng danh sách thật + điền cột "Link giao hàng (Google Drive)" cho từng dòng.');
}

// ══════════════ 9. Chuyển dữ liệu sản phẩm THẬT (đang nằm ở 1 tab khác trong CÙNG Sheet này) ══════════════
// sang tab SAN_PHAM đúng chuẩn 8 cột. Dùng hàm này THAY CHO setupProductCatalog() khi đã có sẵn
// danh sách sản phẩm thật (VD tab "Trang tính1") thay vì phải gõ tay lại từ đầu.
//
// Cách dùng:
// 1. Sửa biến SRC_SHEET_NAME bên dưới đúng TÊN TAB đang chứa dữ liệu sản phẩm thật.
// 2. Chạy hàm này MỘT LẦN (dropdown Apps Script editor -> chọn taoSheetSanPham -> ▷ Chạy).
// 3. Hàm tự dò cột theo TÊN TIÊU ĐỀ (không quan trọng thứ tự cột trong tab nguồn), tạo/ghi đè tab
//    "SAN_PHAM" với đúng 8 cột: Stt, Ma San Pham, Ten San Pham, Nhom San Pham, Nganh San Pham,
//    Mo Ta San Pham, Gia Ban San Pham, Link San Pham.
// 4. Đối chiếu lại: mã sản phẩm (cột "Ma San Pham") PHẢI khớp tuyệt đối với mã sản phẩm trong
//    mảng PRODUCTS ở index.html (đây là khoá duy nhất để bot tự tra link giao hàng khi /xacnhan).
function taoSheetSanPham() {
  const SRC_SHEET_NAME = 'Trang tính1'; // <-- đổi đúng tên tab đang chứa dữ liệu sản phẩm thật

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const src = ss.getSheetByName(SRC_SHEET_NAME);
  if (!src) throw new Error('Không tìm thấy tab "' + SRC_SHEET_NAME + '" — sửa lại SRC_SHEET_NAME cho đúng tên tab thật trong Sheet.');

  const V = src.getDataRange().getValues();
  if (V.length < 2) throw new Error('Tab "' + SRC_SHEET_NAME + '" chưa có dữ liệu (chỉ có dòng tiêu đề hoặc trống).');

  const header = V[0];
  function findColByHeader(keywords) {
    for (let j = 0; j < header.length; j++) {
      const h = _tgNorm(String(header[j] || ''));
      if (keywords.some(function (k) { return h.indexOf(k) >= 0; })) return j;
    }
    return -1;
  }
  const col = {
    stt:   findColByHeader(['stt']),
    ma:    findColByHeader(['ma sp', 'ma san pham']),
    ten:   findColByHeader(['ten san pham', 'ten sp']),
    nhom:  findColByHeader(['nhom']),
    nganh: findColByHeader(['nganh']),
    gia:   findColByHeader(['gia']),
    link:  findColByHeader(['link']),
    mota:  findColByHeader(['mo ta']),
  };
  if (col.ma < 0) throw new Error('Không tìm thấy cột "Mã SP" trong tab "' + SRC_SHEET_NAME + '" — kiểm tra lại dòng tiêu đề.');

  const NEW_HEADERS = ['Stt', 'Ma San Pham', 'Ten San Pham', 'Nhom San Pham', 'Nganh San Pham', 'Mo Ta San Pham', 'Gia Ban San Pham', 'Link San Pham'];
  let sh = ss.getSheetByName('SAN_PHAM');
  if (!sh) sh = ss.insertSheet('SAN_PHAM');
  sh.clear();
  sh.getRange(1, 1, 1, NEW_HEADERS.length).setValues([NEW_HEADERS]);
  sh.getRange(1, 1, 1, NEW_HEADERS.length).setFontWeight('bold').setBackground('#EEF2FF');
  sh.setFrozenRows(1);

  const rows = [];
  for (let r = 1; r < V.length; r++) {
    const row = V[r];
    const ma = String(row[col.ma] || '').trim();
    if (!ma) continue; // bỏ dòng trống
    rows.push([
      col.stt >= 0 ? row[col.stt] : rows.length + 1,
      ma,
      col.ten >= 0 ? row[col.ten] : '',
      col.nhom >= 0 ? row[col.nhom] : '',
      col.nganh >= 0 ? row[col.nganh] : '',
      col.mota >= 0 ? row[col.mota] : '',
      col.gia >= 0 ? row[col.gia] : '',
      col.link >= 0 ? row[col.link] : '',
    ]);
  }
  if (rows.length) sh.getRange(2, 1, rows.length, NEW_HEADERS.length).setValues(rows);

  const msg = 'Đã tạo tab "SAN_PHAM" với ' + rows.length + ' sản phẩm từ tab "' + SRC_SHEET_NAME + '".';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { /* getUi() lỗi nếu chạy ngoài UI Sheets, bỏ qua */ }
  Logger.log(msg);
}
