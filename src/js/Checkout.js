const methods = document.querySelectorAll(".method");
const cardInput = document.getElementById("cardNumber");
let selectedMethod = "Thanh toán khi nhận hàng";
let address = "";
// ==== CHỌN PHƯƠNG THỨC THANH TOÁN ====
methods.forEach((m) => {
  m.addEventListener("click", () => {
    methods.forEach((el) => el.classList.remove("selected"));
    m.classList.add("selected");
    selectedMethod = m.dataset.method;

    // Nếu chọn Visa thì hiển thị ô nhập số thẻ
    cardInput.style.display = selectedMethod === "Visa" ? "block" : "none";
  });
});

// ==== HIỂN THỊ GIỎ HÀNG CỦA USER ====
const users = JSON.parse(localStorage.getItem("users")) || [];
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
const invoiceContainer = document.querySelector(".invoice-items");
const totalElement = document.querySelector(".total-amount");

// Hiển thị sản phẩm nếu đến từ nút "Mua ngay"
function renderInvoiceTemp(tempCart) {
  invoiceContainer.innerHTML = "";
  let total = 0;

  tempCart.forEach((item) => {
    const price = item.price;
    const qty = item.quantity;
    const subtotal = price * qty;
    total += subtotal;

    const div = document.createElement("div");
    div.classList.add("invoice-item");
    div.innerHTML = `
      <div class="product-name">${item.title}</div>
      <div class="product-price">${price.toLocaleString("vi-VN")}đ</div>
      <div class="product-qty">${qty}</div>
    `;
    invoiceContainer.appendChild(div);
  });

  totalElement.textContent = total.toLocaleString("vi-VN") + "đ";
}


function renderInvoice() {
  // ==== TRƯỜNG HỢP MUA NGAY (checkoutCart) ====
  const tempCheckout = JSON.parse(localStorage.getItem("checkoutCart")) || [];
  if (tempCheckout.length > 0) {
    renderInvoiceTemp(tempCheckout);
    return; // không chạy phần render giỏ hàng
  }

  // ==== BẤM THANH TOÁN ====
  // Lấy dữ liệu user và giỏ hàng
  if (!currentUser) {
    alert("Bạn cần đăng nhập!");
    window.location.href = "./logInPage.html";
  }

  if (!currentUser.cart || !currentUser.cart.length) {
    alert("Giỏ hàng trống!");
    window.location.href = "./Product.html";
  }
  const index = users.findIndex((u) => u.username === currentUser.username);
  if (index === -1) return alert("Không tìm thấy user!");

  const cart = users[index].cart || [];
  let total = 0;

  invoiceContainer.innerHTML = "";

  cart.forEach((item) => {
    if (!item.selected) return; // chỉ lấy sản phẩm được chọn

    const price = item.price;
    const qty = item.quantity;
    const subtotal = price * qty;
    total += subtotal;

    const div = document.createElement("div");
    div.classList.add("invoice-item");
    div.innerHTML = `
      <div class="product-name">${item.title}</div>
      <div class="product-price">${price.toLocaleString("vi-VN")}đ</div>
      <div class="product-qty">${qty}</div>
    `;
    invoiceContainer.appendChild(div);
  });

  totalElement.textContent = total.toLocaleString("vi-VN") + "đ";
  return total;
}
// Hiển thị Địa chỉ giao hàng
function renderAddress() {
  if (!currentUser) return alert("Bạn cần đăng nhập!");

  const addressInput = document.querySelector(".address input[id='address']");
  const cityInput = document.querySelector(".address input[id='city']");
  const nationInput = document.querySelector(".address input[id='nation']");

  if (addressInput) addressInput.value = currentUser.address || "";
  if (cityInput) cityInput.value = currentUser.city || "";
  if (nationInput) nationInput.value = currentUser.nation || "";
}

// Gọi khi tải trang
let total = renderInvoice();
renderAddress();

