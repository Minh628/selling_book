document.addEventListener("DOMContentLoaded", () => {
  // --- 1. LẤY DOM ELEMENTS (SỬA LỖI) ---
  const inventoryStartDateInput = document.getElementById("inventory-start-date"); // SỬA
  const inventoryEndDateInput = document.getElementById("inventory-end-date");   // SỬA
  const summaryEndDateDisplay = document.getElementById("summary-end-date-display"); // MỚI
  const totalStockDisplay = document.getElementById("total-stock-display");
  const inventoryTableBody = document.getElementById("inventoryTable");
  const searchInput = document.getElementById("searchInput");
  const statusSelect = document.getElementById("search-by-status");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageNumbersDiv = document.getElementById("pageNumbers");

  // Biến trạng thái
  let currentPage = 1;
  const productsPerPage = 6;
  let allStockInSlips = [];
  let allOrders = [];
  let allBooks = []; // Không dùng đến nhưng để đây cho logic cũ

  // --- HÀM HELPER SỬA LỖI NGÀY (Giữ nguyên) ---
  function convertDateToISO(dateStr) {
    if (!dateStr || !dateStr.includes("/")) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    const isoMonth = month.padStart(2, '0');
    const isoDay = day.padStart(2, '0');
    return `${year}-${isoMonth}-${isoDay}`;
  }

  // --- TẢI DATA (Giữ nguyên) ---
  function loadData() {
    allStockInSlips = JSON.parse(localStorage.getItem("stockInSlips")) || [];
    allOrders = JSON.parse(localStorage.getItem("Orders")) || [];
    allBooks = JSON.parse(localStorage.getItem("books")) || [];
  }

  // --- HÀM LẤY SP DUY NHẤT (Giữ nguyên) ---
  function getUniqueProductsFromSlips() {
    const productMap = new Map();
    allStockInSlips.forEach((slip) => {
      if (slip.status === "Đã nhập" && slip.productName) {
        const normalizedName = slip.productName.toLowerCase().trim();
        if (!normalizedName) return;
        if (!productMap.has(normalizedName)) {
          productMap.set(normalizedName, {
            name: slip.productName,
            category: slip.category,
          });
        }
      }
    });
    return Array.from(productMap.values());
  }

  // --- 2. HÀM TÍNH TOÁN CỐT LÕI (SỬA LỖI) ---
  
  // Đổi tên: Hàm này chỉ dùng để tính TỔNG TỒN KHO cho thẻ summary
  function calculatePhysicalStockAsOf(endDate) {
    loadData(); // Tải lại data mới nhất

    const totalStockIn = allStockInSlips
      .filter((slip) => {
        return slip.status === "Đã nhập" && slip.date <= endDate;
      })
      .reduce((total, slip) => total + (slip.quantity || 0), 0);

    const totalStockOut = allOrders
      .filter((order) => {
        const orderDateISO = convertDateToISO(order.date);
        return order.status !== "cancelled" && orderDateISO && orderDateISO <= endDate;
      })
      .reduce((total, order) => {
        const orderTotalQuantity = (order.items || []).reduce(
          (itemSum, item) => itemSum + (item.qty || 0),
          0
        );
        return total + orderTotalQuantity;
      }, 0);

    const physicalStock = totalStockIn - totalStockOut;
    return Math.max(0, physicalStock);
  }

  // --- 3. HÀM CẬP NHẬT GIAO DIỆN (SỬA LỖI) ---
  function updateInventoryDisplay() {
    // SỬA: Đọc cả 2 ngày
    const startDate = inventoryStartDateInput.value;
    const endDate = inventoryEndDateInput.value;

    if (!startDate || !endDate) {
      totalStockDisplay.textContent = "Vui lòng chọn ngày bắt đầu và kết thúc.";
      inventoryTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Vui lòng chọn khoảng thời gian.</td></tr>`;
      return;
    }

    if (endDate < startDate) {
      totalStockDisplay.textContent = "Ngày kết thúc phải sau ngày bắt đầu.";
      inventoryTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Ngày kết thúc không hợp lệ.</td></tr>`;
      return;
    }

    // SỬA: Cập nhật thẻ summary
    const totalStock = calculatePhysicalStockAsOf(endDate); // Tính tồn kho TÍNH ĐẾN NGÀY KẾT THÚC
    totalStockDisplay.textContent = `${totalStock.toLocaleString(
      "vi-VN"
    )} sản phẩm`;
    // Hiển thị ngày cuối kỳ
    const formattedEndDate = new Date(endDate).toLocaleDateString("vi-VN");
    summaryEndDateDisplay.textContent = formattedEndDate;

    // SỬA: Tải bảng theo khoảng thời gian
    loadProductTable(startDate, endDate);
  }

  // --- 4. HÀM TẢI BẢNG (VIẾT LẠI HOÀN TOÀN) ---
  function loadProductTable(startDate, endDate) {
    loadData();
    inventoryTableBody.innerHTML = "";

    const uniqueProducts = getUniqueProductsFromSlips();

    const productsWithStock = uniqueProducts.map((product) => {
      const normalizedProductName = product.name.toLowerCase().trim();

      // === TÍNH NHẬP TRONG KỲ ===
      const periodStockIn = allStockInSlips
        .filter(
          (s) =>
            s.productName &&
            s.productName.toLowerCase().trim() === normalizedProductName &&
            s.status === "Đã nhập" &&
            s.date >= startDate && s.date <= endDate // SỬA: Lọc theo khoảng
        )
        .reduce((sum, s) => sum + s.quantity, 0);

      // === TÍNH XUẤT TRONG KỲ ===
      const periodStockOut = allOrders
        .filter(
          (o) => {
            const orderDateISO = convertDateToISO(o.date);
            return o.status !== "cancelled" && orderDateISO &&
                   orderDateISO >= startDate && orderDateISO <= endDate; // SỬA: Lọc theo khoảng
          }
        )
        .flatMap((o) => o.items || [])
        .filter(
          (item) =>
            item.name &&
            item.name.toLowerCase().trim() === normalizedProductName
        )
        .reduce((sum, item) => sum + (item.qty || 0), 0);

      // === TÍNH TỒN KHO CUỐI KỲ (TÍNH ĐẾN `endDate`) ===
      const totalStockIn = allStockInSlips
        .filter(
          (s) =>
            s.productName &&
            s.productName.toLowerCase().trim() === normalizedProductName &&
            s.status === "Đã nhập" &&
            s.date <= endDate // SỬA: Chỉ tính đến ngày cuối
        )
        .reduce((sum, s) => sum + s.quantity, 0);

      const totalStockOut = allOrders
        .filter(
          (o) => {
            const orderDateISO = convertDateToISO(o.date);
            return o.status !== "cancelled" && orderDateISO &&
                   orderDateISO <= endDate; // SỬA: Chỉ tính đến ngày cuối
          }
        )
        .flatMap((o) => o.items || [])
        .filter(
          (item) =>
            item.name &&
            item.name.toLowerCase().trim() === normalizedProductName
        )
        .reduce((sum, item) => sum + (item.qty || 0), 0);
      
      const physicalStock = totalStockIn - totalStockOut;
      const totalStock = physicalStock; // Tồn cuối kỳ

      let status = "ok";
      if (physicalStock <= 0) {
        status = "out";
      } else if (physicalStock <= 10) {
        status = "low";
      }

      // Trả về tên gốc và các giá trị TRONG KỲ
      return { ...product, name: product.name, periodStockIn, periodStockOut, totalStock, status, physicalStock };
    });

    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = statusSelect.value;
    const filteredProducts = productsWithStock.filter((p) => {
      const nameMatch = p.name.toLowerCase().trim().includes(searchTerm);
      const statusMatch = statusFilter === "all" || p.status === statusFilter;
      // SỬA: Lọc dựa trên Tồn cuối kỳ HOẶC có hoạt động trong kỳ
      const isRelevant = p.physicalStock > 0 || p.periodStockIn > 0 || p.periodStockOut > 0;
      return nameMatch && statusMatch && isRelevant;
    });

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    if (paginatedProducts.length === 0) {
      inventoryTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Không tìm thấy sản phẩm nào.</td></tr>`;
    } else {
      paginatedProducts.forEach((p) => {
        let statusText = "Còn hàng";
        let statusClass = "ok";
        if (p.status === "out") {
          statusText = "Hết hàng";
          statusClass = "out";
        } else if (p.status === "low") {
          statusText = "Sắp hết";
          statusClass = "low";
        }
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td>${p.periodStockIn > 0 ? `+${p.periodStockIn}` : 0}</td>
          <td>${p.periodStockOut > 0 ? `-${p.periodStockOut}` : 0}</td>
          <td><strong>${p.totalStock}</strong></td>
          <td>
            <span class="status ${statusClass}">${statusText}</span>
          </td>
        `;
        inventoryTableBody.appendChild(row);
      });
    }
    setupPagination(filteredProducts.length);
  }

  // --- 5. HÀM PHÂN TRANG (Giữ nguyên) ---
  function setupPagination(totalItems) {
    pageNumbersDiv.innerHTML = "";
    const pageCount = Math.ceil(totalItems / productsPerPage);
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === pageCount || pageCount === 0;
    if (pageCount <= 1) return;
    for (let i = 1; i <= pageCount; i++) {
      const pageElement = document.createElement(
        i === currentPage ? "span" : "button"
      );
      pageElement.className = "page-number";
      if (i === currentPage) {
        pageElement.classList.add("active");
      }
      pageElement.textContent = i;
      pageElement.dataset.page = i;
      pageNumbersDiv.appendChild(pageElement);
    }
  }

  // --- 6. HÀM XỬ LÝ SỰ KIỆN ---
  function handlePaginationClick(event) {
    const target = event.target;
    let newPage = currentPage;
    if (target === prevPageBtn) {
      if (currentPage > 1) newPage--;
    } else if (target === nextPageBtn) {
      const totalFiltered = getFilteredProductsCount(); // SỬA: Gọi hàm đã cập nhật
      const pageCount = Math.ceil(totalFiltered / productsPerPage);
      if (currentPage < pageCount) newPage++;
    } else if (
      target.classList.contains("page-number") &&
      target.tagName === "BUTTON"
    ) {
      newPage = parseInt(target.dataset.page);
    }
    if (newPage !== currentPage) {
      currentPage = newPage;
      updateInventoryDisplay();
    }
  }

  function handleFilterChange() {
    currentPage = 1;
    updateInventoryDisplay();
  }

  // HÀM ĐẾM SỐ LƯỢNG LỌC (VIẾT LẠI HOÀN TOÀN)
  function getFilteredProductsCount() {
    loadData(); // Tải data mới nhất

    const startDate = inventoryStartDateInput.value; // SỬA: Đọc ngày
    const endDate = inventoryEndDateInput.value;   // SỬA: Đọc ngày
    if (!startDate || !endDate || endDate < startDate) return 0;
    
    const uniqueProducts = getUniqueProductsFromSlips();

    const productsWithStock = uniqueProducts.map((product) => {
      // (Dán logic y hệt từ hàm loadProductTable)
      const normalizedProductName = product.name.toLowerCase().trim();

      const periodStockIn = allStockInSlips
        .filter(s =>
            s.productName &&
            s.productName.toLowerCase().trim() === normalizedProductName &&
            s.status === "Đã nhập" &&
            s.date >= startDate && s.date <= endDate
        ).reduce((sum, s) => sum + s.quantity, 0);

      const periodStockOut = allOrders
        .filter(o => {
            const orderDateISO = convertDateToISO(o.date);
            return o.status !== "cancelled" && orderDateISO &&
                   orderDateISO >= startDate && orderDateISO <= endDate;
          }
        ).flatMap((o) => o.items || [])
        .filter(item =>
            item.name &&
            item.name.toLowerCase().trim() === normalizedProductName
        ).reduce((sum, item) => sum + (item.qty || 0), 0);

      const totalStockIn = allStockInSlips
        .filter(s =>
            s.productName &&
            s.productName.toLowerCase().trim() === normalizedProductName &&
            s.status === "Đã nhập" &&
            s.date <= endDate
        ).reduce((sum, s) => sum + s.quantity, 0);

      const totalStockOut = allOrders
        .filter(o => {
            const orderDateISO = convertDateToISO(o.date);
            return o.status !== "cancelled" && orderDateISO &&
                   orderDateISO <= endDate;
          }
        ).flatMap((o) => o.items || [])
        .filter(item =>
            item.name &&
            item.name.toLowerCase().trim() === normalizedProductName
        ).reduce((sum, item) => sum + (item.qty || 0), 0);
      
      const physicalStock = totalStockIn - totalStockOut;
      const totalStock = physicalStock;
      let status = "ok";
      if (physicalStock <= 0) status = "out";
      else if (physicalStock <= 10) status = "low";

      return { ...product, name: product.name, periodStockIn, periodStockOut, totalStock, status, physicalStock };
    });

    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = statusSelect.value;
    const filteredProducts = productsWithStock.filter((p) => {
      const nameMatch = p.name.toLowerCase().trim().includes(searchTerm);
      const statusMatch = statusFilter === "all" || p.status === statusFilter;
      const isRelevant = p.physicalStock > 0 || p.periodStockIn > 0 || p.periodStockOut > 0;
      return nameMatch && statusMatch && isRelevant;
    });
    return filteredProducts.length;
  }

  // --- 7. HÀM KHỞI TẠO & GÁN SỰ KIỆN (SỬA LỖI) ---
  function initialize() {
    // SỬA: Đặt ngày mặc định là đầu tháng và hôm nay
    const today = new Date();
    const todayISO = today.toISOString().split("T")[0];
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split("T")[0];
    
    inventoryStartDateInput.value = firstDayOfMonth;
    inventoryEndDateInput.value = todayISO;

    updateInventoryDisplay(); // Chạy lần đầu

    // SỬA: Lắng nghe cả 2 ô lịch
    inventoryStartDateInput.addEventListener("change", updateInventoryDisplay);
    inventoryEndDateInput.addEventListener("change", updateInventoryDisplay);
    searchInput.addEventListener("input", handleFilterChange);
    statusSelect.addEventListener("change", handleFilterChange);
    prevPageBtn.addEventListener("click", handlePaginationClick);
    nextPageBtn.addEventListener("click", handlePaginationClick);
    pageNumbersDiv.addEventListener("click", handlePaginationClick);
  }

  initialize();
});