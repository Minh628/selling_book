var toggle = document.getElementById("eyeIcon-Password");
var password = document.getElementById("password");

toggle.onclick = function () {
  if (password.type === "password") {
    password.type = "text";
    toggle.classList.remove("fa-eye-slash");
    toggle.classList.add("fa-eye");
  } else {
    password.type = "password";
    toggle.classList.remove("fa-eye");
    toggle.classList.add("fa-eye-slash");
  }
};

let users = JSON.parse(localStorage.getItem("users")) || [];
const logInButton = document.getElementById("logInButton");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

logInButton.addEventListener("click", function () {
  const username = usernameInput.value;
  const password = passwordInput.value;


  const user = users.find(
    (user) => user.username === username && user.password === password
  );
  
  //sai thông tin đăng nhập
  if (!user) {
    alert("Tên đăng nhập hoặc mật khẩu không đúng!");
    return;
  }

  // kiển tra tài khoản bị khóa hay không
  if (user.status && user.status.toLowerCase() === "locked") {
    alert("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!");
    return;
  }

  if (user) {
    // Đăng nhập thành công → lưu user vào localStorage
    localStorage.setItem("currentUser", JSON.stringify(user));

    alert("Đăng nhập thành công!");

    // Chuyển sang trang cá nhân
    window.location.href = "profile.html";
  } 
});
