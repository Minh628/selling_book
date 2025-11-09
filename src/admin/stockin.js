document.addEventListener("DOMContentLoaded", () => {
  // --- 2. LẤY DOM (Giữ nguyên) ---
  const addStockInBtn = document.getElementById("stockin-add-btn");
  const modalOverlay = document.getElementById("stockin-modal-overlay");
  const modalForm = document.getElementById("stockin-form");
  const cancelBtn = document.getElementById("stockin-cancel-btn");
  const tableBody = document.getElementById("stockin-table-body");
  const paginationList = document.getElementById("stockin-pagination-list");
  const modalTitle = document.querySelector(".stockin-modal-content h2");
  const searchNameInput = document.getElementById("stockin-search-name");
  const filterStartDate = document.getElementById("stockin-filter-start-date");
  const filterEndDate = document.getElementById("stockin-filter-end-date");
  const productNameInput = document.getElementById("stockin-product-name");
  const categorySelect = document.getElementById("stockin-category");
  const unitPriceInput = document.getElementById("stockin-unit-price");
  const stockInput = document.getElementById("stockin-stock");
  const dateInput = document.getElementById("stockin-date");
  const totalValueSpan = document.getElementById("stockin-total-value");

  // Biến trạng thái (Giữ nguyên)
  let currentPage = 1;
  const rowsPerPage = 7;
  let allStockSlips = [];
  let editingSlipId = null;

  // --- 3. KHỞI TẠO DỮ LIỆU (Giữ nguyên) ---
  function initializeData() {
    if (!localStorage.getItem("products")) {
      localStorage.setItem("products", JSON.stringify([]));
    }
    if (!localStorage.getItem("stockInSlips")) {
      localStorage.setItem("stockInSlips", JSON.stringify([]));
    }
  }

  // --- 4. HÀM TIỆN ÍCH (Giữ nguyên) ---
  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  }

  // --- 5. HÀM TẢI VÀ HIỂN THỊ (Giữ nguyên) ---
  function loadAllDataFromStorage() {
    allStockSlips = JSON.parse(localStorage.getItem("stockInSlips")) || [];
    allStockSlips.sort((a, b) => b.id.localeCompare(a.id));
  }

  // Thay thế hàm loadCategoriesToModal cũ trong stockin.js

function loadCategoriesToModal() {
  // SỬA: Đọc từ localStorage.categories đã được quản lý
  const allCategories = JSON.parse(localStorage.getItem("categories")) || [];
  
  // Chỉ hiển thị các danh mục đang "visible"
  const visibleCategories = allCategories
    .filter(cat => cat.visible === true)
    .map(cat => cat.name); 
    
  const uniqueCategories = [...new Set(visibleCategories)];

  categorySelect.innerHTML = `<option value="">-- Chọn danh mục --</option>`;
  uniqueCategories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

  function getFilteredSlips() {
    const searchTerm = searchNameInput.value.toLowerCase();
    const startDate = filterStartDate.value;
    const endDate = filterEndDate.value;
    let filteredList = allStockSlips;
    if (searchTerm) {
      filteredList = filteredList.filter((slip) =>
        slip.productName.toLowerCase().includes(searchTerm)
      );
    }
    if (startDate) {
      filteredList = filteredList.filter((slip) => slip.date >= startDate);
    }
    if (endDate) {
      filteredList = filteredList.filter((slip) => slip.date <= endDate);
    }
    return filteredList;
  }

  function loadStockInTable() {
    tableBody.innerHTML = "";
    const allFilteredSlips = getFilteredSlips();
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedSlips = allFilteredSlips.slice(startIndex, endIndex);

    if (allFilteredSlips.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Không tìm thấy phiếu nhập nào.</td></tr>`;
    } else {
      paginatedSlips.forEach((slip) => {
        const row = document.createElement("tr");
        const statusClass =
          slip.status === "Đã nhập"
            ? "stockin-status-completed"
            : "stockin-status-pending";
        const formattedDate = new Date(slip.date).toLocaleDateString("vi-VN");
        const isCompleted = slip.status === "Đã nhập";
        row.innerHTML = `
          <td>${slip.productName}</td>
          <td>${slip.category}</td>
          <td>${formattedDate}</td>
          <td>${formatCurrency(slip.unitPrice)}</td>
          <td>${slip.quantity}</td>
          <td>${formatCurrency(slip.totalValue)}</td>
          <td>
            <div class="status-edit-wrapper">
              <select 
                class="stockin-status-select ${statusClass}" 
                data-id="${slip.id}"
                ${isCompleted ? "disabled" : ""} 
              >
                <option value="Chưa nhập" ${!isCompleted ? "selected" : ""
          }>Chưa nhập</option>
                <option value="Đã nhập" ${isCompleted ? "selected" : ""
          }>Đã nhập</option>
              </select>
              <button class="stockin-edit-btn" data-id="${slip.id
          }" style="display: none;">Lưu</button>
            </div>
          </td>
          <td>
            <button 
              class="stockin-btn-edit-details" 
              data-id="${slip.id}"
              ${isCompleted ? "disabled" : ""} 
              title="${isCompleted ? "Không thể sửa phiếu đã nhập" : "Sửa chi tiết"
          }"
            >
              Sửa
            </button>
            <button 
              class="stockin-btn-delete" 
              data-id="${slip.id}"
              ${isCompleted ? "disabled" : ""} 
              title="${isCompleted ? "Không thể xóa phiếu đã nhập kho" : "Xóa phiếu"
          }"
            >
              Xóa
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
    setupPagination(allFilteredSlips.length);
  }

  function setupPagination(totalItems) {
    paginationList.innerHTML = "";
    const pageCount = Math.ceil(totalItems / rowsPerPage);
    if (pageCount <= 1) return;
    const prevLi = document.createElement("li");
    prevLi.className = "stockin-pagination-item";
    if (currentPage === 1) prevLi.classList.add("disabled");
    prevLi.innerHTML = `<a href="#" data-page="prev">&laquo; Trước</a>`;
    paginationList.appendChild(prevLi);
    for (let i = 1; i <= pageCount; i++) {
      const pageLi = document.createElement("li");
      pageLi.className = "stockin-pagination-item";
      if (i === currentPage) pageLi.classList.add("active");
      pageLi.innerHTML = `<a href="#" data-page="${i}">${i}</a>`;
      paginationList.appendChild(pageLi);
    }
    const nextLi = document.createElement("li");
    nextLi.className = "stockin-pagination-item";
    if (currentPage === pageCount) nextLi.classList.add("disabled");
    nextLi.innerHTML = `<a href="#" data-page="next">Sau &raquo;</a>`;
    paginationList.appendChild(nextLi);
  }

  // --- 6. HÀM XỬ LÝ NGHIỆP VỤ ---
  function autoCalculateTotal() {
    const price = parseFloat(unitPriceInput.value) || 0;
    const qty = parseInt(stockInput.value) || 0;
    totalValueSpan.textContent = formatCurrency(price * qty);
  }

  function autoCheckProductName() {
    const productName = productNameInput.value.trim();
    if (!productName) return;
    const allProducts = JSON.parse(localStorage.getItem("products")) || [];
    const productInfo = allProducts.find(
      (p) => p.name.toLowerCase() === productName.toLowerCase()
    );
    if (productInfo) {
      categorySelect.value = productInfo.category;
      categorySelect.disabled = true;
    } else {
      categorySelect.disabled = false;
      categorySelect.value = "";
    }
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalForm.reset();
    totalValueSpan.textContent = formatCurrency(0);
    categorySelect.disabled = false;
    categorySelect.value = "";
    editingSlipId = null;
    modalTitle.textContent = "Tạo phiếu nhập hàng";
  }

  // HÀM GỬI FORM (Đã có validation từ lần trước)
  function handleFormSubmit(event) {
    event.preventDefault();
    const productName = productNameInput.value.trim();
    const category = categorySelect.value;
    const unitPrice = parseFloat(unitPriceInput.value);
    const quantity = parseInt(stockInput.value);
    const date = dateInput.value;

    if (!productName || !category || !date) {
      alert("Vui lòng điền đầy đủ tên, danh mục và ngày nhập.");
      return;
    }
    if (isNaN(unitPrice) || unitPrice <= 0) {
      alert("Đơn giá phải là một số hợp lệ và lớn hơn 0.");
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      alert("Số lượng phải là một số hợp lệ và lớn hơn 0.");
      return;
    }

    if (!category) {
      alert("Vui lòng chọn danh mục cho sản phẩm.");
      return;
    }
    const allSlips = JSON.parse(localStorage.getItem("stockInSlips")) || [];
    if (editingSlipId) {
      const slipToUpdate = allSlips.find((slip) => slip.id === editingSlipId);
      if (slipToUpdate) {
        slipToUpdate.productName = productName;
        slipToUpdate.category = category;
        slipToUpdate.unitPrice = unitPrice;
        slipToUpdate.quantity = quantity;
        slipToUpdate.date = date;
        slipToUpdate.totalValue = unitPrice * quantity;
      }
    } else {
      const newSlip = {
        id: Date.now().toString(),
        productName: productName,
        category: category,
        date: date,
        unitPrice: unitPrice,
        quantity: quantity,
        totalValue: unitPrice * quantity,
        status: "Chưa nhập",
      };
      allSlips.push(newSlip);
    }
    localStorage.setItem("stockInSlips", JSON.stringify(allSlips));
    closeModal();
    loadAllDataFromStorage();
    if (!editingSlipId) currentPage = 1;
    loadStockInTable();
  }

  function handleDeleteSlip(slipId) {
    if (!confirm("Bạn có chắc chắn muốn xóa phiếu nhập này?")) {
      return;
    }
    let stockInSlips = JSON.parse(localStorage.getItem("stockInSlips")) || [];
    const updatedSlips = stockInSlips.filter((slip) => slip.id !== slipId);
    localStorage.setItem("stockInSlips", JSON.stringify(updatedSlips));
    loadAllDataFromStorage();
    const totalFiltered = getFilteredSlips().length;
    const maxPage = Math.ceil(totalFiltered / rowsPerPage);
    if (currentPage > maxPage) {
      currentPage = maxPage || 1;
    }
    loadStockInTable();
  }

  function handlePaginationClick(event) {
    event.preventDefault();
    const target = event.target;
    if (
      target.tagName !== "A" ||
      target.parentElement.classList.contains("disabled")
    )
      return;
    const pageData = target.dataset.page;
    const totalFiltered = getFilteredSlips().length;
    const pageCount = Math.ceil(totalFiltered / rowsPerPage);
    if (pageData === "prev" && currentPage > 1) {
      currentPage--;
    } else if (pageData === "next" && currentPage < pageCount) {
      currentPage++;
    } else if (!isNaN(pageData)) {
      currentPage = parseInt(pageData);
    }
    loadStockInTable();
  }

  function handleOpenEditModal(slipId) {
    const slipToEdit = allStockSlips.find((slip) => slip.id === slipId);
    if (!slipToEdit) return;
    editingSlipId = slipId;
    loadCategoriesToModal();
    productNameInput.value = slipToEdit.productName;
    unitPriceInput.value = slipToEdit.unitPrice;
    stockInput.value = slipToEdit.quantity;
    dateInput.value = slipToEdit.date;
    autoCheckProductName();
    if (!categorySelect.disabled) {
      categorySelect.value = slipToEdit.category;
    }
    autoCalculateTotal();
    modalTitle.textContent = "Chỉnh sửa phiếu nhập hàng";
    modalOverlay.style.display = "flex";
  }

  // --- HÀM DUYỆT PHIẾU (ĐÃ SỬA LỖI GIÁ VỐN) ---
  function handleUpdateSlipStatus(slipId) {
    const allProducts = JSON.parse(localStorage.getItem("products")) || [];
    const allSlips = JSON.parse(localStorage.getItem("stockInSlips")) || [];

    const slipToUpdate = allSlips.find((slip) => slip.id === slipId);
    if (!slipToUpdate || slipToUpdate.status === "Đã nhập") return;

    // 1. Cập nhật trạng thái phiếu
    slipToUpdate.status = "Đã nhập";

    // 2. Kiểm tra xem sản phẩm này đã có trong catalog 'products' chưa
    let productInCatalog = allProducts.find(
      (p) => p.name.toLowerCase() === slipToUpdate.productName.toLowerCase()
    );

    if (productInCatalog) {
      // 3a. SỬA: Nếu CÓ RỒI -> KHÔNG cập nhật giá vốn nữa.
      // productInCatalog.cost = slipToUpdate.unitPrice; // Dòng này là LỖI, đã bị xóa.
    } else {
      // 3b. Nếu CHƯA có -> thêm vào catalog VÀ đặt giá vốn
      const newProduct = {
        name: slipToUpdate.productName,
        author: "Chưa rõ",
        category: slipToUpdate.category,
        cost: slipToUpdate.unitPrice, // Chỉ đặt giá vốn khi tạo mới
        image: "/images/default_book_cover.jpg",
      };
      allProducts.push(newProduct);
    }

    // 4. Lưu lại cả hai
    localStorage.setItem("products", JSON.stringify(allProducts));
    localStorage.setItem("stockInSlips", JSON.stringify(allSlips));

    alert("Đã duyệt phiếu và cập nhật kho thành công!");
    loadAllDataFromStorage();
    loadStockInTable();
  }

  // --- 7. GÁN SỰ KIỆN (Giữ nguyên) ---
  addStockInBtn.addEventListener("click", () => {
    editingSlipId = null;
    modalTitle.textContent = "Tạo phiếu nhập hàng";
    loadCategoriesToModal();
    modalOverlay.style.display = "flex";
    dateInput.valueAsDate = new Date();
    modalForm.reset();
    autoCalculateTotal();
    categorySelect.disabled = false;
  });

  cancelBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) closeModal();
  });
  productNameInput.addEventListener("blur", autoCheckProductName);
  unitPriceInput.addEventListener("input", autoCalculateTotal);
  stockInput.addEventListener("input", autoCalculateTotal);
  modalForm.addEventListener("submit", handleFormSubmit);
  paginationList.addEventListener("click", handlePaginationClick);
  tableBody.addEventListener("click", (event) => {
    const target = event.target;
    if (target.classList.contains("stockin-btn-delete")) {
      handleDeleteSlip(target.dataset.id);
    }
    if (target.classList.contains("stockin-edit-btn")) {
      handleUpdateSlipStatus(target.dataset.id);
    }
    if (target.classList.contains("stockin-btn-edit-details")) {
      handleOpenEditModal(target.dataset.id);
    }
  });
  tableBody.addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList.contains("stockin-status-select")) {
      const saveBtn = target.nextElementSibling;
      if (target.value === "Đã nhập") {
        saveBtn.style.display = "inline-block";
        target.classList.remove("stockin-status-pending");
        target.classList.add("stockin-status-completed");
      } else {
        saveBtn.style.display = "none";
        target.classList.remove("stockin-status-completed");
        target.classList.add("stockin-status-pending");
      }
    }
  });
  function handleFilterChange() {
    currentPage = 1;
    loadStockInTable();
  }
  searchNameInput.addEventListener("input", handleFilterChange);
  filterStartDate.addEventListener("change", handleFilterChange);
  filterEndDate.addEventListener("change", handleFilterChange);

  // --- CHẠY LẦN ĐẦU ---
  initializeData();
  loadAllDataFromStorage();
  loadStockInTable();
});