// ==== XỬ LÝ NÚT XÁC NHẬN ====
document.getElementById("confirmBtn").addEventListener("click", () => {
  if (!currentUser) return alert("Bạn cần đăng nhập!");

  const index = users.findIndex((u) => u.username === currentUser.username);
  if (index === -1) return alert("Không tìm thấy user!");

  // const cart = users[index].cart || [];
  // if (!cart.length) return alert("Giỏ hàng trống!");

    // --- Hỗ trợ cả "Mua ngay" ---

  const tempCheckout = JSON.parse(localStorage.getItem("checkoutCart")) || [];
  const isTempCheckout = tempCheckout.length > 0;

  let cart = users[index].cart || [];

  if (isTempCheckout) {
    cart = tempCheckout.map(item => ({
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      category: item.category || "Chưa xác định",
      selected: true
    }));
  }
  // Nếu vẫn không có gì thì báo lỗi
  if (!cart.length) return alert("Giỏ hàng trống!");


  if (!selectedMethod) return alert("Chọn phương thức thanh toán!");
  if (selectedMethod === "Visa" && !cardInput.value.trim())
    return alert("Nhập số thẻ Visa!");

  const addressInputs = [...document.querySelectorAll(".address input")];
  const allFilled = addressInputs.every(
    (i) => i.value.trim() || i.id === "cardNumber"
  );
  if (!allFilled) return alert("Điền đầy đủ địa chỉ giao hàng!");

  // Lấy địa chỉ giao hàng
  const addressInput = document.querySelector("#address").value.trim();
  const cityInput = document.querySelector("#city").value.trim();
  const nationInput = document.querySelector("#nation").value.trim();
  const fullAddress = `${addressInput}, ${cityInput}, ${nationInput}`;

  // Lọc các sản phẩm được chọn
  const items = cart
    .filter((i) => i.selected)
    .map((i) => ({
      name: i.title,
      qty: i.quantity,
      price: i.price,
      category: i.category || "Chưa xác định",
    }));

  if (!items.length)
    return alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");

  // Lấy danh sách Orders tổng thể
  let allOrders = JSON.parse(localStorage.getItem("Orders")) || [];

  // ID toàn hệ thống (dùng chung cho mọi user)
  const newGlobalId = String(allOrders.length + 1).padStart(3, "0");

  // Tính tổng tiền
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  // Tạo đơn hàng mới
  const newOrder = {
    id: newGlobalId,
    date: new Date().toLocaleDateString("vi-VN"),
    total,
    status: "new",
    items,
    address: fullAddress,
    username: currentUser.username,
    paymentMethod: selectedMethod,
  };

  // ==== GIẢM SỐ LƯỢNG TỒN KHO (ROBUST VERSION) ====
  const Products = JSON.parse(localStorage.getItem("books")) || [];
  const inventoryData = JSON.parse(localStorage.getItem("inventoryData")) || [];

  items.forEach((orderItem) => {
    const orderItemName = orderItem.name.toLowerCase().trim();

    // Update products (books)
    const productIndex = Products.findIndex(
      (p) => p.title.toLowerCase().trim() === orderItemName
    );
    if (productIndex !== -1) {
      Products[productIndex].quantity = Math.max(
        0,
        Products[productIndex].quantity - orderItem.qty
      );
    }

    // Update inventory
    const inventoryIndex = inventoryData.findIndex(
      (p) => p.name.toLowerCase().trim() === orderItemName
    );
    if (inventoryIndex !== -1) {
      inventoryData[inventoryIndex].stock = Math.max(
        0,
        inventoryData[inventoryIndex].stock - orderItem.qty
      );
    }
  });

  // Lưu lại books và inventoryData sau khi trừ số lượng
  localStorage.setItem("books", JSON.stringify(Products));
  localStorage.setItem("inventoryData", JSON.stringify(inventoryData));

  // ==== LƯU ĐƠN HÀNG ====
  allOrders.push(newOrder);
  localStorage.setItem("Orders", JSON.stringify(allOrders));

  // Xóa giỏ hàng tạm nếu dùng nút "Mua ngay"
  localStorage.removeItem("checkoutCart");

  // Gắn order vào user và xóa giỏ hàng
  users[index].orderData = users[index].orderData || [];
  users[index].orderData.push(newOrder);
  if (!isTempCheckout){
    users[index].cart = [];
  }


  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify(users[index]));

  alert("Thanh toán thành công!");
  window.location.href = "./profile.html";
});

// Xóa giỏ tạm (checkoutCart) nếu người dùng rời trang Checkout mà chưa thanh toán
window.addEventListener("beforeunload", () => {
  localStorage.removeItem("checkoutCart");
});
