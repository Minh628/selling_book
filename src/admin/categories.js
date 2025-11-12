document.addEventListener("DOMContentLoaded", () => {
  // --- 1. DOM Elements ---
  const openModalBtn = document.getElementById("openCategoryModal");
  const popupOverlay = document.getElementById("popupOverlay");
  const cancelPopupBtn = document.getElementById("cancelPopup");
  const popupForm = document.getElementById("popupForm");
  const popupTitle = document.querySelector(".popup h3");
  const categoryTableBody = document.getElementById("categoryTableBody");
  const searchInput = document.getElementById("searchCategory");
  const paginationContainer = document.getElementById("pagination");

  // --- 2. Form Fields ---
  const categoryNameInput = document.getElementById("categoryName");
  const categoryDescInput = document.getElementById("categoryDesc");
  const categoryStatusInput = document.getElementById("categoryStatus");
  const categoryImageInput = document.getElementById("categoryImage");
  const imagePreview = document.getElementById("imagePreview");
  const defaultPlaceholder =
    "https://placehold.co/400x200/eee/ccc?text=Chon+Anh";

  // --- 3. State ---
  let categories = [];
  let isEditMode = false;
  let editCategoryId = null;
  let currentPage = 1;
  const ITEMS_PER_PAGE = 5;
  let currentImageDataUrl = null;

  // --- 4. DATA HANDLING ---
  const loadCategories = () => {
    const stored = localStorage.getItem("categories");
    categories = stored ? JSON.parse(stored) : [];
  };

  const saveCategories = () => {
    localStorage.setItem("categories", JSON.stringify(categories));
  };

  // --- ▼▼▼ HÀM ĐÃ ĐƯỢC SỬA LỖI ▼▼▼ ---
  function getDynamicCategoryImage(categoryName) {
    const nameLower = categoryName.toLowerCase();

    // Dùng đường dẫn tương đối từ admin/categories.html
    // (Lùi ra 1 cấp -> ../images/...)
    if (nameLower.includes("tiểu thuyết")) {
      return "../images/Bố Già.webp";
    }
    if (nameLower.includes("khoa học")) {
      return "../images/Vũ Trụ Trong Vỏ Hạt Dẻ.jpg";
    }
    if (nameLower.includes("kỹ năng sống")) {
      return "../images/Đắc nhân tâm.jpg";
    }
    if (nameLower.includes("tâm linh")) {
      return "../images/Hiểu về trái tim.webp";
    }
    if (nameLower.includes("nuôi dạy con")) {
      return "../images/Để Con Được Ốm.jpg";
    }
    if (nameLower.includes("kinh doanh")) {
      return "../images/Cha Giàu Cha Nghèo.jpg";
    }
    if (nameLower.includes("văn học")) {
      return "../images/Cây Cam Ngọt Của Tôi.webp";
    }

    // Ảnh dự phòng chung (nếu không khớp)
    return `https://placehold.co/300x420/c49b66/fff?text=${encodeURIComponent(
      categoryName
    )}`;
  }


  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log(`Ảnh gốc: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // Cài đặt nén (ảnh danh mục có thể nén nhỏ hơn)
      const options = {
        maxSizeMB: 0.3, // Nén xuống dưới 0.3MB
        maxWidthOrHeight: 600, // Chiều rộng tối đa 600px
        useWebWorker: true,
      };

      try {
        // 1. Chờ nén ảnh
        const compressedFile = await imageCompression(file, options);
        console.log(`Ảnh đã nén: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        // 2. Đọc file ĐÃ NÉN thành Base64
        const reader = new FileReader();
        reader.onload = (e) => {
          currentImageDataUrl = e.target.result; // Lưu Base64 ĐÃ NÉN
          imagePreview.src = e.target.result;
          imagePreview.style.display = "block";
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Lỗi nén ảnh:", error);
        alert("Lỗi nén ảnh. Vui lòng thử ảnh khác.");
        currentImageDataUrl = null; // Reset nếu lỗi
        imagePreview.src = defaultPlaceholder;
        imagePreview.style.display = "block";
      }
    }
  };

  // --- 5. DATA MIGRATION ---
  const migrateCategoriesFromBooks = () => {
    const books = JSON.parse(localStorage.getItem("books")) || [];
    const products = JSON.parse(localStorage.getItem("products")) || [];
    if (books.length === 0 && products.length === 0) return;

    const existingCategoryNames = new Set(
      categories.map((c) => c.name.toLowerCase())
    );

    const categoriesFromBooks = books.map((b) => b.category);
    const categoriesFromProducts = products.map((p) => p.category);
    const uniqueCategories = [
      ...new Set([...categoriesFromBooks, ...categoriesFromProducts]),
    ];

    let newCategoriesAdded = false;
    uniqueCategories.forEach((categoryName) => {
      if (
        categoryName &&
        !existingCategoryNames.has(categoryName.toLowerCase())
      ) {
        const newCategory = {
          id: Date.now() + Math.random(),
          name: categoryName,
          description: "Danh mục được tạo tự động từ dữ liệu hiện có",
          visible: true,
          imageUrl: getDynamicCategoryImage(categoryName), // Tự động gán ảnh
        };
        categories.push(newCategory);
        newCategoriesAdded = true;
      }
    });
    if (newCategoriesAdded) saveCategories();
  };

  // --- 6. RENDERING ---
  const renderTable = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredCategories = categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm)
    );
    categoryTableBody.innerHTML = "";

    const paginatedCategories = filteredCategories.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    if (paginatedCategories.length === 0 && currentPage > 1) {
      currentPage--;
      renderTable();
      return;
    }

    paginatedCategories.forEach((cat) => {
      const row = document.createElement("tr");
      row.dataset.id = cat.id;

      const statusBadge = cat.visible
        ? `<span class="status-badge status-visible">Hiển thị</span>`
        : `<span class="status-badge status-hidden">Ẩn</span>`;
      const imageCell = cat.imageUrl
        ? `<img src="${cat.imageUrl}" alt="${cat.name}" style="width: 70px; height: 40px; object-fit: cover; border-radius: 4px;">`
        : "Không có ảnh";

      row.innerHTML = `
        <td>${cat.name}</td>
        <td>${cat.description}</td>
        <td>${imageCell}</td>
        <td>${statusBadge}</td>
        <td class="actions">
          <button class="action-btn btn-edit">Sửa</button>
          <button class="action-btn btn-toggle-visibility">${
            cat.visible ? "Ẩn" : "Hiện"
          }</button>
          <button class="action-btn btn-delete">Xóa</button>
        </td>
      `;
      categoryTableBody.appendChild(row);
    });
    renderPagination(filteredCategories.length);
  };

  const renderPagination = (totalItems) => {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return;
    const createButton = (label, page, disabled = false, active = false) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      if (disabled) btn.disabled = true;
      if (active) btn.classList.add("active");
      btn.addEventListener("click", () => {
        if (page !== currentPage && !disabled) {
          currentPage = page;
          renderTable();
        }
      });
      paginationContainer.appendChild(btn);
    };
    createButton("«", currentPage - 1, currentPage === 1);
    const visiblePages = [];
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) visiblePages.push(i);
    } else {
      visiblePages.push(1, 2);
      if (currentPage > 4) visiblePages.push("...");
      for (
        let i = Math.max(3, currentPage - 2);
        i <= Math.min(totalPages - 2, currentPage + 2);
        i++
      ) {
        visiblePages.push(i);
      }
      if (currentPage < totalPages - 3) visiblePages.push("...");
      visiblePages.push(totalPages - 1, totalPages);
    }
    visiblePages.forEach((p) => {
      if (p === "...") {
        const span = document.createElement("span");
        span.textContent = "...";
        span.classList.add("pagination-ellipsis");
        paginationContainer.appendChild(span);
      } else {
        createButton(p, p, false, p === currentPage);
      }
    });
    createButton("»", currentPage + 1, currentPage === totalPages);
  };

  // --- 7. MODAL (POPUP) HANDLING ---
  const openPopup = (isEdit = false, category = null) => {
    isEditMode = isEdit;
    popupForm.reset();
    currentImageDataUrl = null;
    imagePreview.style.display = "none";
    // Luôn đảm bảo nút upload được hiển thị
    categoryImageInput.style.display = "block";
    document.querySelector('label[for="categoryImage"]').style.display =
      "block";

    if (isEdit && category) {
      // --- CHẾ ĐỘ SỬA ---
      popupTitle.textContent = "Chỉnh sửa danh mục";
      editCategoryId = category.id;
      categoryNameInput.value = category.name;
      categoryDescInput.value = category.description;
      categoryStatusInput.value = category.visible ? "visible" : "hidden";

      // HIỂN THỊ ẢNH HIỆN TẠI (Dù là ảnh hardcode hay ảnh upload)
      if (category.imageUrl) {
        currentImageDataUrl = category.imageUrl;
        imagePreview.src = category.imageUrl;
        imagePreview.style.display = "block";
      } else {
        imagePreview.src = defaultPlaceholder;
        imagePreview.style.display = "block";
      }
    } else {
      // --- CHẾ ĐỘ TẠO MỚI ---
      popupTitle.textContent = "Tạo danh mục mới";
      editCategoryId = null;
      imagePreview.src = defaultPlaceholder;
      imagePreview.style.display = "block";
    }

    popupOverlay.classList.add("active");
  };

  const closePopup = () => {
    popupOverlay.classList.remove("active");
    categoryImageInput.value = null;
    currentImageDataUrl = null;
  };

  // --- 8. LOGIC ĐỒNG BỘ DỮ LIỆU ---
  function syncCategoryNameUpdate(oldName, newName) {
    const keysToUpdate = ["products", "books", "stockInSlips"];
    const fieldToUpdate = {
      products: "category",
      books: "category",
      stockInSlips: "category",
    };
    keysToUpdate.forEach((key) => {
      let data = JSON.parse(localStorage.getItem(key)) || [];
      let updated = false;
      data.forEach((item) => {
        const categoryField = fieldToUpdate[key];
        if (key === "books" && item.title === oldName) {
          item.title = newName;
          updated = true;
        }
        if (
          item[categoryField] &&
          item[categoryField].toLowerCase() === oldName.toLowerCase()
        ) {
          item[categoryField] = newName;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    });
  }

  function isCategoryInUse(categoryName) {
    const books = JSON.parse(localStorage.getItem("books")) || [];
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const nameLower = categoryName.toLowerCase();
    const inBooks = books.some(
      (b) => b.category && b.category.toLowerCase() === nameLower
    );
    const inProducts = products.some(
      (p) => p.category && p.category.toLowerCase() === nameLower
    );
    return inBooks || inProducts;
  }

  function syncBookStatusWithCategory(categoryName, isVisible) {
    let books = JSON.parse(localStorage.getItem("books")) || [];
    let updated = false;
    const newStatus = isVisible ? "Visible" : "Hidden";
    const nameLower = categoryName.toLowerCase();
    books.forEach((book) => {
      if (book.category && book.category.toLowerCase() === nameLower) {
        if (book.status !== newStatus) {
          book.status = newStatus;
          updated = true;
        }
      }
    });
    if (updated) {
      localStorage.setItem("books", JSON.stringify(books));
    }
  }

  // --- 9. EVENT LISTENERS ---
  openModalBtn.addEventListener("click", () => openPopup(false));
  cancelPopupBtn.addEventListener("click", closePopup);
  popupOverlay.addEventListener("click", (e) => {
    if (e.target === popupOverlay) {
      closePopup();
    }
  });

  categoryImageInput.addEventListener("change", handleImageUpload);

  // THAY THẾ HÀM CŨ BẰNG HÀM NÀY
  popupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = categoryNameInput.value.trim();
    const description = categoryDescInput.value.trim();
    const isVisible = categoryStatusInput.value === "visible";

    if (!name) {
      alert("Tên danh mục không được để trống.");
      return;
    }

    if (isEditMode && editCategoryId !== null) {
      // --- CHẾ ĐỘ SỬA ---
      const category = categories.find((cat) => cat.id === editCategoryId);
      if (category) {
        const oldName = category.name;
        if (oldName !== name) {
          syncCategoryNameUpdate(oldName, name);
        }
        category.name = name;
        category.description = description;
        category.visible = isVisible;

        // 'currentImageDataUrl' giờ đã là ảnh cũ (từ openPopup)
        // hoặc ảnh mới ĐÃ NÉN (từ handleImageUpload)
        category.imageUrl = currentImageDataUrl;
      }
    } else {
      // --- CHẾ ĐỘ TẠO MỚI ---
      if (
        categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())
      ) {
        alert("Tên danh mục này đã tồn tại.");
        return;
      }
      categories.push({
        id: Date.now(),
        name,
        description,
        visible: isVisible,
        // 'currentImageDataUrl' là ảnh mới ĐÃ NÉN (nếu có) hoặc null
        imageUrl: currentImageDataUrl,
      });
    }

    // --- THÊM TRY...CATCH ĐỂ BẮT LỖI QUOTA ---
    try {
      saveCategories();
      renderTable();
      closePopup();
    } catch (err) {
      if (err.name === "QuotaExceededError") {
        alert(
          "LỖI: HẾT DUNG LƯỢNG! Không thể lưu. LocalStorage đã đầy, kể cả khi đã nén ảnh. Bạn cần xóa bớt dữ liệu (F12 > Application > Clear)."
        );
      } else {
        alert("Lỗi không xác định khi lưu: " + err.message);
      }
    }
  });
  
  categoryTableBody.addEventListener("click", (e) => {
    const target = e.target;
    const row = target.closest("tr");
    if (!row) return;

    const categoryId = parseFloat(row.dataset.id);
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return;

    if (target.classList.contains("btn-edit")) {
      openPopup(true, category);
    } else if (target.classList.contains("btn-delete")) {
      if (isCategoryInUse(category.name)) {
        alert(
          `Không thể xóa danh mục "${category.name}" vì vẫn còn sản phẩm thuộc danh mục này.`
        );
        return;
      }
      if (
        confirm(
          `Bạn có chắc chắn muốn xóa danh mục "${category.name}"? Đây là hành động không thể hoàn tác.`
        )
      ) {
        categories = categories.filter((cat) => cat.id !== categoryId);
        saveCategories();
        renderTable();
      }
    } else if (target.classList.contains("btn-toggle-visibility")) {
      category.visible = !category.visible;
      syncBookStatusWithCategory(category.name, category.visible);
      saveCategories();
      renderTable();
    }
  });

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  });

  // --- 10. INITIALIZATION ---
  loadCategories();
  migrateCategoriesFromBooks();
  renderTable();
});
