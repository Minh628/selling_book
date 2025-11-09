// Thêm hàm dịch trạng thái vào đầu tệp để có thể dùng ở nhiều nơi
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

// ====== DỮ LIỆU ĐƠN HÀNG CỦA TỪNG USER ======
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let orderData = [];

if (currentUser) {
  const userInUsers = users.find((u) => u.username === currentUser.username);
  if (userInUsers && userInUsers.orderData) {
    orderData = userInUsers.orderData;
  }
}

// ====== NẾU CHƯA ĐĂNG NHẬP THÌ CHUYỂN VỀ LOGIN ======
if (!currentUser) {
  alert("⚠️ Vui lòng đăng nhập trước khi xem thông tin cá nhân!");
  window.location.href = "logInPage.html";
}

// ====== HIỂN THỊ DANH SÁCH ĐƠN HÀNG ======
const orderBody = document.getElementById("orderBody");

if (orderData && orderData.length > 0) {
  orderBody.innerHTML = orderData
    .map((order) => {
      const translated = translateStatus(order.status); // Dịch trạng thái (luôn dùng tiếng Anh làm nguồn)
      return `
      <tr onclick="showDetail('${order.id}')">
        <td>${order.id}</td>
        <td>${order.date}</td>
        <td class="price">${(typeof order.total === "number" ? order.total : 0
      ).toLocaleString()}đ</td>
        <td>${translated}</td> 
        <td>
          ${
        // SỬA: Chỉ cho phép hủy khi trạng thái là "Mới"
        translated === "Mới"
        ? `<button onclick="event.stopPropagation(); cancelOrder('${order.id}')" class="cancel-btn">Hủy</button>`
        : ""
      }
        </td>
        
      </tr>
    `;
    })
    .join("");
} else {
  orderBody.innerHTML = '<tr><td colspan="5">Lịch sử mua hàng trống.</td></tr>';
}

// ====== HIỂN THỊ CHI TIẾT ĐƠN ======
function showDetail(id) {
  const order = orderData.find((o) => o.id === id);
  if (!order) return;

  let html = `
  <div class="order-detail">
    <p><strong>Địa chỉ giao hàng:</strong> ${order.address || "(Chưa có thông tin)"
    }</p>
    <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod || "(Không xác định)"
    }</p>
    <p><strong>Mã đơn:</strong> ${order.id}</p> 

    <div class="order-items">
      <ul>
        ${order.items
      .map(
        (i) => `
              <li>
                ${i.name} - SL: ${i.qty} - Tổng: 
                <span class="price">${(
            i.price * i.qty
          ).toLocaleString()}đ</span>
              </li>
            `
      )
      .join("")}
      </ul>
    </div>
  </div>
`;

  document.getElementById("orderDetail").innerHTML = html;
}

// ====== VALIDATE THÔNG TIN KHÁCH HÀNG (Giữ nguyên) ======
const saveBtn = document.getElementById("saveBtn");
const inputs = {
  name: document.getElementById("name"),
  phone: document.getElementById("phone"),
  address: document.getElementById("address"),
  city: document.getElementById("city"),
  nation: document.getElementById("nation"),
};

function validate() {
  let valid = true;
  document.querySelectorAll("small").forEach((e) => (e.style.display = "none"));
  Object.values(inputs).forEach((e) => e.classList.remove("error"));
  if (!/^[A-Za-zÀ-ỹ\s]+$/.test(inputs.name.value.trim())) {
    showError("name"); valid = false;
  }
  if (!/^0\d{9}$/.test(inputs.phone.value.trim())) {
    showError("phone"); valid = false;
  }
  if (inputs.address.value.trim() === "") {
    showError("address"); valid = false;
  }
  if (inputs.city.value.trim() === "") {
    showError("city"); valid = false;
  }
  if (inputs.nation.value.trim() === "") {
    showError("nation"); valid = false;
  }
  return valid;
}

function showError(field) {
  document.getElementById("err-" + field).style.display = "block";
  inputs[field].classList.add("error");
}

// ====== LƯU THÔNG TIN NGƯỜI DÙNG (Giữ nguyên) ======
saveBtn.addEventListener("click", () => {
  if (!validate()) return;
  const data = {};
  for (let key in inputs) data[key] = inputs[key].value.trim();
  if (currentUser) {
    for (let key in data) {
      currentUser[key] = data[key];
    }
    const index = users.findIndex((u) => u.username === currentUser.username);
    if (index !== -1) {
      users[index] = currentUser;
    }
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    localStorage.setItem("users", JSON.stringify(users));
    alert("✅ Lưu thông tin thành công!");
  }
});

