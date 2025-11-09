document.addEventListener("DOMContentLoaded", () => {
  // === DOM ELEMENTS ===
  const productTableBody = document.querySelector(".product-table tbody");
  const paginationList = document.querySelector(".pagination-list");
  const modalOverlay = document.getElementById("edit-product-modal");
  const modalTitle = modalOverlay.querySelector(".popup-header h3");
  const editForm = document.getElementById("edit-product-form");
  const closeButton = modalOverlay.querySelector(".close-btn");
  const cancelButton = modalOverlay.querySelector(".btn-cancel");
  const addButton = document.querySelector(".btn-add");
  const searchNameInput = document.getElementById("admin-search-name");
  const searchCategorySelect = document.getElementById("admin-search-category");

  // === MODAL FORM FIELDS ===
  const titleSelect = document.getElementById("edit-title-select");
  const titleStatic = document.getElementById("edit-title-static");
  const categoryDisplay = document.getElementById("edit-category-display");
  const priceDisplay = document.getElementById("edit-price-display");
  const authorInput = document.getElementById("edit-author");
  const descriptionInput = document.getElementById("edit-description");
  const imageInput = document.getElementById("edit-image");
  const titleSelectGroup = document.getElementById("product-selection-group");
  const titleStaticGroup = document.getElementById("product-static-group");
  const quantityInput = document.getElementById("edit-quantity-input");
  const quantityInputGroup = document.getElementById("quantity-input-group");
  const quantityRealHint = document.getElementById("quantity-real-hint");
  const quantityDisplay = document.getElementById("edit-quantity-display");
  const quantityDisplayGroup = document.getElementById("quantity-display-group");

  // === STATE ===
  let books = [];
  let categories = [];
  let masterProducts = [];
  let stockInSlips = [];
  let allOrders = [];
  let productSellingPrices = {};

  let currentPage = 1;
  const ITEMS_PER_PAGE = 5;

  // --- 1. DATA LOADING ---
  function loadDataFromLocalStorage() {
    books = JSON.parse(localStorage.getItem("books")) || [];
    categories = JSON.parse(localStorage.getItem("categories")) || [];
    masterProducts = JSON.parse(localStorage.getItem("products")) || [];
    stockInSlips = JSON.parse(localStorage.getItem("stockInSlips")) || [];
    allOrders = JSON.parse(localStorage.getItem("Orders")) || [];
    productSellingPrices =
      JSON.parse(localStorage.getItem("productSellingPrices")) || {};
  }

  function saveDataToLocalStorage() {
    localStorage.setItem("books", JSON.stringify(books));
  }

  // --- 2. CORE LOGIC (CALCULATION) ---
  function calculatePhysicalStock(productName) {
    const normalizedName = productName.toLowerCase().trim();
    if (!normalizedName) return 0;

    const totalStockIn = stockInSlips
      .filter(
        (slip) =>
          slip.productName &&
          slip.productName.toLowerCase().trim() === normalizedName &&
          slip.status === "Đã nhập"
      )
      .reduce((sum, slip) => sum + (slip.quantity || 0), 0);

    const totalStockOut = allOrders
      .filter((order) => order.status !== "cancelled")
      .flatMap((order) => order.items || [])
      .filter(
        (item) =>
          item.name && item.name.toLowerCase().trim() === normalizedName
      )
      .reduce((sum, item) => sum + (item.qty || 0), 0);

    return Math.max(0, totalStockIn - totalStockOut);
  }

  function calculateAvailableStock(productName) {
    const physicalStock = calculatePhysicalStock(productName);
    const normalizedName = productName.toLowerCase().trim();
    if (!normalizedName) return 0;

    const allocatedBook = books.find(
      (b) => b.title.toLowerCase().trim() === normalizedName
    );
    const allocatedQuantity = allocatedBook ? allocatedBook.quantity || 0 : 0;

    return Math.max(0, physicalStock - allocatedQuantity);
  }

  function formatCurrency(n) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);
  }

  // --- 3. RENDERING ---
  function renderProducts() {
    loadDataFromLocalStorage();
    const nameFilter = searchNameInput.value.toLowerCase();
    const categoryFilter = searchCategorySelect.value;

    const filteredBooks = books.filter((book) => {
      const nameMatch = book.title.toLowerCase().includes(nameFilter);
      const categoryMatch =
        categoryFilter === "all" || book.category === categoryFilter;
      return nameMatch && categoryMatch;
    });

    displayPaginatedProducts(filteredBooks, productTableBody, currentPage);
    setupPagination(filteredBooks, paginationList);
    saveDataToLocalStorage();
  }

  function displayPaginatedProducts(items, wrapper, page) {
    wrapper.innerHTML = "";
    page--;
    const start = ITEMS_PER_PAGE * page;
    const end = start + ITEMS_PER_PAGE;
    const paginatedItems = items.slice(start, end);

    paginatedItems.forEach((book) => {
      const currentPrice = productSellingPrices[book.title] || book.price;
      book.price = currentPrice;

      const row = document.createElement("tr");
      row.setAttribute("data-id", book.id);
      const imageUrl = book.image.startsWith("./")
        ? `../${book.image.substring(2)}`
        : book.image.startsWith("/")
        ? `..${book.image}`
        : `../${book.image}`;

      row.innerHTML = `
        <td>${book.id}</td>
        <td><img src="${imageUrl}" alt="${
        book.title
      }" width="50" onerror="this.src='https://placehold.co/50x50/eee/aaa?text=Error'"></td>
        <td>${book.title}</td>
        <td>${book.category}</td>
        <td>${formatCurrency(currentPrice)}</td>
        <td>${book.quantity}</td>
        <td><span class="status-${book.status.toLowerCase()}">${
        book.status
      }</span></td>
        <td class="action-buttons">
            <button class="btn-edit">Chỉnh sửa</button>
            <button class="btn-toggle-status">${
              book.status === "Visible" ? "Ẩn" : "Hiện"
            }</button>
            <button class="btn-delete">Xóa</button>
        </td>
      `;
      wrapper.appendChild(row);
    });
  }

  function setupPagination(items, wrapper) {
    wrapper.innerHTML = "";
    const pageCount = Math.ceil(items.length / ITEMS_PER_PAGE);
    for (let i = 1; i <= pageCount; i++) {
      const btn = paginationButton(i);
      wrapper.appendChild(btn);
    }
  }

  function paginationButton(page) {
    const button = document.createElement("li");
    button.classList.add("pagination-item");
    if (currentPage === page) button.classList.add("active");

    const link = document.createElement("a");
    link.href = "#";
    link.innerText = page;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = page;
      renderProducts();
    });

    button.appendChild(link);
    return button;
  }

  function loadAdminCategories() {
    loadDataFromLocalStorage();
    const visibleCategories = categories.filter((cat) => cat.visible);

    searchCategorySelect.innerHTML =
      '<option value="all">Tất cả danh mục</option>';

    visibleCategories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = cat.name;
      searchCategorySelect.appendChild(option.cloneNode(true));
    });
  }

  // --- 4. DRAWER LOGIC ---
  function openDrawerForAdd() {
    loadDataFromLocalStorage();
    modalTitle.textContent = "Thêm sản phẩm mới";
    editForm.reset();
    editForm.removeAttribute("data-editing-id");

    titleSelectGroup.style.display = "flex";
    titleStaticGroup.style.display = "none";
    quantityInputGroup.style.display = "flex";
    quantityDisplayGroup.style.display = "none";

    titleSelect.required = true;
    quantityInput.required = true;

    categoryDisplay.textContent = "-";
    priceDisplay.textContent = "-";
    quantityRealHint.textContent = "Tồn kho thực tế: -";

    const allocatedProductNames = new Set(
      books.map((b) => b.title.toLowerCase().trim())
    );

    const availableProducts = masterProducts.filter((item) => {
      const stock = calculateAvailableStock(item.name);
      const isAllocated = allocatedProductNames.has(
        item.name.toLowerCase().trim()
      );
      return stock > 0 || isAllocated;
    });

    titleSelect.innerHTML =
      '<option value="">-- Chọn sản phẩm từ kho --</option>';
    if (availableProducts.length === 0) {
      titleSelect.innerHTML =
        '<option value="" disabled>Không có sản phẩm nào trong kho</option>';
    }
    availableProducts.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = `${
        item.name
      } (Có thể thêm: ${calculateAvailableStock(item.name)})`;
      titleSelect.appendChild(option);
    });

    modalOverlay.classList.add("active");
  }

  function openDrawerForEdit(productId) {
    loadDataFromLocalStorage();
    const product = books.find((p) => p.id === productId);
    if (!product) return;

    modalTitle.textContent = "Chỉnh sửa sản phẩm";
    editForm.reset();
    editForm.setAttribute("data-editing-id", product.id);

    titleSelectGroup.style.display = "none";
    titleStaticGroup.style.display = "flex";
    quantityInputGroup.style.display = "none";
    quantityDisplayGroup.style.display = "flex";

    titleSelect.required = false;
    quantityInput.required = false;

    titleStatic.value = product.title;
    categoryDisplay.textContent = product.category;
    priceDisplay.textContent = formatCurrency(
      productSellingPrices[product.title] || product.price
    );
    quantityDisplay.textContent = product.quantity;

    authorInput.value = product.author || "";
    descriptionInput.value = product.description || "";
    imageInput.value = product.image || "";

    modalOverlay.classList.add("active");
  }

  function closeDrawer() {
    modalOverlay.classList.remove("active");
  }

  // --- 5. EVENT LISTENERS ---
  addButton.addEventListener("click", openDrawerForAdd);
  closeButton.addEventListener("click", closeDrawer);
  cancelButton.addEventListener("click", closeDrawer);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeDrawer();
    }
  });

  titleSelect.addEventListener("change", () => {
    loadDataFromLocalStorage();

    const selectedName = titleSelect.value;
    if (!selectedName) {
      categoryDisplay.textContent = "-";
      priceDisplay.textContent = "-";
      quantityRealHint.textContent = "Tồn kho thực tế: -";
      return;
    }

    const productInfo = masterProducts.find((p) => p.name === selectedName);
    const sellingPrice = productSellingPrices[selectedName] || 0;
    const stock = calculateAvailableStock(selectedName);

    if (productInfo) {
      categoryDisplay.textContent = productInfo.category;
      priceDisplay.textContent = formatCurrency(sellingPrice);
      quantityRealHint.textContent = `Tồn kho thực tế: ${stock}`;
    }
  });

  productTableBody.addEventListener("click", (event) => {
    const target = event.target;
    const row = target.closest("tr");
    if (!row) return;
    const productId = parseInt(row.dataset.id, 10);

    if (target.classList.contains("btn-toggle-status")) {
      const product = books.find((p) => p.id === productId);
      if (product) {
        product.status = product.status === "Visible" ? "Hidden" : "Visible";
        saveDataToLocalStorage();
        renderProducts();
      }
    } else if (target.classList.contains("btn-edit")) {
      openDrawerForEdit(productId);
    } else if (target.classList.contains("btn-delete")) {
      if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm này?`)) {
        books = books.filter((p) => p.id !== productId);
        saveDataToLocalStorage();
        renderProducts();
      }
    }
  });

  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const editingId = editForm.getAttribute("data-editing-id");

    loadDataFromLocalStorage();

    if (editingId) {
      // === EDIT MODE ===
      const product = books.find((p) => p.id === parseInt(editingId, 10));
      if (product) {
        product.author = authorInput.value;
        product.description = descriptionInput.value;
        product.image = imageInput.value.replace(/^\.\//, "");
      }
    } else {
      // === ADD MODE ===
      const title = titleSelect.value;
      if (!title) {
        alert("Vui lòng chọn một sản phẩm từ kho.");
        return;
      }

      const realStock = calculateAvailableStock(title);
      const quantityToSell = parseInt(quantityInput.value, 10);

      if (isNaN(quantityToSell) || quantityToSell <= 0) {
        alert("Vui lòng nhập số lượng bán hợp lệ.");
        return;
      }
      if (quantityToSell > realStock) {
        alert(
          `Số lượng bán (${quantityToSell}) không thể lớn hơn tồn kho thực tế (${realStock}).`
        );
        return;
      }

      const normalizedTitle = title.toLowerCase().trim();
      const existingBook = books.find(
        (b) => b.title.toLowerCase().trim() === normalizedTitle
      );

      if (existingBook) {
        existingBook.quantity += quantityToSell;
      } else {
        const maxId = books.reduce((max, b) => (b.id > max ? b.id : max), 0);
        const newId = maxId + 1;
        const productInfo = masterProducts.find((p) => p.name === title);
        const sellingPrice = productSellingPrices[title] || 0;

        const newProduct = {
          id: newId,
          title: title,
          author: authorInput.value,
          description: descriptionInput.value,
          category: productInfo ? productInfo.category : "Không rõ",
          price: sellingPrice,
          quantity: quantityToSell,
          image: imageInput.value.replace(/^\.\//, ""),
          status: "Visible",
        };
        books.push(newProduct);
      }
    }

    saveDataToLocalStorage();
    renderProducts();
    closeDrawer();
  });

  // Event Listeners
  searchNameInput.addEventListener("input", renderProducts);
  searchCategorySelect.addEventListener("change", renderProducts);

  // --- 6. INITIALIZATION ---
  loadDataFromLocalStorage();
  loadAdminCategories();
  renderProducts();
});