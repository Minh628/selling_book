// --- 1. DỮ LIỆU (DATA) ---
let books = [];

const loadBooksFromLocalStorage = () => {
  const storedBooks = localStorage.getItem("books");
  if (storedBooks) {
    books = JSON.parse(storedBooks);
  } else {
    console.error("Lỗi: Không tìm thấy dữ liệu sách trong Local Storage.");
  }
};

loadBooksFromLocalStorage();


// --- 2. BIẾN TRẠNG THÁI (STATE) ---
let cart = [];
let currentPage = 1;
let itemsPerPage = 10;

// --- 3. CÁC HÀM TRỢ GIÚP (HELPER FUNCTIONS) ---
const formatCurrency = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

function saveCartOfCurrentUserToLocalStorage() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const users = JSON.parse(localStorage.getItem("users")) || [];
  if (!currentUser) return;

  const index = users.findIndex((u) => u.username === currentUser.username);
  if (index !== -1) {
    users[index].cart = cart;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(users[index]));
  }
}

function loadCartOfCurrentUserFromLocalStorage() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || !currentUser.cart) {
    cart = [];
    return;
  }
  cart = currentUser.cart;
}

function updateCartCount() {
  const cartCountSpan = document.getElementById("cart-count");
  if (!cartCountSpan) return;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountSpan.textContent = totalItems;
  cartCountSpan.style.display = totalItems > 0 ? "flex" : "none";
}

function calculateCartTotal() {
  const cartTotalDisplay = document.querySelector(".cart-total");
  if (!cartTotalDisplay) return;
  const total = cart.reduce((sum, item) => {
    return sum + (item.selected ? item.price * item.quantity : 0);
  }, 0);
  cartTotalDisplay.innerHTML = `<h3>Tổng thanh toán: <span class="total-amount">${formatCurrency(
    total
  )}</span></h3>`;
}

function updateProductCardUI(productId) {
  const product = books.find((p) => p.id === productId);
  const bookCard = document
    .querySelector(`.book-card .add-to-cart-btn[data-id="${productId}"]`)
    ?.closest(".book-card");
  if (!bookCard || !product) return;

  const cartItem = cart.find((item) => item.id === productId);
  
  // SỬA: Tính toán tồn kho thực tế (đồng bộ với logic admin)
  // Đây là một giả định đơn giản, logic kho thực tế đã được chuyển sang admin
  // Chúng ta sẽ dùng `product.quantity` làm nguồn tin cậy
  const physicalStock = product.quantity; // Số lượng mà admin phân bổ
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const remainingQuantity = physicalStock - quantityInCart;

  const quantityElement = bookCard.querySelector(".book-card-quantity");
  const buttonElement = bookCard.querySelector(".add-to-cart-btn");
  const buyNowButton = bookCard.querySelector(".buy-now-btn");

  if (remainingQuantity > 0) {
    quantityElement.textContent = `Tồn kho: ${remainingQuantity}`;
    quantityElement.classList.remove("out-of-stock");
    buttonElement.textContent = "Thêm vào giỏ";
    buttonElement.disabled = false;
    buyNowButton.disabled = false;
  } else {
    quantityElement.textContent = "Hết hàng";
    quantityElement.classList.add("out-of-stock");
    buttonElement.textContent = "Hết hàng";
    buttonElement.disabled = true;
    buyNowButton.disabled = true;
  }
}

// --- 4. CÁC HÀM XỬ LÝ CHÍNH (MAIN FUNCTIONS) ---

// --- 4.1. Chức năng Phân Trang (Pagination) ---

/**
 * SỬA LỖI: Hiển thị danh mục "Chưa có" nếu danh mục bị ẩn/xóa
 */