// ====== TỰ ĐỘNG HIỂN THỊ LẠI DỮ LIỆU (Giữ nguyên) ======
window.addEventListener("load", () => {
  if (currentUser) {
    for (let key in inputs) {
      if (currentUser[key]) inputs[key].value = currentUser[key];
    }
  }
});

// ====== HỦY ĐƠN HÀNG (SỬA LỖI TRẢ HÀNG) ======
function cancelOrder(id) {
  if (!confirm(`❗ Bạn có chắc muốn hủy đơn hàng #${id}?`)) return;

  // ===== LẤY DỮ LIỆU =====
  let orders = JSON.parse(localStorage.getItem("Orders")) || [];
  let users = JSON.parse(localStorage.getItem("users")) || [];
  let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
  let books = JSON.parse(localStorage.getItem("books")) || []; // SỬA: Lấy kho 'books'

  // Tìm đơn hàng trong danh sách 'Orders'
  const orderIndex = orders.findIndex((o) => o.id === id);
  if (orderIndex === -1) return alert("Lỗi: Không tìm thấy đơn hàng!");
  
  const order = orders[orderIndex];

  // ===== SỬA LỖI: BƯỚC 1: TRẢ HÀNG VỀ KHO 'books' =====
  // Chỉ trả hàng nếu đơn hàng CHƯA BỊ HỦY
  if (order.status !== "cancelled") {
    let itemsReturned = false;
    order.items.forEach(item => {
      const bookIndex = books.findIndex(b => b.title.toLowerCase().trim() === item.name.toLowerCase().trim());
      if (bookIndex !== -1) {
          books[bookIndex].quantity = (books[bookIndex].quantity || 0) + (item.qty || 0);
          itemsReturned = true;
      }
    });

    if (itemsReturned) {
      localStorage.setItem("books", JSON.stringify(books));
      console.log("Đã trả hàng về kho 'books' (user hủy).");
    }
  }
  // ===== KẾT THÚC SỬA LỖI =====


  // ===== BƯỚC 2: CẬP NHẬT TRONG DANH SÁCH ORDERS (Key: "Orders") =====
  order.status = "cancelled"; // Trạng thái Tiếng Anh

  // ===== BƯỚC 3: CẬP NHẬT TRONG users[].orderData =====
  users.forEach((u) => {
    if (u.orderData && Array.isArray(u.orderData)) {
      const userOrder = u.orderData.find((o) => o.id === id);
      if (userOrder) {
        userOrder.status = "cancelled"; // Trạngathái Tiếng Anh
      }
    }
  });

  // ===== BƯỚC 4: CẬP NHẬT TRONG currentUser.orderData =====
  if (currentUser && currentUser.orderData) {
    const userOrder = currentUser.orderData.find((o) => o.id === id);
    if (userOrder) {
      userOrder.status = "cancelled"; // Trạng thái Tiếng Anh
    }
  }

  // ===== BƯỚC 5: LƯU VÀO localStorage =====
  localStorage.setItem("Orders", JSON.stringify(orders));
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  // ===== BƯỚC 6: HIỂN THỊ LẠI BẢNG (Render lại giao diện) =====
  if (currentUser && currentUser.orderData) {
    const orderData = currentUser.orderData;
    orderBody.innerHTML = orderData
      .map((order) => {
        const translated = translateStatus(order.status); // Dịch trạng thái
        return `
        <tr onclick="showDetail('${order.id}')">
          <td>${order.id}</td>
          <td>${order.date}</td>
          <td class="price">${(typeof order.total === "number" ? order.total : 0
        ).toLocaleString()}đ</td>
          <td>${translated}</td>
          <td>
            ${
          // So sánh bằng trạng thái đã dịch
          translated === "Mới"
            ? `<button onclick="event.stopPropagation(); cancelOrder('${order.id}')" class="cancel-btn">Hủy</button>`
            : ""
          }
          </td>
        </tr>
      `;
      })
      .join("");
  }

  alert(`✅ Đơn hàng #${id} đã được hủy thành công.`);
}