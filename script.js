console.log("TRAANSCOM SCRIPT LOADED");

const API_URL = "https://traanscom-backend-api.onrender.com";

let products = [];

let cart = [];

try {
  cart = JSON.parse(
    localStorage.getItem("traanscomCart") || "[]"
  );

  if (!Array.isArray(cart)) {
    cart = [];
  }
} catch (error) {
  console.error("Cart storage error:", error);
  cart = [];
}


// =====================================================
// CATEGORIES
// =====================================================

const cats = [
  ["Fashion", "👕"],
  ["Electronics", "🎧"],
  ["Beauty", "🧴"],
  ["Home & Living", "🏠"],
  ["Accessories", "👜"],
  ["Health & Care", "✨"]
];


// =====================================================
// HELPER
// =====================================================

const $ = selector => document.querySelector(selector);


function money(amount, currency = "PKR") {

  const value = Number(amount || 0);

  const symbols = {
    PKR: "Rs. ",
    USD: "$",
    GBP: "£",
    EUR: "€",
    AED: "AED ",
    SAR: "SAR ",
    CAD: "CA$ ",
    AUD: "A$ ",
    NZD: "NZ$ ",
    INR: "₹",
    BDT: "৳",
    TRY: "₺"
  };

  const code = String(currency || "PKR").toUpperCase();

  const symbol = symbols[code] || `${code} `;

  return (
    symbol +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}


function getSellingPrice(product) {

  const sale = Number(product.sale_price || 0);
  const price = Number(product.price || 0);

  if (
    sale > 0 &&
    price > 0 &&
    sale < price
  ) {
    return sale;
  }

  return price;
}


function getCurrency(product) {

  return (
    product.currency ||
    "PKR"
  ).toUpperCase();
}


function getCategoryEmoji(category) {

  const map = {
    "Fashion": "👕",
    "Men's Fashion": "👔",
    "Women's Fashion": "👗",
    "Electronics": "🎧",
    "Beauty": "🧴",
    "Home & Living": "🏠",
    "Accessories": "👜",
    "Health & Care": "✨"
  };

  return map[category] || "🛍️";
}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =====================================================
// API JSON HELPER
// =====================================================

async function getJson(response) {

  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {

    console.error(
      "Invalid JSON response:",
      text
    );

    return {};
  }
}


// =====================================================
// PRODUCT IMAGE
// =====================================================

function getProductImageUrl(imageUrl) {

  if (!imageUrl) {
    return null;
  }

  const url = String(imageUrl).trim();

  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  if (url.startsWith("/")) {
    return API_URL + url;
  }

  return API_URL + "/" + url;
}


function productImageHtml(
  product,
  mode = "card"
) {

  const imageUrl =
    getProductImageUrl(
      product.image_url
    );

  const emoji =
    product.emoji ||
    getCategoryEmoji(product.cat);

  if (imageUrl) {

    return `
      <img
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(product.name)}"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        "
        onerror="
          this.style.display='none';
          if(this.nextElementSibling){
            this.nextElementSibling.style.display='flex';
          }
        "
      >

      <span
        class="emoji"
        style="
          display:none;
          width:100%;
          height:100%;
          align-items:center;
          justify-content:center;
          font-size:${mode === "modal" ? "90px" : "55px"};
        "
      >
        ${emoji}
      </span>
    `;

  }

  return `
    <span
      class="emoji"
      style="
        width:100%;
        height:100%;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${mode === "modal" ? "90px" : "55px"};
      "
    >
      ${emoji}
    </span>
  `;
}


// =====================================================
// LOAD PRODUCTS FROM BACKEND
// =====================================================

async function loadProducts() {

  try {

    const response =
      await fetch(
        `${API_URL}/api/products`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        }
      );

    const data =
      await getJson(response);

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Failed to load products"
      );
    }

    if (!Array.isArray(data)) {

      throw new Error(
        "Products API did not return an array"
      );
    }


    products = data.map(p => {

      const category =
        p.category_name ||
        "Uncategorized";


      const pricePkr =
        Number(
          p.price_pkr ?? 0
        );

      const priceUsd =
        Number(
          p.price_usd ?? 0
        );

      const priceGbp =
        Number(
          p.price_gbp ?? 0
        );


      const salePkr =
        Number(
          p.sale_price_pkr ?? 0
        );

      const saleUsd =
        Number(
          p.sale_price_usd ?? 0
        );

      const saleGbp =
        Number(
          p.sale_price_gbp ?? 0
        );


      /*
        Backend currently stores separate
        PKR / USD / GBP prices.

        Customer website currently displays PKR.
      */

      return {

        id:
          Number(p.id),

        name:
          p.name || "Unnamed Product",

        cat:
          category,

        description:
          p.description ||
          "Quality product from Traanscom.",

        desc:
          p.description ||
          "Quality product from Traanscom.",

        currency:
          "PKR",

        price:
          pricePkr,

        sale_price:
          salePkr,

        price_pkr:
          pricePkr,

        price_usd:
          priceUsd,

        price_gbp:
          priceGbp,

        sale_price_pkr:
          salePkr,

        sale_price_usd:
          saleUsd,

        sale_price_gbp:
          saleGbp,

        old:
          pricePkr,

        stock:
          Number(
            p.stock_quantity || 0
          ),

        sku:
          p.sku || "",

        active:
          p.is_active !== false,

        featured:
          p.is_featured === true,

        tag:
          p.is_featured === true
            ? "POPULAR"
            : "NEW",

        emoji:
          getCategoryEmoji(category),

        image_url:
          p.image_url ||
          p.primary_image_url ||
          null,

        image_is_primary:
          p.image_is_primary === true

      };

    });


    console.log(
      "Products loaded:",
      products
    );


    renderProducts();
    renderCart();


  } catch (error) {

    console.error(
      "Products API Error:",
      error
    );

    const grid =
      $("#productGrid");

    if (grid) {

      grid.innerHTML = `
        <p
          style="
            padding:20px;
            grid-column:1/-1;
          "
        >
          Unable to load products.
          Please try again later.
        </p>
      `;
    }

  }

}


// =====================================================
// CATEGORIES
// =====================================================

