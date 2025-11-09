document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#customerTable tbody");
  const searchInput = document.getElementById("searchInput");
  const popup = document.getElementById("popupConfirm");
  const popupTitle = document.getElementById("popupTitle");
  const popupMessage = document.getElementById("popupMessage");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");

  let customers = []; // Sẽ load trong hàm render
  let allUsers = []; // Nguồn dữ liệu thô

  const menuToggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".admin_sidebar");
  const overlay = document.createElement("div");
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

  let selectedAction = null;
  let selectedCustomer = null;

  // SỬA LỖI: Tách hàm load và hàm save
  function loadData() {
    allUsers = JSON.parse(localStorage.getItem("users")) || [];
    customers = allUsers.map((u, index) => ({
      ...u, // Giữ lại TOÀN BỘ dữ liệu (quan trọng nhất là 'cart')
      id: index + 1,
      name: u.name || "(Chưa cập nhật)",
      userName: u.username,
      password: u.password,
      status: u.status || "active",
    }));
  }

  function saveData() {
    // Chỉ lưu lại các trường cần thiết, loại bỏ 'id' và 'userName' tạm thời
    const usersToSave = customers.map(c => {
        // Tạo một bản sao của customer
        // 'c' đang chứa tất cả dữ liệu gốc (cart, orderData, v.v...)
        const userToSave = { ...c };
        
        // Xóa các key tạm thời do admin thêm vào
        delete userToSave.id;
        delete userToSave.userName; 
        
        // Đảm bảo các trường chính xác (vì 'c' có thể bị ghi đè)
        userToSave.username = c.userName; // Đặt lại username gốc
        
        return userToSave;
    });
    localStorage.setItem("users", JSON.stringify(usersToSave));
  }


  // === Hiển thị bảng ===
  function renderCustomers(data) {
    tableBody.innerHTML = data.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.userName}</td>
        <td>${c.password}</td>
        <td style="color:${c.status === 'active' ? '#43a047' : '#ef5350'};">
          ${c.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
        </td>
        <td>
          <button class="btn btn-reset" onclick="resetPassword(${c.id})">Đổi MK</button>
          ${c.status === 'active'
            ? `<button class="btn btn-lock" onclick="toggleLock(${c.id})">Khóa</button>`
            : `<button class="btn btn-unlock" onclick="toggleLock(${c.id})">Mở khóa</button>`}
        </td>
      </tr>
    `).join("");

    // SỬA LỖI: KHÔNG lưu trữ lại ở đây.
    // Chúng ta chỉ LƯU khi có THAY ĐỔI (trong confirmYes.onclick)
  }

  // Hàm chạy ban đầu
  function initialize() {
    loadData();
    renderCustomers(customers);
  }
  
  initialize(); // Chạy lần đầu

  // === Tìm kiếm khách hàng ===
  searchInput.addEventListener("input", e => {
    const keyword = e.target.value.toLowerCase();
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(keyword) || c.userName.toLowerCase().includes(keyword)
    );
    renderCustomers(filtered);
  });

  // === Popup confirm logic ===
  function openPopup(title, message, action, customer) {
    popupTitle.textContent = title;
    popupMessage.innerHTML = message;
    selectedAction = action;
    selectedCustomer = customer;
    if (action === "reset") {
      popupMessage.innerHTML += `
        <br><input id="newPassword" type="password" placeholder="Nhập mật khẩu mới" 
        style="margin-top:10px;padding:8px;width:90%;border:1px solid #ccc;border-radius:6px;">
      `;
    }
    popup.style.display = "flex";
  }

  function closePopup() {
    popup.style.display = "none";
  }

  confirmNo.onclick = closePopup;

  confirmYes.onclick = () => {
    if (!selectedCustomer) return;

    if (selectedAction === "reset") {
      const newPassInput = document.getElementById("newPassword");
      const newPass = newPassInput ? newPassInput.value.trim() : "";
      if (newPass === "") {
        alert("❌ Vui lòng nhập mật khẩu mới!");
        return;
      }
      selectedCustomer.password = newPass;
      alert(`✅ Mật khẩu của ${selectedCustomer.name} đã được đổi thành: ${newPass}`);
    } 
    else if (selectedAction === "lock") {
      selectedCustomer.status = "locked";
      alert(`🔒 Đã khóa tài khoản của ${selectedCustomer.name}`);
    } 
    else if (selectedAction === "unlock") {
      selectedCustomer.status = "active";
      alert(`🔓 Đã mở khóa tài khoản của ${selectedCustomer.name}`);
    }

    // SỬA LỖI: Chỉ lưu lại localStorage KHI CÓ THAY ĐỔI
    saveData();
    renderCustomers(customers); // Render lại với dữ liệu đã cập nhật
    closePopup();
  };

  // === Gắn hàm toàn cục để gọi từ HTML ===
  window.resetPassword = function (id) {
    const c = customers.find(x => x.id === id);
    openPopup("Đổi mật khẩu", `Nhập mật khẩu mới cho <b>${c.name}</b>:`, "reset", c);
  };

  window.toggleLock = function (id) {
    const c = customers.find(x => x.id === id);
    if (c.status === "active") {
      openPopup("Khóa tài khoản", `Bạn có chắc muốn khóa tài khoản của <b>${c.name}</b>?`, "lock", c);
    } else {
      openPopup("Mở khóa tài khoản", `Bạn có chắc muốn mở khóa cho <b>${c.name}</b>?`, "unlock", c);
    }
  };
});