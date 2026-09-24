const API_URL = "https://traanscom-backend.onrender.com";

let products = [];

let cart = JSON.parse(
  localStorage.getItem("traanscomCart") || "[]"
);


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
// HELPERS
// =====================================================

const $ = selector =>
  document.querySelector(selector);


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

  const symbol =
    symbols[currency] || `${currency} `;

  return (
    symbol +
    value.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  );
}


function getSellingPrice(product) {

  const sale = Number(
    product.sale_price ?? 0
  );

  const price = Number(
    product.price ?? 0
  );

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

  return (
    map[category] ||
    "🛍️"
  );
}


function getProductImageUrl(imageUrl) {

  if (!imageUrl) {
    return null;
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return (
    API_URL +
    imageUrl
  );
}


function productImageHtml(
  product,
  mode = "card"
) {

  const imageUrl =
    getProductImageUrl(
      product.image_url
    );

  if (imageUrl) {

    return `
      <img
        src="${imageUrl}"
        alt="${product.name}"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        "
        onerror="
          this.style.display='none';
          this.nextElementSibling.style.display='flex';
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
          font-size:55px;
        "
      >
        ${product.emoji}
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
      ${product.emoji}
    </span>
  `;
}


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

  try {

    const response =
      await fetch(
        `${API_URL}/api/products`
      );

    if (!response.ok) {

      throw new Error(
        "Failed to load products"
      );

    }

    const data =
      await response.json();

    products =
      data.map(p => ({

        id: Number(p.id),

        name: p.name,

        cat:
          p.category_name ||
          "Uncategorized",

        description:
          p.description ||
          "Quality product from Traanscom.",

        desc:
          p.description ||
          "Quality product from Traanscom.",

        currency:
          (
            p.currency ||
            "PKR"
          ).toUpperCase(),

        price:
          Number(
            p.price ??
            p.price_pkr ??
            0
          ),

        sale_price:
          Number(
            p.sale_price ??
            p.sale_price_pkr ??
            0
          ),

        old:
          Number(
            p.price ??
            p.price_pkr ??
            0
          ),

        stock:
          Number(
            p.stock_quantity || 0
          ),

        sku:
          p.sku || "",

        active:
          p.is_active,

        featured:
          p.is_featured,

        tag:
          p.is_featured
            ? "POPULAR"
            : "NEW",

        emoji:
          getCategoryEmoji(
            p.category_name
          ),

        image_url:
          p.image_url || null,

        image_is_primary:
          p.image_is_primary || false

      }));


    renderProducts();

    renderCart();


  } catch (error) {

    console.error(
      "Products API Error:",
      error
    );

    if ($("#productGrid")) {

      $("#productGrid").innerHTML = `

        <p style="
          padding:20px;
          grid-column:1/-1;
        ">

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

  if (!$("#categoryGrid")) {
    return;
  }


  $("#categoryGrid").innerHTML =
    cats.map(
      ([name, emoji]) => `

        <div
          class="category"
          data-cat="${name}"
        >

          <span class="emoji">
            ${emoji}
          </span>

          <b>
            ${name}
          </b>

        </div>

      `
    ).join("");


  document
    .querySelectorAll(".category")
    .forEach(category => {

      category.onclick = () => {

        if ($("#categoryFilter")) {

          $("#categoryFilter").value =
            category.dataset.cat;

        }

        renderProducts();

        location.hash = "shop";

      };

    });


  if ($("#categoryFilter")) {

    $("#categoryFilter").innerHTML =
      '<option value="all">All categories</option>' +

      cats.map(
        category =>
          `<option value="${category[0]}">
            ${category[0]}
          </option>`
      ).join("");

  }

}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

  if (!$("#productGrid")) {
    return;
  }


  const q =
    $("#searchInput")
      ? $("#searchInput")
          .value
          .toLowerCase()
          .trim()
      : "";


  const cat =
    $("#categoryFilter")
      ? $("#categoryFilter").value
      : "all";


  const list =
    products.filter(product => {

      return (

        product.active !== false &&

        (
          cat === "all" ||
          product.cat === cat
        ) &&

        (

          !q ||

          product.name
            .toLowerCase()
            .includes(q)

          ||

          product.cat
            .toLowerCase()
            .includes(q)

        )

      );

    });


  $("#productGrid").innerHTML =
    list.map(product => {

      const sellingPrice =
        getSellingPrice(product);

      const currency =
        getCurrency(product);

      const originalPrice =
        Number(
          product.price || 0
        );

      const hasSale =
        Number(product.sale_price || 0) > 0 &&
        Number(product.sale_price || 0) <
        originalPrice;


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
              ${product.tag}
            </span>

            ${productImageHtml(product)}

          </div>


          <div class="product-info">

            <h3>
              ${product.name}
            </h3>

            <p>
              ${product.cat}
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

    }).join("");


  if ($("#emptyState")) {

    $("#emptyState").hidden =
      list.length > 0;

  }


  document
    .querySelectorAll(".product")
    .forEach(productCard => {

      productCard.onclick = () => {

        openProduct(
          Number(
            productCard.dataset.id
          )
        );

      };

    });

}


// =====================================================
// PRODUCT DETAILS
// =====================================================

function openProduct(id) {

  const product =
    products.find(
      item => item.id === id
    );


  if (!product) {
    return;
  }


  const currency =
    getCurrency(product);


  const sellingPrice =
    getSellingPrice(product);


  const originalPrice =
    Number(
      product.price || 0
    );


  const hasSale =
    Number(product.sale_price || 0) > 0 &&
    Number(product.sale_price || 0) <
    originalPrice;


  const stockMessage =
    product.stock > 0
      ? `✓ ${product.stock} in stock`
      : "✕ Out of stock";


  if (!$("#modalContent")) {
    return;
  }


  $("#modalContent").innerHTML = `

    <div
      class="modal-product-image"
      style="
        height:280px;
        overflow:hidden;
        display:flex;
        align-items:center;
        justify-content:center;
      "
    >

      ${productImageHtml(
        product,
        "modal"
      )}

    </div>


    <div
      style="
        padding:20px;
      "
    >

      <p
        style="
          color:#777;
          margin:0 0 5px;
        "
      >
        ${product.cat}
      </p>


      <h2
        style="
          margin:0 0 10px;
        "
      >
        ${product.name}
      </h2>


      <div
        style="
          margin-bottom:12px;
        "
      >

        <strong
          style="
            font-size:22px;
          "
        >
          ${money(
            sellingPrice,
            currency
          )}
        </strong>

        ${
          hasSale
            ? `
              <span
                style="
                  text-decoration:line-through;
                  color:#999;
                  margin-left:8px;
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

      </div>


      <p>
        ${
          product.description ||
          "Quality product from Traanscom."
        }
      </p>


      <p
        style="
          font-weight:600;
          margin-top:12px;
        "
      >
        ${stockMessage}
      </p>


      <button
        onclick="
          addToCart(${product.id});
          closeProduct();
        "
        ${
          product.stock <= 0
            ? "disabled"
            : ""
        }
        style="
          width:100%;
          padding:13px;
          border:0;
          border-radius:8px;
          background:#111;
          color:white;
          cursor:pointer;
          margin-top:10px;
          opacity:${
            product.stock <= 0
              ? ".5"
              : "1"
          };
        "
      >
        ${
          product.stock > 0
            ? "Add to Cart"
            : "Out of Stock"
        }
      </button>

    </div>

  `;


  if ($("#modal")) {

    $("#modal")
      .classList
      .add("show");

  }

}


// =====================================================
// CLOSE PRODUCT
// =====================================================

function closeProduct() {

  if ($("#modal")) {

    $("#modal")
      .classList
      .remove("show");

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
            "Authorization":
              "Bearer " + token
          }

        }
      );


    if (!response.ok) {
      return;
    }


    const data =
      await response.json();


    const backendItems =
      Array.isArray(data)
        ? data
        : (
            data.cart ||
            data.items ||
            []
          );


    cart =
      backendItems.map(item => ({

        id:
          Number(
            item.product_id ||
            item.id
          ),

        qty:
          Number(
            item.quantity ||
            item.qty ||
            1
          )

      }));


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
      item => item.id === id
    );


  if (
    !product ||
    product.stock <= 0
  ) {

    toast(
      "Product is out of stock"
    );

    return;

  }


  const found =
    cart.find(
      item => item.id === id
    );


  if (found) {

    if (
      found.qty >=
      product.stock
    ) {

      toast(
        "Maximum available stock reached"
      );

      return;

    }

    found.qty++;

  } else {

    cart.push({

      id: id,

      qty: 1

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

                product_id: id,

                quantity: 1

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
// UPDATE CART COUNT
// =====================================================

function updateCartCount() {

  const count =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.qty || 0),
      0
    );


  if ($("#cartCount")) {

    $("#cartCount")
      .textContent = count;

  }

}


// =====================================================
// RENDER CART
// =====================================================

function renderCart() {

  updateCartCount();


  if (!$("#cartItems")) {
    return;
  }


  if (!cart.length) {

    $("#cartItems").innerHTML =
      '<p class="empty">Your cart is empty.</p>';


    if ($("#cartTotal")) {

      $("#cartTotal")
        .textContent =
        money(0);

    }

    return;

  }


  $("#cartItems").innerHTML =

    cart.map(item => {

      const product =
        products.find(
          p => p.id === item.id
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
              ${product.name}
            </h4>


            <p>
              ${money(
                price,
                currency
              )}
            </p>


            <div class="qty">

              <button
                onclick="
                  changeQty(
                    ${product.id},
                    -1
                  )
                "
              >
                −
              </button>


              <span>
                ${item.qty}
              </span>


              <button
                onclick="
                  changeQty(
                    ${product.id},
                    1
                  )
                "
              >
                +
              </button>

            </div>

          </div>


          <b>

            ${money(
              price *
              item.qty,
              currency
            )}

          </b>

        </div>

      `;

    }).join("");


  let total = 0;


  cart.forEach(item => {

    const product =
      products.find(
        p => p.id === item.id
      );


    if (product) {

      total +=
        getSellingPrice(product) *
        item.qty;

    }

  });


  if ($("#cartTotal")) {

    const currencies =
      cart
        .map(item => {

          const product =
            products.find(
              p => p.id === item.id
            );

          return product
            ? getCurrency(product)
            : "PKR";

        });


    const currency =
      currencies[0] || "PKR";


    $("#cartTotal")
      .textContent =
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
      x => x.id === id
    );


  const product =
    products.find(
      x => x.id === id
    );


  if (
    !item ||
    !product
  ) {
    return;
  }


  const newQty =
    item.qty + delta;


  if (newQty <= 0) {

    cart =
      cart.filter(
        x => x.id !== id
      );

  } else if (
    newQty > product.stock
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


  if (token) {

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
                quantity: newQty
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

}


// =====================================================
// OPEN CART
// =====================================================

function openCart() {

  if ($("#cartDrawer")) {

    $("#cartDrawer")
      .classList
      .add("open");

  }

  if ($("#overlay")) {

    $("#overlay")
      .classList
      .add("show");

  }

  renderCart();

}


// =====================================================
// CLOSE CART
// =====================================================

function closeCart() {

  if ($("#cartDrawer")) {

    $("#cartDrawer")
      .classList
      .remove("open");

  }

  if ($("#overlay")) {

    $("#overlay")
      .classList
      .remove("show");

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

    const savedCart =
      JSON.parse(
        localStorage.getItem(
          "traanscomCart"
        ) || "[]"
      );


    if (Array.isArray(savedCart)) {

      cart =
        savedCart;

    }

  } catch (error) {

    console.error(
      "Unable to read saved cart:",
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
        event.target === overlay
      ) {

        overlay.style.display =
          "none";

      }

    };


  const loginButton =
    document.createElement(
      "button"
    );


  loginButton.id =
    "loginButton";


  loginButton.textContent =
    "Login";


  loginButton.style.cssText = `

    position:fixed;

    right:20px;

    bottom:20px;

    z-index:9000;

    border:0;

    border-radius:999px;

    padding:12px 20px;

    background:#111;

    color:white;

    cursor:pointer;

    box-shadow:
      0 8px 25px
      rgba(0,0,0,.2);

  `;


  loginButton.onclick =
    openLoginOverlay;


  document.body.appendChild(
    loginButton
  );


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


        <h2
          style="
            margin:0;
          "
        >
          Login
        </h2>

      </div>


      <button
        id="closeLogin"
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


  document.getElementById(
    "closeLogin"
  ).onclick =
    closeLoginOverlay;


  document.getElementById(
    "showRegister"
  ).onclick =
    showRegisterForm;


  document.getElementById(
    "loginForm"
  ).onsubmit =
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


        <h2
          style="
            margin:0;
          "
        >
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


  document.getElementById(
    "closeRegister"
  ).onclick =
    closeLoginOverlay;


  document.getElementById(
    "showLogin"
  ).onclick =
    showLoginForm;


  document.getElementById(
    "registerForm"
  ).onsubmit =
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
    return;
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
    document.getElementById(
      "loginEmail"
    ).value.trim();


  const password =
    document.getElementById(
      "loginPassword"
    ).value;


  const submit =
    document.getElementById(
      "loginSubmit"
    );


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
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Login failed"
      );

    }


    localStorage.setItem(
      "traanscomToken",
      data.token
    );


    localStorage.setItem(
      "traanscomUser",
      JSON.stringify(
        data.user
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
    document.getElementById(
      "registerName"
    ).value.trim();


  const email =
    document.getElementById(
      "registerEmail"
    ).value.trim();


  const phone =
    document.getElementById(
      "registerPhone"
    ).value.trim();


  const password =
    document.getElementById(
      "registerPassword"
    ).value;


  const submit =
    document.getElementById(
      "registerSubmit"
    );


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
      await response.json();


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
      document.getElementById(
        "loginEmail"
      );


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
// LOGIN BUTTON / ACCOUNT MENU
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


  const user =
    JSON.parse(
      localStorage.getItem(
        "traanscomUser"
      ) || "null"
    );


  if (!token) {

    button.textContent =
      "Login";

    button.onclick =
      openLoginOverlay;

    return;

  }


  button.textContent =
    user?.full_name
      ? user.full_name
      : "Account";


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

    <h2
      style="
        margin-top:0;
      "
    >
      My Account
    </h2>


    <button
      id="accountOrdersBtn"
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
        event.target === overlay
      ) {

        overlay.remove();

      }

    };


  document.getElementById(
    "accountOrdersBtn"
  ).onclick = () => {

    overlay.remove();

    loadMyOrders();

  };


  document.getElementById(
    "accountLogoutBtn"
  ).onclick = () => {

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
            "Authorization":
              "Bearer " + token
          }

        }
      );


    const data =
      await response.json();


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

function showMyOrders(
  orders
) {

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


  let ordersHtml;


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
      orders.map(order => `

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
                  order.order_number ||
                  order.id
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
                (
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
                String(
                  order.order_status ||
                  "pending"
                ).toUpperCase()
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
                order.payment_method ||
                "COD"
              }
            </span>

          </div>


          <button
            onclick="
              viewMyOrder(
                ${order.id}
              )
            "
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

      `).join("");

  }


  box.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
        gap:15px;
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


        <h2
          style="
            margin:0;
          "
        >
          My Orders
        </h2>

      </div>


      <button
        id="closeMyOrders"
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


  document.getElementById(
    "closeMyOrders"
  ).onclick = () => {

    overlay.remove();

  };


  overlay.onclick = event => {

    if (
      event.target === overlay
    ) {

      overlay.remove();

    }

  };

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
      await response.json();


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

function showOrderDetails(
  orderData
) {

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


  const currency =
    (
      order.currency ||
      "PKR"
    ).toUpperCase();


  const itemsHtml =
    items.length

      ? items.map(item => `

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
                ${
                  item.product_name ||
                  "Product"
                }
              </strong>


              <div
                style="
                  color:#777;
                  font-size:13px;
                  margin-top:4px;
                "
              >
                Qty:
                ${item.quantity}
              </div>

            </div>


            <strong>

              ${money(
                Number(
                  item.total_price ||
                  0
                ),
                currency
              )}

            </strong>

          </div>

        `).join("")

      : `

          <p
            style="
              color:#777;
            "
          >
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

      <h2
        style="
          margin:0;
        "
      >
        Order Details
      </h2>


      <button
        id="closeOrderDetails"
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
        order.order_number ||
        order.id
      }
    </h3>


    <p
      style="
        color:#666;
      "
    >
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

        ${String(
          order.order_status ||
          "pending"
        ).toUpperCase()}

      </p>


      <p>

        <strong>
          Payment:
        </strong>

        ${
          order.payment_method ||
          "COD"
        }

      </p>


      <p>

        <strong>
          Payment Status:
        </strong>

        ${String(
          order.payment_status ||
          "pending"
        ).toUpperCase()}

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
              order.subtotal ||
              0
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
              order.shipping_fee ||
              0
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
              order.total ||
              0
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


  document.getElementById(
    "closeOrderDetails"
  ).onclick = () => {

    overlay.remove();

  };


  overlay.onclick = event => {

    if (
      event.target === overlay
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

    z-index:10002;

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


        <h2
          style="
            margin:0;
          "
        >
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


  const user =
    JSON.parse(
      localStorage.getItem(
        "traanscomUser"
      ) || "null"
    );


  if (user) {

    const name =
      document.getElementById(
        "shippingFullName"
      );


    const phone =
      document.getElementById(
        "shippingPhone"
      );


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


  document.getElementById(
    "closeShippingAddress"
  ).onclick = () => {

    overlay.remove();

  };


  document.getElementById(
    "cancelShippingAddress"
  ).onclick = () => {

    overlay.remove();

  };


  overlay.onclick =
    event => {

      if (
        event.target === overlay
      ) {

        overlay.remove();

      }

    };


  document.getElementById(
    "shippingAddressForm"
  ).onsubmit =
    saveShippingAddress;

}


// =====================================================
// SAVE ADDRESS + PLACE ORDER
// =====================================================

async function saveShippingAddress(
  event
) {

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
    document.getElementById(
      "shippingFullName"
    ).value.trim();


  const phone =
    document.getElementById(
      "shippingPhone"
    ).value.trim();


  const addressLine1 =
    document.getElementById(
      "shippingAddress1"
    ).value.trim();


  const addressLine2 =
    document.getElementById(
      "shippingAddress2"
    ).value.trim();


  const city =
    document.getElementById(
      "shippingCity"
    ).value.trim();


  const state =
    document.getElementById(
      "shippingState"
    ).value.trim();


  const postalCode =
    document.getElementById(
      "shippingPostalCode"
    ).value.trim();


  const country =
    document.getElementById(
      "shippingCountry"
    ).value.trim();


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
    document.getElementById(
      "saveAddressCheckout"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Processing...";

  }


  try {

    // -----------------------------------------------
    // 1. Save shipping address
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
      await addressResponse.json();


    if (!addressResponse.ok) {

      throw new Error(
        addressData.message ||
        "Unable to save shipping address"
      );

    }


    // -----------------------------------------------
    // 2. Checkout
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
      await checkoutResponse.json();


    if (!checkoutResponse.ok) {

      throw new Error(
        checkoutData.message ||
        "Unable to place order"
      );

    }


    // -----------------------------------------------
    // 3. Clear local cart
    // -----------------------------------------------

    cart = [];


    localStorage.setItem(
      "traanscomCart",
      JSON.stringify(cart)
    );


    renderCart();


    // -----------------------------------------------
    // 4. Close checkout UI
    // -----------------------------------------------

    const overlay =
      document.getElementById(
        "shippingAddressOverlay"
      );


    if (overlay) {
      overlay.remove();
    }


    closeCart();


    // -----------------------------------------------
    // 5. Refresh products / stock
    // -----------------------------------------------

    await loadProducts();


    // -----------------------------------------------
    // 6. Success message
    // -----------------------------------------------

    toast(
      "Order placed successfully! Order #" +
      (
        checkoutData.order?.order_number ||
        checkoutData.order?.id ||
        ""
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

if ($("#searchInput")) {

  $("#searchInput").oninput =
    renderProducts;

}


if ($("#categoryFilter")) {

  $("#categoryFilter").onchange =
    renderProducts;

}


if ($("#cartBtn")) {

  $("#cartBtn").onclick =
    openCart;

}


if ($("#closeCart")) {

  $("#closeCart").onclick =
    closeCart;

}


if ($("#closeModal")) {

  $("#closeModal").onclick =
    closeProduct;

}


if ($("#overlay")) {

  $("#overlay").onclick = () => {

    closeCart();

    closeProduct();

  };

}


if ($("#searchBtn")) {

  $("#searchBtn").onclick = () => {

    if ($("#searchInput")) {

      $("#searchInput").focus();

    }

    location.hash =
      "shop";

  };

}


if ($("#menuBtn")) {

  $("#menuBtn").onclick = () => {

    if ($("#mobileNav")) {

      $("#mobileNav")
        .classList
        .toggle("show");

    }

  };

}


if ($("#checkoutBtn")) {

  $("#checkoutBtn").onclick =
    checkout;

}


// =====================================================
// START WEBSITE
// =====================================================

renderCategories();

loadProducts();

renderCart();


// =====================================================
// START LOGIN SYSTEM
// =====================================================

createLoginUI();

updateLoginButton();


// =====================================================
// LOAD BACKEND CART IF LOGGED IN
// =====================================================

if (
  localStorage.getItem(
    "traanscomToken"
  )
) {

  loadCartFromBackend();

}