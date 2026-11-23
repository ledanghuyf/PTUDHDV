/**
 * Admin Module - Trang quản lý (#/admin) cho tài khoản Quản lý:
 * Đơn hàng (duyệt/hủy/giao), Sản phẩm (thêm/sửa/xóa), Mã giảm giá, Nội dung trang (banner, thông báo, phí ship...),
 * Tài khoản (xem người dùng, cấp/gỡ quyền quản lý). Đăng nhập dùng chung trang #/dang-nhap (auth.js).
 *
 * Lưu ý: phân quyền chỉ chặn ở giao diện, json-server không có xác thực nên API vẫn mở;
 * muốn bảo mật thật cần backend có đăng nhập + phân quyền.
 */

import * as api from './api.js';
import * as ui from './components.js';
import * as auth from './auth.js';

const POLL_MS = 10000;
const LOW_STOCK = 5;

const { escapeHtml: esc, formatPrice, ORDER_STATUS, isPendingOrder, orderCodeOf } = ui;

const SECTIONS = [
    ['orders', 'Đơn hàng'],
    ['products', 'Sản phẩm'],
    ['coupons', 'Mã giảm giá'],
    ['settings', 'Nội dung trang'],
    ['users', 'Tài khoản'],
];

const COUPON_TYPES = { percent: 'Giảm %', fixed: 'Giảm tiền', freeship: 'Miễn phí ship' };

