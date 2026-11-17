/**
 * Gửi email xác nhận đơn hàng bằng Gmail của cửa hàng (Google Apps Script, miễn phí).
 * Cách triển khai: xem setup/email-script/README.md
 *
 * Web gửi POST (JSON) tới URL Web app này sau khi tạo đơn; script gửi email cho khách
 * và gửi bản sao (BCC) về Gmail của cửa hàng để biết có đơn mới.
 * Giới hạn Gmail thường: 100 người nhận/ngày (mỗi đơn dùng 2 nếu bật NOTIFY_SHOP).
 */

const NOTIFY_SHOP = true;         // true = gửi bản sao mỗi đơn về Gmail cửa hàng
const MAX_PER_EMAIL_PER_HOUR = 5; // chống lạm dụng: tối đa số email/giờ cho một địa chỉ nhận

function doPost(e) {
    try {
        const d = JSON.parse(e.postData.contents);
        const error = validate(d);
        if (error) return reply({ ok: false, error });

        // URL Web app là công khai → giới hạn số email gửi tới cùng một địa chỉ
        const cache = CacheService.getScriptCache();
        const key = 'n:' + d.to_email.toLowerCase();
        const sent = Number(cache.get(key) || 0);
        if (sent >= MAX_PER_EMAIL_PER_HOUR) return reply({ ok: false, error: 'Gửi quá nhiều email tới địa chỉ này, thử lại sau.' });

        const options = { to: d.to_email, subject: `Xác nhận đơn hàng #${d.order_id} - ${d.shop_name}`, htmlBody: buildHtml(d), name: d.shop_name };
        if (NOTIFY_SHOP) options.bcc = Session.getEffectiveUser().getEmail();
        MailApp.sendEmail(options);

        cache.put(key, String(sent + 1), 3600);
        return reply({ ok: true });
    } catch (err) {
        return reply({ ok: false, error: String(err && err.message || err) });
    }
}

// Mở URL bằng trình duyệt để kiểm tra script đã chạy
function doGet() {
    return reply({ ok: true, message: 'Email script đang hoạt động', remainingToday: MailApp.getRemainingDailyQuota() });
}

function validate(d) {
    if (!d || typeof d !== 'object') return 'Dữ liệu không hợp lệ';
    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(String(d.to_email || ''))) return 'Email người nhận không hợp lệ';
    if (!d.order_id || !Array.isArray(d.items) || d.items.length === 0 || d.items.length > 50) return 'Thiếu thông tin đơn hàng';
    if (JSON.stringify(d).length > 20000) return 'Dữ liệu quá lớn';
    return '';
}

// Mọi giá trị đều do trình duyệt gửi lên → escape trước khi chèn vào HTML
function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildHtml(d) {
    const rows = d.items.map(i => `
        <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f6d9e5">${esc(i.name)} <span style="color:#7d5f6d">× ${esc(i.quantity)}</span></td>
            <td style="padding:8px 0;border-bottom:1px solid #f6d9e5;text-align:right;white-space:nowrap">${esc(i.total)}</td>
        </tr>`).join('');

    return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#3a1d2c">
        <h2 style="color:#c92f6f;margin-bottom:4px">${esc(d.shop_name)}</h2>
        <p>Chào <strong>${esc(d.to_name)}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng lúc ${esc(d.order_date)}. Mã đơn của bạn: <strong>#${esc(d.order_id)}</strong></p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
            <tr><td style="padding:10px 0"><strong>Tổng cộng</strong></td>
                <td style="padding:10px 0;text-align:right;color:#c92f6f"><strong>${esc(d.order_total)}</strong></td></tr>
        </table>
        <p><strong>Thanh toán:</strong> ${esc(d.payment_method)}<br>${esc(d.payment_instructions)}</p>
        <p><strong>Giao tới:</strong> ${esc(d.shipping_address)}<br><strong>SĐT:</strong> ${esc(d.phone)}</p>
        <p style="color:#7d5f6d;font-size:12px">Email được gửi tự động, vui lòng không trả lời nếu không cần hỗ trợ.</p>
    </div>`;
}

function reply(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
