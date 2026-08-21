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

            if (STORE.instagram) {
                link.href = STORE.instagram;
            }

        });


    document
        .querySelectorAll('a[href*="wa.me"]')
        .forEach(link => {

            if (!STORE.whatsapp) return;

            const message =
                "Hola! Quería consultar por 007imported.";

            link.href =
                `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;

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


    if (!buttons.length) {
        return;
    }


    buttons.forEach(button => {

        button.addEventListener("click", event => {

            event.preventDefault();


            const category =
                button.dataset.category ||
                "Todos";


            state.category =
                normalizeCategory(category);


            updateCategoryButtons();


            renderProducts();


            /*
             * Si se presionó una tarjeta grande
             * de categorías, bajamos al catálogo.
             */

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
   ACTUALIZAR BOTONES
===================================================== */

function updateCategoryButtons() {

    document
        .querySelectorAll(".category-card")
        .forEach(button => {

            const buttonCategory =
                normalizeCategory(
                    button.dataset.category
                );


            button.classList.toggle(
                "active",
                buttonCategory === state.category
            );

        });


    document
        .querySelectorAll(".filter-button")
        .forEach(button => {

            const buttonCategory =
                normalizeCategory(
                    button.dataset.category
                );


            button.classList.toggle(
                "active",
                buttonCategory === state.category
            );

        });

}


/* =====================================================
   NORMALIZAR CATEGORÍA
===================================================== */

function normalizeCategory(value) {

    const category =
        String(value || "")
            .trim()
            .toLowerCase();


    const categories = {
        "todos": "Todos",
        "todo": "Todos",

        "remeras": "Remeras",
        "remera": "Remeras",

        "pantalones": "Pantalones",
        "pantalon": "Pantalones",

        "buzos": "Buzos",
        "buzo": "Buzos",

        "camperas": "Camperas",
        "campera": "Camperas",

        "accesorios": "Accesorios",
        "accesorio": "Accesorios"
    };


    return (
        categories[category] ||
        String(value || "").trim()
    );

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
                String(event.target.value || "")
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

    const loading =
        document.querySelector(
            "#productsLoading"
        );

    const empty =
        document.querySelector(
            "#emptyProducts"
        );

    const grid =
        document.querySelector(
            "#productsGrid"
        );


    if (loading) {
        loading.hidden = false;
    }


    if (empty) {
        empty.hidden = true;
    }


    if (grid) {
        grid.innerHTML = "";
    }


    try {

        /*
         * IMPORTANTE:
         *
         * No usamos:
         *
         * .order("created_at")
         *
         * porque si created_at no existe,
         * Supabase rompe toda la consulta.
         */

        const result =
            await supabase
                .from("products")
                .select("*");


        const data =
            result.data;

        const error =
            result.error;


        if (error) {
            throw error;
        }


        state.products =
            Array.isArray(data)
                ? data
                : [];


        /*
         * Ordenamos solamente si existe
         * una fecha válida.
         */

        state.products.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        a.created_at ||
                        a.createdAt ||
                        0
                    ).getTime();


                const dateB =
                    new Date(
                        b.created_at ||
                        b.createdAt ||
                        0
                    ).getTime();


                if (
                    !Number.isNaN(dateA) &&
                    !Number.isNaN(dateB)
                ) {

                    return dateB - dateA;

                }


                return 0;

            }
        );


        renderProducts();


    } catch (error) {

        console.error(
            "ERROR CARGANDO PRODUCTOS:",
            error
        );


        state.products = [];


        renderProducts();


        /*
         * Mostramos el error real en la página
         * para no dejar "Cargando catálogo..."
         * infinitamente.
         */

        showCatalogError(error);

    } finally {

        if (loading) {
            loading.hidden = true;
        }

    }

}


/* =====================================================
   ERROR DEL CATÁLOGO
===================================================== */

function showCatalogError(error) {

    const grid =
        document.querySelector(
            "#productsGrid"
        );

    const empty =
        document.querySelector(
            "#emptyProducts"
        );


    if (!grid) {
        return;
    }


    const message =
        error?.message ||
        "No se pudo cargar el catálogo.";


    grid.innerHTML = `

        <div class="catalog-error">

            <div class="empty-icon">×</div>

            <h3>
                No se pudo cargar el catálogo
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                class="button button-primary"
                id="retryProducts"
            >
                Reintentar
            </button>

        </div>

    `;


    if (empty) {
        empty.hidden = true;
    }


    const retry =
        document.querySelector(
            "#retryProducts"
        );


    if (retry) {

        retry.addEventListener(
            "click",
            loadProducts
        );

    }

}


/* =====================================================
   FILTRAR PRODUCTOS
===================================================== */

function getFilteredProducts() {

    return state.products.filter(
        product => {

            const productCategory =
                normalizeCategory(
                    product.category ||
                    product.categoria ||
                    ""
                );


            const categoryMatch =
                state.category === "Todos" ||
                productCategory ===
                    state.category;


            const text = [

                getProductName(product),

                getProductDescription(product),

                productCategory

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const searchMatch =
                !state.search ||
                text.includes(state.search);


            return (
                categoryMatch &&
                searchMatch
            );

        }
    );

}


/* =====================================================
   MOSTRAR PRODUCTOS
===================================================== */

function renderProducts() {

    const grid =
        document.querySelector(
            "#productsGrid"
        );

    const empty =
        document.querySelector(
            "#emptyProducts"
        );


    if (!grid) {
        return;
    }


    const products =
        getFilteredProducts();


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

        grid.appendChild(
            createProductCard(product)
        );

    });

}


/* =====================================================
   CREAR TARJETA
===================================================== */

function createProductCard(product) {

    const article =
        document.createElement("article");


    article.className =
        "product-card";


    const image =
        getProductImage(product);


    const name =
        getProductName(product);


    const category =
        getProductCategory(product);


    const price =
        getProductPrice(product);


    article.innerHTML = `

        <button
            type="button"
            class="product-card-button"
            aria-label="Ver ${escapeAttribute(name)}"
        >

            <div class="product-image-wrap">

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(name)}"
                    class="product-image"
                    loading="lazy"
                >

            </div>


            <div class="product-card-info">

                <div class="product-card-category">
                    ${escapeHtml(category)}
                </div>

                <h3 class="product-card-name">
                    ${escapeHtml(name)}
                </h3>

                <div class="product-card-price">
                    ${formatPrice(price)}
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
            () => openProductModal(product)
        );

    }


    return article;

}