function renderCategories() {

  const categoryGrid =
    $("#categoryGrid");

  if (!categoryGrid) {
    return;
  }


  categoryGrid.innerHTML =
    cats
      .map(
        ([name, emoji]) => `
          <div
            class="category"
            data-cat="${escapeHtml(name)}"
          >

            <span class="emoji">
              ${emoji}
            </span>

            <b>
              ${escapeHtml(name)}
            </b>

          </div>
        `
      )
      .join("");


  document
    .querySelectorAll(".category")
    .forEach(category => {

      category.onclick = () => {

        const filter =
          $("#categoryFilter");

        if (filter) {

          filter.value =
            category.dataset.cat;

        }

        renderProducts();

        location.hash =
          "shop";

      };

    });


  const filter =
    $("#categoryFilter");

  if (filter) {

    filter.innerHTML =
      '<option value="all">All categories</option>' +

      cats
        .map(
          ([name]) =>
            `
              <option value="${escapeHtml(name)}">
                ${escapeHtml(name)}
              </option>
            `
        )
        .join("");
  }

}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

  const grid =
    $("#productGrid");

  if (!grid) {
    return;
  }


  const searchInput =
    $("#searchInput");

  const categoryFilter =
    $("#categoryFilter");


  const q =
    searchInput
      ? searchInput.value
          .toLowerCase()
          .trim()
      : "";


  const cat =
    categoryFilter
      ? categoryFilter.value
      : "all";


  const list =
    products.filter(product => {

      const active =
        product.active !== false;

      const categoryMatch =
        cat === "all" ||
        product.cat === cat;

      const searchMatch =
        !q ||
        String(product.name)
          .toLowerCase()
          .includes(q) ||

        String(product.cat)
          .toLowerCase()
          .includes(q);


      return (
        active &&
        categoryMatch &&
        searchMatch
      );

    });


  if (!list.length) {

    grid.innerHTML = "";

  } else {

    grid.innerHTML =
      list
        .map(product => {

          const sellingPrice =
            getSellingPrice(product);

          const currency =
            getCurrency(product);

          const originalPrice =
            Number(
              product.price || 0
            );

          const salePrice =
            Number(
              product.sale_price || 0
            );

          const hasSale =
            salePrice > 0 &&
            originalPrice > 0 &&
            salePrice < originalPrice;


          return `
            <article
              class="product"
              data-id="${product.id}"
            >

              <div
                class="product-image"
                style="
                  overflow:hidden;
                  position:relative;
                "
              >

                <span class="tag">
                  ${escapeHtml(product.tag)}
                </span>

                ${productImageHtml(product)}

              </div>


              <div class="product-info">

                <h3>
                  ${escapeHtml(product.name)}
                </h3>

                <p>
                  ${escapeHtml(product.cat)}
                </p>

                <p class="price">

                  ${money(
                    sellingPrice,
                    currency
                  )}

                  ${
                    hasSale
                      ? `
                        <span
                          style="
                            text-decoration:line-through;
                            color:#999;
                            font-size:13px;
                            margin-left:7px;
                          "
                        >
                          ${money(
                            originalPrice,
                            currency
                          )}
                        </span>
                      `
                      : ""
                  }

                </p>

              </div>

            </article>
          `;

        })
        .join("");

  }


  const emptyState =
    $("#emptyState");

  if (emptyState) {

    emptyState.hidden =
      list.length > 0;

  }


// =====================================================
// PRODUCT CLICK - EVENT DELEGATION
// =====================================================

if (!grid.dataset.productClickAttached) {

  grid.addEventListener("click", function (event) {

    const card =
      event.target.closest(".product");

    if (!card) {
      return;
    }

    const id =
      Number(card.dataset.id);

    console.log(
      "PRODUCT CARD CLICKED:",
      id
    );

    if (!id) {

      console.error(
        "Product ID missing from card:",
        card
      );

      return;
    }

    openProduct(id);

  });

  grid.dataset.productClickAttached = "true";

}
/* =====================================================
   CLOSE renderProducts()
   ===================================================== */

}


// =====================================================
// PRODUCT DETAILS
// =====================================================

function openProduct(id) {

    console.log("OPEN PRODUCT:", id);

    const productId = Number(id);

    const product = products.find(
        p => Number(p.id) === productId
    );

    if (!product) {
        console.error("PRODUCT NOT FOUND:", productId);
        return;
    }

    console.log("PRODUCT FOUND:", product);

    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modalContent");

    if (!modal) {
        console.error("MODAL ELEMENT NOT FOUND");
        return;
    }

    if (!modalContent) {
        console.error("MODAL CONTENT ELEMENT NOT FOUND");
        return;
    }

    const price = Number(product.price || product.price_pkr || 0);
    const salePrice = Number(
        product.sale_price || product.sale_price_pkr || 0
    );

    const stock = Number(product.stock || 0);

    const imageUrl =
        product.image_url ||
        product.primary_image_url ||
        "";

    const imageHTML = imageUrl
        ? `<img src="${imageUrl}"
                style="width:100%;height:100%;object-fit:contain;"
                onerror="this.style.display='none';">`
        : `<div style="font-size:80px;">${product.emoji || "🛍️"}</div>`;

    modalContent.innerHTML = `
        <div style="
            display:flex;
            flex-direction:column;
            gap:20px;
        ">

            <div style="
                width:100%;
                height:280px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#f8f8f8;
                overflow:hidden;
            ">
                ${imageHTML}
            </div>

            <div style="padding:10px 5px 20px;">

                <h2 style="
                    margin:0 0 10px;
                    font-size:28px;
                ">
                    ${product.name || "Product"}
                </h2>

                <p style="
                    margin:0 0 15px;
                    color:#666;
                    line-height:1.6;
                ">
                    ${product.description || "Quality product from Traanscom."}
                </p>

                <div style="
                    font-size:24px;
                    font-weight:700;
                    margin-bottom:10px;
                ">
                    ₨ ${salePrice > 0 ? salePrice : price}
                </div>

                <div style="
                    margin-bottom:20px;
                    color:${stock > 0 ? "green" : "red"};
                    font-weight:600;
                ">
                    ${stock > 0 ? `✓ ${stock} in stock` : "✕ Out of stock"}
                </div>

                <button
                    id="modalAddToCart"
                    ${stock <= 0 ? "disabled" : ""}
                    style="
                        width:100%;
                        padding:14px;
                        border:none;
                        border-radius:8px;
                        background:#111;
                        color:#fff;
                        font-size:16px;
                        cursor:pointer;
                    "
                >
                    ${stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>

            </div>
        </div>
    `;

    /* FORCE MODAL OPEN */

    modal.classList.add("show");

    modal.style.display = "block";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    modal.style.position = "fixed";
    modal.style.zIndex = "999999";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.background = "#fff";

    console.log("✅ MODAL OPENED");

    const addButton =
        document.getElementById("modalAddToCart");

    if (addButton && stock > 0) {

        addButton.onclick = async function () {

            await addToCart(product.id);

            closeProduct();

        };

    }
}

// =====================================================
// CLOSE PRODUCT
// =====================================================

function closeProduct() {

  const modal =
    $("#modal");

  if (modal) {

    modal.classList.remove(
      "show"
    );

  }

}


// =====================================================
// CART FROM BACKEND
// =====================================================

