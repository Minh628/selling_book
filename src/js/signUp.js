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

var toggleRepeat = document.getElementById("eyeIcon-repeatPassword");
var passwordRepeat = document.getElementById("passwordRepeat");

toggleRepeat.onclick = function () {
  if (passwordRepeat.type === "password") {
    passwordRepeat.type = "text";
    toggleRepeat.classList.remove("fa-eye-slash");
    toggleRepeat.classList.add("fa-eye");
  } else {
    passwordRepeat.type = "password";
    toggleRepeat.classList.remove("fa-eye");
    toggleRepeat.classList.add("fa-eye-slash");
  }
};

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const passwordRepeatInput = document.getElementById("passwordRepeat");
const signUpButton = document.getElementById("signUpButton");

//hàm thực thi khi click vào nút sign up
signUpButton.addEventListener("click", function () {
  const username = usernameInput.value;
  const password = passwordInput.value;
  const passwordRepeat = passwordRepeatInput.value;
  //check xem có ô nào trống hay không
  if (!username || !password || !passwordRepeat) {
    alert("Please fill in all fields!");
    return;
  }

  //check xem mật khẩu với mật khẩu lặp lại có trùng nhau không
  if (password !== passwordRepeat) {
    alert("Passwords do not match!");
    return;
  }

  //tạo mảng users theo dữ liệu trong local storage, nếu chưa có thì tạo mảng rỗng
  let users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.some((user) => user.username === username)) {
    alert("Username already exists!");
    return;
  }

  //tạo thông tin user mới và lưu vào local storage
  let newUser = {
    username: username,
    password: password,
    name: "",
    phone: "",
    address: "",
    city: "",
    nation: "",
    status: "active",
    orderData: [],
  };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  alert("Sign up successful!");
  window.location.href = "logInPage.html";
});
