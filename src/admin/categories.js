// Dán đè toàn bộ file categories.js
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const openModalBtn = document.getElementById("openCategoryModal");
  const popupOverlay = document.getElementById("popupOverlay");
  const cancelPopupBtn = document.getElementById("cancelPopup");
  const popupForm = document.getElementById("popupForm");
  const popupTitle = document.querySelector(".popup h3");
  const categoryTableBody = document.getElementById("categoryTableBody");
  const searchInput = document.getElementById("searchCategory");
  const paginationContainer = document.getElementById("pagination");

  // Form Fields
  const categoryNameInput = document.getElementById("categoryName");
  const categoryDescInput = document.getElementById("categoryDesc");
  const categoryStatusInput = document.getElementById("categoryStatus");

  // State
  let categories = [];
  let isEditMode = false;
  let editCategoryId = null;
  let currentPage = 1;
  const ITEMS_PER_PAGE = 5;

  // --- DATA HANDLING ---
  const loadCategories = () => {
    const stored = localStorage.getItem("categories");
    categories = stored ? JSON.parse(stored) : [];
  };

  const saveCategories = () => {
    localStorage.setItem("categories", JSON.stringify(categories));
  };

  // --- DATA MIGRATION (Giữ nguyên) ---
  const migrateCategoriesFromBooks = () => {
    // SỬA: Đọc từ 'books' (sản phẩm bán) và 'products' (sản phẩm gốc)
    const books = JSON.parse(localStorage.getItem("books")) || [];
    const products = JSON.parse(localStorage.getItem("products")) || [];
    
    if (books.length === 0 && products.length === 0) return;

    const existingCategoryNames = new Set(categories.map(c => c.name.toLowerCase()));
    
    // Lấy danh mục từ cả hai nguồn
    const categoriesFromBooks = books.map(b => b.category);
    const categoriesFromProducts = products.map(p => p.category);
    const uniqueCategories = [...new Set([...categoriesFromBooks, ...categoriesFromProducts])];

    let newCategoriesAdded = false;
    uniqueCategories.forEach(categoryName => {
        if (categoryName && !existingCategoryNames.has(categoryName.toLowerCase())) {
            const newCategory = {
                id: Date.now() + Math.random(),
                name: categoryName,
                description: "Danh mục được tạo tự động từ dữ liệu hiện có",
                visible: true,
            };
            categories.push(newCategory);
            newCategoriesAdded = true;
        }
    });

    if (newCategoriesAdded) {
        saveCategories();
    }
  };

  // --- RENDERING (Giữ nguyên) ---
  const renderTable = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredCategories = categories.filter(cat => cat.name.toLowerCase().includes(searchTerm));

    categoryTableBody.innerHTML = "";

    const paginatedCategories = filteredCategories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (paginatedCategories.length === 0 && currentPage > 1) {
        currentPage--;
        renderTable();
        return;
    }

    paginatedCategories.forEach(cat => {
      const row = document.createElement("tr");
      row.dataset.id = cat.id;

      const statusBadge = cat.visible
        ? `<span class="status-badge status-visible">Hiển thị</span>`
        : `<span class="status-badge status-hidden">Ẩn</span>`;

      row.innerHTML = `
        <td>${cat.name}</td>
        <td>${cat.description}</td>
        <td>${statusBadge}</td>
        <td class="actions">
          <button class="action-btn btn-edit">Sửa</button>
          <button class="action-btn btn-toggle-visibility">${cat.visible ? 'Ẩn' : 'Hiện'}</button>
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

  // --- MODAL (POPUP) HANDLING (Giữ nguyên) ---
  const openPopup = (isEdit = false, category = null) => {
    isEditMode = isEdit;
    popupForm.reset();

    if (isEdit && category) {
      popupTitle.textContent = "Chỉnh sửa danh mục";
      editCategoryId = category.id;
      categoryNameInput.value = category.name;
      categoryDescInput.value = category.description;
      categoryStatusInput.value = category.visible ? "visible" : "hidden";
    } else {
      popupTitle.textContent = "Tạo danh mục mới";
      editCategoryId = null;
    }

    popupOverlay.classList.add("active");
  };

  const closePopup = () => {
    popupOverlay.classList.remove("active");
  };

  // --- SỬA LỖI: LOGIC ĐỒNG BỘ KHI THAY ĐỔI ---

  /**
   * SỬA: Quét và cập nhật tên danh mục cũ sang tên mới
   * trên tất cả các localStorage liên quan.
   */
  function syncCategoryNameUpdate(oldName, newName) {
    const keysToUpdate = ["products", "books", "stockInSlips"];
    const fieldToUpdate = {
      "products": "category",
      "books": "category",
      "stockInSlips": "category"
    };

    keysToUpdate.forEach(key => {
      let data = JSON.parse(localStorage.getItem(key)) || [];
      let updated = false;
      
      data.forEach(item => {
        const categoryField = fieldToUpdate[key];
        // Sửa tên sản phẩm (books)
        if (key === 'books' && item.title === oldName) {
            item.title = newName;
            updated = true;
        }
        // Sửa danh mục
        if (item[categoryField] && item[categoryField].toLowerCase() === oldName.toLowerCase()) {
          item[categoryField] = newName;
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    });
  }

  /**
   * SỬA: Kiểm tra xem danh mục có đang được sử dụng không.
   */
  function isCategoryInUse(categoryName) {
    const books = JSON.parse(localStorage.getItem("books")) || [];
    const products = JSON.parse(localStorage.getItem("products")) || [];
    
    const nameLower = categoryName.toLowerCase();

    const inBooks = books.some(b => b.category && b.category.toLowerCase() === nameLower);
    const inProducts = products.some(p => p.category && p.category.toLowerCase() === nameLower);

    return inBooks || inProducts;
  }

  // --- EVENT LISTENERS (SỬA LỖI) ---
  openModalBtn.addEventListener("click", () => openPopup(false));
  cancelPopupBtn.addEventListener("click", closePopup);
  popupOverlay.addEventListener("click", (e) => {
    if (e.target === popupOverlay) {
      closePopup();
    }
  });

  // SỬA: Thêm logic đồng bộ khi Submit
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
      // Edit
      const category = categories.find(cat => cat.id === editCategoryId);
      if (category) {
        const oldName = category.name;
        if (oldName !== name) {
          // Chỉ đồng bộ nếu tên THỰC SỰ thay đổi
          syncCategoryNameUpdate(oldName, name);
        }
        category.name = name;
        category.description = description;
        category.visible = isVisible;
      }
    } else {
      // Add new
      // Kiểm tra trùng tên
      if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
          alert("Tên danh mục này đã tồn tại.");
          return;
      }
      const newCategory = {
        id: Date.now(),
        name,
        description,
        visible: isVisible,
      };
      categories.push(newCategory);
    }

    saveCategories();
    renderTable();
    closePopup(); 
  });

  // SỬA: Thêm logic kiểm tra khi Xóa
  categoryTableBody.addEventListener("click", (e) => {
    const target = e.target;
    const row = target.closest("tr");
    if (!row) return;

    const categoryId = parseFloat(row.dataset.id);
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    if (target.classList.contains("btn-edit")) {
      openPopup(true, category);
    } else if (target.classList.contains("btn-delete")) {
      
      // SỬA: Kiểm tra trước khi xóa
      if (isCategoryInUse(category.name)) {
        alert(`Không thể xóa danh mục "${category.name}" vì vẫn còn sản phẩm thuộc danh mục này.`);
        return;
      }
      
      if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"? Đây là hành động không thể hoàn tác.`)) {
        categories = categories.filter(cat => cat.id !== categoryId);
        saveCategories();
        renderTable();
      }
    } else if (target.classList.contains("btn-toggle-visibility")) {
        category.visible = !category.visible;
        saveCategories();
        renderTable();
    }
  });

  searchInput.addEventListener("input", () => {
      currentPage = 1;
      renderTable();
  });

  // --- INITIALIZATION ---
  loadCategories();
  migrateCategoriesFromBooks();
  renderTable();
});