async function loadCartFromBackend() {

  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  if (!token) {
    return;
  }


  try {

    const response =
      await fetch(
        `${API_URL}/api/cart`,
        {
          method: "GET",

          headers: {
            "Accept":
              "application/json",

            "Authorization":
              "Bearer " + token
          }
        }
      );


    if (!response.ok) {

      console.warn(
        "Backend cart could not be loaded"
      );

      return;
    }


    const data =
      await getJson(response);


    const backendItems =
      Array.isArray(data)
        ? data
        : (
            data.cart ||
            data.items ||
            []
          );


    if (!Array.isArray(backendItems)) {
      return;
    }


    cart =
      backendItems
        .map(item => ({

          id:
            Number(
              item.product_id ??
              item.id
            ),

          qty:
            Number(
              item.quantity ??
              item.qty ??
              1
            )

        }))
        .filter(
          item =>
            Number.isFinite(item.id) &&
            item.id > 0 &&
            item.qty > 0
        );


    localStorage.setItem(
      "traanscomCart",
      JSON.stringify(cart)
    );


    renderCart();


  } catch (error) {

    console.error(
      "Backend cart error:",
      error
    );

  }

}


// =====================================================
// ADD TO CART
// =====================================================

async function addToCart(id) {

  const product =
    products.find(
      item =>
        Number(item.id) ===
        Number(id)
    );


  if (
    !product ||
    Number(product.stock) <= 0
  ) {

    toast(
      "Product is out of stock"
    );

    return;
  }


  const productId =
    Number(product.id);


  const found =
    cart.find(
      item =>
        Number(item.id) ===
        productId
    );


  if (found) {

    if (
      Number(found.qty) >=
      Number(product.stock)
    ) {

      toast(
        "Maximum available stock reached"
      );

      return;
    }

    found.qty =
      Number(found.qty) + 1;

  } else {

    cart.push({

      id:
        productId,

      qty:
        1

    });

  }


  saveCart();


  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  if (token) {

    try {

      const response =
        await fetch(
          `${API_URL}/api/cart`,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Authorization":
                "Bearer " + token

            },

            body:
              JSON.stringify({

                product_id:
                  productId,

                quantity:
                  1

              })

          }
        );


      if (!response.ok) {

        console.warn(
          "Backend cart add failed"
        );

      }

    } catch (error) {

      console.error(
        "Backend cart sync error:",
        error
      );

    }

  }


  toast(
    "Added to cart"
  );

}


// =====================================================
// SAVE CART
// =====================================================

function saveCart() {

  localStorage.setItem(
    "traanscomCart",
    JSON.stringify(cart)
  );

  renderCart();

}


// =====================================================
// CART COUNT
// =====================================================

function updateCartCount() {

  const count =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.qty || 0),
      0
    );


  const cartCount =
    $("#cartCount");

  if (cartCount) {

    cartCount.textContent =
      count;

  }

}


// =====================================================
// RENDER CART
// =====================================================

function renderCart() {

  updateCartCount();


  const cartItems =
    $("#cartItems");

  if (!cartItems) {
    return;
  }


  /*
    Remove invalid products
    from local cart.
  */

  cart =
    cart.filter(item =>
      products.some(
        product =>
          Number(product.id) ===
          Number(item.id)
      )
    );


  if (!cart.length) {

    cartItems.innerHTML =
      '<p class="empty">Your cart is empty.</p>';


    const cartTotal =
      $("#cartTotal");

    if (cartTotal) {

      cartTotal.textContent =
        money(0);

    }

    updateCartCount();

    return;
  }


  cartItems.innerHTML =
    cart
      .map(item => {

        const product =
          products.find(
            p =>
              Number(p.id) ===
              Number(item.id)
          );


        if (!product) {
          return "";
        }


        const price =
          getSellingPrice(product);


        const currency =
          getCurrency(product);


        return `

          <div class="cart-row">

            <div
              class="cart-thumb"
              style="
                overflow:hidden;
                display:flex;
                align-items:center;
                justify-content:center;
              "
            >

              ${productImageHtml(
                product
              )}

            </div>


            <div>

              <h4>
                ${escapeHtml(product.name)}
              </h4>

              <p>
                ${money(
                  price,
                  currency
                )}
              </p>


              <div class="qty">

                <button
                  type="button"
                  data-cart-minus="${product.id}"
                >
                  −
                </button>


                <span>
                  ${item.qty}
                </span>


                <button
                  type="button"
                  data-cart-plus="${product.id}"
                >
                  +
                </button>

              </div>

            </div>


            <b>
              ${money(
                price *
                Number(item.qty || 0),
                currency
              )}
            </b>

          </div>

        `;

      })
      .join("");


  /*
    Attach quantity buttons
    after cart HTML is rendered.
  */

  cartItems
    .querySelectorAll(
      "[data-cart-minus]"
    )
    .forEach(button => {

      button.onclick = () => {

        changeQty(
          Number(
            button.dataset.cartMinus
          ),
          -1
        );

      };

    });


  cartItems
    .querySelectorAll(
      "[data-cart-plus]"
    )
    .forEach(button => {

      button.onclick = () => {

        changeQty(
          Number(
            button.dataset.cartPlus
          ),
          1
        );

      };

    });


  let total = 0;

  let currency =
    "PKR";


  cart.forEach(item => {

    const product =
      products.find(
        p =>
          Number(p.id) ===
          Number(item.id)
      );


    if (product) {

      total +=
        getSellingPrice(product) *
        Number(item.qty || 0);

      currency =
        getCurrency(product);

    }

  });


  const cartTotal =
    $("#cartTotal");

  if (cartTotal) {

    cartTotal.textContent =
      money(
        total,
        currency
      );

  }

}


// =====================================================
// CHANGE CART QUANTITY
// =====================================================

async function changeQty(
  id,
  delta
) {

  const item =
    cart.find(
      x =>
        Number(x.id) ===
        Number(id)
    );


  const product =
    products.find(
      x =>
        Number(x.id) ===
        Number(id)
    );


  if (
    !item ||
    !product
  ) {
    return;
  }


  const oldQty =
    Number(item.qty || 0);


  const newQty =
    oldQty +
    Number(delta);


  if (newQty <= 0) {

    cart =
      cart.filter(
        x =>
          Number(x.id) !==
          Number(id)
      );

  } else if (
    newQty >
    Number(product.stock)
  ) {

    toast(
      "Maximum available stock reached"
    );

    return;

  } else {

    item.qty =
      newQty;

  }


  saveCart();


  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  if (!token) {
    return;
  }


  try {

    if (newQty <= 0) {

      await fetch(
        `${API_URL}/api/cart/${id}`,
        {
          method: "DELETE",

          headers: {
            "Authorization":
              "Bearer " + token
          }

        }
      );

    } else {

      await fetch(
        `${API_URL}/api/cart/${id}`,
        {
          method: "PUT",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              "Bearer " + token

          },

          body:
            JSON.stringify({
              quantity:
                newQty
            })

        }
      );

    }

  } catch (error) {

    console.error(
      "Cart update error:",
      error
    );

  }

}


