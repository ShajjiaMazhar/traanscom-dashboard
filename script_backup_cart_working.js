const API_URL = "http://localhost:5000/api";

let products = [];
let cart = JSON.parse(localStorage.getItem("traanscomCart") || "[]");

const cats = [
  ["Fashion", "👕"],
  ["Electronics", "🎧"],
  ["Beauty", "🧴"],
  ["Home & Living", "🏠"],
  ["Accessories", "👜"],
  ["Health & Care", "✨"]
];

const money = n => "Rs. " + Number(n || 0).toLocaleString("en-PK");
const $ = s => document.querySelector(s);


// =====================================================
// PRODUCTS
// =====================================================

async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const data = await response.json();

    products = data.map(p => ({
      id: Number(p.id),
      name: p.name,
      cat: p.category_name || "Uncategorized",
      price: Number(p.sale_price_pkr || p.price_pkr || 0),
      old: Number(p.price_pkr || 0),
      emoji: getCategoryEmoji(p.category_name),
      tag: p.is_featured ? "POPULAR" : "NEW",
      desc: p.description || "Quality product from Traanscom.",
      stock: Number(p.stock_quantity || 0),
      active: p.is_active
    }));

    renderProducts();
    renderCart();

  } catch (error) {
    console.error("Products API Error:", error);

    $("#productGrid").innerHTML = `
      <p style="padding:20px;">
        Unable to load products. Please make sure the Traanscom backend is running.
      </p>
    `;
  }
}


function getCategoryEmoji(category) {
  const map = {
    "Fashion": "👕",
    "Electronics": "🎧",
    "Beauty": "🧴",
    "Home & Living": "🏠",
    "Accessories": "👜",
    "Health & Care": "✨"
  };

  return map[category] || "🛍️";
}


// =====================================================
// CATEGORIES
// =====================================================

function renderCategories() {

  $("#categoryGrid").innerHTML = cats.map(
    ([name, emoji]) => `
      <div class="category" data-cat="${name}">
        <span class="emoji">${emoji}</span>
        <b>${name}</b>
      </div>
    `
  ).join("");

  document.querySelectorAll(".category").forEach(x => {

    x.onclick = () => {
      $("#categoryFilter").value = x.dataset.cat;
      renderProducts();
      location.hash = "shop";
    };

  });

  $("#categoryFilter").innerHTML =
    '<option value="all">All categories</option>' +
    cats.map(
      c => `<option value="${c[0]}">${c[0]}</option>`
    ).join("");
}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

  const q = $("#searchInput").value.toLowerCase().trim();
  const cat = $("#categoryFilter").value;

  const list = products.filter(p =>
    p.active !== false &&
    (cat === "all" || p.cat === cat) &&
    (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q)
    )
  );

  $("#productGrid").innerHTML = list.map(p => `
    <article class="product" data-id="${p.id}">

      <div class="product-image">

        <span class="tag">${p.tag}</span>

        <span class="emoji">${p.emoji}</span>

      </div>

      <div class="product-info">

        <h3>${p.name}</h3>

        <p>${p.cat}</p>

        <p class="price">${money(p.price)}</p>

      </div>

    </article>
  `).join("");

  $("#emptyState").hidden = list.length > 0;

  document.querySelectorAll(".product").forEach(x => {
    x.onclick = () => openProduct(Number(x.dataset.id));
  });
}


// =====================================================
// PRODUCT DETAILS
// =====================================================

function openProduct(id) {

  const p = products.find(x => x.id === id);

  if (!p) return;

  const stockMessage =
    p.stock > 0
      ? `✓ ${p.stock} in stock`
      : "✕ Out of stock";

  $("#modalContent").innerHTML = `
    <div class="modal-product">

      <div class="modal-img">
        ${p.emoji}
      </div>

      <div>

        <p class="eyebrow">${p.cat}</p>

        <h2>${p.name}</h2>

        <p class="price">${money(p.price)}</p>

        <p class="desc">
          ${p.desc}
        </p>

        <p>
          ${stockMessage}
          &nbsp; ✓ Secure checkout
        </p>

        ${
          p.stock > 0
            ? `
              <button
                class="btn primary"
                onclick="addToCart(${p.id})">
                Add to Cart
              </button>
            `
            : `
              <button
                class="btn primary"
                disabled>
                Out of Stock
              </button>
            `
        }

      </div>

    </div>
  `;

  $("#productModal").classList.add("open");
  $("#overlay").classList.add("show");
}


