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
    "https://traanscom-backend.onrender.com" +
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
// LOAD PRODUCTS FROM BACKEND
// =====================================================

async function loadProducts() {

  try {

    const response =
      await fetch(
        `${API_URL}/products`
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

          Please make sure the
          Traanscom backend is running.

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

    <div class="modal-product">

      <div
        class="modal-img"
        style="
          overflow:hidden;
          min-height:300px;
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


      <div>

        <p class="eyebrow">
          ${product.cat}
        </p>


        <h2>
          ${product.name}
        </h2>


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
                    font-size:15px;
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

        </p>


        <p class="desc">
          ${product.desc}
        </p>


        <p>

          ${stockMessage}

          &nbsp;

          ✓ Secure checkout

        </p>


        ${
          product.stock > 0

            ? `

              <button
                class="btn primary"
                onclick="
                  addToCart(${product.id});
                  closeProduct();
                "
              >
                Add to Cart
              </button>

            `

            : `

              <button
                class="btn primary"
                disabled
              >
                Out of Stock
              </button>

            `
        }

      </div>

    </div>

  `;


  if ($("#productModal")) {

    $("#productModal")
      .classList
      .add("open");

  }


  if ($("#overlay")) {

    $("#overlay")
      .classList
      .add("show");

  }

}


// =====================================================
// CLOSE PRODUCT
// =====================================================

function closeProduct() {

  if ($("#productModal")) {

    $("#productModal")
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
// LOAD CART FROM BACKEND
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
        `${API_URL}/cart`,
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

      await fetch(
        `${API_URL}/cart`,
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

    const firstProduct =
      products.find(
        p =>
          cart.some(
            item =>
              item.id === p.id
          )
      );


    const currency =
      firstProduct
        ? getCurrency(firstProduct)
        : "PKR";


    $("#cartTotal")
      .textContent =
      money(
        total,
        currency
      );

  }

}


// =====================================================
// CHANGE QUANTITY
// =====================================================

function changeQty(id, difference) {

  const item =
    cart.find(
      x => x.id === id
    );


  const product =
    products.find(
      x => x.id === id
    );


  if (!item || !product) {
    return;
  }


  item.qty += difference;


  if (
    item.qty >
    product.stock
  ) {

    item.qty =
      product.stock;

    toast(
      "Maximum stock reached"
    );

  }


  if (item.qty <= 0) {

    cart =
      cart.filter(
        x => x.id !== id
      );

  }


  saveCart();

}


// =====================================================
// CART DRAWER
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

}


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

  if (!$("#toast")) {
    return;
  }


  $("#toast")
    .textContent =
    message;


  $("#toast")
    .classList
    .add("show");


  setTimeout(
    () => {

      if ($("#toast")) {

        $("#toast")
          .classList
          .remove("show");

      }

    },
    1800
  );

}


// =====================================================
// CHECKOUT
// =====================================================

async function checkout() {

  if (!cart.length) {

    toast(
      "Your cart is empty"
    );

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


    const loginOverlay =
      document.getElementById(
        "loginOverlay"
      );


    if (loginOverlay) {

      loginOverlay.style.display =
        "flex";

    }


    return;

  }


  const checkoutBtn =
    $("#checkoutBtn");


  try {

    if (checkoutBtn) {

      checkoutBtn.disabled =
        true;

      checkoutBtn.textContent =
        "Processing...";

    }


    const response =
      await fetch(
        `${API_URL}/checkout`,
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
                "cod"

            })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Checkout failed"
      );

    }


    cart = [];


    localStorage.setItem(
      "traanscomCart",
      JSON.stringify(cart)
    );


    renderCart();


    toast(
      "Order placed successfully! Order #" +
      (
        data.order?.order_number ||
        data.order?.id ||
        ""
      )
    );


    setTimeout(
      () => {

        closeCart();

      },
      1200
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

    if (checkoutBtn) {

      checkoutBtn.disabled =
        false;

      checkoutBtn.textContent =
        "Proceed to Checkout";

    }

  }

}


// =====================================================
// LOGIN UI
// =====================================================

function createLoginUI() {

  if (
    document.getElementById(
      "loginBox"
    )
  ) {
    return;
  }


  const loginBox =
    document.createElement(
      "div"
    );


  loginBox.id =
    "loginBox";


  loginBox.innerHTML = `

    <div
      id="loginOverlay"
      style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.55);
        display:none;
        align-items:center;
        justify-content:center;
        z-index:9999;
      "
    >

      <div
        style="
          background:white;
          width:360px;
          max-width:90%;
          padding:30px;
          border-radius:18px;
          box-shadow:
            0 20px 60px
            rgba(0,0,0,.25);
        "
      >

        <h2
          style="
            margin-top:0;
          "
        >
          Login to Traanscom
        </h2>


        <p
          style="
            color:#666;
          "
        >
          Login to manage your
          cart and orders.
        </p>


        <input
          id="loginEmail"
          type="email"
          placeholder="Email address"
          style="
            width:100%;
            box-sizing:border-box;
            padding:13px;
            margin:8px 0;
            border:1px solid #ddd;
            border-radius:8px;
          "
        >


        <input
          id="loginPassword"
          type="password"
          placeholder="Password"
          style="
            width:100%;
            box-sizing:border-box;
            padding:13px;
            margin:8px 0;
            border:1px solid #ddd;
            border-radius:8px;
          "
        >


        <button
          id="loginSubmit"
          style="
            width:100%;
            padding:13px;
            margin-top:10px;
            border:0;
            border-radius:8px;
            background:#111;
            color:white;
            cursor:pointer;
            font-size:16px;
          "
        >
          Login
        </button>


        <button
          id="loginClose"
          style="
            width:100%;
            padding:10px;
            margin-top:8px;
            border:0;
            background:#eee;
            border-radius:8px;
            cursor:pointer;
          "
        >
          Close
        </button>


        <p
          id="loginMessage"
          style="
            margin-bottom:0;
            text-align:center;
          "
        ></p>

      </div>

    </div>

  `;


  document.body.appendChild(
    loginBox
  );


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "loginButton";


  button.textContent =
    "Login";


  button.style.cssText = `

    position:fixed;

    right:20px;

    bottom:20px;

    z-index:9998;

    padding:12px 20px;

    border:0;

    border-radius:25px;

    background:#111;

    color:white;

    cursor:pointer;

    font-weight:bold;

    box-shadow:
      0 5px 20px
      rgba(0,0,0,.2);

  `;


  document.body.appendChild(
    button
  );


  button.onclick = () => {

    const overlay =
      document.getElementById(
        "loginOverlay"
      );


    if (overlay) {

      overlay.style.display =
        "flex";

    }

  };


  document.getElementById(
    "loginClose"
  ).onclick = () => {

    document.getElementById(
      "loginOverlay"
    ).style.display =
      "none";

  };


  document.getElementById(
    "loginSubmit"
  ).onclick =
    loginUser;

}


// =====================================================
// LOGIN API
// =====================================================

async function loginUser() {

  const email =
    document.getElementById(
      "loginEmail"
    ).value.trim();


  const password =
    document.getElementById(
      "loginPassword"
    ).value;


  const message =
    document.getElementById(
      "loginMessage"
    );


  if (!email || !password) {

    message.textContent =
      "Please enter email and password.";

    message.style.color =
      "red";

    return;

  }


  try {

    const response =
      await fetch(
        `${API_URL}/users/login`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              email:
                email,

              password:
                password

            })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      message.textContent =
        data.message ||
        "Login failed.";

      message.style.color =
        "red";

      return;

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


    message.textContent =
      "Login successful!";


    message.style.color =
      "green";


    await loadCartFromBackend();


    setTimeout(
      () => {

        const overlay =
          document.getElementById(
            "loginOverlay"
          );


        if (overlay) {

          overlay.style.display =
            "none";

        }


        updateLoginButton();


        toast(
          `Welcome ${data.user.full_name}`
        );

      },
      800
    );


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    message.textContent =
      "Cannot connect to server.";


    message.style.color =
      "red";

  }

}


// =====================================================
// LOGIN BUTTON STATE
// =====================================================

function updateLoginButton() {

  const button =
    document.getElementById(
      "loginButton"
    );


  if (!button) {
    return;
  }


  const user =
    JSON.parse(
      localStorage.getItem(
        "traanscomUser"
      ) || "null"
    );


  if (user) {

    button.textContent =
      `👤 ${user.full_name}`;


    button.onclick = () => {

      loadMyOrders();

    };


  } else {

    button.textContent =
      "Login";


    button.onclick = () => {

      const overlay =
        document.getElementById(
          "loginOverlay"
        );


      if (overlay) {

        overlay.style.display =
          "flex";

      }

    };

  }

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
      "Please login to view your orders"
    );

    return;

  }


  try {

    const response =
      await fetch(
        `${API_URL}/orders/my-orders`,
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


    const orders =
      Array.isArray(data)
        ? data
        : (
            data.orders ||
            data.data ||
            []
          );


    showMyOrders(
      orders
    );


  } catch (error) {

    console.error(
      "My Orders Error:",
      error
    );


    toast(
      error.message ||
      "Unable to load your orders"
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

    z-index:10000;

    padding:20px;

    box-sizing:border-box;

  `;


  const box =
    document.createElement(
      "div"
    );


  box.style.cssText = `

    background:white;

    width:850px;

    max-width:100%;

    max-height:90vh;

    overflow:auto;

    border-radius:18px;

    padding:28px;

    box-sizing:border-box;

    box-shadow:
      0 20px 60px
      rgba(0,0,0,.25);

  `;


  let ordersHtml = "";


  if (
    !orders ||
    !orders.length
  ) {

    ordersHtml = `

      <div
        style="
          text-align:center;
          padding:50px 20px;
          color:#666;
        "
      >

        <div
          style="
            font-size:50px;
            margin-bottom:15px;
          "
        >
          📦
        </div>


        <h3
          style="
            margin:0 0 8px;
            color:#111;
          "
        >
          No orders yet
        </h3>


        <p>
          Your placed orders
          will appear here.
        </p>

      </div>

    `;

  } else {

    ordersHtml =
      orders.map(order => {

        const currency =
          (
            order.currency ||
            "PKR"
          ).toUpperCase();


        const total =
          money(
            Number(
              order.total || 0
            ),
            currency
          );


        const date =
          order.created_at
            ? new Date(
                order.created_at
              ).toLocaleString()
            : "-";


        const status =
          String(
            order.order_status ||
            "pending"
          ).toUpperCase();


        const paymentStatus =
          String(
            order.payment_status ||
            "pending"
          ).toUpperCase();


        return `

          <div
            style="
              border:1px solid #e5e5e5;
              border-radius:14px;
              padding:18px;
              margin-bottom:14px;
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

                <h3
                  style="
                    margin:0 0 7px;
                  "
                >
                  Order #${
                    order.order_number ||
                    order.id
                  }
                </h3>


                <p
                  style="
                    margin:0;
                    color:#666;
                    font-size:14px;
                  "
                >
                  ${date}
                </p>

              </div>


              <div
                style="
                  text-align:right;
                "
              >

                <strong
                  style="
                    font-size:18px;
                  "
                >
                  ${total}
                </strong>

              </div>

            </div>


            <div
              style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
                margin-top:15px;
              "
            >

              <span
                style="
                  padding:6px 10px;
                  background:#f3f3f3;
                  border-radius:20px;
                  font-size:12px;
                "
              >
                Order: ${status}
              </span>


              <span
                style="
                  padding:6px 10px;
                  background:#f3f3f3;
                  border-radius:20px;
                  font-size:12px;
                "
              >
                Payment:
                ${paymentStatus}
              </span>


              <span
                style="
                  padding:6px 10px;
                  background:#f3f3f3;
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

        `;

      }).join("");

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
        `${API_URL}/orders/my-orders/${orderId}`,
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
// LOAD BACKEND CART IF ALREADY LOGGED IN
// =====================================================

if (
  localStorage.getItem(
    "traanscomToken"
  )
) {

  loadCartFromBackend();

}