// =====================================================
// OPEN CART
// =====================================================

function openCart() {

  const drawer =
    $("#cartDrawer");

  const overlay =
    $("#overlay");


  if (drawer) {

    drawer.classList.add(
      "open"
    );

  }


  if (overlay) {

    overlay.classList.add(
      "show"
    );

  }


  renderCart();

}


// =====================================================
// CLOSE CART
// =====================================================

function closeCart() {

  const drawer =
    $("#cartDrawer");

  const overlay =
    $("#overlay");


  if (drawer) {

    drawer.classList.remove(
      "open"
    );

  }


  if (overlay) {

    overlay.classList.remove(
      "show"
    );

  }

}


// =====================================================
// TOAST
// =====================================================

function toast(message) {

  let toastBox =
    document.getElementById(
      "traanscomToast"
    );


  if (!toastBox) {

    toastBox =
      document.createElement(
        "div"
      );


    toastBox.id =
      "traanscomToast";


    toastBox.style.cssText = `

      position:fixed;

      bottom:25px;

      right:25px;

      z-index:20000;

      background:#111;

      color:white;

      padding:13px 18px;

      border-radius:10px;

      box-shadow:
        0 10px 30px
        rgba(0,0,0,.2);

      font-size:14px;

      max-width:320px;

    `;


    document.body.appendChild(
      toastBox
    );

  }


  toastBox.textContent =
    message;


  toastBox.style.display =
    "block";


  clearTimeout(
    toastBox._timer
  );


  toastBox._timer =
    setTimeout(
      () => {

        toastBox.style.display =
          "none";

      },
      3000
    );

}


// =====================================================
// CHECKOUT
// =====================================================

async function checkout() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(
          "traanscomCart"
        ) || "[]"
      );

    if (Array.isArray(saved)) {

      cart =
        saved;

    }

  } catch (error) {

    console.error(
      "Saved cart error:",
      error
    );

  }


  if (!cart.length) {

    toast(
      "Your cart is empty"
    );

    renderCart();

    return;
  }


  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  if (!token) {

    toast(
      "Please login before checkout"
    );

    openLoginOverlay();

    return;
  }


  openShippingAddressModal();

}


// =====================================================
// LOGIN / REGISTER UI
// =====================================================

function createLoginUI() {

  if (
    document.getElementById(
      "loginOverlay"
    )
  ) {
    updateLoginButton();
    return;
  }


  const overlay =
    document.createElement(
      "div"
    );

  overlay.id =
    "loginOverlay";


  overlay.style.cssText = `

    position:fixed;

    inset:0;

    background:
      rgba(0,0,0,.55);

    display:none;

    align-items:center;

    justify-content:center;

    z-index:10000;

    padding:20px;

    box-sizing:border-box;

  `;


  const box =
    document.createElement(
      "div"
    );

  box.id =
    "loginBox";


  box.style.cssText = `

    width:430px;

    max-width:100%;

    max-height:90vh;

    overflow:auto;

    background:white;

    border-radius:18px;

    padding:28px;

    box-sizing:border-box;

    box-shadow:
      0 20px 60px
      rgba(0,0,0,.25);

  `;


  overlay.appendChild(
    box
  );


  document.body.appendChild(
    overlay
  );


  overlay.onclick =
    event => {

      if (
        event.target ===
        overlay
      ) {

        closeLoginOverlay();

      }

    };


  showLoginForm();

}


// =====================================================
// LOGIN FORM
// =====================================================

function showLoginForm() {

  const box =
    document.getElementById(
      "loginBox"
    );


  if (!box) {
    return;
  }


  box.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
      "
    >

      <div>

        <p
          style="
            margin:0 0 4px;
            color:#777;
            font-size:12px;
            letter-spacing:1px;
          "
        >
          TRAANSCOM
        </p>

        <h2 style="margin:0">
          Login
        </h2>

      </div>


      <button
        id="closeLogin"
        type="button"
        style="
          border:0;
          background:#eee;
          width:36px;
          height:36px;
          border-radius:50%;
          font-size:22px;
          cursor:pointer;
        "
      >
        ×
      </button>

    </div>


    <form id="loginForm">

      <label
        style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        "
      >
        Email
      </label>

      <input
        id="loginEmail"
        type="email"
        required
        autocomplete="email"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:14px;
        "
      >


      <label
        style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        "
      >
        Password
      </label>

      <input
        id="loginPassword"
        type="password"
        required
        autocomplete="current-password"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:18px;
        "
      >


      <button
        type="submit"
        id="loginSubmit"
        style="
          width:100%;
          padding:13px;
          border:0;
          border-radius:8px;
          background:#111;
          color:white;
          cursor:pointer;
        "
      >
        Login
      </button>

    </form>


    <p
      style="
        text-align:center;
        margin:18px 0 0;
      "
    >

      Don't have an account?

      <button
        id="showRegister"
        type="button"
        style="
          border:0;
          background:none;
          padding:0;
          cursor:pointer;
          font-weight:700;
        "
      >
        Create Account
      </button>

    </p>

  `;


  $("#closeLogin").onclick =
    closeLoginOverlay;


  $("#showRegister").onclick =
    showRegisterForm;


  $("#loginForm").onsubmit =
    loginUser;

}


// =====================================================
// REGISTER FORM
// =====================================================

function showRegisterForm() {

  const box =
    document.getElementById(
      "loginBox"
    );


  if (!box) {
    return;
  }


  box.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
      "
    >

      <div>

        <p
          style="
            margin:0 0 4px;
            color:#777;
            font-size:12px;
            letter-spacing:1px;
          "
        >
          TRAANSCOM
        </p>

        <h2 style="margin:0">
          Create Account
        </h2>

      </div>


      <button
        id="closeRegister"
        type="button"
        style="
          border:0;
          background:#eee;
          width:36px;
          height:36px;
          border-radius:50%;
          font-size:22px;
          cursor:pointer;
        "
      >
        ×
      </button>

    </div>


    <form id="registerForm">

      <label
        style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        "
      >
        Full Name
      </label>

      <input
        id="registerName"
        type="text"
        required
        autocomplete="name"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:14px;
        "
      >


      <label
        style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        "
      >
        Email
      </label>

      <input
        id="registerEmail"
        type="email"
        required
        autocomplete="email"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:14px;
        "
      >


      <label
        style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        "
      >
        Phone
      </label>

      <input
        id="registerPhone"
        type="tel"
        autocomplete="tel"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:14px;
        "
      >


      <label
        style="
          display:block;
          margin-bottom:6px;
          font-weight:600;
        "
      >
        Password
      </label>

      <input
        id="registerPassword"
        type="password"
        required
        minlength="6"
        autocomplete="new-password"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:18px;
        "
      >


      <button
        type="submit"
        id="registerSubmit"
        style="
          width:100%;
          padding:13px;
          border:0;
          border-radius:8px;
          background:#111;
          color:white;
          cursor:pointer;
        "
      >
        Create Account
      </button>

    </form>


    <p
      style="
        text-align:center;
        margin:18px 0 0;
      "
    >

      Already have an account?

      <button
        id="showLogin"
        type="button"
        style="
          border:0;
          background:none;
          padding:0;
          cursor:pointer;
          font-weight:700;
        "
      >
        Login
      </button>

    </p>

  `;


  $("#closeRegister").onclick =
    closeLoginOverlay;


  $("#showLogin").onclick =
    showLoginForm;


  $("#registerForm").onsubmit =
    registerUser;

}


