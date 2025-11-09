document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === 'admin' && password === 'admin') {
                sessionStorage.setItem('adminLoggedIn', 'true');
                window.location.href = 'dashboard.html';
            } else {
                alert('Sai tên đăng nhập hoặc mật khẩu!');
            }
        });
    }

    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            sessionStorage.removeItem('adminLoggedIn');
            window.location.href = 'index.html';
        });
    }

    // Logic for sidebar toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const adminContainer = document.querySelector('.admin_container');
    if (menuToggle && adminContainer) {
        menuToggle.addEventListener('click', function () {
            adminContainer.classList.toggle('sidebar-hidden');
        });
    }
});