function closeProduct() {

  $("#productModal").classList.remove("open");
  $("#overlay").classList.remove("show");
}


// =====================================================
// LOAD CART FROM DATABASE
// =====================================================

async function loadCartFromBackend() {

  const token = localStorage.getItem("traanscomToken");

  if (!token) {
    return;
  }

  try {

    const response = await fetch(`${API_URL}/cart`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error("Failed to load backend cart");
      return;
    }

    const data = await response.json();

    cart = data.map(item => ({
      id: Number(item.product_id),
      qty: Number(item.quantity)
    }));

    localStorage.setItem(
      "traanscomCart",
      JSON.stringify(cart)
    );

    renderCart();

  } catch (error) {

    console.error("Load Cart Error:", error);

  }
}


// =====================================================
// ADD TO CART
// =====================================================

async function addToCart(id) {

  const product = products.find(p => p.id === id);

  if (!product) {
    toast("Product not found");
    return;
  }

  if (product.stock <= 0) {
    toast("Product is out of stock");
    return;
  }

  const token = localStorage.getItem("traanscomToken");

  if (!token) {

    toast("Please login first");

    const loginOverlay =
      document.getElementById("loginOverlay");

    if (loginOverlay) {
      loginOverlay.style.display = "flex";
    }

    return;
  }

  try {

    const response = await fetch(`${API_URL}/cart`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },

      body: JSON.stringify({
        product_id: id,
        quantity: 1
      })
    });

    const data = await response.json();

    if (!response.ok) {

      toast(data.message || "Unable to add to cart");

      return;
    }

    toast("Added to cart");

    await loadCartFromBackend();

  } catch (error) {

    console.error("Cart API Error:", error);

    toast("Cannot connect to cart server");
  }
}


// =====================================================
// LOCAL CART STORAGE
// =====================================================

function saveCart() {

  localStorage.setItem(
    "traanscomCart",
    JSON.stringify(cart)
  );

  renderCart();
}


// =====================================================
// RENDER CART
// =====================================================

function renderCart() {

  $("#cartCount").textContent =
    cart.reduce((a, x) => a + x.qty, 0);

  if (!cart.length) {

    $("#cartItems").innerHTML =
      '<p class="empty">Your cart is empty.</p>';

    $("#cartTotal").textContent =
      money(0);

    return;
  }

  $("#cartItems").innerHTML =
    cart.map(x => {

      const p =
        products.find(z => z.id === x.id);

      if (!p) return "";

      return `
        <div class="cart-row">

          <div class="cart-thumb">
            ${p.emoji}
          </div>

          <div>

            <h4>${p.name}</h4>

            <p>${money(p.price)}</p>

            <div class="qty">

              <button
                onclick="changeQty(${p.id}, -1)">
                −
              </button>

              <span>${x.qty}</span>

              <button
                onclick="changeQty(${p.id}, 1)">
                +
              </button>

            </div>

          </div>

          <b>
            ${money(p.price * x.qty)}
          </b>

        </div>
      `;

    }).join("");

  $("#cartTotal").textContent =
    money(
      cart.reduce(
        (total, x) => {

          const p =
            products.find(z => z.id === x.id);

          return total +
            (p ? p.price * x.qty : 0);

        },
        0
      )
    );
}


// =====================================================
// CHANGE QUANTITY
// =====================================================