// =====================================================
// OPEN LOGIN
// =====================================================

function openLoginOverlay() {

  const overlay =
    document.getElementById(
      "loginOverlay"
    );


  if (!overlay) {

    createLoginUI();

    return openLoginOverlay();

  }


  showLoginForm();


  overlay.style.display =
    "flex";

}


// =====================================================
// CLOSE LOGIN
// =====================================================

function closeLoginOverlay() {

  const overlay =
    document.getElementById(
      "loginOverlay"
    );


  if (overlay) {

    overlay.style.display =
      "none";

  }

}


// =====================================================
// LOGIN
// =====================================================

async function loginUser(event) {

  event.preventDefault();


  const email =
    $("#loginEmail").value.trim();

  const password =
    $("#loginPassword").value;


  const submit =
    $("#loginSubmit");


  if (submit) {

    submit.disabled =
      true;

    submit.textContent =
      "Logging in...";

  }


  try {

    const response =
      await fetch(
        `${API_URL}/api/users/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              email,
              password
            })
        }
      );


    const data =
      await getJson(response);


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Login failed"
      );

    }


    if (!data.token) {

      throw new Error(
        "Login succeeded but no token was returned."
      );

    }


    localStorage.setItem(
      "traanscomToken",
      data.token
    );


    localStorage.setItem(
      "traanscomUser",
      JSON.stringify(
        data.user || {}
      )
    );


    closeLoginOverlay();

    updateLoginButton();

    await loadCartFromBackend();

    toast(
      "Login successful"
    );


  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    toast(
      error.message ||
      "Unable to login"
    );


  } finally {

    if (submit) {

      submit.disabled =
        false;

      submit.textContent =
        "Login";

    }

  }

}


// =====================================================
// REGISTER
// =====================================================

async function registerUser(event) {

  event.preventDefault();


  const full_name =
    $("#registerName").value.trim();

  const email =
    $("#registerEmail").value.trim();

  const phone =
    $("#registerPhone").value.trim();

  const password =
    $("#registerPassword").value;


  const submit =
    $("#registerSubmit");


  if (submit) {

    submit.disabled =
      true;

    submit.textContent =
      "Creating...";

  }


  try {

    const response =
      await fetch(
        `${API_URL}/api/users/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              full_name,

              email,

              password,

              phone

            })
        }
      );


    const data =
      await getJson(response);


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Registration failed"
      );

    }


    toast(
      "Account created successfully. Please login."
    );


    showLoginForm();


    const loginEmail =
      $("#loginEmail");

    if (loginEmail) {

      loginEmail.value =
        email;

    }


  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    toast(
      error.message ||
      "Unable to create account"
    );


  } finally {

    if (submit) {

      submit.disabled =
        false;

      submit.textContent =
        "Create Account";

    }

  }

}


// =====================================================
// LOGIN BUTTON
// =====================================================

function updateLoginButton() {

  const button =
    document.getElementById(
      "loginButton"
    );


  if (!button) {
    return;
  }


  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  let user = null;

  try {

    user =
      JSON.parse(
        localStorage.getItem(
          "traanscomUser"
        ) || "null"
      );

  } catch (error) {

    user = null;

  }


  if (!token) {

    button.textContent =
      "Login";

    button.onclick =
      openLoginOverlay;

    return;

  }


  button.textContent =
    user?.full_name ||
    "Account";


  button.onclick =
    openAccountMenu;

}


// =====================================================
// ACCOUNT MENU
// =====================================================

function openAccountMenu() {

  const old =
    document.getElementById(
      "accountMenuOverlay"
    );


  if (old) {
    old.remove();
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "accountMenuOverlay";


  overlay.style.cssText = `

    position:fixed;

    inset:0;

    background:
      rgba(0,0,0,.45);

    display:flex;

    align-items:center;

    justify-content:center;

    z-index:10000;

    padding:20px;

  `;


  const box =
    document.createElement(
      "div"
    );


  box.style.cssText = `

    background:white;

    width:360px;

    max-width:100%;

    border-radius:18px;

    padding:25px;

    box-sizing:border-box;

    box-shadow:
      0 20px 60px
      rgba(0,0,0,.25);

  `;


  box.innerHTML = `

    <h2 style="margin-top:0">
      My Account
    </h2>

    <button
      id="accountOrdersBtn"
      type="button"
      style="
        width:100%;
        padding:13px;
        margin-bottom:10px;
        border:0;
        border-radius:8px;
        background:#111;
        color:white;
        cursor:pointer;
      "
    >
      My Orders
    </button>


    <button
      id="accountLogoutBtn"
      type="button"
      style="
        width:100%;
        padding:13px;
        border:1px solid #ddd;
        border-radius:8px;
        background:white;
        color:#111;
        cursor:pointer;
      "
    >
      Logout
    </button>

  `;


  overlay.appendChild(
    box
  );


  document.body.appendChild(
    overlay
  );


  overlay.onclick =
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    };


  $("#accountOrdersBtn").onclick =
    () => {

      overlay.remove();

      loadMyOrders();

    };


  $("#accountLogoutBtn").onclick =
    () => {

      logoutUser();

      overlay.remove();

    };

}


// =====================================================
// LOGOUT
// =====================================================

function logoutUser() {

  localStorage.removeItem(
    "traanscomToken"
  );

  localStorage.removeItem(
    "traanscomUser"
  );


  updateLoginButton();


  toast(
    "Logged out successfully"
  );

}


// =====================================================
// MY ORDERS
// =====================================================

async function loadMyOrders() {

  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  if (!token) {

    toast(
      "Please login first"
    );

    openLoginOverlay();

    return;

  }


  try {

    const response =
      await fetch(
        `${API_URL}/api/orders/my-orders`,
        {
          method: "GET",

          headers: {
            "Accept":
              "application/json",

            "Authorization":
              "Bearer " + token
          }
        }
      );


    const data =
      await getJson(response);


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Unable to load orders"
      );

    }


    showMyOrders(
      Array.isArray(data)
        ? data
        : (
            data.orders ||
            []
          )
    );


  } catch (error) {

    console.error(
      "Orders error:",
      error
    );

    toast(
      error.message ||
      "Unable to load orders"
    );

  }

}


