const userIcon = document.getElementById("icon-user");
const userMenu = document.getElementById("menu-user");
const navBar = document.getElementById("nav-bar");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");

// Toggle hamburger menu
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// Toggle mở/đóng khi click vào icon
userIcon.addEventListener("click", function (e) {
  userMenu.classList.toggle("show");
  e.stopPropagation(); // Ngăn sự kiện click lan ra document
});

// Click ra ngoài để ẩn menu người dùng
document.addEventListener("click", function (e) {
  // Nếu click không nằm trong userMenu và không phải là userIcon
  if (!userMenu.contains(e.target) && !userIcon.contains(e.target)) {
    userMenu.classList.remove("show");
  }
});

// =================================

// KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
const navUser = JSON.parse(localStorage.getItem("currentUser"));

// Nếu chưa đăng nhập
if (!navUser) {
  userMenu.innerHTML = `
    <a href="logInPage.html">Đăng nhập</a>
    <hr />
    <a href="signUpPage.html">Đăng ký</a>
  `;
}
// Nếu đã đăng nhập → đổi nội dung menu
if (navUser) {
  const message = document.createElement("div");
  message.classList.add("hi-name");
  message.innerHTML = `Xin chào <span class="name">${
    navUser.name || navUser.username
  }</span>`;

  // Chèn lời chào vào trong nav-links để nó cũng được ẩn/hiện
  navLinks.appendChild(message);

  userMenu.innerHTML = `
    <a href="profile.html">Trang cá nhân</a>
    <hr />
    <a href="" id="logoutBtn">Đăng xuất</a>
  `;

  // Xử lý sự kiện đăng xuất
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("currentUser");
    alert("Bạn đã đăng xuất!");
    window.location.href = "logInPage.html";
  });
}