const displayPaginatedBooks = (items, wrapper, page) => {
  // SỬA: Tải danh sách danh mục HỢP LỆ (visible)
  const storedCategories = JSON.parse(localStorage.getItem("categories")) || [];
  const visibleCategoryNames = new Set(
    storedCategories
      .filter(cat => cat.visible === true)
      .map(cat => cat.name.toLowerCase())
  );

  const visibleBooks = items.filter((book) => book.status === "Visible");
  wrapper.innerHTML = "";
  page--; 

  const start = itemsPerPage * page;
  const end = start + itemsPerPage;
  const paginatedItems = visibleBooks.slice(start, end);

  paginatedItems.forEach((book) => {
    // SỬA: Kiểm tra xem danh mục của sách có hợp lệ không
    const categoryName = (book.category && visibleCategoryNames.has(book.category.toLowerCase()))
      ? book.category
      : "Chưa có"; // Nếu không, hiển thị "Chưa có"

    const bookCard = document.createElement("div");
    bookCard.className = "book-card";
    bookCard.innerHTML = `
            <div class="book-card-image-wrapper">
            <img src="${book.image}" alt="${book.title}" class="book-card-image">
          </div>
          <div class="book-card-body">
            <span class="book-card-category">${categoryName}</span> <h3 class="book-card-title">${book.title}</h3>
            <p class="book-card-author">${book.author}</p>
            <p class="book-card-price">${formatCurrency(book.price)}</p>
            <p class="book-card-quantity"></p>
          </div>  
          <div class="book-overlay">
            <button class="view-detail-btn" data-id="${book.id}">Xem chi tiết</button>
            <button class="buy-now-btn" data-id="${book.id}">Mua ngay</button>
            <button class="add-to-cart-btn" data-id="${book.id}">Thêm vào giỏ</button>
          </div>`;
    wrapper.appendChild(bookCard);
    updateProductCardUI(book.id); // Cập nhật trạng thái (Hết hàng/Tồn kho)
  });

  // Gắn sự kiện cho nút "Mua ngay"
  const buyNowButtons = wrapper.querySelectorAll(".buy-now-btn");
  buyNowButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const bookId = btn.dataset.id;
      const selectedBook = items.find((b) => b.id == bookId);
      if (!selectedBook) return;

      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "./logInPage.html";
        return;
      }

      // Kiểm tra tồn kho trước khi Mua ngay
      const cartItem = cart.find(item => item.id === selectedBook.id);
      const quantityInCart = cartItem ? cartItem.quantity : 0;
      if (selectedBook.quantity - quantityInCart < 1) {
          alert("Sản phẩm đã hết hàng hoặc số lượng trong giỏ đã tối đa!");
          return;
      }

      const tempCart = [
        { 
          title: selectedBook.title,
          price: selectedBook.price,
          quantity: 1, // Mua ngay luôn là 1
          category: selectedBook.category,
          selected: true
        }
      ];

      localStorage.setItem("checkoutCart", JSON.stringify(tempCart));
      window.location.href = "./Checkout.html";
    });
  });

  if (paginatedItems.length === 0) {
    document.getElementById("no-results").classList.remove("hidden");
  } else {
    document.getElementById("no-results").classList.add("hidden");
  }
};

const setupPagination = (items, wrapper) => {
  const visibleBooks = items.filter((book) => book.status === "Visible");
  wrapper.innerHTML = "";
  const pageCount = Math.ceil(visibleBooks.length / itemsPerPage);
  for (let i = 1; i < pageCount + 1; i++) {
    const btn = paginationButton(i, items);
    wrapper.appendChild(btn);
  }
};

const paginationButton = (page, items) => {
  const button = document.createElement("li");
  button.classList.add("pagination-item");
  if (currentPage === page) button.classList.add("active");

  const link = document.createElement("a");
  link.href = "#";
  link.innerText = page;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    currentPage = page;
    displayPaginatedBooks(
      items,
      document.getElementById("book-list"),
      currentPage
    );

    const currentBtn = document.querySelector(".pagination-item.active");
    if (currentBtn) {
      currentBtn.classList.remove("active");
    }
    button.classList.add("active");
  });

  button.appendChild(link);
  return button;
};