// =====================================================
// SHOW MY ORDERS
// =====================================================

function showMyOrders(orders) {

  const existing =
    document.getElementById(
      "myOrdersOverlay"
    );


  if (existing) {
    existing.remove();
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "myOrdersOverlay";


  overlay.style.cssText = `

    position:fixed;

    inset:0;

    background:
      rgba(0,0,0,.55);

    display:flex;

    align-items:center;

    justify-content:center;

    z-index:10001;

    padding:20px;

    box-sizing:border-box;

  `;


  const box =
    document.createElement(
      "div"
    );


  box.style.cssText = `

    background:white;

    width:700px;

    max-width:100%;

    max-height:90vh;

    overflow:auto;

    border-radius:18px;

    padding:28px;

    box-sizing:border-box;

  `;


  let ordersHtml = "";


  if (!orders.length) {

    ordersHtml = `

      <div
        style="
          text-align:center;
          padding:35px 10px;
          color:#777;
        "
      >
        You have no orders yet.
      </div>

    `;

  } else {

    ordersHtml =
      orders
        .map(order => `

          <div
            style="
              border:1px solid #eee;
              border-radius:12px;
              padding:16px;
              margin-bottom:12px;
            "
          >

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                flex-wrap:wrap;
              "
            >

              <div>

                <strong>
                  Order #${
                    escapeHtml(
                      order.order_number ||
                      order.id
                    )
                  }
                </strong>

                <div
                  style="
                    color:#777;
                    font-size:13px;
                    margin-top:5px;
                  "
                >
                  ${
                    order.created_at
                      ? new Date(
                          order.created_at
                        ).toLocaleString()
                      : ""
                  }
                </div>

              </div>


              <strong>
                ${money(
                  Number(
                    order.total || 0
                  ),
                  String(
                    order.currency ||
                    "PKR"
                  ).toUpperCase()
                )}
              </strong>

            </div>


            <div
              style="
                margin-top:10px;
                display:flex;
                gap:10px;
                flex-wrap:wrap;
              "
            >

              <span
                style="
                  background:#f1f1f1;
                  padding:5px 9px;
                  border-radius:20px;
                  font-size:12px;
                "
              >
                ${
                  escapeHtml(
                    String(
                      order.order_status ||
                      "pending"
                    ).toUpperCase()
                  )
                }
              </span>


              <span
                style="
                  background:#f1f1f1;
                  padding:5px 9px;
                  border-radius:20px;
                  font-size:12px;
                "
              >
                ${
                  escapeHtml(
                    order.payment_method ||
                    "COD"
                  )
                }
              </span>

            </div>


            <button
              type="button"
              data-order-id="${order.id}"
              class="view-order-btn"
              style="
                margin-top:15px;
                padding:10px 16px;
                border:0;
                border-radius:8px;
                background:#111;
                color:white;
                cursor:pointer;
              "
            >
              View Details
            </button>

          </div>

        `)
        .join("");

  }


  box.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
      "
    >

      <div>

        <p
          style="
            margin:0 0 5px;
            color:#777;
            font-size:13px;
            letter-spacing:1px;
          "
        >
          ACCOUNT
        </p>

        <h2 style="margin:0">
          My Orders
        </h2>

      </div>


      <button
        id="closeMyOrders"
        type="button"
        style="
          border:0;
          background:#eee;
          width:38px;
          height:38px;
          border-radius:50%;
          font-size:24px;
          cursor:pointer;
        "
      >
        ×
      </button>

    </div>


    ${ordersHtml}

  `;


  overlay.appendChild(
    box
  );


  document.body.appendChild(
    overlay
  );


  $("#closeMyOrders").onclick =
    () => {

      overlay.remove();

    };


  overlay.onclick =
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    };


  box
    .querySelectorAll(
      ".view-order-btn"
    )
    .forEach(button => {

      button.onclick =
        () => {

          viewMyOrder(
            Number(
              button.dataset.orderId
            )
          );

        };

    });

}


// =====================================================
// ORDER DETAILS
// =====================================================

async function viewMyOrder(orderId) {

  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  if (!token) {

    toast(
      "Please login first"
    );

    return;

  }


  try {

    const response =
      await fetch(
        `${API_URL}/api/orders/my-orders/${orderId}`,
        {
          method: "GET",

          headers: {
            "Authorization":
              "Bearer " + token
          }
        }
      );


    const data =
      await getJson(response);


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Unable to load order details"
      );

    }


    showOrderDetails(
      data
    );


  } catch (error) {

    console.error(
      "Order Details Error:",
      error
    );

    toast(
      error.message ||
      "Unable to load order details"
    );

  }

}


// =====================================================
// SHOW ORDER DETAILS
// =====================================================

function showOrderDetails(orderData) {

  const order =
    orderData.order ||
    orderData;


  const items =
    orderData.items ||
    order.items ||
    [];


  const existing =
    document.getElementById(
      "orderDetailsOverlay"
    );


  if (existing) {
    existing.remove();
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "orderDetailsOverlay";


  overlay.style.cssText = `

    position:fixed;

    inset:0;

    background:
      rgba(0,0,0,.55);

    display:flex;

    align-items:center;

    justify-content:center;

    z-index:10002;

    padding:20px;

    box-sizing:border-box;

  `;


  const box =
    document.createElement(
      "div"
    );


  box.style.cssText = `

    background:white;

    width:700px;

    max-width:100%;

    max-height:90vh;

    overflow:auto;

    border-radius:18px;

    padding:28px;

    box-sizing:border-box;

  `;


  const currency =
    String(
      order.currency ||
      "PKR"
    ).toUpperCase();


  const itemsHtml =
    items.length

      ? items
          .map(item => `

            <div
              style="
                display:flex;
                justify-content:space-between;
                gap:15px;
                padding:12px 0;
                border-bottom:1px solid #eee;
              "
            >

              <div>

                <strong>
                  ${escapeHtml(
                    item.product_name ||
                    "Product"
                  )}
                </strong>

                <div
                  style="
                    color:#777;
                    font-size:13px;
                    margin-top:4px;
                  "
                >
                  Qty:
                  ${Number(
                    item.quantity || 0
                  )}
                </div>

              </div>


              <strong>
                ${money(
                  Number(
                    item.total_price || 0
                  ),
                  currency
                )}
              </strong>

            </div>

          `)
          .join("")

      : `
          <p style="color:#777">
            No item details available.
          </p>
        `;


  box.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
      "
    >

      <h2 style="margin:0">
        Order Details
      </h2>


      <button
        id="closeOrderDetails"
        type="button"
        style="
          border:0;
          background:#eee;
          width:38px;
          height:38px;
          border-radius:50%;
          font-size:24px;
          cursor:pointer;
        "
      >
        ×
      </button>

    </div>


    <h3>
      Order #${
        escapeHtml(
          order.order_number ||
          order.id
        )
      }
    </h3>


    <p style="color:#666">
      ${
        order.created_at
          ? new Date(
              order.created_at
            ).toLocaleString()
          : ""
      }
    </p>


    <div
      style="
        background:#f7f7f7;
        padding:15px;
        border-radius:12px;
        margin:20px 0;
      "
    >

      <p>
        <strong>
          Order Status:
        </strong>

        ${
          escapeHtml(
            String(
              order.order_status ||
              "pending"
            ).toUpperCase()
          )
        }
      </p>


      <p>
        <strong>
          Payment:
        </strong>

        ${
          escapeHtml(
            order.payment_method ||
            "COD"
          )
        }
      </p>


      <p>
        <strong>
          Payment Status:
        </strong>

        ${
          escapeHtml(
            String(
              order.payment_status ||
              "pending"
            ).toUpperCase()
          )
        }
      </p>

    </div>


    <h3>
      Items
    </h3>


    ${itemsHtml}


    <div
      style="
        margin-top:20px;
        padding-top:15px;
        border-top:2px solid #111;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          margin-bottom:8px;
        "
      >

        <span>
          Subtotal
        </span>

        <strong>
          ${money(
            Number(
              order.subtotal || 0
            ),
            currency
          )}
        </strong>

      </div>


      <div
        style="
          display:flex;
          justify-content:space-between;
          margin-bottom:8px;
        "
      >

        <span>
          Shipping
        </span>

        <strong>
          ${money(
            Number(
              order.shipping_fee || 0
            ),
            currency
          )}
        </strong>

      </div>


      <div
        style="
          display:flex;
          justify-content:space-between;
          font-size:20px;
          margin-top:12px;
        "
      >

        <strong>
          Total
        </strong>

        <strong>
          ${money(
            Number(
              order.total || 0
            ),
            currency
          )}
        </strong>

      </div>

    </div>

  `;


  overlay.appendChild(
    box
  );


  document.body.appendChild(
    overlay
  );


  $("#closeOrderDetails").onclick =
    () => {

      overlay.remove();

    };


  overlay.onclick =
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    };

}


