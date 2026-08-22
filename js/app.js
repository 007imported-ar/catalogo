import { supabase } from "./supabase.js";
import { STORE } from "./config.js";

/* =====================================================
   ESTADO
===================================================== */

const state = {
    products: [],
    category: "Todos",
    search: "",
    cart: []
};

let selectedProduct = null;
let toastTimer = null;


/* =====================================================
   INICIO
===================================================== */

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
   LINKS
===================================================== */

function setupLinks() {

    document
        .querySelectorAll('a[href*="instagram.com"]')
        .forEach(link => {

            link.href = STORE.instagram;

            link.target = "_blank";
            link.rel = "noopener noreferrer";

        });


    document
        .querySelectorAll('a[href*="wa.me"]')
        .forEach(link => {

            const message =
                "Hola! Quería consultar por 007imported.";

            link.href =
                `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;

            link.target = "_blank";
            link.rel = "noopener noreferrer";

        });

}


/* =====================================================
   MENÚ MOBILE
===================================================== */

function setupMenu() {

    const menuButton =
        document.querySelector("#menuButton");

    const mobileMenu =
        document.querySelector("#mobileMenu");


    if (!menuButton || !mobileMenu) {
        return;
    }


    menuButton.addEventListener("click", () => {

        const open =
            mobileMenu.classList.toggle("active");

        menuButton.classList.toggle(
            "active",
            open
        );

        menuButton.setAttribute(
            "aria-expanded",
            String(open)
        );

    });


    mobileMenu
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener("click", () => {

                mobileMenu.classList.remove(
                    "active"
                );

                menuButton.classList.remove(
                    "active"
                );

                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

}


/* =====================================================
   CATEGORÍAS
===================================================== */

function setupCategories() {

    const buttons =
        document.querySelectorAll(
            ".category-card, .filter-button"
        );


    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const category =
                button.dataset.category || "Todos";

            state.category = category;


            document
                .querySelectorAll(".category-card")
                .forEach(item => {

                    item.classList.toggle(
                        "active",
                        item.dataset.category === category
                    );

                });


            document
                .querySelectorAll(".filter-button")
                .forEach(item => {

                    item.classList.toggle(
                        "active",
                        item.dataset.category === category
                    );

                });


            renderProducts();


            if (
                button.classList.contains(
                    "category-card"
                )
            ) {

                const catalog =
                    document.querySelector(
                        "#catalogo"
                    );

                if (catalog) {

                    catalog.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }

        });

    });

}


/* =====================================================
   BUSCADOR
===================================================== */

function setupSearch() {

    const input =
        document.querySelector(
            "#searchInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        event => {

            state.search =
                event.target.value
                    .trim()
                    .toLowerCase();

            renderProducts();

        }
    );

}


/* =====================================================
   CARGAR PRODUCTOS
===================================================== */

async function loadProducts() {
    const loading = document.querySelector("#loadingProducts");
    if (loading) loading.hidden = true;

    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        state.products = Array.isArray(data) ? data : [];
        renderProducts(state.products);
    } catch (error) {
        console.error("Error al cargar productos de Supabase:", error);
        const container = document.getElementById("products-container") || document.querySelector(".products-grid");
        state.products = [];
        renderProducts([]);
    }
}
    if (empty) {
        empty.hidden = true;
    }


    products.forEach(product => {

        grid.appendChild(
            createProductCard(product)
        );

    });

}


/* =====================================================
   TARJETA DE PRODUCTO
===================================================== */

function createProductCard(product) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "product-card";


    const image =
        product.image ||
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";


    article.innerHTML = `

        <button
            type="button"
            class="product-card-button"
            aria-label="Ver ${escapeAttribute(
                product.name || "producto"
            )}"
        >

            <div class="product-image">

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(
                        product.name || "Producto"
                    )}"
                    loading="lazy"
                >

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${escapeHtml(
                        product.category || "Producto"
                    )}
                </span>


                <h3 class="product-name">
                    ${escapeHtml(
                        product.name || "Producto"
                    )}
                </h3>


                <div class="product-bottom">

                    <div class="product-price">
                        ${formatPrice(product.price)}
                    </div>


                    <span
                        class="product-button"
                        aria-hidden="true"
                    >
                        +
                    </span>

                </div>

            </div>

        </button>

    `;


    const button =
        article.querySelector(
            ".product-card-button"
        );


    if (button) {

        button.addEventListener(
            "click",
            () => {
                openProductModal(product);
            }
        );

    }


    return article;

}


/* =====================================================
   MODAL
===================================================== */

function setupModal() {

    const close =
        document.querySelector(
            "#modalClose"
        );

    const overlay =
        document.querySelector(
            "#modalOverlay"
        );

    const add =
        document.querySelector(
            "#modalAddToCart"
        );


    if (close) {

        close.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (add) {

        add.addEventListener(
            "click",
            () => {

                if (!selectedProduct) {
                    return;
                }


                addToCartProduct(
                    selectedProduct
                );


                closeProductModal();

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }


            closeProductModal();
            closeCart();

        }
    );

}


/* =====================================================
   ABRIR MODAL
===================================================== */

function openProductModal(product) {

    selectedProduct = product;


    const modal =
        document.querySelector(
            "#productModal"
        );


    if (!modal) {
        return;
    }


    const image =
        document.querySelector(
            "#modalProductImage"
        );

    const category =
        document.querySelector(
            "#modalProductCategory"
        );

    const name =
        document.querySelector(
            "#modalProductName"
        );

    const price =
        document.querySelector(
            "#modalProductPrice"
        );

    const description =
        document.querySelector(
            "#modalProductDescription"
        );

    const whatsapp =
        document.querySelector(
            "#modalWhatsapp"
        );


    const productImage =
        product.image ||
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80";


    if (image) {

        image.src =
            productImage;

        image.alt =
            product.name ||
            "Producto";

    }


    if (category) {

        category.textContent =
            product.category ||
            "Producto";

    }


    if (name) {

        name.textContent =
            product.name ||
            "Producto";

    }


    if (price) {

        price.textContent =
            formatPrice(
                product.price
            );

    }


    if (description) {

        description.textContent =
            product.description ||
            "Consultanos por disponibilidad, talles y colores.";

    }


    if (whatsapp) {

        const message =
            `Hola! Quería consultar por ${product.name || "este producto"}. ` +
            `Precio: ${formatPrice(product.price)}.`;

        whatsapp.href =
            `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;

        whatsapp.target = "_blank";
        whatsapp.rel = "noopener noreferrer";

    }


    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "no-scroll"
    );

}


