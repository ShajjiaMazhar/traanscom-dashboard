const API_URL = "http://localhost:5000/api";

let products = [];
let cart = JSON.parse(
  localStorage.getItem("traanscomCart") || "[]"
);

const cats = [
  ["Fashion", "👕"],
  ["Electronics", "🎧"],
  ["Beauty", "🧴"],
  ["Home & Living", "🏠"],
  ["Accessories", "👜"],
  ["Health & Care", "✨"]
];

const money = n =>
  "Rs. " + Number(n || 0).toLocaleString("en-PK");

const $ = s => document.querySelector(s);


// =====================================================
// PRODUCTS
// =====================================================

async function loadProducts() {

  try {

    const response =
      await fetch(`${API_URL}/products`);

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const data =
      await response.json();

    products = data.map(p => ({

      id: Number(p.id),

      name: p.name,

      cat:
        p.category_name ||
        "Uncategorized",

      price:
        Number(
          p.sale_price_pkr ||
          p.price_pkr ||
          0
        ),

      old:
        Number(
          p.price_pkr || 0
        ),

      emoji:
        getCategoryEmoji(
          p.category_name
        ),

      tag:
        p.is_featured
          ? "POPULAR"
          : "NEW",

      desc:
        p.description ||
        "Quality product from Traanscom.",

      stock:
        Number(
          p.stock_quantity || 0
        ),

      active:
        p.is_active

    }));

    renderProducts();

    renderCart();

  } catch (error) {

    console.error(
      "Products API Error:",
      error
    );

    $("#productGrid").innerHTML = `
      <p style="padding:20px;">
        Unable to load products.
        Please make sure the Traanscom backend is running.
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

          <b>${name}</b>
        </div>
      `
    ).join("");


  document
    .querySelectorAll(".category")
    .forEach(x => {

      x.onclick = () => {

        $("#categoryFilter").value =
          x.dataset.cat;

        renderProducts();

        location.hash = "shop";
      };

    });


  $("#categoryFilter").innerHTML =
    '<option value="all">All categories</option>' +

    cats.map(
      c =>
        `<option value="${c[0]}">
          ${c[0]}
        </option>`
    ).join("");
}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

  const q =
    $("#searchInput")
      .value
      .toLowerCase()
      .trim();

  const cat =
    $("#categoryFilter").value;


  const list =
    products.filter(p =>

      p.active !== false &&

      (cat === "all" || p.cat === cat) &&

      (
        !q ||

        p.name
          .toLowerCase()
          .includes(q) ||

        p.cat
          .toLowerCase()
          .includes(q)
      )

    );


  $("#productGrid").innerHTML =
    list.map(p => `

      <article
        class="product"
        data-id="${p.id}"
      >

        <div class="product-image">

          <span class="tag">
            ${p.tag}
          </span>

          <span class="emoji">
            ${p.emoji}
          </span>

        </div>


        <div class="product-info">

          <h3>
            ${p.name}
          </h3>

          <p>
            ${p.cat}
          </p>

          <p class="price">
            ${money(p.price)}
          </p>

        </div>

      </article>

    `).join("");


  $("#emptyState").hidden =
    list.length > 0;


  document
    .querySelectorAll(".product")
    .forEach(x => {

      x.onclick = () =>
        openProduct(
          Number(
            x.dataset.id
          )
        );

    });
}


// =====================================================
// PRODUCT DETAILS
// =====================================================

function openProduct(id) {

  const p =
    products.find(
      x => x.id === id
    );

  if (!p) {
    return;
  }


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

        <p class="eyebrow">
          ${p.cat}
        </p>

        <h2>
          ${p.name}
        </h2>

        <p class="price">
          ${money(p.price)}
        </p>

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
                onclick="addToCart(${p.id})"
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


  $("#productModal")
    .classList.add("open");

  $("#overlay")
    .classList.add("show");
}


function closeProduct() {

  $("#productModal")
    .classList.remove("open");

  $("#overlay")
    .classList.remove("show");
}