const sortNewest = orders => [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
const canAskNotify = () => 'Notification' in window && Notification.permission === 'default';

/**
 * @param {Object} ctx - { app, toast, getSettings, applySettings, notifyCustomer, logout }
 */
export function createAdmin(ctx) {
    const { app, toast } = ctx;
    let pollTimer = null;
    let orders = [];
    let products = [];
    let coupons = [];
    let users = [];
    let orderTab = 'pending';
    let productFilter = { q: '', category: '', stock: '' };
    let section = 'orders';

    const stop = () => clearInterval(pollTimer);

    // ===================== Khung trang quản lý =====================

    function Shell(account, body) {
        const pending = orders.filter(isPendingOrder).length;
        return `
            <div class="admin-shell">
                <div class="admin-head">
                    <div>
                        <h1 class="page-title">Trang quản lý</h1>
                        <p class="admin-hello">Xin chào <strong>${esc(account.name)}</strong> · tự cập nhật đơn mới mỗi 10 giây</p>
                    </div>
                    <div class="admin-head-actions">
                        ${canAskNotify() ? '<button type="button" class="btn btn-secondary" id="admin-notify-btn">Bật thông báo trình duyệt</button>' : ''}
                        <a href="#/" class="btn btn-secondary">Xem trang web</a>
                        <button type="button" class="btn btn-secondary" id="admin-logout-btn">Đăng xuất</button>
                    </div>
                </div>
                <nav class="admin-nav" aria-label="Mục quản lý">
                    ${SECTIONS.map(([key, label]) => `<a href="#/admin/${key}" class="${key === section ? 'active' : ''}"${key === section ? ' aria-current="page"' : ''}>
                        ${label}${key === 'orders' && pending ? ` <span class="admin-count has-pending">${pending}</span>` : ''}</a>`).join('')}
                </nav>
                <div id="admin-body">${body}</div>
            </div>
        `;
    }

    function render() {
        const account = auth.currentUser();
        const pending = orders.filter(isPendingOrder).length;
        document.title = `${pending ? `(${pending}) ` : ''}Quản lý | Cosmetics Store`;
        const body = { orders: OrdersSection, products: ProductsSection, coupons: CouponsSection, settings: SettingsSection, users: UsersSection }[section]();
        app.innerHTML = `<div class="container">${Shell(account, body)}</div>`;
        if (section === 'settings') bindSettingsForm();
        if (section === 'coupons') bindCouponForm();
        if (section === 'products') bindProductFilters();
    }

    // Luôn tải đơn (để đếm đơn chờ duyệt); sản phẩm/mã giảm giá/tài khoản chỉ tải khi mở mục đó
    async function loadData() {
        const [o, p, c, u] = await Promise.all([
            api.getOrders(),
            section === 'products' ? api.getAllProducts() : products,
            section === 'coupons' ? api.getCoupons() : coupons,
            section === 'users' ? api.getUsers() : users,
        ]);
        orders = sortNewest(o);
        products = p;
        coupons = c;
        users = u;
    }

    /** Route #/admin hoặc #/admin/<mục> */
    async function view(sub) {
        stop();
        // Kiểm tra lại quyền với dữ liệu mới nhất (Quản lý khác có thể vừa gỡ quyền)
        const me = auth.currentUser();
        if (me?.role === auth.ROLES.MANAGER) {
            const fresh = await api.findUser(me.email || me.username || me.phone).catch(() => null);
            if (fresh) auth.setSession(fresh);
            else auth.clearSession();
        }
        if (!auth.isManager()) {
            // Khách hàng đã đăng nhập không có quyền; chưa đăng nhập thì mời đăng nhập rồi quay lại đây
            if (auth.currentUser()) toast('Tài khoản của bạn không có quyền quản lý.', 'error');
            window.location.hash = auth.currentUser() ? '#/' : '#/dang-nhap?next=admin';
            return null;
        }
        section = SECTIONS.some(([key]) => key === sub) ? sub : 'orders';
        await loadData();
        return () => {
            render();
            let known = new Set(orders.filter(isPendingOrder).map(o => o.id));
            pollTimer = setInterval(async () => {
                try {
                    orders = sortNewest(await api.getOrders());
                } catch (error) {
                    console.error('Không tải được đơn hàng:', error);
                    return;
                }
                const pending = orders.filter(isPendingOrder);
                const fresh = pending.filter(o => !known.has(o.id));
                known = new Set(pending.map(o => o.id));
                if (fresh.length) notifyNewOrders(fresh);
                // Không vẽ lại khi đang nhập liệu (sửa sản phẩm/nội dung) để không mất chữ đang gõ
                if (section === 'orders' || fresh.length) refreshCountsOrRender();
            }, POLL_MS);
        };
    }

    function refreshCountsOrRender() {
        if (section === 'orders') return render();
        const pending = orders.filter(isPendingOrder).length;
        document.title = `${pending ? `(${pending}) ` : ''}Quản lý | Cosmetics Store`;
        const link = app.querySelector('.admin-nav a[href="#/admin/orders"]');
        if (link) link.innerHTML = `Đơn hàng${pending ? ` <span class="admin-count has-pending">${pending}</span>` : ''}`;
    }

    function notifyNewOrders(list) {
        const message = list.length === 1
            ? `Đơn mới #${orderCodeOf(list[0])} - ${formatPrice(list[0].totalAmount)}`
            : `Có ${list.length} đơn hàng mới chờ duyệt`;
        toast(message, 'info');
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Cosmetics Store - Đơn chờ duyệt', { body: message });
        }
    }

    // ===================== Đơn hàng =====================

    const ORDER_TABS = [
        ['pending', 'Chờ duyệt', isPendingOrder],
        ['shipping', 'Đang giao', o => o.status === ORDER_STATUS.SHIPPING],
        ['done', 'Đã giao', o => o.status === ORDER_STATUS.DONE],
        ['cancelled', 'Đã hủy', o => o.status === ORDER_STATUS.CANCELLED],
        ['all', 'Tất cả', () => true],
    ];

    function OrdersSection() {
        const [, , filter] = ORDER_TABS.find(([key]) => key === orderTab) || ORDER_TABS[0];
        const shown = orders.filter(filter);
        const revenue = orders.filter(o => o.status === ORDER_STATUS.DONE).reduce((s, o) => s + (o.totalAmount || 0), 0);
        return `
            <div class="admin-stats">
                <div><span>Chờ duyệt</span><strong>${orders.filter(isPendingOrder).length}</strong></div>
                <div><span>Đang giao</span><strong>${orders.filter(o => o.status === ORDER_STATUS.SHIPPING).length}</strong></div>
                <div><span>Doanh thu đã giao</span><strong>${formatPrice(revenue)}</strong></div>
            </div>
            <div class="admin-tabs" role="tablist">
                ${ORDER_TABS.map(([key, label, f]) => {
                    const count = orders.filter(f).length;
                    return `<button type="button" role="tab" class="admin-tab${key === orderTab ? ' active' : ''}" data-tab="${key}" aria-selected="${key === orderTab}">
                        ${label} <span class="admin-count${key === 'pending' && count ? ' has-pending' : ''}">${count}</span></button>`;
                }).join('')}
            </div>
            <div class="admin-orders">
                ${shown.length ? shown.map(OrderCard).join('') : '<p class="empty-result">Không có đơn hàng nào.</p>'}
            </div>
        `;
    }

    function OrderCard(order) {
        const info = order.customerInfo || {};
        const isBank = order.paymentMethod === 'bank';
        const pending = isPendingOrder(order);
        const action = (name, label, cls = '') => `<button type="button" class="btn ${cls} admin-action" data-action="${name}" data-id="${esc(order.id)}">${label}</button>`;
        const money = [
            order.subtotal !== undefined ? `Tạm tính ${formatPrice(order.subtotal)}` : '',
            order.discount ? `Giảm ${formatPrice(order.discount)}${order.couponCode ? ` (${esc(order.couponCode)})` : ''}` : '',
            order.shippingFee ? `Ship ${formatPrice(order.shippingFee)}` : (order.subtotal !== undefined ? 'Freeship' : ''),
        ].filter(Boolean).join(' · ');

        return `
            <article class="admin-order${pending ? ' is-pending' : ''}">
                <header class="admin-order-head">
                    <strong>#${esc(orderCodeOf(order))}</strong>
                    <span class="status-badge">${esc(order.status || ORDER_STATUS.PENDING)}</span>
                    <time>${new Date(order.timestamp).toLocaleString('vi-VN')}</time>
                </header>
                <p><strong>${esc(info.name)}</strong> · ${esc(info.phone)} · ${esc(info.email)}</p>
                <p>${esc(info.address)}</p>
                ${info.note ? `<p class="admin-note">📝 ${esc(info.note)}</p>` : ''}
                <ul class="admin-items">
                    ${(order.items || []).map(i => `<li>${esc(i.name)} × ${i.quantity}<span>${formatPrice(i.price * i.quantity)}</span></li>`).join('')}
                </ul>
                ${money ? `<p class="admin-money">${money}</p>` : ''}
                <p class="admin-total">Tổng: <strong>${formatPrice(order.totalAmount)}</strong> ·
                    ${ui.PAYMENT_METHODS[order.paymentMethod] || ui.PAYMENT_METHODS.cod} · ${esc(order.paymentStatus || 'Chưa thanh toán')}</p>
                ${pending && isBank ? `<p class="admin-warn">Kiểm tra tài khoản đã nhận <strong>${formatPrice(order.totalAmount)}</strong>
                    với nội dung <strong>${esc(ui.transferContent(orderCodeOf(order)))}</strong> trước khi duyệt.</p>` : ''}
                <div class="admin-actions">
                    ${pending ? action('approve', 'Duyệt đơn & trừ kho') + action('cancel', 'Từ chối', 'btn-secondary') : ''}
                    ${order.status === ORDER_STATUS.SHIPPING ? action('deliver', 'Đã giao hàng') : ''}
                </div>
            </article>
        `;
    }

    /** Cộng/trừ tồn kho theo đơn (sign = -1: trừ kho khi duyệt đơn, +1: hoàn kho khi hủy đơn đã trừ kho) */
    async function applyStock(order, sign) {
        const latest = await Promise.all(order.items.map(i => api.getProductById(i.id)));
        if (sign < 0) {
            const k = order.items.findIndex((item, idx) => latest[idx].stock < item.quantity);
            if (k !== -1) throw new Error(`"${order.items[k].name}" chỉ còn ${latest[k].stock} trong kho, không đủ để duyệt đơn.`);
        }
        await Promise.all(order.items.map((item, idx) => api.updateProduct(item.id, {
            stock: latest[idx].stock + sign * item.quantity,
            soldCount: Math.max(0, (latest[idx].soldCount || 0) - sign * item.quantity),
        })));
    }

    const ORDER_ACTIONS = {
        async approve(order) {
            // Chỉ trừ kho khi đơn chưa trừ (stockApplied === false)
            if (order.stockApplied === false) await applyStock(order, -1);
            const updated = await api.updateOrder(order.id, {
                status: ORDER_STATUS.SHIPPING,
                stockApplied: true,
                approvedAt: new Date().toISOString(),
                // Chuyển khoản: Quản lý đã đối soát tiền trước khi duyệt
                ...(order.paymentMethod === 'bank' ? { paymentStatus: 'Đã thanh toán' } : {}),
            });
            ctx.notifyCustomer(updated); // báo khách đơn đang giao (lỗi email không chặn thao tác)
            return `Đã duyệt đơn #${orderCodeOf(order)}, chuyển sang giao hàng.`;
        },
        async cancel(order) {
            if (!confirm(`Từ chối và hủy đơn #${orderCodeOf(order)}?`)) return null;
            if (order.stockApplied !== false) await applyStock(order, +1); // đơn đã trừ kho thì hoàn lại kho
            const updated = await api.updateOrder(order.id, { status: ORDER_STATUS.CANCELLED, stockApplied: false, cancelledAt: new Date().toISOString() });
            ctx.notifyCustomer(updated);
            return `Đã hủy đơn #${orderCodeOf(order)}.`;
        },
        async deliver(order) {
            await api.updateOrder(order.id, { status: ORDER_STATUS.DONE, paymentStatus: 'Đã thanh toán', deliveredAt: new Date().toISOString() });
            return `Đơn #${orderCodeOf(order)} đã giao thành công.`;
        },
    };

    async function runOrderAction(button) {
        app.querySelectorAll('.admin-action').forEach(b => { b.disabled = true; });
        try {
            // Lấy bản mới nhất của đơn để không duyệt/hủy trùng khi 2 tab cùng thao tác
            const order = await api.getOrderById(button.dataset.id);
            const allowed = button.dataset.action === 'deliver' ? order.status === ORDER_STATUS.SHIPPING : isPendingOrder(order);
            if (!allowed) throw new Error('Đơn đã được xử lý ở nơi khác, danh sách sẽ được tải lại.');
            const message = await ORDER_ACTIONS[button.dataset.action](order);
            if (message) toast(message);
        } catch (error) {
            console.error(error);
            toast(error.message, 'error');
        }
        orders = sortNewest(await api.getOrders().catch(() => orders));
        render();
    }

    // ===================== Sản phẩm =====================

    function filteredProducts() {
        const q = productFilter.q.toLowerCase();
        return products.filter(p =>
            (!q || `${p.name} ${p.brand}`.toLowerCase().includes(q)) &&
            (!productFilter.category || p.category === productFilter.category) &&
            (!productFilter.stock || (productFilter.stock === 'low' ? p.stock > 0 && p.stock <= LOW_STOCK : p.stock <= 0)));
    }

    function ProductsSection() {
        const low = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK).length;
        const out = products.filter(p => p.stock <= 0).length;
        return `
            <div class="admin-stats">
                <div><span>Sản phẩm</span><strong>${products.length}</strong></div>
                <div><span>Sắp hết (≤${LOW_STOCK})</span><strong>${low}</strong></div>
                <div><span>Hết hàng</span><strong>${out}</strong></div>
            </div>
            <div class="admin-toolbar">
                <input type="search" id="ap-search" placeholder="Tìm tên hoặc thương hiệu..." value="${esc(productFilter.q)}" aria-label="Tìm sản phẩm">
                <select id="ap-category" aria-label="Lọc danh mục">
                    <option value="">Tất cả danh mục</option>
                    ${ui.CATEGORIES.map(c => `<option value="${c.id}" ${c.id === productFilter.category ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
                <select id="ap-stock" aria-label="Lọc tồn kho">
                    <option value="">Mọi tồn kho</option>
                    <option value="low" ${productFilter.stock === 'low' ? 'selected' : ''}>Sắp hết hàng</option>
                    <option value="out" ${productFilter.stock === 'out' ? 'selected' : ''}>Hết hàng</option>
                </select>
                <button type="button" class="btn" data-product-edit="">+ Thêm sản phẩm</button>
            </div>
            <div id="ap-table">${ProductTable()}</div>
            <dialog class="admin-dialog" id="product-dialog"></dialog>
        `;
    }

    function ProductTable() {
        const list = filteredProducts();
        if (!list.length) return '<p class="empty-result">Không có sản phẩm phù hợp.</p>';
        return `
            <div class="table-wrap">
                <table class="admin-table">
                    <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Đã bán</th><th></th></tr></thead>
                    <tbody>
                        ${list.map(p => `
                            <tr>
                                <td class="ap-product"><img src="${esc(p.image)}" alt="" loading="lazy"><div><strong>${esc(p.name)}</strong><span>${esc(p.brand)}</span></div></td>
                                <td>${esc(ui.CATEGORY_NAMES[p.category] || p.category)}</td>
                                <td>${formatPrice(p.price)}${p.originalPrice > p.price ? `<br><s>${formatPrice(p.originalPrice)}</s>` : ''}</td>
                                <td class="${p.stock <= 0 ? 'stock-out' : p.stock <= LOW_STOCK ? 'stock-low' : ''}">${p.stock}</td>
                                <td>${p.soldCount || 0}</td>
                                <td class="ap-actions">
                                    <button type="button" class="btn btn-secondary" data-product-edit="${esc(p.id)}">Sửa</button>
                                    <button type="button" class="link-btn danger" data-product-delete="${esc(p.id)}">Xóa</button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function bindProductFilters() {
        const refresh = () => { app.querySelector('#ap-table').innerHTML = ProductTable(); };
        app.querySelector('#ap-search').addEventListener('input', e => { productFilter.q = e.target.value.trim(); refresh(); });
        app.querySelector('#ap-category').addEventListener('change', e => { productFilter.category = e.target.value; refresh(); });
        app.querySelector('#ap-stock').addEventListener('change', e => { productFilter.stock = e.target.value; refresh(); });
    }

    function ProductForm(p) {
        const field = (name, label, input) => `<div class="form-group"><label for="pf-${name}">${label}</label>${input}</div>`;
        return `
            <form method="dialog" id="product-form" class="admin-form">
                <h2>${p.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                ${field('name', 'Tên sản phẩm *', `<input id="pf-name" name="name" required maxlength="200" value="${esc(p.name)}">`)}
                <div class="form-row">
                    ${field('brand', 'Thương hiệu *', `<input id="pf-brand" name="brand" required maxlength="60" value="${esc(p.brand)}">`)}
                    ${field('category', 'Danh mục *', `<select id="pf-category" name="category" required>
                        ${ui.CATEGORIES.map(c => `<option value="${c.id}" ${c.id === p.category ? 'selected' : ''}>${c.name}</option>`).join('')}</select>`)}
                </div>
                <div class="form-row three">
                    ${field('price', 'Giá bán (₫) *', `<input id="pf-price" name="price" type="number" required min="1000" step="1000" value="${p.price ?? ''}">`)}
                    ${field('originalPrice', 'Giá gốc (₫)', `<input id="pf-originalPrice" name="originalPrice" type="number" min="0" step="1000" value="${p.originalPrice ?? ''}" placeholder="Để trống nếu không giảm">`)}
                    ${field('stock', 'Tồn kho *', `<input id="pf-stock" name="stock" type="number" required min="0" step="1" value="${p.stock ?? 0}">`)}
                </div>
                <div class="pf-image-row">
                    ${field('image', 'Ảnh (đường dẫn hoặc URL) *', `<input id="pf-image" name="image" required maxlength="500" value="${esc(p.image)}" placeholder="assets/images/product-1.jpg">`)}
                    <img id="pf-preview" src="${esc(p.image)}" alt="Xem trước ảnh">
                </div>
                ${field('description_short', 'Mô tả ngắn', `<textarea id="pf-description_short" name="description_short" rows="2" maxlength="400">${esc(p.description_short)}</textarea>`)}
                ${field('description_long', 'Mô tả chi tiết <small>(cho phép thẻ &lt;h3&gt; &lt;p&gt; &lt;ul&gt; &lt;li&gt; &lt;strong&gt;)</small>',
                    `<textarea id="pf-description_long" name="description_long" rows="8">${esc(p.description_long)}</textarea>`)}
                <label class="pf-check"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> Gắn nhãn "Nổi bật" (hiện ở mục Sản phẩm nổi bật)</label>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="pf-cancel">Hủy</button>
                    <button type="submit" class="btn" value="save">Lưu sản phẩm</button>
                </div>
            </form>
        `;
    }

    function openProductDialog(id) {
        const dialog = app.querySelector('#product-dialog');
        const product = id ? products.find(p => String(p.id) === id) : { category: ui.CATEGORIES[0].id, stock: 0 };
        dialog.innerHTML = ProductForm(product);
        const form = dialog.querySelector('#product-form');
        form.querySelector('#pf-image').addEventListener('input', e => { dialog.querySelector('#pf-preview').src = e.target.value; });
        form.querySelector('#pf-cancel').addEventListener('click', () => dialog.close());
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = new FormData(form);
            const num = k => (f.get(k) === '' ? null : Number(f.get(k)));
            const data = {
                name: f.get('name').trim(),
                brand: f.get('brand').trim(),
                category: f.get('category'),
                price: num('price'),
                originalPrice: num('originalPrice'),
                stock: num('stock'),
                image: f.get('image').trim(),
                description_short: f.get('description_short').trim(),
                description_long: f.get('description_long').trim(),
                featured: f.get('featured') === 'on',
            };
            if (!data.name || !data.brand || !data.image) return toast('Vui lòng điền tên, thương hiệu và ảnh.', 'error');
            if (data.originalPrice !== null && data.originalPrice <= data.price) data.originalPrice = null; // giá gốc phải cao hơn giá bán
            const saveBtn = form.querySelector('button[type="submit"]');
            saveBtn.disabled = true;
            try {
                if (product.id) await api.updateProduct(product.id, data);
                else await api.createProduct({ ...data, soldCount: 0 });
                toast(product.id ? 'Đã lưu sản phẩm.' : 'Đã thêm sản phẩm mới.');
                dialog.close();
                products = await api.getAllProducts();
                render();
            } catch (error) {
                toast(error.message, 'error');
                saveBtn.disabled = false;
            }
        });
        dialog.showModal();
    }

    async function deleteProduct(id) {
        const product = products.find(p => String(p.id) === id);
        if (!product || !confirm(`Xóa sản phẩm "${product.name}"? Thao tác này không hoàn tác được.`)) return;
        try {
            await api.deleteProduct(id);
            toast('Đã xóa sản phẩm.');
            products = await api.getAllProducts();
            render();
        } catch (error) {
            toast(error.message, 'error');
        }
    }

    // ===================== Mã giảm giá =====================

    function couponText(c) {
        if (c.type === 'percent') return `-${c.value}%${c.maxDiscount ? ` (tối đa ${formatPrice(c.maxDiscount)})` : ''}`;
        if (c.type === 'fixed') return `-${formatPrice(c.value)}`;
        return 'Miễn phí ship';
    }

    function CouponsSection() {
        return `
            <form id="coupon-form" class="admin-form admin-card">
                <h2>Tạo mã giảm giá</h2>
                <div class="form-row three">
                    <div class="form-group"><label for="cf-code">Mã *</label>
                        <input id="cf-code" name="code" required maxlength="20" pattern="[A-Za-z0-9]{3,20}" placeholder="VD: SALE20"
                               data-pattern-message="Mã gồm 3–20 chữ cái/số, không dấu, không khoảng trắng."></div>
                    <div class="form-group"><label for="cf-type">Loại *</label>
                        <select id="cf-type" name="type">${Object.entries(COUPON_TYPES).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
                    <div class="form-group"><label for="cf-value">Giá trị (% hoặc ₫)</label>
                        <input id="cf-value" name="value" type="number" min="0" step="1" placeholder="VD: 20 hoặc 50000"></div>
                </div>
                <div class="form-row three">
                    <div class="form-group"><label for="cf-max">Giảm tối đa (₫, cho loại %)</label><input id="cf-max" name="maxDiscount" type="number" min="0" step="1000"></div>
                    <div class="form-group"><label for="cf-min">Đơn tối thiểu (₫)</label><input id="cf-min" name="minOrder" type="number" min="0" step="1000" value="0"></div>
                    <div class="form-group"><label for="cf-exp">Hết hạn (không bắt buộc)</label><input id="cf-exp" name="expiresAt" type="date"></div>
                </div>
                <div class="form-group"><label for="cf-desc">Mô tả hiển thị cho khách</label><input id="cf-desc" name="description" maxlength="120" placeholder="Để trống sẽ tự tạo"></div>
                <button type="submit" class="btn">Tạo mã</button>
            </form>
            <div class="table-wrap">
                <table class="admin-table">
                    <thead><tr><th>Mã</th><th>Ưu đãi</th><th>Đơn tối thiểu</th><th>Hết hạn</th><th>Trạng thái</th><th></th></tr></thead>
                    <tbody>
                        ${coupons.map(c => `
                            <tr>
                                <td><strong>${esc(c.code)}</strong><br><small>${esc(c.description)}</small></td>
                                <td>${couponText(c)}</td>
                                <td>${c.minOrder ? formatPrice(c.minOrder) : '—'}</td>
                                <td>${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : 'Không'}</td>
                                <td><button type="button" class="status-toggle${c.active ? ' on' : ''}" data-coupon-toggle="${esc(c.id)}" aria-pressed="${!!c.active}">
                                    ${c.active ? 'Đang bật' : 'Đã tắt'}</button></td>
                                <td><button type="button" class="link-btn danger" data-coupon-delete="${esc(c.id)}">Xóa</button></td>
                            </tr>`).join('') || '<tr><td colspan="6">Chưa có mã giảm giá.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    function bindCouponForm() {
        const form = app.querySelector('#coupon-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = new FormData(form);
            const num = k => Number(f.get(k)) || 0;
            const code = f.get('code').trim().toUpperCase();
            const type = f.get('type');
            if (coupons.some(c => c.code === code)) return toast(`Mã ${code} đã tồn tại.`, 'error');
            if (type !== 'freeship' && num('value') <= 0) return toast('Vui lòng nhập giá trị giảm.', 'error');
            if (type === 'percent' && num('value') > 100) return toast('Giảm theo % tối đa 100.', 'error');
            const coupon = {
                code, type,
                value: type === 'freeship' ? 0 : num('value'),
                maxDiscount: type === 'percent' ? num('maxDiscount') || null : null,
                minOrder: num('minOrder'),
                expiresAt: f.get('expiresAt') ? `${f.get('expiresAt')}T23:59:59` : null,
                active: true,
            };
            coupon.description = f.get('description').trim() || `${couponText(coupon)}${coupon.minOrder ? ` cho đơn từ ${formatPrice(coupon.minOrder)}` : ''}`;
            try {
                await api.createCoupon(coupon);
                toast(`Đã tạo mã ${code}.`);
                coupons = await api.getCoupons();
                render();
            } catch (error) {
                toast(error.message, 'error');
            }
        });
    }

    async function couponAction(id, kind) {
        const coupon = coupons.find(c => String(c.id) === id);
        if (!coupon) return;
        try {
            if (kind === 'toggle') await api.updateCoupon(id, { active: !coupon.active });
            else if (confirm(`Xóa mã ${coupon.code}?`)) await api.deleteCoupon(id);
            else return;
            coupons = await api.getCoupons();
            render();
        } catch (error) {
            toast(error.message, 'error');
        }
    }

    // ===================== Nội dung trang =====================

    function SettingsSection() {
        const s = ctx.getSettings();
        const input = (name, label, attrs = '') => `<div class="form-group"><label for="sf-${name}">${label}</label>
            <input id="sf-${name}" name="${name}" value="${esc(s[name])}" ${attrs}></div>`;
        return `
            <form id="settings-form" class="admin-form admin-card">
                <h2>Thanh thông báo & banner trang chủ</h2>
                ${input('announcement', 'Thanh thông báo đầu trang (để trống để ẩn)', 'maxlength="160"')}
                <div class="form-row">
                    ${input('heroEyebrow', 'Dòng nhỏ trên tiêu đề', 'maxlength="60"')}
                    ${input('heroTitle', 'Tiêu đề banner', 'required maxlength="60"')}
                </div>
                <div class="form-group"><label for="sf-heroRotating">Cụm từ đổi luân phiên sau chữ "cho" (mỗi dòng một cụm)</label>
                    <textarea id="sf-heroRotating" name="heroRotating" rows="4">${esc((s.heroRotating || []).join('\n'))}</textarea></div>
                <div class="form-group"><label for="sf-heroSubtitle">Mô tả dưới tiêu đề</label>
                    <textarea id="sf-heroSubtitle" name="heroSubtitle" rows="3" maxlength="300">${esc(s.heroSubtitle)}</textarea></div>

                <h2>Vận chuyển & liên hệ</h2>
                <div class="form-row">
                    ${input('shippingFee', 'Phí vận chuyển (₫)', 'type="number" min="0" step="1000" required')}
                    ${input('freeShipThreshold', 'Miễn phí ship cho đơn từ (₫, 0 = không áp dụng)', 'type="number" min="0" step="1000" required')}
                </div>
                <div class="form-row">
                    ${input('hotline', 'Hotline', 'maxlength="30"')}
                    ${input('contactEmail', 'Email liên hệ', 'type="email" maxlength="100"')}
                </div>
                <div class="form-actions">
                    <a href="#/" class="btn btn-secondary">Xem trang chủ</a>
                    <button type="submit" class="btn">Lưu nội dung</button>
                </div>
            </form>
        `;
    }

    function bindSettingsForm() {
        const form = app.querySelector('#settings-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = new FormData(form);
            const data = {
                announcement: f.get('announcement').trim(),
                heroEyebrow: f.get('heroEyebrow').trim(),
                heroTitle: f.get('heroTitle').trim(),
                heroRotating: f.get('heroRotating').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8),
                heroSubtitle: f.get('heroSubtitle').trim(),
                shippingFee: Number(f.get('shippingFee')) || 0,
                freeShipThreshold: Number(f.get('freeShipThreshold')) || 0,
                hotline: f.get('hotline').trim(),
                contactEmail: f.get('contactEmail').trim(),
            };
            try {
                ctx.applySettings(await api.updateSettings(data));
                toast('Đã lưu nội dung trang. Khách sẽ thấy ngay khi tải trang.');
            } catch (error) {
                toast(error.message, 'error');
            }
        });
    }

    // ===================== Tài khoản =====================

    function UsersSection() {
        const me = auth.currentUser();
        const orderCount = id => orders.filter(o => o.userId === id).length;
        const managers = users.filter(u => u.role === auth.ROLES.MANAGER).length;
        return `
            <div class="admin-stats">
                <div><span>Tài khoản</span><strong>${users.length}</strong></div>
                <div><span>Khách hàng</span><strong>${users.length - managers}</strong></div>
                <div><span>Quản lý</span><strong>${managers}</strong></div>
            </div>
            <div class="table-wrap">
                <table class="admin-table">
                    <thead><tr><th>Họ tên</th><th>Liên hệ</th><th>Vai trò</th><th>Ngày tạo</th><th>Đơn hàng</th><th></th></tr></thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td><strong>${esc(u.name)}</strong>${u.username ? `<br><small>@${esc(u.username)}</small>` : ''}</td>
                                <td>${esc(u.email)}${u.phone ? `<br><small>${esc(u.phone)}</small>` : ''}</td>
                                <td><span class="status-badge">${auth.ROLE_NAMES[u.role] || esc(u.role)}</span></td>
                                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                                <td>${orderCount(u.id)}</td>
                                <td>${u.id === me.id ? '<small>(bạn)</small>' : `<button type="button" class="btn btn-secondary" data-user-role="${esc(u.id)}">
                                    ${u.role === auth.ROLES.MANAGER ? 'Gỡ quyền quản lý' : 'Cấp quyền quản lý'}</button>`}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <p class="admin-note-text">Khách tự đăng ký tại trang Đăng ký. Quyền quản lý chỉ do Quản lý cấp tại đây; không thể tự gỡ quyền của chính mình.</p>
        `;
    }

    async function toggleManager(id) {
        const user = users.find(u => String(u.id) === id);
        if (!user || user.id === auth.currentUser().id) return;
        const toManager = user.role !== auth.ROLES.MANAGER;
        if (!confirm(`${toManager ? 'Cấp' : 'Gỡ'} quyền quản lý cho "${user.name}"?`)) return;
        try {
            await api.updateUser(user.id, { role: toManager ? auth.ROLES.MANAGER : auth.ROLES.CUSTOMER });
            toast(`Đã ${toManager ? 'cấp' : 'gỡ'} quyền quản lý cho ${user.name}.`);
            users = await api.getUsers();
            render();
        } catch (error) {
            toast(error.message, 'error');
        }
    }

    // ===================== Sự kiện chung =====================

    async function handleClick(e) {
        const target = e.target.closest('button');
        if (!target) return;
        const d = target.dataset;
        if (d.tab) { orderTab = d.tab; render(); }
        else if (target.id === 'admin-logout-btn') {
            stop();
            ctx.logout();
        } else if (target.id === 'admin-notify-btn') { await Notification.requestPermission(); render(); }
        else if (d.action) await runOrderAction(target);
        else if (d.productEdit !== undefined) openProductDialog(d.productEdit);
        else if (d.productDelete) await deleteProduct(d.productDelete);
        else if (d.couponToggle) await couponAction(d.couponToggle, 'toggle');
        else if (d.couponDelete) await couponAction(d.couponDelete, 'delete');
        else if (d.userRole) await toggleManager(d.userRole);
    }

    return { view, stop, handleClick };
}