// --- 4.2. Chức năng Giỏ hàng (Cart) ---
function renderCartItems() {
  const cartItemsContainer = document.querySelector(".cart-items-container");
  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML =
      '<p class="empty-cart-message">Giỏ hàng của bạn đang trống.</p>';
  } else {
    cart.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";
      itemDiv.dataset.productId = item.id;

      itemDiv.innerHTML = `
                 <input type="checkbox" class="item-select-checkbox" ${
                   item.selected ? "checked" : ""
                 }>
                 <img src="${item.image}" alt="${
        item.title
      }" class="cart-item-image">
                 <div class="cart-item-details">
                     <h4>${item.title}</h4>
                     <p class="cart-item-price">${formatCurrency(
                       item.price
                     )}</p>
                     <div class="cart-item-quantity-control">
                         <button class="quantity-btn decrease-quantity" data-id="${
                           item.id
                         }">-</button>
                         <input type="number" class="item-quantity-input" value="${
                           item.quantity
                         }" min="1" data-id="${item.id}">
                         <button class="quantity-btn increase-quantity" data-id="${
                           item.id
                         }">+</button>
                     </div>
                 </div>
                 <button class="remove-item-btn" data-id="${
                   item.id
                 }" title="Xóa sản phẩm">&times;</button>
             `;
      cartItemsContainer.appendChild(itemDiv);
    });
  }
  calculateCartTotal();
}

function openCart() {
  const cartOverlay = document.getElementById("cart-overlay");
  const cartSidebar = document.getElementById("cart-sidebar");
  if (!cartOverlay || !cartSidebar) return;

  cartOverlay.classList.remove("hidden");
  cartSidebar.classList.add("open");
  renderCartItems();
}

function closeCart() {
  const cartOverlay = document.getElementById("cart-overlay");
  const cartSidebar = document.getElementById("cart-sidebar");
  if (!cartOverlay || !cartSidebar) return;

  cartOverlay.classList.add("hidden");
  cartSidebar.classList.remove("open");
}

function addToCart(product) {
  const existingItem = cart.find((item) => item.id === product.id);
  
  if (existingItem) {
    // Kiểm tra tồn kho (so sánh với 'quantity' từ 'books')
    if (existingItem.quantity < product.quantity) {
      existingItem.quantity++;
    } else {
      alert(`Số lượng tồn kho của sản phẩm "${product.title}" không đủ.`);
      return;
    }
  } else {
    // Kiểm tra tồn kho khi thêm mới
    if (product.quantity > 0) {
      cart.push({ ...product, quantity: 1, selected: true });
    } else {
      alert(`Sản phẩm "${product.title}" đã hết hàng.`);
      return;
    }
  }
  updateCartCount();
  saveCartOfCurrentUserToLocalStorage();
  updateProductCardUI(product.id); // Cập nhật UI thẻ sản phẩm

  const cartSidebar = document.getElementById("cart-sidebar");
  if (cartSidebar && cartSidebar.classList.contains("open")) {
    renderCartItems();
  }
}
window.books = books;
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;

function removeItemFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  updateCartCount();
  renderCartItems();
  saveCartOfCurrentUserToLocalStorage();
  updateProductCardUI(productId); // Cập nhật lại thẻ sản phẩm
}

// --- 4.3-- Chức năng tìm kiếm (Search) ---
function searchBooks() {
  let searchInput = document.getElementById("search");
  let authorInput = document.getElementById("author_filter");
  let minPriceInput = document.getElementById("min_price");
  let maxPriceInput = document.getElementById("max_price");
  let categorySelect = document.getElementById("category_filter");
  
  let searchInputValue = searchInput ? searchInput.value.toLowerCase() : "";
  let authorInputValue = authorInput ? authorInput.value.toLowerCase() : "";
  let categoryValue = categorySelect ? categorySelect.value.toLowerCase() : "tất cả";
  let minPriceValue = minPriceInput ? parseFloat(minPriceInput.value) || 0 : 0;
  let maxPriceValue = maxPriceInput ? parseFloat(maxPriceInput.value) || Infinity : Infinity;
  
  if (maxPriceValue <= 0) maxPriceValue = Infinity;

  const filteredBooks = books.filter((book) => {
    const titleMatch = book.title.toLowerCase().includes(searchInputValue);
    const authorMatch = book.author.toLowerCase().includes(authorInputValue);
    const priceMatch =
      book.price >= minPriceValue && book.price <= maxPriceValue;
      
    // SỬA: Logic lọc danh mục (phải chuẩn hóa)
    const bookCategory = book.category ? book.category.toLowerCase() : "";
    const categoryMatch =
      categoryValue === "tất cả" ||
      bookCategory === categoryValue;
      
    return titleMatch && authorMatch && priceMatch && categoryMatch;
  });
  
  displayPaginatedBooks(filteredBooks, document.getElementById("book-list"), 1);
  setupPagination(filteredBooks, document.getElementById("pagination-list"));
}

