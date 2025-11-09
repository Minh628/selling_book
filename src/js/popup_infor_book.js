// Popup info: use delegation and defensive checks so it works for dynamic items
document.addEventListener("DOMContentLoaded", () => {
  const popupOverlay = document.getElementById("popupOverlay");
  const closePopup = document.getElementById("closePopup");
  const productList = document.querySelector(".product-list");
  const bookList = document.getElementById("book-list");
  const cartIcon = document.getElementById("cart-icon");
  const popupQuantity = document.getElementById("popupQuantity");
  const decreaseQtyBtn = document.getElementById("decreaseQty");
  const increaseQtyBtn = document.getElementById("increaseQty");
  const popupAddBtn = document.getElementById("popupAddBtn");

  // Helper to show/hide overlay using class (and handle accessibility / focus trap)
  let lastFocusedElement = null;
  let keydownHandler = null;
  let currentQuantity = 1;
  function trapFocus(e) {
    if (!popup) return;
    const focusable = popup.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function showPopup() {
    if (!popupOverlay) return;
    lastFocusedElement = document.activeElement;
    popupOverlay.classList.add("is-open");
    popupOverlay.setAttribute("aria-hidden", "false");
    // focus first focusable inside popup
    if (popup) {
      const focusable = popup.querySelectorAll(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) focusable[0].focus();
    }

    // Add keydown handler for Escape and focus trap
    keydownHandler = (e) => {
      if (e.key === "Escape") {
        hidePopup();
      } else if (e.key === "Tab") {
        trapFocus(e);
      }
    };
    document.addEventListener("keydown", keydownHandler);
  }

  function hidePopup() {
    if (!popupOverlay) return;
    popupOverlay.classList.remove("is-open");
    popupOverlay.setAttribute("aria-hidden", "true");
    // remove keydown handler
    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
    }
    // restore focus
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  // Popup element references for population
  const popup = popupOverlay ? popupOverlay.querySelector(".popup") : null;
  const popupImg = popup ? popup.querySelector("img") : null;
  const popupTitle = popup ? popup.querySelector(".popup-content h2") : null;
  const popupAuthor = popup
    ? popup.querySelector(".popup-content .author")
    : null;
  const popupDescription = popup
    ? popup.querySelector(".popup-description p")
    : null; // Thêm biến cho mô tả
  const popupPrice = popup
    ? popup.querySelector(".popup-content .price")
    : null;
  const popupDetails = popup
    ? popup.querySelector(".popup-content .details")
    : null;
  // const popupAddBtn = popup
  //   ? popup.querySelector(".popup-content button")
  //   : null;

  // Helper: try to find the full book object from card using data-id or title match
  function findBookFromCard(card) {
    if (!card) return null;
    // If the card contains an add-to-cart button with data-id, use it
    const addBtn = card.querySelector(".add-to-cart-btn");
    if (addBtn && addBtn.dataset && addBtn.dataset.id) {
      const id = parseInt(addBtn.dataset.id, 10);
      if (window.books && Array.isArray(window.books)) {
        return window.books.find((b) => b.id === id) || null;
      }
    }

    // Otherwise attempt to match by title text
    const titleEl =
      card.querySelector(".book-card-title") || card.querySelector("h3");
    const title = titleEl ? titleEl.textContent.trim() : "";
    if (title && window.books && Array.isArray(window.books)) {
      return (
        window.books.find((b) => b.title === title) ||
        window.books.find((b) => b.title.includes(title)) ||
        null
      );
    }

    // No match, build a minimal object from available DOM
    const img = card.querySelector("img") ? card.querySelector("img").src : "";
    const author =
      card.querySelector(".book-card-author") || card.querySelector(".author")
        ? (
            card.querySelector(".book-card-author") ||
            card.querySelector(".author")
          ).textContent.trim()
        : "";
    const priceText =
      card.querySelector(".book-card-price") || card.querySelector(".price")
        ? (
            card.querySelector(".book-card-price") ||
            card.querySelector(".price")
          ).textContent.trim()
        : "";
    return {
      id: null,
      title: title || "",
      author: author || "",
      price: null,
      priceText: priceText || "",
      image: img || "",
    };
  }

  // Populate popup fields from a book object (book may be partial)
  function populatePopup(book) {
    if (!popup) return;

    // Ảnh bìa
    if (popupImg) {
      popupImg.src = book?.image || "";
      popupImg.alt = book?.title || "Ảnh bìa sách";
    }

    // Tên sách
    if (popupTitle) popupTitle.textContent = book?.title || "Chưa có tên sách";

    // Tác giả
    if (popupAuthor)
      popupAuthor.textContent = book?.author
        ? "Tác giả: " + book.author
        : "Tác giả: Chưa cập nhật";

    // Mô tả
    if (popupDescription) {
      popupDescription.textContent =
        book?.description || "Sản phẩm này chưa có mô tả.";
    }

    // Giá (định dạng VND)
    if (popupPrice) {
      if (book?.price || book?.price === 0) {
        popupPrice.textContent = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(book.price);
      } else {
        popupPrice.textContent = "Chưa có giá";
      }
    }

    // Thông tin thêm (loại, số lượng, trạng thái)
    if (popupDetails) {
      popupDetails.innerHTML = `
      <p><b>Thể loại:</b> ${book?.category || "Chưa rõ"}</p>
      <p><b>Số lượng trong kho:</b> ${book?.quantity ?? 0}</p>
      <p><b>Trạng thái:</b> ${book?.status || "Không xác định"}</p>
    `;
    }

    // If popup has an Add-to-cart button, store product id (if known) so it can be used
    if (popupAddBtn) {
      if (book && book.id) {
        popupAddBtn.dataset.id = book.id;
        // ensure it doesn't accidentally submit a form
        popupAddBtn.type = "button";
      } else {
        delete popupAddBtn.dataset.id;
      }
    }
    currentQuantity = 1;
    if (popupQuantity) popupQuantity.textContent = currentQuantity;
  }

  // Small UI helpers to animate/show the floating cart (black cart-fab)
  function revealAndAnimateCart() {
    if (!cartIcon) return;
    // ensure visible
    cartIcon.classList.add("visible");
    // trigger pop animation
    cartIcon.classList.remove("pop");
    // force reflow to restart animation
    // eslint-disable-next-line no-unused-expressions
    cartIcon.offsetWidth;
    cartIcon.classList.add("pop");
    // remove pop class after animation
    setTimeout(() => cartIcon.classList.remove("pop"), 300);
  }
  // Make it available globally
  window.revealAndAnimateCart = revealAndAnimateCart;

  // Function to sync show popup and cart animation
  function showPopupWithCart(book) {
    currentQuantity = 1;
    if (popupQuantity) popupQuantity.textContent = currentQuantity;
    populatePopup(book);
    // Show popup first
    showPopup();
    // Slight delay before cart animation
    setTimeout(revealAndAnimateCart, 50);
  }

  // Listen on the static .product-list if present (older markup)
  if (productList) {
    productList.addEventListener("click", (e) => {
      // ignore clicks on add-to-cart buttons
      if (e.target.classList && e.target.classList.contains("add-to-cart-btn"))
        return;
      const product = e.target.closest(".product");
      if (!product) return;
      const book = findBookFromCard(product);
      showPopupWithCart(book);
    });
  }

  // Listen on the dynamic #book-list used by Product.js (cards have class .book-card)
  if (bookList) {
    bookList.addEventListener("click", (e) => {
      // If the click is on the add-to-cart button, let Product.js handle it and do not open popup
      if (e.target.classList && e.target.classList.contains("add-to-cart-btn"))
        return;
      const card = e.target.closest(".book-card");
      if (!card) return;
      const book = findBookFromCard(card);
      showPopupWithCart(book);
    });
  }

  // Fallback for a single static element with id book1
  const book1 = document.getElementById("book1");
  if (book1) {
    book1.addEventListener("click", (e) => {
      const book = findBookFromCard(book1);
      showPopupWithCart(book);
    });
  }

  if (closePopup) closePopup.addEventListener("click", hidePopup);

  // Click outside popup closes it
  if (popupOverlay) {
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) hidePopup();
    });
  }

  // Nút tăng
  if (increaseQtyBtn) {
    increaseQtyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentQuantity++;
      popupQuantity.textContent = currentQuantity;
    });
  }

  // Nút giảm
  if (decreaseQtyBtn) {
    decreaseQtyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentQuantity > 1) {
        currentQuantity--;
        popupQuantity.textContent = currentQuantity;
      }
    });
  }

  // Hook popup's Add-to-cart button to the site's addToCart function (if available)
  if (popupAddBtn) {
    popupAddBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Kiểm tra đăng nhập
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
        // chuyển sang trang đăng nhập nếu có
        window.location.href = "./logInPage.html";
        return;
      }
      const id = popupAddBtn.dataset.id;
      let book = null;

      if (id && window.books && Array.isArray(window.books)) {
        book = window.books.find((b) => b.id === parseInt(id, 10));
      }

      if (book) {
        if (typeof window.addToCart === "function") {
          for (let i = 0; i < currentQuantity; i++) {
            window.addToCart(book);
          } // ✅ truyền số lượng thực tế
        }

        revealAndAnimateCart();
        if (typeof window.updateCartCount === "function") {
          window.updateCartCount();
        }

        currentQuantity = 1;
        popupQuantity.textContent = currentQuantity;
        hidePopup();
      } else {
        console.error("Book not found for popup!");
      }
    });
  }
});
