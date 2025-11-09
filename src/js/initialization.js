// js/initialization.js

(function () {
  // IIFE: Hàm tự chạy ngay lập tức khi file được tải
  console.log("🔍 Đang kiểm tra và khởi tạo dữ liệu...");

  // --- DỮ LIỆU GỐC ---

  // 1. DANH MỤC SẢN PHẨM GỐC (Catalog - Không chứa stock và giá bán)
  // Dùng làm nguồn dữ liệu chính để tạo ra danh sách sản phẩm hoàn chỉnh.
  const defaultProducts = [
    // ... (dữ liệu sản phẩm gốc không đổi)
    {
      name: "Nhà Giả Kim",
      author: "Paulo Coelho",
      category: "Tiểu thuyết",
      cost: 30000,
      image: "./images/Nhà giả kim.webp",
    },
    {
      name: "Đắc Nhân Tâm",
      author: "Dale Carnegie",
      category: "Kỹ năng sống",
      cost: 35000,
      image: "./images/Đắc nhân tâm.jpg",
    },
    {
      name: "Muôn Kiếp Nhân Sinh",
      author: "Nguyên Phong",
      category: "Tâm linh",
      cost: 30000,
      image: "./images/Muôn Kiếp Nhân Sinh.jpeg",
    },
    {
      name: "Sapiens: Lược Sử Loài Người",
      author: "Yuval Noah Harari",
      category: "Khoa học",
      cost: 25000,
      image: "./images/Sapiens Lược Sử Loài Người.jpg",
    },
    {
      name: "Cây Cam Ngọt Của Tôi",
      author: "José Mauro de Vasconcelos",
      category: "Văn học",
      cost: 50000,
      image: "./images/Cây Cam Ngọt Của Tôi.webp",
    },
    {
      name: "Tội Ác Và Trừng Phạt",
      author: "Fyodor Dostoevsky",
      category: "Văn học",
      cost: 60000,
      image: "./images/Tội Ác Và Trừng Phạt.jpg",
    },
    {
      name: "Người Nam Châm",
      author: "Jack Canfield",
      category: "Kỹ năng sống",
      cost: 40000,
      image: "./images/Người Nam Châm.webp",
    },
    {
      name: "Để Con Được Ốm",
      author: "BS. Trí Đoàn",
      category: "Nuôi dạy con",
      cost: 50000,
      image: "./images/Để Con Được Ốm.jpg",
    },
    {
      name: "Hiểu Về Trái Tim",
      author: "Minh Niệm",
      category: "Tâm linh",
      cost: 35000,
      image: "./images/Hiểu Về Trái Tim.webp",
    },
    {
      name: "Vũ Trụ Trong Vỏ Hạt Dẻ",
      author: "Stephen Hawking",
      category: "Khoa học",
      cost: 60000,
      image: "./images/Vũ Trụ Trong Vỏ Hạt Dẻ.jpg",
    },
    {
      name: "Bố Già",
      author: "Mario Puzo",
      category: "Tiểu thuyết",
      cost: 55000,
      image: "./images/Bố Già.webp",
    },
    {
      name: "Cha Giàu Cha Nghèo",
      author: "Robert T. Kiyosaki",
      category: "Kinh doanh",
      cost: 42000,
      image: "./images/Cha Giàu Cha Nghèo.jpg",
    },
  ];

  // 2. LỊCH SỬ NHẬP KHO BAN ĐẦU (Transactions - Để tính toán stock)
  const defaultStockSlips = [
    {
      id: "default-1",
      productName: "Nhà Giả Kim",
      category: "Tiểu thuyết",
      date: "2025-11-01",
      unitPrice: 30000,
      quantity: 50,
      totalValue: 1500000,
      status: "Đã nhập",
    },
    {
      id: "default-2",
      productName: "Đắc Nhân Tâm",
      category: "Kỹ năng sống",
      date: "2025-11-01",
      unitPrice: 35000,
      quantity: 100,
      totalValue: 3500000,
      status: "Đã nhập",
    },
    {
      id: "default-3",
      productName: "Muôn Kiếp Nhân Sinh",
      category: "Tâm linh",
      date: "2025-11-01",
      unitPrice: 30000,
      quantity: 70,
      totalValue: 2100000,
      status: "Đã nhập",
    },
    {
      id: "default-4",
      productName: "Sapiens: Lược Sử Loài Người",
      category: "Khoa học",
      date: "2025-11-01",
      unitPrice: 25000,
      quantity: 40,
      totalValue: 1000000,
      status: "Đã nhập",
    },
    {
      id: "default-5",
      productName: "Cây Cam Ngọt Của Tôi",
      category: "Văn học",
      date: "2025-11-01",
      unitPrice: 50000,
      quantity: 60,
      totalValue: 3000000,
      status: "Đã nhập",
    },
    {
      id: "default-6",
      productName: "Tội Ác Và Trừng Phạt",
      category: "Văn học",
      date: "2025-11-01",
      unitPrice: 60000,
      quantity: 30,
      totalValue: 1800000,
      status: "Đã nhập",
    },
    {
      id: "default-7",
      productName: "Người Nam Châm",
      category: "Kỹ năng sống",
      date: "2025-11-01",
      unitPrice: 40000,
      quantity: 80,
      totalValue: 3200000,
      status: "Đã nhập",
    },
    {
      id: "default-8",
      productName: "Để Con Được Ốm",
      category: "Nuôi dạy con",
      date: "2025-11-01",
      unitPrice: 50000,
      quantity: 45,
      totalValue: 2250000,
      status: "Đã nhập",
    },
    {
      id: "default-9",
      productName: "Hiểu Về Trái Tim",
      category: "Tâm linh",
      date: "2025-11-01",
      unitPrice: 35000,
      quantity: 55,
      totalValue: 1925000,
      status: "Đã nhập",
    },
    {
      id: "default-10",
      productName: "Vũ Trụ Trong Vỏ Hạt Dẻ",
      category: "Khoa học",
      date: "2025-11-01",
      unitPrice: 60000,
      quantity: 25,
      totalValue: 1500000,
      status: "Đã nhập",
    },
    {
      id: "default-11",
      productName: "Bố Già",
      category: "Tiểu thuyết",
      date: "2025-11-01",
      unitPrice: 55000,
      quantity: 35,
      totalValue: 1925000,
      status: "Đã nhập",
    },
    {
      id: "default-12",
      productName: "Cha Giàu Cha Nghèo",
      category: "Kinh doanh",
      date: "2025-11-01",
      unitPrice: 42000,
      quantity: 90,
      totalValue: 3780000,
      status: "Đã nhập",
    },
  ];

  // --- LOGIC TÍNH TOÁN ĐỘNG ---

  /**
   * COMMENT: Bắt đầu phần logic chính để tạo dữ liệu sách (`books`) một cách tự động.
   * Thay vì dùng dữ liệu cứng, chúng ta sẽ tính toán số lượng tồn kho và giá bán
   * dựa trên các dữ liệu gốc (phiếu nhập, quy tắc lợi nhuận).
   * Điều này đảm bảo dữ liệu luôn đồng nhất trên toàn hệ thống.
   */

  // 1. TÍNH TOÁN SỐ LƯỢNG TỒN KHO (QUANTITY)
  // Từ các phiếu nhập kho, tính tổng số lượng cho mỗi sản phẩm.
  function calculateInitialStock(slips) {
    const stockMap = new Map();
    slips.forEach((slip) => {
      if (slip.status === "Đã nhập") {
        const currentQuantity = stockMap.get(slip.productName) || 0;
        stockMap.set(slip.productName, currentQuantity + slip.quantity);
      }
    });
    return stockMap;
  }

  // 2. TÍNH TOÁN GIÁ BÁN (SELLING PRICE)
  // Logic này được sao chép từ `manage-price.js` để đảm bảo tính nhất quán.
  // Nó xác định giá bán dựa trên hệ thống lợi nhuận 3 cấp: Sản phẩm > Loại > Toàn cục.

  function getProfitRates() {
    const globalProfitRate =
      JSON.parse(localStorage.getItem("globalProfitRate")) || 20;
    const categoryProfitRates =
      JSON.parse(localStorage.getItem("categoryProfitRates")) || {
        "Tiểu thuyết": 20, "Kỹ năng sống": 25, "Tâm linh": 30, "Khoa học": 22,
        "Văn học": 28, "Nuôi dạy con": 26, "Kinh doanh": 35,
      };
    const productProfitRates =
      JSON.parse(localStorage.getItem("productProfitRates")) || {};
    return { globalProfitRate, categoryProfitRates, productProfitRates };
  }

  function getEffectiveProfit(product, rates) {
    const { name, category } = product;
    if (rates.productProfitRates.hasOwnProperty(name))
      return rates.productProfitRates[name];
    if (rates.categoryProfitRates.hasOwnProperty(category))
      return rates.categoryProfitRates[category];
    return rates.globalProfitRate;
  }

  function calculateSellingPrice(product, rates) {
    const profitPercent = getEffectiveProfit(product, rates);
    // Làm tròn giá bán đến hàng nghìn gần nhất cho đẹp
    const rawPrice = product.cost + (product.cost * profitPercent) / 100;
    return Math.round(rawPrice / 1000) * 1000;
  }

  // 3. TẠO MẢNG `books` HOÀN CHỈNH
  function createFinalBooksArray() {
    console.log("🔄 Bắt đầu tạo mảng 'books' tự động...");

    const stockInSlips =
      JSON.parse(localStorage.getItem("stockInSlips")) || defaultStockSlips;
    const initialStock = calculateInitialStock(stockInSlips);
    const profitRates = getProfitRates();
    const productSellingPrices = {}; // Lưu giá bán để đồng bộ với admin

    const finalBooks = defaultProducts.map((p, index) => {
      const quantity = initialStock.get(p.name) || 0;
      const price = calculateSellingPrice(p, profitRates);

      // Lưu giá bán vào object riêng để trang admin có thể sử dụng
      productSellingPrices[p.name] = price;

      return {
        id: index + 1, // ID tự tăng
        title: p.name,
        author: p.author,
        category: p.category,
        price: price, // Giá bán đã được tính toán
        image: p.image,
        quantity: quantity, // Số lượng tồn kho đã được tính toán
        status: "Visible", // Mặc định là 'Visible'
      };
    });

    // COMMENT: Lưu lại danh sách giá bán đã được tính toán.
    // Trang `manage-price.js` sẽ đọc từ đây để hiển thị, đảm bảo sự đồng bộ.
    if (!localStorage.getItem("productSellingPrices")) {
        localStorage.setItem("productSellingPrices", JSON.stringify(productSellingPrices));
    }


    console.log("✅ Mảng 'books' đã được tạo thành công!");
    return finalBooks;
  }

  // --- KHỞI TẠO LOCALSTORAGE ---

  // Chỉ khởi tạo nếu dữ liệu chưa tồn tại
  if (!localStorage.getItem("products")) {
    console.log("⚡ Đang khởi tạo dữ liệu sản phẩm gốc (catalog)...");
    // Chỉ lưu các trường cơ bản, không có image
    const catalogProducts = defaultProducts.map(({ image, ...rest }) => rest);
    localStorage.setItem("products", JSON.stringify(catalogProducts));
  }
  if (!localStorage.getItem("stockInSlips")) {
    console.log("⚡ Đang khởi tạo dữ liệu phiếu nhập gốc...");
    localStorage.setItem("stockInSlips", JSON.stringify(defaultStockSlips));
  }
  if (!localStorage.getItem("Orders")) {
    console.log("⚡ Đang khởi tạo dữ liệu đơn hàng rỗng...");
    localStorage.setItem("Orders", JSON.stringify([]));
  }

  // COMMENT: Luôn luôn tạo lại 'books' khi khởi tạo để đảm bảo dữ liệu mới nhất.
  // Nếu 'books' chưa có, hoặc logic cập nhật trong tương lai cần làm mới,
  // việc chạy hàm này mỗi lần sẽ đảm bảo tính đúng đắn.
  // Để tránh ghi đè dữ liệu người dùng đã thay đổi (ví dụ: admin thay đổi giá),
  // chúng ta chỉ tạo `books` nếu nó chưa tồn tại.
  if (!localStorage.getItem("books")) {
    console.log("📚 Tạo và lưu trữ danh sách sách (books) lần đầu...");
    const books = createFinalBooksArray();
    localStorage.setItem("books", JSON.stringify(books));
  }

  console.log("✅ Hoàn tất kiểm tra và khởi tạo dữ liệu.");
})();
