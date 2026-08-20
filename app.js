import { supabase } from "./supabase.js";
import { STORE } from "./config.js";

const state = {
    products: [],
    category: "Todos",
    search: "",
    cart: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

document.addEventListener("DOMContentLoaded", () => {
    setupLinks();
    setupMenu();
    setupCategories();
    setupSearch();
    setupModal();
    setupCart();

    loadCart();
    loadProducts();
});

/* =====================================================
   CONFIG / LINKS
===================================================== */

function setupLinks() {
    const instagramLinks = $$('a[href*="instagram.com"]');

    instagramLinks.forEach(link => {
        link.href = STORE.instagram;
    });

    const whatsappLinks = $$('a[href*="wa.me"]');

    whatsappLinks.forEach(link => {
        const text = "Hola! Quería consultar por 007imported.";

        link.href =
            `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
    });
}

/* =====================================================
   MENU MOBILE
===================================================== */

function setupMenu() {
    const menuButton = $("#menuButton");
    const mobileMenu = $("#mobileMenu");

    if (!menuButton || !mobileMenu) return;

    menuButton.addEventListener("click", () => {
        const isOpen = mobileMenu.classList.toggle("active");

        menuButton.classList.toggle("active", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            mobileMenu.classList.remove("active");
            menuButton.classList.remove("active");
            menuButton.setAttribute("aria-expanded", "false");
        });
    });
}

/* =====================================================
   CATEGORÍAS
===================================================== */

function setupCategories() {
    const buttons = $$(".category-card, .filter-button");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const category = button.dataset.category || "Todos";

            state.category = category;

            $$(".category-card").forEach(item => {
                item.classList.toggle(
                    "active",
                    item.dataset.category === category
                );
            });

            $$(".filter-button").forEach(item => {
                item.classList.toggle(
                    "active",
                    item.dataset.category === category
                );
            });

            renderProducts();

            const catalog = $("#catalogo");

            if (
                button.classList.contains("category-card") &&
                catalog
            ) {
                catalog.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });
}

/* =====================================================
   BUSCADOR
===================================================== */

function setupSearch() {
    const searchInput = $("#searchInput");

    if (!searchInput) return;

    searchInput.addEventListener("input", event => {
        state.search = event.target.value.trim().toLowerCase();

        renderProducts();
    });
}

/* =====================================================
   SUPABASE - PRODUCTOS
===================================================== */

async function loadProducts() {
    const loading = $("#productsLoading");
    const empty = $("#emptyProducts");

    if (loading) {
        loading.hidden = false;
    }

    if (empty) {
        empty.hidden = true;
    }

    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        state.products = data || [];

        renderProducts();

    } catch (error) {
        console.error("Error cargando productos:", error);

        state.products = [];

        renderProducts();

        showToast("No se pudo cargar el catálogo.");

    } finally {
        if (loading) {
            loading.hidden = true;
        }
    }
}

/* =====================================================
   FILTRAR PRODUCTOS
===================================================== */

function getFilteredProducts() {
    return state.products.filter(product => {

        const categoryMatch =
            state.category === "Todos" ||
            String(product.category || "").toLowerCase() ===
            state.category.toLowerCase();

        const searchText = [
            product.name,
            product.description,
            product.category
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const searchMatch =
            !state.search ||
            searchText.includes(state.search);

        return categoryMatch && searchMatch;
    });
}

/* =====================================================
   RENDER PRODUCTOS
===================================================== */

function renderProducts() {
    const grid = $("#productsGrid");
    const empty = $("#emptyProducts");

    if (!grid) return;

    const products = getFilteredProducts();

    grid.innerHTML = "";

    if (products.length === 0) {
        if (empty) {
            empty.hidden = false;
        }

        return;
    }

    if (empty) {
        empty.hidden = true;
    }

    products.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
}

/* =====================================================
   TARJETA PRODUCTO
===================================================== */

function createProductCard(product) {
    const article = document.createElement("article");

    article.className = "product-card";

    const image =
        product.image ||
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

    const price = formatPrice(product.price);

    article.innerHTML = `
        <button
            type="button"
            class="product-card-button"
            aria-label="Ver ${escapeHtml(product.name)}"
        >

            <div class="product-image-wrap">

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(product.name)}"
                    class="product-image"
                    loading="lazy"
                >

            </div>

            <div class="product-card-info">

                <div class="product-card-category">
                    ${escapeHtml(product.category || "Producto")}
                </div>

                <h3 class="product-card-name">
                    ${escapeHtml(product.name)}
                </h3>

                <div class="product-card-price">
                    ${price}
                </div>

            </div>

        </button>
    `;

    const button = article.querySelector(".product-card-button");

    button.addEventListener("click", () => {
        openProductModal(product);
    });

    return article;
}

/* =====================================================
   MODAL PRODUCTO
===================================================== */

let selectedProduct = null;

function setupModal() {
    const close = $("#modalClose");
    const overlay = $("#modalOverlay");
    const addToCart = $("#modalAddToCart");

    if (close) {
        close.addEventListener("click", closeProductModal);
    }

    if (overlay) {
        overlay.addEventListener("click", closeProductModal);
    }

    if (addToCart) {
        addToCart.addEventListener("click", () => {
            if (!selectedProduct) return;

            addToCartProduct(selectedProduct);
            closeProductModal();
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeProductModal();
            closeCart();
        }
    });
}

function openProductModal(product) {
    selectedProduct = product;

    const modal = $("#productModal");

    if (!modal) return;

    const image = $("#modalProductImage");
    const category = $("#modalProductCategory");
    const name = $("#modalProductName");
    const price = $("#modalProductPrice");
    const description = $("#modalProductDescription");
    const whatsapp = $("#modalWhatsapp");

    const productImage =
        product.image ||
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";

    if (image) {
        image.src = productImage;
        image.alt = product.name || "Producto";
    }

    if (category) {
        category.textContent = product.category || "Producto";
    }

    if (name) {
        name.textContent = product.name || "Producto";
    }

    if (price) {
        price.textContent = formatPrice(product.price);
    }

    if (description) {
        description.textContent =
            product.description ||
            "Consultanos por disponibilidad, talles y colores.";
    }

    if (whatsapp) {
        const message =
            `Hola! Quería consultar por ${product.name}. ` +
            `Precio: ${formatPrice(product.price)}.`;

        whatsapp.href =
            `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
}

function closeProductModal() {
    const modal = $("#productModal");

    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");

    selectedProduct = null;
}

/* =====================================================
   CARRITO
===================================================== */

function setupCart() {
    const cartButton = $("#cartButton");
    const cartClose = $("#cartClose");
    const cartOverlay = $("#cartOverlay");
    const continueShopping = $("#continueShopping");
    const checkout = $("#checkoutButton");

    if (cartButton) {
        cartButton.addEventListener("click", openCart);
    }

    if (cartClose) {
        cartClose.addEventListener("click", closeCart);
    }

    if (cartOverlay) {
        cartOverlay.addEventListener("click", closeCart);
    }

    if (continueShopping) {
        continueShopping.addEventListener("click", () => {
            closeCart();

            const catalog = $("#catalogo");

            if (catalog) {
                catalog.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    }

    if (checkout) {
        checkout.addEventListener("click", checkoutWhatsApp);
    }
}

function loadCart() {
    try {
        const saved = localStorage.getItem("007imported_cart");

        state.cart = saved
            ? JSON.parse(saved)
            : [];

    } catch {
        state.cart = [];
    }

    renderCart();
}

function saveCart() {
    localStorage.setItem(
        "007imported_cart",
        JSON.stringify(state.cart)
    );

    renderCart();
}

function addToCartProduct(product) {
    const existing = state.cart.find(
        item => String(item.id) === String(product.id)
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            image: product.image || "",
            quantity: 1
        });
    }

    saveCart();

    showToast(`${product.name} agregado al carrito`);

    openCart();
}

function removeFromCart(id) {
    state.cart = state.cart.filter(
        item => String(item.id) !== String(id)
    );

    saveCart();
}

function changeQuantity(id, amount) {
    const item = state.cart.find(
        product => String(product.id) === String(id)
    );

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        removeFromCart(id);
        return;
    }

    saveCart();
}

/* =====================================================
   RENDER CARRITO
===================================================== */

function renderCart() {
    const itemsContainer = $("#cartItems");
    const empty = $("#cartEmpty");
    const footer = $("#cartFooter");
    const count = $("#cartCount");
    const totalElement = $("#cartTotal");

    if (!itemsContainer) return;

    const totalItems = state.cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const totalPrice = state.cart.reduce(
        (sum, item) =>
            sum + item.price * item.quantity,
        0
    );

    if (count) {
        count.textContent = totalItems;
    }

    if (totalItems === 0) {
        itemsContainer.innerHTML = "";

        if (empty) empty.hidden = false;
        if (footer) footer.hidden = true;

        if (totalElement) {
            totalElement.textContent = "$0";
        }

        return;
    }

    if (empty) empty.hidden = true;
    if (footer) footer.hidden = false;

    itemsContainer.innerHTML = "";

    state.cart.forEach(item => {

        const element = document.createElement("div");

        element.className = "cart-item";

        element.innerHTML = `
            <div class="cart-item-image">
                <img
                    src="${escapeAttribute(
                        item.image ||
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80"
                    )}"
                    alt="${escapeAttribute(item.name)}"
                >
            </div>

            <div class="cart-item-info">

                <h3>
                    ${escapeHtml(item.name)}
                </h3>

                <strong>
                    ${formatPrice(item.price)}
                </strong>

                <div class="cart-item-controls">

                    <button
                        type="button"
                        class="cart-quantity-button"
                        data-action="decrease"
                    >
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        class="cart-quantity-button"
                        data-action="increase"
                    >
                        +
                    </button>

                    <button
                        type="button"
                        class="cart-remove-button"
                        data-action="remove"
                    >
                        Eliminar
                    </button>

                </div>

            </div>
        `;

        element
            .querySelector('[data-action="decrease"]')
            .addEventListener("click", () => {
                changeQuantity(item.id, -1);
            });

        element
            .querySelector('[data-action="increase"]')
            .addEventListener("click", () => {
                changeQuantity(item.id, 1);
            });

        element
            .querySelector('[data-action="remove"]')
            .addEventListener("click", () => {
                removeFromCart(item.id);
            });

        itemsContainer.appendChild(element);
    });

    if (totalElement) {
        totalElement.textContent =
            formatPrice(totalPrice);
    }
}

/* =====================================================
   ABRIR / CERRAR CARRITO
===================================================== */

function openCart() {
    const drawer = $("#cartDrawer");

    if (!drawer) return;

    drawer.classList.add("active");
    drawer.setAttribute("aria-hidden", "false");

    document.body.classList.add("cart-open");
}

function closeCart() {
    const drawer = $("#cartDrawer");

    if (!drawer) return;

    drawer.classList.remove("active");
    drawer.setAttribute("aria-hidden", "true");

    document.body.classList.remove("cart-open");
}

/* =====================================================
   CHECKOUT WHATSAPP
===================================================== */

function checkoutWhatsApp() {
    if (state.cart.length === 0) {
        showToast("Tu carrito está vacío.");
        return;
    }

    let message =
        "Hola! Quiero hacer un pedido en 007imported.%0A%0A";

    let total = 0;

    state.cart.forEach(item => {

        const subtotal =
            item.price * item.quantity;

        total += subtotal;

        message +=
            `• ${item.name} x${item.quantity} — ${formatPrice(subtotal)}%0A`;
    });

    message +=
        `%0ATotal: ${formatPrice(total)}`;

    const url =
        `https://wa.me/${STORE.whatsapp}?text=${message}`;

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}

/* =====================================================
   PRECIO
===================================================== */

function formatPrice(value) {
    const number = Number(value) || 0;

    return "$" + number.toLocaleString("es-AR");
}

/* =====================================================
   TOAST
===================================================== */

let toastTimer;

function showToast(message) {
    const toast = $("#toast");
    const toastMessage = $("#toastMessage");

    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

/* =====================================================
   SEGURIDAD HTML
===================================================== */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}