// =====================================================
// SHIPPING ADDRESS MODAL
// =====================================================

function openShippingAddressModal() {

  const existing =
    document.getElementById(
      "shippingAddressOverlay"
    );


  if (existing) {
    existing.remove();
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "shippingAddressOverlay";


  overlay.style.cssText = `

    position:fixed;

    inset:0;

    background:
      rgba(0,0,0,.55);

    display:flex;

    align-items:center;

    justify-content:center;

    z-index:10003;

    padding:20px;

    box-sizing:border-box;

  `;


  const box =
    document.createElement(
      "div"
    );


  box.style.cssText = `

    width:620px;

    max-width:100%;

    max-height:90vh;

    overflow:auto;

    background:white;

    border-radius:18px;

    padding:28px;

    box-sizing:border-box;

    box-shadow:
      0 20px 60px
      rgba(0,0,0,.25);

  `;


  box.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
      "
    >

      <div>

        <p
          style="
            margin:0 0 5px;
            color:#777;
            font-size:12px;
            letter-spacing:1px;
          "
        >
          CHECKOUT
        </p>

        <h2 style="margin:0">
          Shipping Address
        </h2>

      </div>


      <button
        id="closeShippingAddress"
        type="button"
        style="
          border:0;
          background:#eee;
          width:38px;
          height:38px;
          border-radius:50%;
          font-size:24px;
          cursor:pointer;
        "
      >
        ×
      </button>

    </div>


    <form id="shippingAddressForm">

      <label
        style="
          display:block;
          font-weight:600;
          margin-bottom:6px;
        "
      >
        Full Name *
      </label>

      <input
        id="shippingFullName"
        type="text"
        required
        autocomplete="name"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:14px;
        "
      >


      <label
        style="
          display:block;
          font-weight:600;
          margin-bottom:6px;
        "
      >
        Phone Number *
      </label>

      <input
        id="shippingPhone"
        type="tel"
        required
        autocomplete="tel"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:14px;
        "
      >


      <label
        style="
          display:block;
          font-weight:600;
          margin-bottom:6px;
        "
      >
        Address *
      </label>

      <input
        id="shippingAddress1"
        type="text"
        required
        autocomplete="street-address"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:14px;
        "
      >


      <label
        style="
          display:block;
          font-weight:600;
          margin-bottom:6px;
        "
      >
        Address Line 2
      </label>

      <input
        id="shippingAddress2"
        type="text"
        autocomplete="address-line2"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ddd;
          border-radius:8px;
          margin-bottom:14px;
        "
      >


      <div
        style="
          display:grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap:12px;
        "
      >

        <div>

          <label
            style="
              display:block;
              font-weight:600;
              margin-bottom:6px;
            "
          >
            City *
          </label>

          <input
            id="shippingCity"
            type="text"
            required
            autocomplete="address-level2"
            style="
              width:100%;
              box-sizing:border-box;
              padding:12px;
              border:1px solid #ddd;
              border-radius:8px;
            "
          >

        </div>


        <div>

          <label
            style="
              display:block;
              font-weight:600;
              margin-bottom:6px;
            "
          >
            Province / State
          </label>

          <input
            id="shippingState"
            type="text"
            autocomplete="address-level1"
            style="
              width:100%;
              box-sizing:border-box;
              padding:12px;
              border:1px solid #ddd;
              border-radius:8px;
            "
          >

        </div>

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap:12px;
          margin-top:14px;
        "
      >

        <div>

          <label
            style="
              display:block;
              font-weight:600;
              margin-bottom:6px;
            "
          >
            Postal Code
          </label>

          <input
            id="shippingPostalCode"
            type="text"
            autocomplete="postal-code"
            style="
              width:100%;
              box-sizing:border-box;
              padding:12px;
              border:1px solid #ddd;
              border-radius:8px;
            "
          >

        </div>


        <div>

          <label
            style="
              display:block;
              font-weight:600;
              margin-bottom:6px;
            "
          >
            Country *
          </label>

          <input
            id="shippingCountry"
            type="text"
            value="Pakistan"
            required
            autocomplete="country-name"
            style="
              width:100%;
              box-sizing:border-box;
              padding:12px;
              border:1px solid #ddd;
              border-radius:8px;
            "
          >

        </div>

      </div>


      <div
        style="
          margin-top:18px;
          padding:14px;
          background:#f7f7f7;
          border-radius:10px;
        "
      >

        <strong>
          Payment Method
        </strong>

        <p
          style="
            margin:5px 0 0;
            color:#666;
          "
        >
          Cash on Delivery (COD)
        </p>

      </div>


      <button
        id="saveAddressCheckout"
        type="submit"
        style="
          width:100%;
          padding:14px;
          margin-top:18px;
          border:0;
          border-radius:8px;
          background:#111;
          color:white;
          cursor:pointer;
          font-size:15px;
          font-weight:600;
        "
      >
        Save Address & Place Order
      </button>


      <button
        id="cancelShippingAddress"
        type="button"
        style="
          width:100%;
          padding:13px;
          margin-top:10px;
          border:1px solid #ddd;
          border-radius:8px;
          background:white;
          color:#111;
          cursor:pointer;
        "
      >
        Cancel
      </button>

    </form>

  `;


  overlay.appendChild(
    box
  );


  document.body.appendChild(
    overlay
  );


  let user = null;

  try {

    user =
      JSON.parse(
        localStorage.getItem(
          "traanscomUser"
        ) || "null"
      );

  } catch (error) {

    user = null;

  }


  if (user) {

    const name =
      $("#shippingFullName");

    const phone =
      $("#shippingPhone");


    if (
      name &&
      user.full_name
    ) {

      name.value =
        user.full_name;

    }


    if (
      phone &&
      user.phone
    ) {

      phone.value =
        user.phone;

    }

  }


  $("#closeShippingAddress").onclick =
    () => {

      overlay.remove();

    };


  $("#cancelShippingAddress").onclick =
    () => {

      overlay.remove();

    };


  overlay.onclick =
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    };


  $("#shippingAddressForm").onsubmit =
    saveShippingAddress;

}


// =====================================================
// SAVE ADDRESS + PLACE ORDER
// =====================================================

async function saveShippingAddress(event) {

  event.preventDefault();


  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  if (!token) {

    toast(
      "Please login before checkout"
    );

    openLoginOverlay();

    return;
  }


  const fullName =
    $("#shippingFullName").value.trim();

  const phone =
    $("#shippingPhone").value.trim();

  const addressLine1 =
    $("#shippingAddress1").value.trim();

  const addressLine2 =
    $("#shippingAddress2").value.trim();

  const city =
    $("#shippingCity").value.trim();

  const state =
    $("#shippingState").value.trim();

  const postalCode =
    $("#shippingPostalCode").value.trim();

  const country =
    $("#shippingCountry").value.trim();


  if (
    !fullName ||
    !phone ||
    !addressLine1 ||
    !city ||
    !country
  ) {

    toast(
      "Please fill all required address fields"
    );

    return;
  }


  const button =
    $("#saveAddressCheckout");


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Processing...";

  }


  try {

    // -----------------------------------------------
    // 1. SAVE ADDRESS
    // -----------------------------------------------

    const addressResponse =
      await fetch(
        `${API_URL}/api/addresses`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              "Bearer " + token

          },

          body:
            JSON.stringify({

              full_name:
                fullName,

              address_line1:
                addressLine1,

              address_line2:
                addressLine2 ||
                null,

              city:
                city,

              state:
                state ||
                null,

              postal_code:
                postalCode ||
                null,

              country:
                country,

              phone:
                phone

            })

        }
      );


    const addressData =
      await getJson(
        addressResponse
      );


    if (!addressResponse.ok) {

      throw new Error(
        addressData.message ||
        "Unable to save shipping address"
      );

    }


    // -----------------------------------------------
    // 2. PLACE ORDER
    // -----------------------------------------------

    const checkoutResponse =
      await fetch(
        `${API_URL}/api/checkout`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              "Bearer " + token

          },

          body:
            JSON.stringify({

              payment_method:
                "COD"

            })

        }
      );


    const checkoutData =
      await getJson(
        checkoutResponse
      );


    if (!checkoutResponse.ok) {

      throw new Error(
        checkoutData.message ||
        "Unable to place order"
      );

    }


    // -----------------------------------------------
    // 3. CLEAR CART
    // -----------------------------------------------

    cart = [];


    localStorage.setItem(
      "traanscomCart",
      JSON.stringify(cart)
    );


    renderCart();


    // -----------------------------------------------
    // 4. CLOSE UI
    // -----------------------------------------------

    const shippingOverlay =
      document.getElementById(
        "shippingAddressOverlay"
      );


    if (shippingOverlay) {

      shippingOverlay.remove();

    }


    closeCart();


    // -----------------------------------------------
    // 5. REFRESH PRODUCTS / STOCK
    // -----------------------------------------------

    await loadProducts();


    // -----------------------------------------------
    // 6. SUCCESS
    // -----------------------------------------------

    const order =
      checkoutData.order ||
      {};


    const orderNumber =
      order.order_number ||
      order.id ||
      "";


    toast(
      "Order placed successfully!" +
      (
        orderNumber
          ? " Order #" +
            orderNumber
          : ""
      )
    );


  } catch (error) {

    console.error(
      "Checkout error:",
      error
    );


    toast(
      error.message ||
      "Unable to place order. Please try again."
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Save Address & Place Order";

    }

  }

}


// =====================================================
// BUTTON EVENTS
// =====================================================

function attachButtonEvents() {

  const searchInput =
    $("#searchInput");

  if (searchInput) {

    searchInput.oninput =
      renderProducts;

  }


  const categoryFilter =
    $("#categoryFilter");

  if (categoryFilter) {

    categoryFilter.onchange =
      renderProducts;

  }


  const cartBtn =
    $("#cartBtn");

  if (cartBtn) {

    cartBtn.onclick =
      openCart;

  }


  const closeCartBtn =
    $("#closeCart");

  if (closeCartBtn) {

    closeCartBtn.onclick =
      closeCart;

  }


  const closeModalBtn =
    $("#closeModal");

  if (closeModalBtn) {

    closeModalBtn.onclick =
      closeProduct;

  }


  const overlay =
    $("#overlay");

  if (overlay) {

    overlay.onclick =
      () => {

        closeCart();
        closeProduct();

      };

  }


  const searchBtn =
    $("#searchBtn");

  if (searchBtn) {

    searchBtn.onclick =
      () => {

        if (searchInput) {

          searchInput.focus();

        }

        location.hash =
          "shop";

      };

  }


  const menuBtn =
    $("#menuBtn");

  if (menuBtn) {

    menuBtn.onclick =
      () => {

        const mobileNav =
          $("#mobileNav");

        if (mobileNav) {

          mobileNav.classList.toggle(
            "show"
          );

        }

      };

  }


  const checkoutBtn =
    $("#checkoutBtn");

  if (checkoutBtn) {

    checkoutBtn.onclick =
      checkout;

  }

}


// =====================================================
// START WEBSITE
// =====================================================

function initTraanscom() {

  console.log(
    "Initializing Traanscom..."
  );


  renderCategories();

  attachButtonEvents();

  renderCart();

  loadProducts();

  createLoginUI();

  updateLoginButton();


  if (
    localStorage.getItem(
      "traanscomToken"
    )
  ) {

    loadCartFromBackend();

  }

}


// =====================================================
// DOM READY
// =====================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initTraanscom
  );

} else {

  initTraanscom();

}