// =====================================================
// LOAD CART FROM DATABASE
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
              `Bearer ${token}`
          }
        }
      );


    if (!response.ok) {

      console.error(
        "Failed to load backend cart"
      );

      return;
    }


    const data =
      await response.json();


    cart =
      data.map(item => ({

        id:
          Number(
            item.product_id
          ),

        qty:
          Number(
            item.quantity
          )

      }));


    localStorage.setItem(
      "traanscomCart",
      JSON.stringify(cart)
    );


    renderCart();

  } catch (error) {

    console.error(
      "Load Cart Error:",
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
      p => p.id === id
    );


  if (!product) {

    toast(
      "Product not found"
    );

    return;
  }


  if (product.stock <= 0) {

    toast(
      "Product is out of stock"
    );

    return;
  }


  const token =
    localStorage.getItem(
      "traanscomToken"
    );


  if (!token) {

    toast(
      "Please login first"
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


  try {

    const response =
      await fetch(
        `${API_URL}/cart`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${token}`

          },

          body:
            JSON.stringify({

              product_id:
                id,

              quantity:
                1

            })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      toast(
        data.message ||
        "Unable to add to cart"
      );

      return;
    }


    toast(
      "Added to cart"
    );


    await loadCartFromBackend();

  } catch (error) {

    console.error(
      "Cart API Error:",
      error
    );


    toast(
      "Cannot connect to cart server"
    );
  }
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
// RENDER CART
// =====================================================

function renderCart() {

  $("#cartCount").textContent =
    cart.reduce(
      (a, x) =>
        a + x.qty,
      0
    );


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
        products.find(
          z => z.id === x.id
        );


      if (!p) {
        return "";
      }


      return `

        <div class="cart-row">

          <div class="cart-thumb">
            ${p.emoji}
          </div>


          <div>

            <h4>
              ${p.name}
            </h4>

            <p>
              ${money(p.price)}
            </p>


            <div class="qty">

              <button
                onclick="changeQty(${p.id}, -1)"
              >
                −
              </button>

              <span>
                ${x.qty}
              </span>

              <button
                onclick="changeQty(${p.id}, 1)"
              >
                +
              </button>

            </div>

          </div>


          <b>
            ${money(
              p.price * x.qty
            )}
          </b>

        </div>

      `;

    }).join("");


  $("#cartTotal").textContent =
    money(
      cart.reduce(
        (total, x) => {

          const p =
            products.find(
              z => z.id === x.id
            );


          return total +
            (
              p
                ? p.price * x.qty
                : 0
            );

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
    localStorage.getItem(
      "traanscomToken"
    );


  if (!token) {

    toast(
      "Please login first"
    );

    return;
  }


  const x =
    cart.find(
      a => a.id === id
    );


  const p =
    products.find(
      a => a.id === id
    );


  if (!x || !p) {
    return;
  }


  const newQuantity =
    x.qty + d;


  if (newQuantity <= 0) {

    try {

      const response =
        await fetch(
          `${API_URL}/cart/${id}`,
          {
            method: "DELETE",

            headers: {
              "Authorization":
                `Bearer ${token}`
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
        cart.filter(
          item =>
            item.id !== id
        );


      saveCart();


      toast(
        "Item removed"
      );

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

    toast(
      "Maximum stock reached"
    );

    return;
  }


  try {

    const response =
      await fetch(
        `${API_URL}/cart/${id}`,
        {
          method: "PUT",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${token}`

          },

          body:
            JSON.stringify({

              quantity:
                newQuantity

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


    x.qty =
      newQuantity;


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

  $("#toast").textContent =
    msg;

  $("#toast")
    .classList.add("show");


  setTimeout(
    () =>
      $("#toast")
        .classList.remove("show"),
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

  location.hash =
    "shop";
};


$("#menuBtn").onclick = () => {

  $("#mobileNav")
    .classList.toggle("show");

};


// =====================================================
// CHECKOUT
// =====================================================

$("#checkoutBtn").onclick =
  async () => {

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


    const oldCheckout =
      document.getElementById(
        "checkoutOverlay"
      );


    if (oldCheckout) {
      oldCheckout.remove();
    }


    const checkoutOverlay =
      document.createElement(
        "div"
      );


    checkoutOverlay.id =
      "checkoutOverlay";


    checkoutOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 20px;
    `;


    checkoutOverlay.innerHTML = `

      <div style="
        background: white;
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 16px;
        padding: 25px;
        box-sizing: border-box;
      ">

        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        ">

          <h2 style="margin: 0;">
            Checkout
          </h2>

          <button
            id="closeCheckout"
            style="
              border: none;
              background: transparent;
              font-size: 25px;
              cursor: pointer;
            "
          >
            ×
          </button>

        </div>


        <p style="margin-bottom: 20px;">
          Please enter your shipping information.
        </p>


        <label>
          Full Name
        </label>

        <input
          id="checkoutName"
          type="text"
          value="Test Customer"
          placeholder="Enter full name"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 15px;
            box-sizing: border-box;
          "
        >


        <label>
          Phone
        </label>

        <input
          id="checkoutPhone"
          type="text"
          value="03001112233"
          placeholder="Enter phone number"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 15px;
            box-sizing: border-box;
          "
        >


        <label>
          Address
        </label>

        <input
          id="checkoutAddress"
          type="text"
          value="House 25, Street 10"
          placeholder="Enter address"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 15px;
            box-sizing: border-box;
          "
        >


        <label>
          Address Line 2
        </label>

        <input
          id="checkoutAddress2"
          type="text"
          value="Near Main Market"
          placeholder="Apartment, area, landmark"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 15px;
            box-sizing: border-box;
          "
        >


        <label>
          City
        </label>

        <input
          id="checkoutCity"
          type="text"
          value="Faisalabad"
          placeholder="Enter city"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 15px;
            box-sizing: border-box;
          "
        >


        <label>
          State / Province
        </label>

        <input
          id="checkoutState"
          type="text"
          value="Punjab"
          placeholder="Enter state"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 15px;
            box-sizing: border-box;
          "
        >


        <label>
          Postal Code
        </label>

        <input
          id="checkoutPostal"
          type="text"
          value="38000"
          placeholder="Enter postal code"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 15px;
            box-sizing: border-box;
          "
        >


        <label>
          Country
        </label>

        <input
          id="checkoutCountry"
          type="text"
          value="Pakistan"
          placeholder="Enter country"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 15px;
            box-sizing: border-box;
          "
        >


        <label>
          Payment Method
        </label>

        <select
          id="checkoutPayment"
          style="
            width: 100%;
            padding: 12px;
            margin: 6px 0 10px;
            box-sizing: border-box;
          "
        >

          <option value="COD">
            💵 Cash on Delivery
          </option>

          <option value="ONLINE">
            💳 Online Payment
          </option>

        </select>


        <div
          id="onlinePaymentInfo"
          style="
            display: none;
            background: #f5f7fa;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 20px;
            font-size: 14px;
          "
        >
          💳 Online payment will be processed
          through our secure payment gateway.
          You will continue to the payment page
          after confirming your order.
        </div>


        <button
          id="placeOrderBtn"
          class="btn primary"
          style="
            width: 100%;
            padding: 14px;
            cursor: pointer;
          "
        >
          Place Order
        </button>

      </div>

    `;


    document.body.appendChild(
      checkoutOverlay
    );


    const closeCheckout =
      document.getElementById(
        "closeCheckout"
      );


    closeCheckout.onclick = () => {

      checkoutOverlay.remove();

    };


    checkoutOverlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          checkoutOverlay
        ) {

          checkoutOverlay.remove();

        }

      }
    );


    // =================================================
    // PAYMENT METHOD UI
    // =================================================

    const checkoutPayment =
      document.getElementById(
        "checkoutPayment"
      );


    const onlinePaymentInfo =
      document.getElementById(
        "onlinePaymentInfo"
      );


    checkoutPayment.addEventListener(
      "change",
      () => {

        if (
          checkoutPayment.value ===
          "ONLINE"
        ) {

          onlinePaymentInfo.style.display =
            "block";

        } else {

          onlinePaymentInfo.style.display =
            "none";

        }

      }
    );


    // =================================================
    // PLACE ORDER
    // =================================================

    document.getElementById(
      "placeOrderBtn"
    ).onclick =
      async () => {

        const placeOrderBtn =
          document.getElementById(
            "placeOrderBtn"
          );


        placeOrderBtn.disabled =
          true;

        placeOrderBtn.textContent =
          "Processing...";


        try {

          const addressData = {

            full_name:
              document
                .getElementById(
                  "checkoutName"
                )
                .value
                .trim(),

            phone:
              document
                .getElementById(
                  "checkoutPhone"
                )
                .value
                .trim(),

            address_line1:
              document
                .getElementById(
                  "checkoutAddress"
                )
                .value
                .trim(),

            address_line2:
              document
                .getElementById(
                  "checkoutAddress2"
                )
                .value
                .trim(),

            city:
              document
                .getElementById(
                  "checkoutCity"
                )
                .value
                .trim(),

            state:
              document
                .getElementById(
                  "checkoutState"
                )
                .value
                .trim(),

            postal_code:
              document
                .getElementById(
                  "checkoutPostal"
                )
                .value
                .trim(),

            country:
              document
                .getElementById(
                  "checkoutCountry"
                )
                .value
                .trim()

          };


          if (
            !addressData.full_name ||
            !addressData.phone ||
            !addressData.address_line1 ||
            !addressData.city ||
            !addressData.state ||
            !addressData.postal_code ||
            !addressData.country
          ) {

            toast(
              "Please complete all required fields"
            );


            placeOrderBtn.disabled =
              false;

            placeOrderBtn.textContent =
              "Place Order";

            return;
          }


          // ===========================================
          // SAVE SHIPPING ADDRESS
          // ===========================================

          const addressResponse =
            await fetch(
              `${API_URL}/addresses`,
              {

                method: "POST",

                headers: {

                  "Content-Type":
                    "application/json",

                  "Authorization":
                    `Bearer ${token}`

                },

                body:
                  JSON.stringify(
                    addressData
                  )

              }
            );


          const addressResult =
            await addressResponse.json();


          if (!addressResponse.ok) {

            throw new Error(
              addressResult.message ||
              "Failed to save shipping address"
            );
          }


          // ===========================================
          // CALCULATE TOTAL
          // ===========================================

          const subtotal =
            cart.reduce(
              (sum, item) => {

                const product =
                  products.find(
                    p =>
                      p.id ===
                      item.id
                  );


                return sum +
                  (
                    product
                      ? product.price *
                        item.qty
                      : 0
                  );

              },
              0
            );


          const shippingFee =
            200;


          const discount =
            0;


          const total =
            subtotal +
            shippingFee -
            discount;


          const user =
            JSON.parse(
              localStorage.getItem(
                "traanscomUser"
              ) || "{}"
            );


          // ===========================================
          // ONLINE PAYMENT
          // ===========================================

          if (
            checkoutPayment.value ===
            "ONLINE"
          ) {

            placeOrderBtn.disabled =
              false;

            placeOrderBtn.textContent =
              "Place Order";


            toast(
              "Online payment gateway will be connected next."
            );


            return;
          }


          // ===========================================
          // CASH ON DELIVERY ORDER
          // ===========================================

          const orderData = {

            customer_name:
              addressData.full_name,

            customer_email:
              user.email || "",

            customer_phone:
              addressData.phone,

            shipping_address:
              addressData.address_line1 +

              (
                addressData.address_line2
                  ? ", " +
                    addressData.address_line2
                  : ""
              ),

            shipping_country:
              addressData.country,

            shipping_city:
              addressData.city,

            currency:
              "PKR",

            subtotal:
              subtotal,

            shipping_fee:
              shippingFee,

            discount:
              discount,

            total:
              total,

            payment_method:
              "COD"

          };


          const orderResponse =
            await fetch(
              `${API_URL}/checkout`,
              {

                method: "POST",

                headers: {

                  "Content-Type":
                    "application/json",

                  "Authorization":
                    `Bearer ${token}`

                },

                body:
                  JSON.stringify(
                    orderData
                  )

              }
            );


          const orderResult =
            await orderResponse.json();


          if (!orderResponse.ok) {

            throw new Error(
              orderResult.message ||
              "Checkout failed"
            );
          }


          // ===========================================
          // SUCCESS
          // ===========================================

          checkoutOverlay.remove();


          cart = [];


          localStorage.setItem(
            "traanscomCart",
            JSON.stringify(cart)
          );


          await loadCartFromBackend();


          toast(
            "Order placed successfully!"
          );


          setTimeout(
            () => {

              alert(
                "Order placed successfully!\n\n" +
                "Order Number: " +
                (
                  orderResult
                    .order
                    ?.order_number ||
                  "Created successfully"
                )
              );

            },
            300
          );


        } catch (error) {

          console.error(
            "Checkout error:",
            error
          );


          toast(
            error.message ||
            "Checkout failed"
          );


          placeOrderBtn.disabled =
            false;

          placeOrderBtn.textContent =
            "Place Order";
        }

      };

  };


// =====================================================
// LOGIN UI
// =====================================================

function createLoginUI() {

  const oldLoginBox =
    document.getElementById(
      "loginBox"
    );

  if (oldLoginBox) {
    oldLoginBox.remove();
  }


  const oldLoginButton =
    document.getElementById(
      "loginButton"
    );

  if (oldLoginButton) {
    oldLoginButton.remove();
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

    const user =
      JSON.parse(
        localStorage.getItem(
          "traanscomUser"
        ) || "null"
      );


    if (user) {

      toast(
        `Logged in as ${user.full_name}`
      );

      return;
    }


    document.getElementById(
      "loginOverlay"
    ).style.display =
      "flex";

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
    document
      .getElementById(
        "loginEmail"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "loginPassword"
      )
      .value;


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


    updateLoginButton();


    setTimeout(
      () => {

        document.getElementById(
          "loginOverlay"
        ).style.display =
          "none";


        updateLoginButton();


        toast(
          `Welcome ${data.user.full_name}`
        );

      },
      800
    );


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

  } else {

    button.textContent =
      "Login";
  }


  // Show My Orders only when logged in

  const ordersButton =
    document.getElementById(
      "ordersButton"
    );


  if (ordersButton) {

    ordersButton.style.display =
      user
        ? "block"
        : "none";

  }
}


// =====================================================
// MY ORDERS BUTTON
// =====================================================

function createOrdersUI() {

  const oldOrdersButton =
    document.getElementById(
      "ordersButton"
    );

  if (oldOrdersButton) {
    oldOrdersButton.remove();
  }


  const ordersButton =
    document.createElement(
      "button"
    );


  ordersButton.id =
    "ordersButton";


  ordersButton.textContent =
    "📦 My Orders";


  ordersButton.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 75px;
    z-index: 9998;
    padding: 12px 20px;
    border: 0;
    border-radius: 25px;
    background: #ffffff;
    color: #111;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 5px 20px rgba(0,0,0,.15);
    display: none;
  `;


  document.body.appendChild(
    ordersButton
  );


  ordersButton.onclick =
    loadMyOrders;
}


// =====================================================
// LOAD MY ORDERS
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
              `Bearer ${token}`

          }

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      toast(
        data.message ||
        "Unable to load orders"
      );

      return;
    }


    // Support both possible backend response formats

    const orders =
      Array.isArray(data)
        ? data
        : (
            Array.isArray(data.orders)
              ? data.orders
              : []
          );


    showOrdersModal(
      orders
    );


  } catch (error) {

    console.error(
      "My Orders Error:",
      error
    );


    toast(
      "Cannot connect to order server"
    );
  }
}


// =====================================================
// SHOW MY ORDERS MODAL
// =====================================================

function showOrdersModal(orders) {

  const oldModal =
    document.getElementById(
      "ordersOverlay"
    );


  if (oldModal) {
    oldModal.remove();
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "ordersOverlay";


  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 20px;
  `;


  overlay.innerHTML = `

    <div style="
      background: white;
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 18px;
      padding: 25px;
      box-sizing: border-box;
    ">


      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
      ">

        <h2 style="margin:0;">
          📦 My Orders
        </h2>


        <button
          id="closeOrders"
          style="
            border:none;
            background:transparent;
            font-size:28px;
            cursor:pointer;
          "
        >
          ×
        </button>

      </div>


      ${
        orders.length === 0

          ? `

            <div style="
              text-align:center;
              padding:40px 20px;
              color:#666;
            ">

              <div style="font-size:45px;">
                📦
              </div>

              <h3>
                No orders yet
              </h3>

              <p>
                Your orders will appear here after checkout.
              </p>

            </div>

          `

          :

          orders.map(
            order => `

              <div style="
                border:1px solid #e5e5e5;
                border-radius:14px;
                padding:18px;
                margin-bottom:15px;
                background:#fafafa;
              ">


                <div style="
                  display:flex;
                  justify-content:space-between;
                  gap:10px;
                  flex-wrap:wrap;
                ">


                  <div>

                    <strong>
                      Order #${order.order_number}
                    </strong>


                    <p style="
                      margin:6px 0;
                      color:#777;
                      font-size:14px;
                    ">

                      ${formatOrderDate(
                        order.created_at
                      )}

                    </p>

                  </div>


                  <span style="
                    background:#fff3cd;
                    color:#856404;
                    padding:6px 12px;
                    border-radius:20px;
                    font-size:13px;
                    font-weight:bold;
                  ">

                    ${
                      order.order_status ||
                      "pending"
                    }

                  </span>

                </div>


                <div style="
                  display:grid;
                  grid-template-columns:
                    repeat(auto-fit,minmax(140px,1fr));
                  gap:12px;
                  margin-top:15px;
                ">


                  <div>

                    <small style="color:#777;">
                      Total
                    </small>


                    <strong style="
                      display:block;
                      margin-top:4px;
                    ">

                      ${money(
                        order.total
                      )}

                    </strong>

                  </div>


                  <div>

                    <small style="color:#777;">
                      Payment
                    </small>


                    <strong style="
                      display:block;
                      margin-top:4px;
                    ">

                      ${
                        order.payment_method ||
                        "-"
                      }

                    </strong>

                  </div>


                  <div>

                    <small style="color:#777;">
                      Payment Status
                    </small>


                    <strong style="
                      display:block;
                      margin-top:4px;
                    ">

                      ${
                        order.payment_status ||
                        "pending"
                      }

                    </strong>

                  </div>


                </div>


                <div style="
                  margin-top:15px;
                  padding-top:12px;
                  border-top:1px solid #e5e5e5;
                  font-size:14px;
                  color:#555;
                ">

                  <strong>
                    Shipping:
                  </strong>

                  ${
                    order.shipping_address ||
                    "-"
                  },

                  ${
                    order.shipping_city ||
                    "-"
                  },

                  ${
                    order.shipping_country ||
                    "-"
                  }

                </div>


                <div style="
                  margin-top:10px;
                  font-size:13px;
                  color:#777;
                ">

                  Order ID:
                  ${order.id}

                </div>


                <button
                  class="viewOrderDetailsBtn"
                  data-order-id="${order.id}"
                  style="
                    margin-top:15px;
                    width:100%;
                    padding:11px 15px;
                    border:none;
                    border-radius:8px;
                    background:#111;
                    color:white;
                    cursor:pointer;
                    font-weight:bold;
                  "
                >
                  👁 View Details
                </button>


              </div>

            `
          ).join("")
      }


    </div>

  `;


  document.body.appendChild(
    overlay
  );


  document.getElementById(
    "closeOrders"
  ).onclick = () => {

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


  // ===================================================
  // VIEW ORDER DETAILS BUTTONS
  // ===================================================

  document
    .querySelectorAll(
      ".viewOrderDetailsBtn"
    )
    .forEach(button => {

      button.onclick = async () => {

        const orderId =
          button.dataset.orderId;

        await loadOrderDetails(
          orderId
        );

      };

    });
}


// =====================================================
// LOAD SINGLE ORDER DETAILS
// =====================================================

async function loadOrderDetails(orderId) {

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
              `Bearer ${token}`

          }

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      toast(
        data.message ||
        "Unable to load order details"
      );

      return;
    }


    showOrderDetailsModal(
      data
    );


  } catch (error) {

    console.error(
      "Order Details Error:",
      error
    );


    toast(
      "Cannot connect to order server"
    );
  }
}


// =====================================================
// SHOW SINGLE ORDER DETAILS
// =====================================================

function showOrderDetailsModal(data) {

  const oldModal =
    document.getElementById(
      "orderDetailsOverlay"
    );


  if (oldModal) {
    oldModal.remove();
  }


  const order =
    data.order || {};

  const items =
    Array.isArray(data.items)
      ? data.items
      : [];


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "orderDetailsOverlay";


  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.70);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000;
    padding: 20px;
  `;


  const itemsHTML =
    items.length === 0

      ? `
        <div style="
          text-align:center;
          padding:30px;
          color:#777;
        ">
          No products found for this order.
        </div>
      `

      :

      items.map(
        item => `

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            padding:15px 0;
            border-bottom:1px solid #eee;
          ">

            <div style="
              flex:1;
            ">

              <strong style="
                display:block;
                margin-bottom:6px;
              ">
                ${item.product_name}
              </strong>


              <div style="
                color:#777;
                font-size:14px;
                line-height:1.7;
              ">

                Quantity:
                ${item.quantity}

                <br>

                Unit Price:
                ${money(item.unit_price)}

              </div>

            </div>


            <strong style="
              white-space:nowrap;
            ">
              ${money(item.total_price)}
            </strong>

          </div>

        `
      ).join("");


  overlay.innerHTML = `

    <div style="
      background:white;
      width:100%;
      max-width:850px;
      max-height:90vh;
      overflow-y:auto;
      border-radius:18px;
      padding:25px;
      box-sizing:border-box;
      color:#111;
    ">


      <!-- HEADER -->

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:15px;
        margin-bottom:20px;
      ">

        <div>

          <h2 style="
            margin:0 0 6px;
          ">
            📦 Order Details
          </h2>


          <div style="
            color:#777;
            font-size:14px;
          ">
            Order #${order.order_number || "-"}
          </div>

        </div>


        <button
          id="closeOrderDetails"
          style="
            border:none;
            background:#111;
            color:white;
            width:38px;
            height:38px;
            border-radius:50%;
            cursor:pointer;
            font-size:22px;
          "
        >
          ×
        </button>

      </div>


      <!-- ORDER INFORMATION -->

      <div style="
        display:grid;
        grid-template-columns:
          repeat(auto-fit,minmax(150px,1fr));
        gap:12px;
        margin-bottom:25px;
      ">


        <div style="
          background:#f7f7f7;
          padding:15px;
          border-radius:10px;
        ">

          <small style="color:#777;">
            Order Status
          </small>

          <strong style="
            display:block;
            margin-top:6px;
            text-transform:capitalize;
          ">
            ${order.order_status || "pending"}
          </strong>

        </div>


        <div style="
          background:#f7f7f7;
          padding:15px;
          border-radius:10px;
        ">

          <small style="color:#777;">
            Payment Method
          </small>

          <strong style="
            display:block;
            margin-top:6px;
          ">
            ${order.payment_method || "-"}
          </strong>

        </div>


        <div style="
          background:#f7f7f7;
          padding:15px;
          border-radius:10px;
        ">

          <small style="color:#777;">
            Payment Status
          </small>

          <strong style="
            display:block;
            margin-top:6px;
            text-transform:capitalize;
          ">
            ${order.payment_status || "pending"}
          </strong>

        </div>


        <div style="
          background:#f7f7f7;
          padding:15px;
          border-radius:10px;
        ">

          <small style="color:#777;">
            Order Date
          </small>

          <strong style="
            display:block;
            margin-top:6px;
          ">
            ${formatOrderDate(
              order.created_at
            )}
          </strong>

        </div>

      </div>


      <!-- PRODUCTS -->

      <h3 style="
        margin:0 0 12px;
      ">
        🛍️ Products
      </h3>


      <div style="
        border:1px solid #eee;
        border-radius:12px;
        padding:0 15px;
        background:#fff;
      ">

        ${itemsHTML}

      </div>


      <!-- PRICE SUMMARY -->

      <div style="
        margin-top:25px;
        padding:18px;
        background:#f8f8f8;
        border-radius:12px;
      ">

        <h3 style="
          margin:0 0 15px;
        ">
          💰 Order Summary
        </h3>


        <div style="
          display:flex;
          justify-content:space-between;
          margin-bottom:10px;
        ">

          <span>
            Subtotal
          </span>

          <strong>
            ${money(order.subtotal)}
          </strong>

        </div>


        <div style="
          display:flex;
          justify-content:space-between;
          margin-bottom:10px;
        ">

          <span>
            Shipping
          </span>

          <strong>
            ${money(order.shipping_fee)}
          </strong>

        </div>


        <div style="
          display:flex;
          justify-content:space-between;
          margin-bottom:10px;
        ">

          <span>
            Discount
          </span>

          <strong>
            - ${money(order.discount)}
          </strong>

        </div>


        <div style="
          display:flex;
          justify-content:space-between;
          border-top:1px solid #ddd;
          padding-top:15px;
          margin-top:15px;
          font-size:20px;
        ">

          <strong>
            Total
          </strong>

          <strong>
            ${money(order.total)}
          </strong>

        </div>

      </div>


      <!-- SHIPPING INFORMATION -->

      <div style="
        margin-top:25px;
        padding:18px;
        background:#f8f8f8;
        border-radius:12px;
      ">

        <h3 style="
          margin:0 0 15px;
        ">
          📍 Shipping Information
        </h3>


        <p style="
          margin:6px 0;
        ">
          <strong>
            ${order.customer_name || "-"}
          </strong>
        </p>


        <p style="
          margin:6px 0;
        ">
          ${order.customer_phone || "-"}
        </p>


        <p style="
          margin:6px 0;
          line-height:1.6;
        ">
          ${order.shipping_address || "-"}
        </p>


        <p style="
          margin:6px 0;
        ">
          ${order.shipping_city || "-"},
          ${order.shipping_country || "-"}
        </p>

      </div>


      <!-- ORDER ID -->

      <div style="
        margin-top:20px;
        color:#777;
        font-size:13px;
        text-align:right;
      ">

        Order ID:
        ${order.id || "-"}

      </div>

    </div>

  `;


  document.body.appendChild(
    overlay
  );


  document.getElementById(
    "closeOrderDetails"
  ).onclick = () => {

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
// ORDER DATE FORMAT
// =====================================================

function formatOrderDate(date) {

  if (!date) {
    return "-";
  }


  try {

    return new Date(
      date
    ).toLocaleString(
      "en-PK",
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

  } catch (error) {

    return "-";
  }
}


// =====================================================
// START APPLICATION
// =====================================================

renderCategories();

loadProducts();

renderCart();

createLoginUI();

createOrdersUI();

updateLoginButton();


// =====================================================
// LOAD DATABASE CART IF LOGGED IN
// =====================================================

if (
  localStorage.getItem(
    "traanscomToken"
  )
) {

  loadCartFromBackend();

}