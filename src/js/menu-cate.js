document.addEventListener("DOMContentLoaded", () => {
  const categoryListContainer = document.querySelector(
    "#Categories .category-list"
  );

  if (!categoryListContainer) {
    console.error("Lỗi: Không tìm thấy container '.category-list'.");
    return;
  }

  // --- SỬA LỖI: LOGIC FALLBACK ---
  let allCategories = JSON.parse(localStorage.getItem("categories")) || [];
  let visibleCategories = [];

  if (allCategories.length > 0) {
    // CÁCH 1: Nếu admin đã tạo 'categories', dùng nó
    visibleCategories = allCategories.filter((cat) => cat.visible === true);
  } else {
    // CÁCH 2: (FALLBACK) Nếu 'categories' rỗng, tự tạo từ 'books'
    console.warn("Chưa tạo 'categories'. Tự tạo danh sách tạm thời từ 'books'.");
    const books = JSON.parse(localStorage.getItem("books")) || [];
    const categoriesFromBooks = [
      ...new Set(books.map((b) => b.category).filter(Boolean)),
    ];
    
    // Chuyển đổi về định dạng { name, imageUrl, ... } mà code bên dưới cần
    visibleCategories = categoriesFromBooks.map(name => ({
        name: name,
        imageUrl: null, // Sẽ được xử lý bởi getDynamicCategoryImage
        visible: true,
    }));
  }
  // --- KẾT THÚC SỬA LỖI ---


  categoryListContainer.innerHTML = "";

  if (visibleCategories.length === 0) {
    categoryListContainer.innerHTML =
      "<p>Chưa có danh mục nào để hiển thị.</p>";
    return;
  }

  visibleCategories.forEach((category) => {
    const categoryName = category.name;

    // 1. Lấy ảnh từ localStorage
    let imageUrl = category.imageUrl;

    // 2. Nếu ảnh là null (do migrate hoặc fallback), thử lấy ảnh hardcode
    if (!imageUrl) {
      imageUrl = getDynamicCategoryImage(categoryName);
    }

    // 3. SỬA LỖI: Kiểm tra và sửa đường dẫn
    if (imageUrl && imageUrl.startsWith("../")) {
      imageUrl = imageUrl.replace("../", "./");
    }

    // 4. Nếu sau tất cả vẫn không có ảnh, dùng placeholder
    if (!imageUrl) {
      imageUrl = `https://placehold.co/300x420/c49b66/fff?text=${encodeURIComponent(
        categoryName
      )}`;
    }

    const categoryLink = document.createElement("a");
    categoryLink.href = `Product.html?category=${encodeURIComponent(
      categoryName
    )}`;
    categoryLink.className = "category-item";

    categoryLink.innerHTML = `
        <img src="${imageUrl}" alt="${categoryName}" />
        <p>${categoryName}</p>
      `;
    categoryListContainer.appendChild(categoryLink);
  });
});

/**
 * Hàm trợ giúp (ĐÃ SỬA ĐƯỜNG DẪN cho trang chủ)
 */
function getDynamicCategoryImage(categoryName) {
  const nameLower = categoryName.toLowerCase();

  // Dùng đường dẫn đúng cho trang chủ (./images/...)
  if (nameLower.includes("tiểu thuyết")) {
    return "./images/Bố Già.webp";
  }
  if (nameLower.includes("khoa học")) {
    return "./images/Vũ Trụ Trong Vỏ Hạt Dẻ.jpg";
  }
  if (nameLower.includes("văn học")) {
    return "./images/Cây Cam Ngọt Của Tôi.webp";
  }
  if (nameLower.includes("kỹ năng sống")) {
    return "./images/Đắc nhân tâm.jpg";
  }
  if (nameLower.includes("tâm linh")) {
    return "./images/Hiểu về trái tim.webp";
  }
  if (nameLower.includes("nuôi dạy con")) {
    return "./images/Để Con Được Ốm.jpg";
  }
  if (nameLower.includes("kinh doanh")) {
    return "./images/Cha Giàu Cha Nghèo.jpg";
  }

  // Trả về null để dùng placeholder
  return null;
}