/* =====================================================
   DATOS DEL PRODUCTO
===================================================== */

function getProductName(product) {

    return String(
        product.name ||
        product.nombre ||
        "Producto"
    );

}


function getProductCategory(product) {

    return normalizeCategory(
        product.category ||
        product.categoria ||
        "Producto"
    );

}


function getProductDescription(product) {

    return String(
        product.description ||
        product.descripcion ||
        ""
    );

}


function getProductPrice(product) {

    return Number(
        product.price ??
        product.precio ??
        0
    ) || 0;

}


function getProductImage(product) {

    return (
        product.image ||
        product.image_url ||
        product.imagen ||
        product.imagen_url ||
        product.url_imagen ||
        product.photo ||
        ""
    );

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

            if (event.key === "Escape") {

                closeProductModal();
                closeCart();

            }

        }
    );

}


/* =====================================================
   ABRIR MODAL
===================================================== */

function openProductModal(product) {

    selectedProduct =
        product;


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
        getProductImage(product);


    const productName =
        getProductName(product);


    const productCategory =
        getProductCategory(product);


    const productPrice =
        getProductPrice(product);


    const productDescription =
        getProductDescription(product);


    if (image) {

        image.src =
            productImage;

        image.alt =
            productName;

    }


    if (category) {

        category.textContent =
            productCategory;

    }


    if (name) {

        name.textContent =
            productName;

    }


    if (price) {

        price.textContent =
            formatPrice(
                productPrice
            );

    }


    if (description) {

        description.textContent =
            productDescription ||
            "Consultanos por disponibilidad, talles y colores.";

    }


    if (whatsapp && STORE.whatsapp) {

        const message =
            `Hola! Quería consultar por ${productName}. ` +
            `Precio: ${formatPrice(productPrice)}.`;

        whatsapp.href =
            `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;

    }


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
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


    document.body.classList.remove(
        "modal-open"
    );


    selectedProduct =
        null;

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


        const parsed =
            saved
                ? JSON.parse(saved)
                : [];


        state.cart =
            Array.isArray(parsed)
                ? parsed
                : [];


    } catch (error) {

        console.error(
            "Error cargando carrito:",
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
            JSON.stringify(
                state.cart
            )
        );

    } catch (error) {

        console.error(
            "Error guardando carrito:",
            error
        );

    }


    renderCart();

}


/* =====================================================
   AGREGAR AL CARRITO
===================================================== */

function addToCartProduct(product) {

    const id =
        product.id ??
        product.ID ??
        getProductName(product);


    const existing =
        state.cart.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (existing) {

        existing.quantity += 1;

    } else {

        state.cart.push({

            id: id,

            name:
                getProductName(product),

            price:
                getProductPrice(product),

            image:
                getProductImage(product),

            quantity: 1

        });

    }


    saveCart();


    showToast(
        `${getProductName(product)} agregado al carrito`
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


    item.quantity +=
        amount;


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
                (
                    Number(item.quantity) ||
                    0
                ),
            0
        );


    const total =
        state.cart.reduce(
            (sum, item) =>
                sum +
                (
                    Number(item.price) ||
                    0
                ) *
                (
                    Number(item.quantity) ||
                    0
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
            "";


        element.innerHTML = `

            <div class="cart-item-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(image)}"
                                alt="${escapeAttribute(item.name)}"
                            >
                        `
                        : ""
                }

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
                        data-action="decrease"
                    >
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        data-action="increase"
                    >
                        +
                    </button>

                    <button
                        type="button"
                        data-action="remove"
                    >
                        Eliminar
                    </button>

                </div>

            </div>

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


    if (!STORE.whatsapp) {

        showToast(
            "WhatsApp no está configurado."
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


        total +=
            subtotal;


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
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
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