/* =====================================================
   CERRAR MODAL
===================================================== */

function closeProductModal() {

    const modal =
        document.querySelector(
            "#productModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    selectedProduct = null;


    if (!document.querySelector(
        "#cartDrawer.active"
    )) {

        document.body.classList.remove(
            "no-scroll"
        );

    }

}


/* =====================================================
   CARRITO
===================================================== */

function setupCart() {

    const button =
        document.querySelector(
            "#cartButton"
        );

    const close =
        document.querySelector(
            "#cartClose"
        );

    const overlay =
        document.querySelector(
            "#cartOverlay"
        );

    const continueButton =
        document.querySelector(
            "#continueShopping"
        );

    const checkout =
        document.querySelector(
            "#checkoutButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            openCart
        );

    }


    if (close) {

        close.addEventListener(
            "click",
            closeCart
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeCart
        );

    }


    if (continueButton) {

        continueButton.addEventListener(
            "click",
            () => {

                closeCart();


                const catalog =
                    document.querySelector(
                        "#catalogo"
                    );


                if (catalog) {

                    catalog.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
        );

    }


    if (checkout) {

        checkout.addEventListener(
            "click",
            checkoutWhatsApp
        );

    }

}


/* =====================================================
   CARGAR CARRITO
===================================================== */

function loadCart() {

    try {

        const saved =
            localStorage.getItem(
                "007imported_cart"
            );


        if (!saved) {

            state.cart = [];

        } else {

            const parsed =
                JSON.parse(saved);


            state.cart =
                Array.isArray(parsed)
                    ? parsed
                    : [];

        }


    } catch (error) {

        console.warn(
            "No se pudo cargar el carrito:",
            error
        );

        state.cart = [];

    }


    renderCart();

}


/* =====================================================
   GUARDAR CARRITO
===================================================== */

function saveCart() {

    try {

        localStorage.setItem(
            "007imported_cart",
            JSON.stringify(state.cart)
        );

    } catch (error) {

        console.warn(
            "No se pudo guardar el carrito:",
            error
        );

    }


    renderCart();

}


/* =====================================================
   AGREGAR AL CARRITO
===================================================== */

function addToCartProduct(product) {

    const existing =
        state.cart.find(
            item =>
                String(item.id) ===
                String(product.id)
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        state.cart.push({

            id: product.id,

            name:
                product.name ||
                "Producto",

            price:
                Number(product.price) || 0,

            image:
                product.image || "",

            quantity: 1

        });

    }


    saveCart();


    showToast(
        `${product.name || "Producto"} agregado al carrito`
    );


    openCart();

}


/* =====================================================
   ELIMINAR DEL CARRITO
===================================================== */

function removeFromCart(id) {

    state.cart =
        state.cart.filter(
            item =>
                String(item.id) !==
                String(id)
        );


    saveCart();

}


/* =====================================================
   CAMBIAR CANTIDAD
===================================================== */

function changeQuantity(
    id,
    amount
) {

    const item =
        state.cart.find(
            product =>
                String(product.id) ===
                String(id)
        );


    if (!item) {
        return;
    }


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

    const container =
        document.querySelector(
            "#cartItems"
        );

    const empty =
        document.querySelector(
            "#cartEmpty"
        );

    const footer =
        document.querySelector(
            "#cartFooter"
        );

    const count =
        document.querySelector(
            "#cartCount"
        );

    const totalElement =
        document.querySelector(
            "#cartTotal"
        );


    if (!container) {
        return;
    }


    const totalItems =
        state.cart.reduce(
            (sum, item) =>
                sum +
                (Number(item.quantity) || 0),
            0
        );


    const total =
        state.cart.reduce(
            (sum, item) =>
                sum +
                (
                    (Number(item.price) || 0) *
                    (Number(item.quantity) || 0)
                ),
            0
        );


    if (count) {

        count.textContent =
            totalItems;

    }


    if (totalItems === 0) {

        container.innerHTML = "";


        if (empty) {
            empty.hidden = false;
        }


        if (footer) {
            footer.hidden = true;
        }


        if (totalElement) {
            totalElement.textContent =
                "$0";
        }


        return;

    }


    if (empty) {
        empty.hidden = true;
    }


    if (footer) {
        footer.hidden = false;
    }


    container.innerHTML = "";


    state.cart.forEach(item => {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "cart-item";


        const image =
            item.image ||
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80";


        element.innerHTML = `

            <div class="cart-item-image">

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(
                        item.name || "Producto"
                    )}"
                    loading="lazy"
                >

            </div>


            <div class="cart-item-info">

                <h3>
                    ${escapeHtml(
                        item.name || "Producto"
                    )}
                </h3>


                <div class="cart-item-price">
                    ${formatPrice(item.price)}
                </div>


                <div class="cart-item-quantity">

                    <button
                        type="button"
                        data-action="decrease"
                        aria-label="Disminuir cantidad"
                    >
                        −
                    </button>


                    <span>
                        ${Number(item.quantity) || 0}
                    </span>


                    <button
                        type="button"
                        data-action="increase"
                        aria-label="Aumentar cantidad"
                    >
                        +
                    </button>

                </div>

            </div>


            <button
                type="button"
                class="cart-item-remove"
                data-action="remove"
            >
                Eliminar
            </button>

        `;


        const decrease =
            element.querySelector(
                '[data-action="decrease"]'
            );


        const increase =
            element.querySelector(
                '[data-action="increase"]'
            );


        const remove =
            element.querySelector(
                '[data-action="remove"]'
            );


        if (decrease) {

            decrease.addEventListener(
                "click",
                () =>
                    changeQuantity(
                        item.id,
                        -1
                    )
            );

        }


        if (increase) {

            increase.addEventListener(
                "click",
                () =>
                    changeQuantity(
                        item.id,
                        1
                    )
            );

        }


        if (remove) {

            remove.addEventListener(
                "click",
                () =>
                    removeFromCart(
                        item.id
                    )
            );

        }


        container.appendChild(
            element
        );

    });


    if (totalElement) {

        totalElement.textContent =
            formatPrice(total);

    }

}


/* =====================================================
   ABRIR CARRITO
===================================================== */

function openCart() {

    const drawer =
        document.querySelector(
            "#cartDrawer"
        );


    if (!drawer) {
        return;
    }


    drawer.classList.add(
        "active"
    );


    drawer.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "no-scroll"
    );

}


/* =====================================================
   CERRAR CARRITO
===================================================== */

function closeCart() {

    const drawer =
        document.querySelector(
            "#cartDrawer"
        );


    if (!drawer) {
        return;
    }


    drawer.classList.remove(
        "active"
    );


    drawer.setAttribute(
        "aria-hidden",
        "true"
    );


    if (!document.querySelector(
        "#productModal.active"
    )) {

        document.body.classList.remove(
            "no-scroll"
        );

    }

}


/* =====================================================
   CHECKOUT WHATSAPP
===================================================== */

function checkoutWhatsApp() {

    if (state.cart.length === 0) {

        showToast(
            "Tu carrito está vacío."
        );

        return;

    }


    let message =
        "Hola! Quiero hacer un pedido en 007imported.\n\n";


    let total = 0;


    state.cart.forEach(item => {

        const price =
            Number(item.price) || 0;

        const quantity =
            Number(item.quantity) || 0;


        const subtotal =
            price * quantity;


        total += subtotal;


        message +=
            `• ${item.name} x${quantity} — ${formatPrice(subtotal)}\n`;

    });


    message +=
        `\nTotal: ${formatPrice(total)}`;


    const url =
        `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;


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

    const number =
        Number(value) || 0;


    return (
        "$" +
        number.toLocaleString(
            "es-AR"
        )
    );

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    const toast =
        document.querySelector(
            "#toast"
        );

    const toastMessage =
        document.querySelector(
            "#toastMessage"
        );


    if (!toast || !toastMessage) {
        return;
    }


    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);

}


/* =====================================================
   SEGURIDAD
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHtml(value);

}
