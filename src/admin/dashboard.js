document.addEventListener("DOMContentLoaded", function () {
  // === 1. Lấy các phần tử DOM ===
  const revenueCard = document.getElementById("revenue_card");
  const customerCard = document.getElementById("customer_card");
  const orderCard = document.getElementById("order_card");
  const productCard = document.getElementById("product_card");
  const dashboardContainer = document.querySelector(".dashboard_container");

  // === 2. Gán sự kiện cho các thẻ ===
  if (revenueCard) {
    revenueCard.addEventListener("click", showRevenueReport);
  }
  if (customerCard) {
    customerCard.addEventListener("click", showCustomerReport);
  }
  if (orderCard) {
    orderCard.addEventListener("click", showOrderReport);
  }
  if (productCard) {
    productCard.addEventListener("click", showProductReport);
  }

  // === 3. Các hàm Helper ===
  function getReportArea() {
    const existingReport = document.getElementById("dashboard_report_area");
    if (existingReport) {
      existingReport.remove();
    }
    const newReportArea = document.createElement("div");
    newReportArea.id = "dashboard_report_area";
    newReportArea.className = "dashboard_report_container";
    if (dashboardContainer) {
      dashboardContainer.insertAdjacentElement("afterend", newReportArea);
    } else {
      document.querySelector(".admin_main").appendChild(newReportArea);
    }
    return newReportArea;
  }

  const formatVND = (num) =>
    num.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  function parseDate(dateStr) {
    if (!dateStr || !dateStr.includes("/")) return new Date(0);
    const parts = dateStr.split("/");
    if (parts.length !== 3) return new Date(0);
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }

  // === 4. Hàm báo cáo Doanh thu (SỬA LỖI TÍNH LỢI NHUẬN) ===
  function showRevenueReport() {
    const orders = JSON.parse(localStorage.getItem("Orders")) || [];
    // SỬA: Lấy danh sách sản phẩm gốc để biết giá vốn (cost)
    const masterProducts = JSON.parse(localStorage.getItem("products")) || [];

    // Tạo một bản đồ (Map) để tra cứu giá vốn nhanh
    const costMap = new Map();
    masterProducts.forEach(p => {
      costMap.set(p.name.toLowerCase().trim(), p.cost || 0);
    });

    const completedOrders = orders.filter(
      (order) => order.status === "delivered"
    );

    completedOrders.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    const recent3Orders = completedOrders.slice(0, 3);
    let recentOrdersHtml = "";
    if (recent3Orders.length > 0) {
      recentOrdersHtml = `
        <h4>3 đơn hàng đã giao gần nhất</h4>
        <ul class="report-recent-list">
          ${recent3Orders
            .map(
              (o) => `
            <li>
              <span class="recent-id">#${o.id}</span>
              <span class="recent-name">${o.username || "Khách vãng lai"}</span>
              <span class="recent-total">${formatVND(o.total)}</span>
            </li>
          `
            )
            .join("")}
        </ul>
        <hr class="report-divider">
      `;
    }

    // SỬA: Tính toán lợi nhuận thật
    let totalTurnover = 0; // Tổng doanh thu
    let totalCost = 0;     // Tổng giá vốn

    if (completedOrders.length > 0) {
      completedOrders.forEach(order => {
        // 1. Cộng tổng doanh thu
        totalTurnover += (Number(order.total) || 0);

        // 2. Cộng tổng giá vốn
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const normalizedName = item.name.toLowerCase().trim();
            const cost = costMap.get(normalizedName) || 0; // Lấy giá vốn
            totalCost += cost * (item.qty || 0);
          });
        }
      });
    }

    // Lợi nhuận thật = Doanh thu - Giá vốn
    const profit = totalTurnover - totalCost;

    const reportDiv = getReportArea();
    reportDiv.innerHTML = `
      <h2>Báo cáo Doanh thu Chi tiết</h2>
      ${recentOrdersHtml}
      <p>Dựa trên <strong>${completedOrders.length}</strong> đơn hàng "Đã giao thành công".</p>
      
      <div class="report-value">
        <span>Tổng tiền thu về (từ các đơn đã giao):</span>
        <strong>${formatVND(totalTurnover)}</strong>
      </div>
      
      <div class="report-value profit">
        <span>Lợi nhuận thật (Doanh thu - Giá vốn):</span>
        <strong>${formatVND(profit)}</strong>
      </div>
    `;
  }

  // === 5. Hàm báo cáo Khách hàng (Giữ nguyên, không có lỗi) ===
  function showCustomerReport() {
    const orders = JSON.parse(localStorage.getItem("Orders")) || [];
    const recentOrders = orders
      .filter((o) => o.status === "shipping" || o.status === "delivered")
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));
    const uniqueRecentNames = [
      ...new Set(recentOrders.map((o) => o.username || "Khách vãng lai")),
    ];
    const top3Recent = uniqueRecentNames.slice(0, 3);
    let recentHtml =
      top3Recent.length > 0
        ? `<ul>${top3Recent.map((name) => `<li>${name}</li>`).join("")}</ul>`
        : "<p>Chưa có đơn hàng nào.</p>";
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    const customerSpending = new Map();
    for (const order of deliveredOrders) {
      const name = order.username || "Khách vãng lai";
      const currentSpending = customerSpending.get(name) || 0;
      customerSpending.set(name, currentSpending + (Number(order.total) || 0));
    }
    const spendingArray = [...customerSpending.entries()].sort(
      (a, b) => b[1] - a[1]
    );
    let topSpenderHtml = "<p>Chưa có ai mua hàng thành công.</p>";
    if (spendingArray.length > 0) {
      const topSpender = spendingArray[0];
      topSpenderHtml = `
        <div class="top-spender">
          <strong>${topSpender[0]}</strong>
          <span class="profit-text">${formatVND(topSpender[1])}</span>
        </div>
      `;
    }
    const reportDiv = getReportArea();
    reportDiv.innerHTML = `
      <h2>Báo cáo Khách hàng</h2>
      <div class="report-columns">
        <div class="report-column">
          <h4>3 Khách hàng Gần đây Nhất</h4>
          <p class="note">(Tính đơn đang giao & đã giao)</p>
          ${recentHtml}
        </div>
        <div class="report-column">
          <h4>Khách hàng Mua nhiều Nhất</h4>
          <p class="note">(Chỉ tính đơn đã giao thành công)</p>
          ${topSpenderHtml}
        </div>
      </div>
    `;
  }

  // === 6. Hàm báo cáo Đơn hàng (Giữ nguyên, không có lỗi) ===
  function showOrderReport() {
    const orders = JSON.parse(localStorage.getItem("Orders")) || [];
    const sortedByValue = [...orders].sort(
      (a, b) => (Number(b.total) || 0) - (Number(a.total) || 0)
    );
    const top3Orders = sortedByValue.slice(0, 3);
    let topOrdersHtml = "<h4>3 đơn hàng giá trị cao nhất</h4>";
    if (top3Orders.length > 0) {
      topOrdersHtml += `
        <ul class="report-recent-list"> 
          ${top3Orders
            .map(
              (o) => `
            <li>
              <span class="recent-id">#${o.id}</span>
              <span class="recent-name">${o.username || "Khách vãng lai"}</span>
              <span class="recent-total">${formatVND(o.total)}</span>
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    } else {
      topOrdersHtml += "<p>Chưa có đơn hàng nào.</p>";
    }
    const totalAllOrders = orders.length;
    const totalDeliveredOrders = orders.filter(
      (o) => o.status === "delivered"
    ).length;
    const reportDiv = getReportArea();
    reportDiv.innerHTML = `
      <h2>Báo cáo Đơn hàng</h2>
      <div class="report-columns">
        <div class="report-column">
          ${topOrdersHtml}
        </div>
        <div class="report-column">
          <h4>Thống kê Số lượng</h4>
          <div class="stat-box">
            <span>Tổng số đơn (tất cả trạng thái)</span>
            <strong>${totalAllOrders}</strong>
          </div>
          <div class="stat-box delivered">
            <span>Số đơn đã giao thành công</span>
            <strong>${totalDeliveredOrders}</strong>
          </div>
        </div>
      </div>
    `;
  }

  // === 7. Hàm báo cáo Sản phẩm & Kho (SỬA LỖI KHO HÀNG) ===
  function showProductReport() {
    // --- Lấy dữ liệu ---
    const orders = JSON.parse(localStorage.getItem("Orders")) || [];
    // SỬA: Bỏ `inventoryData`, đọc từ `stockInSlips`
    const stockInSlips = JSON.parse(localStorage.getItem("stockInSlips")) || [];

    // --- Task 1: 3 sản phẩm bán chạy nhất (Giữ nguyên) ---
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    const productSales = new Map();
    for (const order of deliveredOrders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const name = item.name.toLowerCase().trim(); // Chuẩn hóa
          const qty = Number(item.qty) || 0;
          const currentSales = productSales.get(name) || 0;
          productSales.set(name, currentSales + qty);
        }
      }
    }
    const sortedProducts = [...productSales.entries()].sort(
      (a, b) => b[1] - a[1]
    );
    const top3Products = sortedProducts.slice(0, 3);
    let topProductsHtml = "<h4>3 sản phẩm bán chạy nhất</h4>";
    if (top3Products.length > 0) {
      topProductsHtml += `
        <ul class="report-recent-list product-sales-list">
          ${top3Products
            .map(
              (p) => `
            <li>
              <span class="recent-name">${p[0]}</span> <span class="recent-total">${p[1]}</span> </li>
          `
            )
            .join("")}
        </ul>
        <p class="note">(Chỉ tính từ đơn 'Đã giao thành công')</p>
      `;
    } else {
      topProductsHtml += "<p>Chưa có sản phẩm nào được bán.</p>";
    }

    // --- SỬA: Task 2: Tổng số sản phẩm trong kho (Tồn kho Vật lý) ---
    // (Dùng chung logic với inventory.js, tính đến 'hôm nay')
    const today = new Date();
    
    // 1. Tính tổng nhập
    const totalStockIn = stockInSlips
      .filter(slip => slip.status === "Đã nhập" && new Date(slip.date) <= today)
      .reduce((sum, slip) => sum + (slip.quantity || 0), 0);

    // 2. Tính tổng xuất (tất cả đơn không bị hủy)
    const totalStockOut = orders
      .filter(order => order.status !== "cancelled" && parseDate(order.date) <= today)
      .flatMap(order => order.items || [])
      .reduce((sum, item) => sum + (item.qty || 0), 0);
    
    // 3. Tồn kho = Nhập - Xuất
    const totalStock = Math.max(0, totalStockIn - totalStockOut);

    // --- Task 3: Tổng số sản phẩm đã bán (Giữ nguyên) ---
    const totalUnitsSold = [...productSales.values()].reduce(
      (sum, qty) => sum + qty,
      0
    );

    // --- Hiển thị kết quả ---
    const reportDiv = getReportArea();
    reportDiv.innerHTML = `
      <h2>Báo cáo Sản phẩm & Kho hàng</h2>
      <div class="report-columns">
        <div class="report-column">
          ${topProductsHtml}
        </div>
        <div class="report-column">
          <h4>Thống kê Kho hàng</h4>
          <div class="stat-box"> 
            <span>Tổng Tồn kho Vật lý (hiện tại)</span>
            <strong>${totalStock}</strong>
          </div>
          <div class="stat-box delivered"> 
            <span>Tổng số sách đã bán (đã giao)</span>
            <strong>${totalUnitsSold}</strong>
          </div>
        </div>
      </div>
    `;
  }
});