async function changeQty(id, d) {

  const token =
    localStorage.getItem("traanscomToken");

  if (!token) {
    toast("Please login first");
    return;
  }

  const x =
    cart.find(a => a.id === id);

  const p =
    products.find(a => a.id === id);

  if (!x || !p) {
    return;
  }

  const newQuantity =
    x.qty + d;


  if (newQuantity <= 0) {

    try {

      const response = await fetch(
        `${API_URL}/cart/${id}`,
        {
          method: "DELETE",

          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        toast(
          data.message ||
          "Unable to remove item"
        );

        return;
      }

      cart =
        cart.filter(item => item.id !== id);

      saveCart();

      toast("Item removed");

    } catch (error) {

      console.error(
        "Remove Cart Error:",
        error
      );

      toast(
        "Cannot connect to cart server"
      );
    }

    return;
  }


  if (newQuantity > p.stock) {

    toast("Maximum stock reached");

    return;
  }


  try {

    const response = await fetch(
      `${API_URL}/cart/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          quantity: newQuantity
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      toast(
        data.message ||
        "Unable to update cart"
      );

      return;
    }

    x.qty = newQuantity;

    saveCart();

  } catch (error) {

    console.error(
      "Update Cart Error:",
      error
    );

    toast(
      "Cannot connect to cart server"
    );
  }
}


// =====================================================
// CART DRAWER
// =====================================================

function openCart() {

  $("#cartDrawer")
    .classList.add("open");

  $("#overlay")
    .classList.add("show");
}


function closeCart() {

  $("#cartDrawer")
    .classList.remove("open");

  $("#overlay")
    .classList.remove("show");
}


// =====================================================
// TOAST
// =====================================================

function toast(msg) {

  $("#toast").textContent = msg;

  $("#toast").classList.add("show");

  setTimeout(
    () =>
      $("#toast").classList.remove("show"),
    1600
  );
}


// =====================================================
// BUTTON EVENTS
// =====================================================

$("#searchInput").oninput =
  renderProducts;

$("#categoryFilter").onchange =
  renderProducts;

$("#cartBtn").onclick =
  openCart;

$("#closeCart").onclick =
  closeCart;

$("#closeModal").onclick =
  closeProduct;

$("#overlay").onclick = () => {

  closeCart();
  closeProduct();

};


$("#searchBtn").onclick = () => {

  $("#searchInput").focus();

  location.hash = "shop";
};


$("#menuBtn").onclick = () => {

  $("#mobileNav")
    .classList.toggle("show");

};


// =====================================================
// CHECKOUT
// =====================================================

$("#checkoutBtn").onclick = () => {

  if (!cart.length) {

    toast("Your cart is empty");

    return;
  }

  const token =
    localStorage.getItem("traanscomToken");

  if (!token) {

    toast("Please login before checkout");

    const loginOverlay =
      document.getElementById("loginOverlay");

    if (loginOverlay) {
      loginOverlay.style.display = "flex";
    }

    return;
  }

  toast("Checkout will be connected next");

};


// =====================================================
// LOGIN UI
// =====================================================

function createLoginUI() {

  const loginBox =
    document.createElement("div");

  loginBox.id = "loginBox";

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
          box-shadow:0 20px 60px rgba(0,0,0,.25);
        "
      >

        <h2 style="margin-top:0;">
          Login to Traanscom
        </h2>

        <p style="color:#666;">
          Login to manage your cart and orders.
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

  document.body.appendChild(loginBox);


  const button =
    document.createElement("button");

  button.id = "loginButton";

  button.textContent = "Login";

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
    box-shadow:0 5px 20px rgba(0,0,0,.2);
  `;

  document.body.appendChild(button);


  button.onclick = () => {

    document.getElementById(
      "loginOverlay"
    ).style.display = "flex";

  };


  document.getElementById(
    "loginClose"
  ).onclick = () => {

    document.getElementById(
      "loginOverlay"
    ).style.display = "none";

  };


  document.getElementById(
    "loginSubmit"
  ).onclick = loginUser;

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

          body: JSON.stringify({
            email: email,
            password: password
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
      JSON.stringify(data.user)
    );


    message.textContent =
      "Login successful!";

    message.style.color =
      "green";


    await loadCartFromBackend();


    setTimeout(() => {

      document.getElementById(
        "loginOverlay"
      ).style.display = "none";


      updateLoginButton();


      toast(
        `Welcome ${data.user.full_name}`
      );

    }, 800);


  } catch (error) {

    console.error(
      "Login Error:",
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

  if (!button) return;


  const user =
    JSON.parse(
      localStorage.getItem(
        "traanscomUser"
      ) || "null"
    );


  if (user) {

    button.textContent =
      `👤 ${user.full_name}`;

  } else {

    button.textContent =
      "Login";

  }
}


// =====================================================
// START
// =====================================================

renderCategories();

loadProducts();

renderCart();

createLoginUI();

updateLoginButton();


// =====================================================
// LOAD DATABASE CART IF LOGGED IN
// =====================================================

if (
  localStorage.getItem("traanscomToken")
) {

  loadCartFromBackend();

}