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
  const quantityDisplayGroup = document.getElementById(
    "quantity-display-group"
  );
  const imagePreview = document.getElementById("edit-image-preview");
  const saveButton = modalOverlay.querySelector(".btn-save");

  // === STATE ===
  let books = [];
  let categories = [];
  let masterProducts = [];
  let stockInSlips = [];
  let allOrders = [];
  let productSellingPrices = {};

  // SỬA LỖI GIÁ: Thêm các biến lợi nhuận
  let productProfitRates = {};
  let categoryProfitRates = {};
  let globalProfitRate = 20;


  let currentPage = 1;
  const ITEMS_PER_PAGE = 5;

  // --- 1. DATA LOADING (SỬA LỖI GIÁ) ---
  function loadDataFromLocalStorage() {
    books = JSON.parse(localStorage.getItem("books")) || [];
    categories = JSON.parse(localStorage.getItem("categories")) || [];
    masterProducts = JSON.parse(localStorage.getItem("products")) || [];
    stockInSlips = JSON.parse(localStorage.getItem("stockInSlips")) || [];
    allOrders = JSON.parse(localStorage.getItem("Orders")) || [];
    productSellingPrices =
      JSON.parse(localStorage.getItem("productSellingPrices")) || {};

    // SỬA: Load dữ liệu lợi nhuận (giống hệt manage-price.js)
    const storedGlobal = localStorage.getItem("globalProfitRate");
    globalProfitRate = storedGlobal !== null ? JSON.parse(storedGlobal) : 20;
    categoryProfitRates =
      JSON.parse(localStorage.getItem("categoryProfitRates")) || {};
    productProfitRates =
      JSON.parse(localStorage.getItem("productProfitRates")) || {};
  }

  function saveDataToLocalStorage() {
    localStorage.setItem("books", JSON.stringify(books));
  }

  // --- 2. CORE LOGIC (CALCULATION) ---

  // --- SỬA LỖI GIÁ: Bổ sung 2 hàm tính giá (copy từ manage-price.js) ---
  function getEffectiveProfit(product) {
    if (!product) return globalProfitRate;
    const { name, category } = product;
    if (productProfitRates.hasOwnProperty(name))
      return productProfitRates[name];
    if (categoryProfitRates.hasOwnProperty(category))
      return categoryProfitRates[category];
    return globalProfitRate;
  }

  function calculateSellingPrice(product) {
    if (!product) return 0;
    const profitPercent = getEffectiveProfit(product);
    const cost = product.cost || 0;
    const rawPrice = cost + (cost * profitPercent) / 100;
    return Math.round(rawPrice / 1000) * 1000;
  }
  // --- KẾT THÚC SỬA LỖI GIÁ ---


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
        (item) => item.name && item.name.toLowerCase().trim() === normalizedName
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

  function getSafeImageUrl(imageString) {
    if (!imageString) {
      return "https://placehold.co/50x50/eee/aaa?text=No+Img";
    }
    if (imageString.startsWith("data:image")) {
      return imageString;
    }
    if (imageString.startsWith("./")) {
      return `../${imageString.substring(2)}`;
    }
    if (imageString.startsWith("/")) {
      return `..${imageString}`;
    }
    return `../${imageString}`;
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // --- 3. RENDERING (SỬA LỖI GIÁ) ---
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
      let currentPrice = productSellingPrices[book.title];
      if (currentPrice === undefined) {
        const masterProduct = masterProducts.find(p => p.name === book.title);
        currentPrice = calculateSellingPrice(masterProduct);
      }
      book.price = currentPrice || 0;

      const row = document.createElement("tr");
      row.setAttribute("data-id", book.id);
      const imageUrl = getSafeImageUrl(book.image);

      row.innerHTML = `
        <td>${book.id}</td>
        <td><img src="${imageUrl}" alt="${book.title
        }" width="50" onerror="this.src='https://placehold.co/50x50/eee/aaa?text=Error'"></td>
        <td>${book.title}</td>
        <td>${book.category}</td>
        <td>${formatCurrency(currentPrice)}</td>
        <td>${book.quantity}</td>
        <td><span class="status-${book.status.toLowerCase()}">${book.status
        }</span></td>
        <td class="action-buttons">
            <button class="btn-edit">Chỉnh sửa</button>
            <button class="btn-toggle-status">${book.status === "Visible" ? "Ẩn" : "Hiện"
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

  /**
   * SỬA LỖI: Thêm logic Fallback nếu 'categories' chưa được tạo
   */
  function loadAdminCategories() {
    loadDataFromLocalStorage(); // Đảm bảo 'categories' và 'masterProducts' đã được tải

    let categoriesToDisplay = [];

    if (categories.length > 0) {
      // CÁCH 1: (Chuẩn) Dùng 'categories' nếu nó tồn tại
      categoriesToDisplay = categories.map(cat => ({
        value: cat.name,
        text: cat.visible ? cat.name : `${cat.name} (Đã ẩn)`
      }));
    } else {
      // CÁCH 2: (FALLBACK) Dùng 'masterProducts'
      console.warn("Chưa tạo 'categories'. Tự tạo danh sách tạm thời từ 'products' (admin).");
      const tempCategoryNames = [
        ...new Set(masterProducts.map(p => p.category).filter(Boolean))
      ];

      categoriesToDisplay = tempCategoryNames.map(name => ({
        value: name,
        text: name // Không có '(Đã ẩn)' vì đây là fallback
      }));
    }

    // Sắp xếp theo ABC
    categoriesToDisplay.sort((a, b) => a.text.localeCompare(b.text));

    searchCategorySelect.innerHTML =
      '<option value="all">Tất cả danh mục</option>';

    categoriesToDisplay.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.value;
      option.textContent = cat.text;
      searchCategorySelect.appendChild(option);
    });
  }

  // --- 4. DRAWER LOGIC (SỬA LỖI GIÁ) ---
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
    imagePreview.style.display = "none";
    imagePreview.src = "";
    imageInput.value = null;

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
      option.textContent = `${item.name
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

    let currentPrice = productSellingPrices[product.title];
    if (currentPrice === undefined) {
      const masterProduct = masterProducts.find(p => p.name === product.title);
      currentPrice = calculateSellingPrice(masterProduct);
    }
    priceDisplay.textContent = formatCurrency(currentPrice || 0);

    quantityDisplay.textContent = product.quantity;
    authorInput.value = product.author || "";
    descriptionInput.value = product.description || "";
    imageInput.value = null;
    if (product.image) {
      imagePreview.src = getSafeImageUrl(product.image);
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
      imagePreview.src = "";
    }

    modalOverlay.classList.add("active");
  }

  function closeDrawer() {
    modalOverlay.classList.remove("active");
  }

  // --- 5. EVENT LISTENERS (SỬA LỖI GIÁ) ---
  addButton.addEventListener("click", openDrawerForAdd);
  closeButton.addEventListener("click", closeDrawer);
  cancelButton.addEventListener("click", closeDrawer);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeDrawer();
    }
  });

  imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      readFileAsDataURL(file)
        .then((dataUrl) => {
          imagePreview.src = dataUrl;
          imagePreview.style.display = "block";
        })
        .catch((err) => {
          console.error("Lỗi đọc file xem trước:", err);
          imagePreview.style.display = "none";
        });
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

    const sellingPrice = calculateSellingPrice(productInfo);
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
        const categoryObject = categories.find(
          (cat) => cat.name === product.category
        );
        if (categoryObject && categoryObject.visible === false) {
          if (product.status === "Hidden") {
            alert(
              `Không thể hiện sản phẩm này. Danh mục "${product.category}" đang bị ẩn.`
            );
            return;
          }
        }
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

  saveButton.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!editForm.checkValidity()) {
      editForm.reportValidity();
      return;
    }

    loadDataFromLocalStorage();

    const editingId = editForm.getAttribute("data-editing-id");
    const imageFile = imageInput.files[0];
    let imageToSave = "";
    let hasNewImage = false;

    if (imageFile) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
      try {
        const compressedFile = await imageCompression(imageFile, options);
        imageToSave = await readFileAsDataURL(compressedFile);
        hasNewImage = true;
      } catch (err) {
        console.error("Lỗi khi nén hoặc đọc file:", err);
        alert("Đã xảy ra lỗi khi xử lý ảnh. Vui lòng thử lại.");
        return;
      }
    }

    if (editingId) {
      // === EDIT MODE ===
      const product = books.find((p) => p.id === parseInt(editingId, 10));
      if (product) {
        product.author = authorInput.value;
        product.description = descriptionInput.value;
        if (hasNewImage) {
          product.image = imageToSave;
        }
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

      const productInfo = masterProducts.find((p) => p.name === title);

      const sellingPrice = calculateSellingPrice(productInfo);

      if (existingBook) {
        existingBook.quantity += quantityToSell;
        existingBook.author = authorInput.value;
        existingBook.description = descriptionInput.value;
        if (hasNewImage) {
          existingBook.image = imageToSave;
        }
      } else {
        const maxId = books.reduce((max, b) => (b.id > max ? b.id : max), 0);
        const newId = maxId + 1;
        const productCategoryName = productInfo
          ? productInfo.category
          : "Không rõ";
        const categoryObject = categories.find(
          (cat) => cat.name === productCategoryName
        );
        const initialStatus =
          categoryObject && categoryObject.visible === false
            ? "Hidden"
            : "Visible";

        const newProduct = {
          id: newId,
          title: title,
          author: authorInput.value,
          description: descriptionInput.value,
          category: productCategoryName,
          price: sellingPrice,
          quantity: quantityToSell,
          image: imageToSave,
          status: initialStatus,
        };
        books.push(newProduct);
      }
    }

    try {
      saveDataToLocalStorage();
      renderProducts();
      closeDrawer();
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        alert(
          "Lỗi: LocalStorage đã bị đầy! Kể cả sau khi nén ảnh, bạn cũng không còn đủ dung lượng."
        );
      } else {
        alert("Đã xảy ra lỗi khi lưu: " + e.message);
      }
    }
  });

  searchNameInput.addEventListener("input", () => {
    currentPage = 1;
    renderProducts();
  });

  searchCategorySelect.addEventListener("change", () => {
    currentPage = 1;
    renderProducts();
  });

  // --- 6. INITIALIZATION ---
  loadDataFromLocalStorage();
  loadAdminCategories(); // <-- Sửa lỗi nằm trong hàm này
  renderProducts();
});