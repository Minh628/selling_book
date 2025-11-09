document.addEventListener("DOMContentLoaded", () => {
  // === DOM Elements ===
  const categoryFilter = document.getElementById("categoryFilter");
  const searchInput = document.getElementById("searchInput");
  const tableBody = document.querySelector("#productTable tbody");
  const defaultProfitContainer = document.getElementById("defaultProfitContainer");
  const defaultProfitSpan = document.getElementById("defaultProfit");
  const editProfitBtn = document.getElementById("editProfitBtn");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageNumbersContainer = document.getElementById("pageNumbers");

  // === State ===
  let allProducts = []; // SỬA: Sẽ đọc từ localStorage.products
  let productProfitRates = {};
  let categoryProfitRates = {};
  let globalProfitRate = 20;
  let productSellingPrices = {};

  let currentPage = 1;
  const ROWS_PER_PAGE = 5;

  // === KHỞI TẠO & LOAD DỮ LIỆU (SỬA LỖI) ===

  function loadDataFromStorage() {
    // 1. Load lợi nhuận đã lưu
    const storedGlobal = localStorage.getItem("globalProfitRate");
    globalProfitRate = storedGlobal !== null ? JSON.parse(storedGlobal) : 20;
    categoryProfitRates = JSON.parse(localStorage.getItem("categoryProfitRates")) || {
      "Tiểu thuyết": 20, "Kỹ năng sống": 25, "Tâm linh": 30, "Khoa học": 22,
      "Văn học": 28, "Nuôi dạy con": 26, "Kinh doanh": 35,
    };
    productProfitRates = JSON.parse(localStorage.getItem("productProfitRates")) || {};
    productSellingPrices = JSON.parse(localStorage.getItem("productSellingPrices")) || {};

    // 2. SỬA: Load sản phẩm từ danh sách "products" GỐC
    // (Danh sách này đã được stockin.js quản lý và "khóa" giá vốn)
    allProducts = JSON.parse(localStorage.getItem("products")) || [];

    // 3. Đồng bộ hóa giá bán khi load
    syncAllSellingPrices();
  }

  function saveDataToStorage() {
    localStorage.setItem("globalProfitRate", JSON.stringify(globalProfitRate));
    localStorage.setItem("categoryProfitRates", JSON.stringify(categoryProfitRates));
    localStorage.setItem("productProfitRates", JSON.stringify(productProfitRates));
    localStorage.setItem("productSellingPrices", JSON.stringify(productSellingPrices));
  }

  // === LOGIC LÕI (Giữ nguyên) ===

  function getEffectiveProfit(product) {
    const { name, category } = product;
    if (productProfitRates.hasOwnProperty(name)) return productProfitRates[name];
    if (categoryProfitRates.hasOwnProperty(category)) return categoryProfitRates[category];
    return globalProfitRate;
  }

  function calculateSellingPrice(product) {
    const profitPercent = getEffectiveProfit(product);
    // SỬA: Đảm bảo 'cost' được đọc chính xác
    const cost = product.cost || 0; 
    const rawPrice = cost + (cost * profitPercent) / 100;
    return Math.round(rawPrice / 1000) * 1000;
  }

  function updateBooksInLocalStorage() {
    console.log("🔄 Đồng bộ hóa giá bán mới vào 'books'...");
    const books = JSON.parse(localStorage.getItem("books")) || [];
    const latestPrices = JSON.parse(localStorage.getItem("productSellingPrices")) || {};

    const updatedBooks = books.map(book => {
      if (latestPrices.hasOwnProperty(book.title)) {
        const newPrice = latestPrices[book.title];
        if (book.price !== newPrice) {
          console.log(`   - Cập nhật giá cho "${book.title}": ${book.price} -> ${newPrice}`);
          book.price = newPrice;
        }
      }
      return book;
    });

    localStorage.setItem("books", JSON.stringify(updatedBooks));
    console.log("✅ Đồng bộ hóa 'books' hoàn tất.");
  }

  function syncSingleSellingPrice(product) {
      const sellingPrice = calculateSellingPrice(product);
      productSellingPrices[product.name] = sellingPrice;
  }

  function syncAllSellingPrices() {
      allProducts.forEach(p => syncSingleSellingPrice(p));
      saveDataToStorage();
      updateBooksInLocalStorage();
  }

  function editProductProfit(name, newProfit) {
      const product = allProducts.find(p => p.name === name);
      if (product) {
          productProfitRates[name] = newProfit;
          syncSingleSellingPrice(product);
          saveDataToStorage();
          updateBooksInLocalStorage();
          renderUI();
      }
  }

  function editCategoryProfit(category, newRate) {
      categoryProfitRates[category] = newRate;
      allProducts.forEach(p => {
          if (p.category === category && productProfitRates.hasOwnProperty(p.name)) {
              delete productProfitRates[p.name];
          }
      });
      syncAllSellingPrices();
      saveDataToStorage();
      renderUI();
  }

  function editGlobalProfit(newRate) {
      globalProfitRate = newRate;
      Object.keys(categoryProfitRates).forEach(key => delete categoryProfitRates[key]);
      Object.keys(productProfitRates).forEach(key => delete productProfitRates[key]);
      syncAllSellingPrices();
      saveDataToStorage();
      renderUI();
  }


  // === RENDERING (Giữ nguyên) ===

  function renderUI() {
    const category = categoryFilter.value;
    const search = searchInput.value;
    renderTable(category, search, currentPage);
    updateDefaultProfitDisplay();
    loadCategoriesToFilter();
  }

  function renderTable(filter, search, page) {
    tableBody.innerHTML = "";
    currentPage = page;

    const searchLower = search.toLowerCase();
    const filtered = allProducts.filter((p) => {
      const text = `${p.name} ${p.category}`.toLowerCase();
      return (filter === "all" || p.category === filter) && text.includes(searchLower);
    });

    const totalRows = filtered.length;
    const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const paginatedItems = filtered.slice(start, end);

    if (paginatedItems.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; font-style:italic;">Không tìm thấy sản phẩm.</td></tr>`;
    } else {
      paginatedItems.forEach((p) => {
        const profitPercent = getEffectiveProfit(p);
        const sellingPrice = productSellingPrices[p.name] || calculateSellingPrice(p);
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${highlight(p.name, search)}</td>
          <td>${highlight(capitalize(p.category), search)}</td>
          <td>${highlight(formatCurrency(p.cost || 0), search)}</td> <td>${highlight(profitPercent + "%", search)}</td>
          <td>${highlight(formatCurrency(sellingPrice), search)}</td>
          <td><button class="editBtn" data-name="${escapeHtml(p.name)}">Sửa</button></td>
        `;
        tableBody.appendChild(row);
      });
    }
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    pageNumbersContainer.innerHTML = "";
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("span");
      pageBtn.className = "page-number";
      pageBtn.textContent = i;
      pageBtn.dataset.page = i;
      if (i === currentPage) pageBtn.classList.add("active");
      pageNumbersContainer.appendChild(pageBtn);
    }
  }

  function updateDefaultProfitDisplay() {
    const category = categoryFilter.value;
    defaultProfitContainer.classList.remove("hidden");
    if (category === "all") {
      defaultProfitSpan.textContent = `${globalProfitRate}%`;
    } else {
      const rate = categoryProfitRates[category] ?? globalProfitRate;
      defaultProfitSpan.textContent = `${rate}% (cho ${capitalize(category)})`;
    }
  }

  function loadCategoriesToFilter() {
    const categories = [...new Set(allProducts.map(p => p.category))];
    const currentCategory = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="all">Tất cả loại sản phẩm</option>';
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = capitalize(cat);
      categoryFilter.appendChild(option);
    });
    categoryFilter.value = currentCategory;
  }

  // === EVENT HANDLERS (Giữ nguyên) ===

  function handleEditDefault() {
    const category = categoryFilter.value;
    if (category === "all") {
      const newRate = parseFloat(prompt(`Nhập tỷ lệ lợi nhuận mặc định cho TẤT CẢ (%):`, globalProfitRate));
      if (!isNaN(newRate)) editGlobalProfit(newRate);
    } else {
      const currentRate = categoryProfitRates[category] ?? globalProfitRate;
      const newRate = parseFloat(prompt(`Nhập tỷ lệ lợi nhuận mặc định mới cho loại "${capitalize(category)}":`, currentRate));
      if (!isNaN(newRate)) editCategoryProfit(category, newRate);
    }
  }

  function handleEditProduct(name) {
    const product = allProducts.find((p) => p.name === name);
    if (!product) return;
    const current = getEffectiveProfit(product);
    const newProfit = parseFloat(prompt(`Nhập tỷ lệ lợi nhuận mới cho "${name}" (%):`, current));
    if (!isNaN(newProfit)) {
      editProductProfit(name, newProfit);
    }
  }

  // === GẮN SỰ KIỆN (Giữ nguyên) ===

  editProfitBtn.addEventListener("click", handleEditDefault);
  categoryFilter.addEventListener("change", () => renderTable(categoryFilter.value, searchInput.value, 1));
  searchInput.addEventListener("input", () => renderTable(categoryFilter.value, searchInput.value, 1));

  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button.editBtn");
    if (btn) handleEditProduct(unescapeHtml(btn.dataset.name));
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) renderTable(categoryFilter.value, searchInput.value, currentPage - 1);
  });

  nextPageBtn.addEventListener("click", () => {
    renderTable(categoryFilter.value, searchInput.value, currentPage + 1);
  });

  pageNumbersContainer.addEventListener("click", (e) => {
    const pageBtn = e.target.closest(".page-number");
    if (pageBtn && !pageBtn.classList.contains("active")) {
      renderTable(categoryFilter.value, searchInput.value, parseInt(pageBtn.dataset.page));
    }
  });

  // === HELPERS (Giữ nguyên) ===
  function formatCurrency(value) { return new Intl.NumberFormat("vi-VN").format(value) + " ₫"; }
  function highlight(text, keyword) {
    if (!keyword) return escapeHtml(text);
    const pattern = new RegExp(`(${escapeRegExp(keyword)})`, "gi");
    return escapeHtml(String(text)).replace(pattern, `<span class="highlight">$1</span>`);
  }
  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
  function capitalize(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function unescapeHtml(s) {
    const map = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
    return String(s).replace(/&(amp|lt|gt|quot|#39);/g, (m) => map[m]);
  }

  // === KHỞI ĐỘNG ===
  loadDataFromStorage();
  renderUI();
});