// --- 4.4-- Tạo danh mục tự động ---

/**
 * SỬA LỖI: Tải danh mục từ localStorage.categories
 * và chỉ hiển thị các danh mục "Visible"
 */
function loadCategories() {
  const categorySelect = document.getElementById("category_filter");
  if (!categorySelect) return;

  // Tải danh mục đã được admin quản lý
  const storedCategories = JSON.parse(localStorage.getItem("categories")) || [];
  
  // Lọc chỉ lấy các danh mục được phép "Hiển thị" (visible)
  const visibleCategories = storedCategories
    .filter(cat => cat.visible === true)
    .map(cat => cat.name); // Chỉ lấy mảng tên

  // Thêm "Tất cả" vào đầu
  const categories = ["Tất cả", ...new Set(visibleCategories)];
  
  categorySelect.innerHTML = ""; // Xóa các lựa chọn cũ
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// --- 5. KHỞI TẠO (INITIALIZATION) ---
document.addEventListener("DOMContentLoaded", () => {
  // --- 5.1. Lấy các phần tử DOM chính ---
  const bookList = document.getElementById("book-list");
  const paginationList = document.getElementById("pagination-list");
  const cartIcon = document.getElementById("cart-icon");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartSidebar = document.getElementById("cart-sidebar");
  const searchInput = document.getElementById("search");
  const authorInput = document.getElementById("author_filter");
  const minPriceInput = document.getElementById("min_price");
  const maxPriceInput = document.getElementById("max_price");
  const categorySelect = document.getElementById("category_filter");

  // --- 5.2. Khởi tạo nội dung Sidebar Giỏ hàng ---
  if (cartSidebar) {
    cartSidebar.innerHTML = `
             <div class="cart-header">
                 <h2>Giỏ hàng của bạn</h2>
                 <button id="close-cart-btn" class="close-btn">&times;</button>
             </div>
             <div class="cart-items-container">
                </div>
             <div class="cart-summary">
                 <div class="cart-total">
                    </div>
                 <button id="checkout-btn" class="checkout-btn">Tiến hành thanh toán</button>
             </div>
         `;
  }
  const checkout_btn = document.getElementById("checkout-btn");
  checkout_btn?.addEventListener("click", () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    // Kiểm tra xem có sản phẩm nào được CHỌN không
    const selectedItems = cart.filter(item => item.selected);
    
    if (selectedItems.length > 0 && currentUser) {
      window.location.href = "./Checkout.html";
    } else if (!currentUser) {
      alert("Bạn chưa đăng nhập");
      window.location.href = "./logInPage.html";
    } else if (cart.length === 0) {
      alert("Giỏ hàng trống!");
    } else if (selectedItems.length === 0) {
      alert("Bạn chưa chọn sản phẩm nào để thanh toán.");
    }
  });

  // --- 5.3. Lấy các phần tử con của Sidebar (sau khi đã chèn HTML) ---
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartItemsContainer = document.querySelector(".cart-items-container");

  // --- 5.4. Khởi tạo trạng thái ban đầu ---
  loadCartOfCurrentUserFromLocalStorage();
  updateCartCount();

  // ---- 5.6 Gắn danh mục sách ----
  loadCategories(); // Hàm này đã được sửa

  // --- 5.5. Responsive Display & Initial Render ---
  const handleResponsiveDisplay = () => {
    const oldItemsPerPage = itemsPerPage;
    
    if (window.innerWidth <= 660) {
      itemsPerPage = 4;
    } else {
      itemsPerPage = 10;
    }

    if (oldItemsPerPage !== itemsPerPage) {
      currentPage = 1;
      searchBooks();
    }
  };
  
  if (window.innerWidth <= 660) { itemsPerPage = 4; } else { itemsPerPage = 10; }
  searchBooks(); // Render lần đầu

  window.addEventListener('resize', handleResponsiveDisplay);
  
  // --- 5.7. Gắn các trình nghe sự kiện (Event Listeners) ---

  cartIcon?.addEventListener("click", openCart);
  cartOverlay?.addEventListener("click", closeCart);
  closeCartBtn?.addEventListener("click", closeCart);

  bookList?.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-to-cart-btn")) {
      const productId = parseInt(event.target.dataset.id, 10);
      const productToAdd = books.find((book) => book.id === productId);
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "./logInPage.html";
        return; // Dừng lại nếu chưa đăng nhập
      }
      if (productToAdd) {
        addToCart(productToAdd);
      }
    }
  });

  cartItemsContainer?.addEventListener("click", (event) => {
    const target = event.target;
    const cartItemElement = target.closest(".cart-item");
    if (!cartItemElement) return;

    const productId = parseInt(cartItemElement.dataset.productId, 10);
    const item = cart.find((p) => p.id === productId);
    const product = books.find((p) => p.id === productId); // Lấy thông tin tồn kho từ 'books'

    if (target.classList.contains("quantity-btn") && item) {
      if (target.classList.contains("increase-quantity")) {
        // Kiểm tra tồn kho
        if (item.quantity < product.quantity) {
          item.quantity++;
        } else {
          alert(`Số lượng tồn kho của sản phẩm "${product.title}" không đủ.`);
        }
      } else if (
        target.classList.contains("decrease-quantity") &&
        item.quantity > 1
      ) {
        item.quantity--;
      }
      renderCartItems(); // Cập nhật lại UI giỏ hàng
      updateCartCount();
      saveCartOfCurrentUserToLocalStorage();
      updateProductCardUI(productId); // Cập nhật lại thẻ sản phẩm
    } else if (target.classList.contains("remove-item-btn")) {
      removeItemFromCart(productId);
    }
  });

  cartItemsContainer?.addEventListener("change", (event) => {
    if (event.target.classList.contains("item-select-checkbox")) {
      const productId = parseInt(
        event.target.closest(".cart-item").dataset.productId,
        10
      );
      const item = cart.find((p) => p.id === productId);
      if (item) {
        item.selected = event.target.checked;
        calculateCartTotal();
        saveCartOfCurrentUserToLocalStorage();
      }
    }
  });

  cartItemsContainer?.addEventListener("input", (event) => {
    if (event.target.classList.contains("item-quantity-input")) {
      const productId = parseInt(event.target.dataset.id, 10);
      const item = cart.find((p) => p.id === productId);
      const product = books.find((p) => p.id === productId);
      const newQuantity = parseInt(event.target.value, 10);

      if (item && !isNaN(newQuantity) && newQuantity >= 1) {
        if (newQuantity <= product.quantity) {
          item.quantity = newQuantity;
        } else {
          alert(`Số lượng tồn kho của sản phẩm "${product.title}" không đủ.`);
          event.target.value = item.quantity; // Reset về giá trị cũ
        }
        updateCartCount();
        calculateCartTotal();
        saveCartOfCurrentUserToLocalStorage();
        updateProductCardUI(productId);
      } else if (item) {
        event.target.value = item.quantity; // Reset nếu nhập rỗng/chữ
      }
    }
  });
  // Sự kiện tìm kiếm
  searchInput?.addEventListener("input", searchBooks);
  authorInput?.addEventListener("input", searchBooks);
  minPriceInput?.addEventListener("input", searchBooks);
  maxPriceInput?.addEventListener("input", searchBooks);
  categorySelect?.addEventListener("change", searchBooks);
});