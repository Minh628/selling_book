document.addEventListener("DOMContentLoaded", () => {
    const orderTable = document.querySelector(".order_table");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");
    const filterForm = document.getElementById("filterForm");
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".admin_sidebar");
    const overlay = document.createElement("div");

    let orders = JSON.parse(localStorage.getItem("Orders")) || [];
    overlay.classList.add("sidebar-overlay");
    document.body.appendChild(overlay);

    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });
    // ======= HIỂN THỊ BẢNG =======
    function renderTable(data) {
        if (!data.length) {
            orderTable.innerHTML = `<p style="text-align:center; color:#888;">Không tìm thấy đơn hàng nào</p>`;
            return;
        }

        orderTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Ngày đặt</th>
            <th>Tổng tiền</th>
            <th>Địa chỉ giao hàng</th>
            <th>Phương thức thanh toán</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          ${data
                .map(
                    (o) => `
            <tr>
              <td>${o.id}</td>
              <td>${o.username || "Không rõ"}</td>
              <td>${o.date}</td>
              <td>${o.total.toLocaleString("vi-VN")}đ</td>
              <td>${o.address || "Chưa có"}</td>
              <td>${translatePayment(o.paymentMethod)}</td>
              <td>${translateStatus(o.status)}</td>
              <td><button class="btn btn-detail" onclick="viewDetail('${o.id
                        }')">Chi tiết</button></td>
            </tr>
          `
                )
                .join("")}
        </tbody>
      </table>
    `;
    }

    // ======= HÀM DỊCH TRẠNG THÁI =======
    function translateStatus(status) {
        switch (status) {
            case "new":
                return "Mới";
            case "processing":
                return "Đang xử lý";
            case "shipping":
                return "Đang giao";
            case "delivered":
                return "Đã giao";
            case "cancelled":
                return "Đã hủy";
            default:
                return status;
        }
    }

    // ======= HÀM DỊCH PHƯƠNG THỨC THANH TOÁN =======
    function translatePayment(method) {
        switch (method) {
            case "visa":
                return "Thẻ Visa";
            case "cod":
                return "Thanh toán khi nhận hàng";
            default:
                return method || "Không xác định";
        }
    }

    // ======= BỘ LỌC (SỬA LỖI LỌC NGÀY) =======
    filterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const keyword = searchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;
        const start = fromDate.value ? new Date(fromDate.value) : null;
        const end = toDate.value ? new Date(toDate.value) : null;

        if (end) {
            end.setHours(23, 59, 59, 999);
        }

        const filtered = orders.filter((o) => {
            const matchKeyword =
                o.id.toLowerCase().includes(keyword) ||
                (o.username || "").toLowerCase().includes(keyword);
            const matchStatus =
                selectedStatus === "all" || o.status === selectedStatus;

            // --- SỬA LỖI LỌC NGÀY (Fix crash "không hiển thị") ---
            // 1. Kiểm tra nếu đơn hàng không có ngày
            if (!o.date || !o.date.includes("/")) return false;

            // 2. Kiểm tra nếu ngày bị lỗi (không phải dd/mm/yyyy)
            const dateParts = o.date.split("/");
            if (dateParts.length !== 3) return false;

            const [day, month, year] = dateParts.map(Number);
            if (isNaN(day) || isNaN(month) || isNaN(year)) return false; // Nếu ngày lỗi -> ẩn
            // --- KẾT THÚC SỬA LỖI ---

            const orderDate = new Date(year, month - 1, day);
            orderDate.setHours(12, 0, 0, 0);

            const matchDate =
                (!start || orderDate >= start) &&
                (!end || orderDate <= new Date(end.getTime() + 86400000 - 1));

            return matchKeyword && matchStatus && matchDate;
        });
        renderTable(filtered);
    });

    // ======= XEM & CẬP NHẬT ĐƠN =======
    window.viewDetail = (id) => {
        const order = orders.find((o) => o.id === id);
        if (!order) return alert("Không tìm thấy đơn hàng!");

        const popup = document.createElement("div");
        popup.className = "popup";
        popup.innerHTML = `
      <div class="popup-content">
        <h2>Chi tiết đơn #${order.id}</h2>
        <p><b>Khách hàng:</b> ${order.username || "Không xác định"}</p>
        <p><b>Ngày đặt:</b> ${order.date}</p>
        <p><b>Địa chỉ:</b> ${order.address || "Chưa có"}</p>
        <p><b>Phương thức thanh toán:</b> ${translatePayment(
            order.paymentMethod
        )}</p>
        <p><b>Tổng tiền:</b> ${order.total.toLocaleString("vi-VN")}đ</p>

        <h3>🛒 Sản phẩm</h3>
        <ul style="max-height:150px; overflow-y:auto;">
          ${order.items
                .map(
                    (i) => `
            <li>${i.name}, SL: ${i.qty}, Thể Loại: ${i.category
                        }, Giá: ${i.price.toLocaleString(
                            "vi-VN"
                        )}đ</li>
          `
                )
                .join("")}
        </ul>

        <p><b>Trạng thái hiện tại:</b> ${translateStatus(order.status)}</p>
        <label for="statusSelect"><b>Cập nhật trạng thái:</b></label>
        <select id="statusSelect">
          <option value="new">Mới</option>
          <option value="processing">Đang xử lý</option>
          <option value="shipping">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <div class="popup-buttons">
          <button class="btn btn-update" id="saveStatus">Cập nhật</button>  
          <button class="btn btn-secondary" id="closePopup">Đóng</button>
        </div>
      </div>
    `;

        document.body.appendChild(popup);
        popup.style.display = "flex";
        popup.querySelector("#statusSelect").value = order.status;

        popup
            .querySelector("#closePopup")
            .addEventListener("click", () => popup.remove());

        // === SỬA LỖI: LOGIC CẬP NHẬT (TRẢ HÀNG VỀ KHO 'books') ===
        popup.querySelector("#saveStatus").addEventListener("click", () => {
            const newStatus = popup.querySelector("#statusSelect").value;
            const oldStatus = order.status; // Lấy trạng thái CŨ

            // --- BƯỚC 1: CẬP NHẬT KHO 'books' (Hệ thống kho Phân bổ) ---
            // Chỉ chạy khi có thay đổi trạng thái hủy
            if (newStatus === "cancelled" && oldStatus !== "cancelled") {
                // Trường hợp: Đơn hàng BỊ HỦY (ví dụ: new -> cancelled)
                // -> Trả hàng về localStorage.books
                let books = JSON.parse(localStorage.getItem("books")) || [];
                let itemsReturned = false;

                order.items.forEach((item) => {
                    const bookIndex = books.findIndex(
                        (b) =>
                            b.title.toLowerCase().trim() ===
                            item.name.toLowerCase().trim()
                    );
                    if (bookIndex !== -1) {
                        books[bookIndex].quantity =
                            (books[bookIndex].quantity || 0) + (item.qty || 0);
                        itemsReturned = true;
                    }
                });

                if (itemsReturned) {
                    localStorage.setItem("books", JSON.stringify(books));
                    console.log("Đã trả hàng về kho 'books' do hủy đơn.");
                }
            } else if (newStatus !== "cancelled" && oldStatus === "cancelled") {
                // Trường hợp: Đơn hàng ĐƯỢC PHỤC HỒI từ "Đã hủy" (ví dụ: cancelled -> processing)
                // -> Trừ hàng khỏi localStorage.books một lần nữa
                let books = JSON.parse(localStorage.getItem("books")) || [];
                let itemsSubtracted = true; // Giả định là thành công

                for (const item of order.items) {
                    const bookIndex = books.findIndex(
                        (b) =>
                            b.title.toLowerCase().trim() ===
                            item.name.toLowerCase().trim()
                    );

                    if (bookIndex !== -1) {
                        // Kiểm tra xem có đủ hàng để trừ không
                        if (books[bookIndex].quantity >= item.qty) {
                            books[bookIndex].quantity -= item.qty;
                        } else {
                            // Nếu không đủ hàng, cảnh báo và không cho phục hồi
                            alert(
                                `Không thể phục hồi đơn: Sản phẩm "${item.name}" không đủ tồn kho (còn ${books[bookIndex].quantity}, cần ${item.qty}).`
                            );
                            itemsSubtracted = false;
                            break; // Dừng vòng lặp
                        }
                    } else {
                        // Nếu sách không còn tồn tại
                        alert(
                            `Không thể phục hồi đơn: Sản phẩm "${item.name}" không còn tồn tại trong kho.`
                        );
                        itemsSubtracted = false;
                        break; // Dừng vòng lặp
                    }
                }

                // Chỉ lưu nếu tất cả các mặt hàng được trừ thành công
                if (itemsSubtracted) {
                    localStorage.setItem("books", JSON.stringify(books));
                    console.log("Đã trừ hàng khỏi kho 'books' do phục hồi đơn.");
                } else {
                    // Nếu có lỗi (do alert ở trên), dừng toàn bộ hàm
                    return;
                }
            }
            // --- KẾT THÚC BƯỚC 1 ---

            // --- BƯỚC 2: CẬP NHẬT DANH SÁCH 'Orders' (Hệ thống kho Động) ---
            order.status = newStatus;
            localStorage.setItem("Orders", JSON.stringify(orders));

            // --- BƯỚC 3: CẬP NHẬT 'users.orderData' (Đồng bộ cho User) ---
            let users = JSON.parse(localStorage.getItem("users")) || [];
            users.forEach((user) => {
                if (user.orderData && Array.isArray(user.orderData)) {
                    const userOrder = user.orderData.find((o) => o.id === order.id);
                    if (userOrder) {
                        userOrder.status = newStatus; // Lưu trạng thái gốc (tiếng Anh)
                    }
                }
            });
            localStorage.setItem("users", JSON.stringify(users));

            // --- BƯỚC 4: CẬP NHẬT 'currentUser' (Nếu user đang đăng nhập) ---
            let currentUser = JSON.parse(localStorage.getItem("currentUser"));
            if (currentUser && currentUser.username === order.username) {
                if (currentUser.orderData && Array.isArray(currentUser.orderData)) {
                    const userOrderInCurrentUser = currentUser.orderData.find(
                        (o) => o.id === order.id
                    );
                    if (userOrderInCurrentUser) {
                        userOrderInCurrentUser.status = newStatus;
                        localStorage.setItem("currentUser", JSON.stringify(currentUser));
                    }
                }
            }

            // --- BƯỚC 5: THÔNG BÁO VÀ RENDER LẠI ---
            alert(
                `✅ Đã cập nhật trạng thái đơn ${order.id} thành "${translateStatus(
                    newStatus
                )}"`
            );
            popup.remove();
            renderTable(orders); // Cập nhật lại bảng admin
        });
    };

    // ======= HIỂN THỊ BAN ĐẦU =======
    renderTable(orders);
});