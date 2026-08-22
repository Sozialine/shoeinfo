/* =====================================
   CONFIG
===================================== */

const SUPABASE_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_PQbg0iClbuSLCjurjMT_Nw_-YjIply-";

const LOGIN_API_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co/functions/v1/admin-login";


/* =====================================
   SUPABASE CLIENT
===================================== */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================
   ELEMENT LOGIN
===================================== */

const loginSection =
    document.getElementById("loginSection");

const adminDashboard =
    document.getElementById("adminDashboard");

const loginForm =
    document.getElementById("loginForm");

const usernameInput =
    document.getElementById("adminUsername");

const passwordInput =
    document.getElementById("adminPassword");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");

const logoutButton =
    document.getElementById("logoutButton");


/* =====================================
   ELEMENT DASHBOARD
===================================== */

const productForm =
    document.getElementById("productForm");

const productId =
    document.getElementById("productId");

const sku =
    document.getElementById("sku");

const name =
    document.getElementById("name");

const brand =
    document.getElementById("brand");

const source =
    document.getElementById("source");

const advantages =
    document.getElementById("advantages");

const materials =
    document.getElementById("materials");

const functions =
    document.getElementById("functions");

const productsTable =
    document.getElementById("productsTable");

const searchProducts =
    document.getElementById("searchProducts");

const totalProducts =
    document.getElementById("totalProducts");

const manualProducts =
    document.getElementById("manualProducts");

const aiProducts =
    document.getElementById("aiProducts");

const cancelButton =
    document.getElementById("cancelButton");

const formTitle =
    document.getElementById("formTitle");

const message =
    document.getElementById("message");

const pagination =
    document.getElementById("pagination");


/* =====================================
   PAGINATION
===================================== */

const PRODUCTS_PER_PAGE = 10;

let currentPage = 1;

let totalProductCount = 0;


/* =====================================
   DATA PRODUK
===================================== */

let products = [];


/* =====================================
   CEK LOGIN SAAT HALAMAN DIBUKA
===================================== */

function checkLogin() {

    const token =
        localStorage.getItem(
            "shoeinfo_admin_token"
        );

    if (token) {

        showDashboard();

    } else {

        showLogin();

    }

}


/* =====================================
   TAMPILKAN LOGIN
===================================== */

function showLogin() {

    loginSection.classList.remove(
        "hidden"
    );

    adminDashboard.classList.add(
        "hidden"
    );

    if (usernameInput) {

        usernameInput.focus();

    }

}


/* =====================================
   TAMPILKAN DASHBOARD
===================================== */

function showDashboard() {

    loginSection.classList.add(
        "hidden"
    );

    adminDashboard.classList.remove(
        "hidden"
    );

    loadProducts();

}


/* =====================================
   PESAN LOGIN
===================================== */

function showLoginMessage(
    text,
    type = "error"
) {

    loginMessage.textContent =
        text;

    loginMessage.classList.remove(
        "hidden",
        "success"
    );

    if (type === "success") {

        loginMessage.classList.add(
            "success"
        );

    }

}


function hideLoginMessage() {

    loginMessage.textContent =
        "";

    loginMessage.classList.add(
        "hidden"
    );

    loginMessage.classList.remove(
        "success"
    );

}


/* =====================================
   REQUEST LOGIN
===================================== */

async function loginAdmin(
    username,
    password
) {

    const response =
        await fetch(
            LOGIN_API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "apikey":
                        SUPABASE_KEY
                },

                body:
                    JSON.stringify({
                        username: username,
                        password: password
                    })
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "Backend mengembalikan respons tidak valid."
        );

    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `Login gagal. HTTP ${response.status}`
        );

    }


    if (data.success !== true) {

        throw new Error(
            data.error ||
            "Username atau password salah."
        );

    }


    return data;

}


/* =====================================
   SUBMIT LOGIN
===================================== */

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        if (!username) {

            showLoginMessage(
                "Username wajib diisi."
            );

            usernameInput.focus();

            return;

        }


        if (!password) {

            showLoginMessage(
                "Password wajib diisi."
            );

            passwordInput.focus();

            return;

        }


        hideLoginMessage();


        loginButton.disabled =
            true;

        loginButton.textContent =
            "Memeriksa...";


        try {

            const result =
                await loginAdmin(
                    username,
                    password
                );


            if (!result.token) {

                throw new Error(
                    "Token login tidak diterima dari server."
                );

            }


            localStorage.setItem(
                "shoeinfo_admin_token",
                result.token
            );


            localStorage.setItem(
                "shoeinfo_admin_username",
                result.username || username
            );


            showLoginMessage(
                "Login berhasil.",
                "success"
            );


            setTimeout(
                function () {

                    showDashboard();

                },
                500
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            showLoginMessage(
                error.message ||
                "Terjadi kesalahan saat login."
            );


            passwordInput.value =
                "";

            passwordInput.focus();


        } finally {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "Login";

        }

    }
);


/* =====================================
   LOGOUT
===================================== */

logoutButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "shoeinfo_admin_token"
        );

        localStorage.removeItem(
            "shoeinfo_admin_username"
        );


        passwordInput.value =
            "";

        hideLoginMessage();

        showLogin();

    }
);


/* =====================================
   LOAD PRODUCTS
===================================== */

async function loadProducts() {

    const from =
        (currentPage - 1) *
        PRODUCTS_PER_PAGE;


    const to =
        from +
        PRODUCTS_PER_PAGE -
        1;


    const { data, count, error } =
        await supabaseClient
            .from("products")
            .select(
                "*",
                {
                    count: "exact"
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .range(
                from,
                to
            );


    if (error) {

        console.error(error);

        showMessage(
            "Gagal mengambil data: " +
            error.message,
            "error"
        );

        return;

    }


    products =
        data || [];


    totalProductCount =
        count || 0;


    /*
       Jika halaman sekarang sudah
       tidak memiliki data, kembali
       ke halaman terakhir yang tersedia.
    */

    const totalPages =
        Math.ceil(
            totalProductCount /
            PRODUCTS_PER_PAGE
        );


    if (
        totalPages > 0 &&
        currentPage > totalPages
    ) {

        currentPage =
            totalPages;

        await loadProducts();

        return;

    }


    renderProducts(products);

    renderPagination();

    await updateStats();

}


/* =====================================
   RENDER PRODUCTS
===================================== */

function renderProducts(data) {

    productsTable.innerHTML =
        "";


    if (data.length === 0) {

        productsTable.innerHTML =
            `
            <tr>
                <td colspan="6">
                    Belum ada produk.
                </td>
            </tr>
            `;

        return;

    }


    data.forEach(
        function (product) {

            const row =
                document.createElement("tr");


            row.innerHTML =
                `
                <td>
                    ${escapeHtml(product.sku || "-")}
                </td>

                <td>
                    ${escapeHtml(product.name || "-")}
                </td>

                <td>
                    ${escapeHtml(product.brand || "-")}
                </td>

                <td>
                    ${escapeHtml(product.source || "-")}
                </td>

                <td>
                    ${
                        product.ai_generated
                            ? '<span class="ai-badge">AI</span>'
                            : "Manual"
                    }
                </td>

                <td>
                    <button
                        type="button"
                        class="action-button edit-button"
                        onclick="editProduct(${product.id})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="action-button delete-button"
                        onclick="deleteProduct(${product.id})"
                    >
                        Hapus
                    </button>
                </td>
                `;


            productsTable.appendChild(row);

        }
    );

}


/* =====================================
   PAGINATION
===================================== */

function renderPagination() {

    pagination.innerHTML =
        "";


    const totalPages =
        Math.ceil(
            totalProductCount /
            PRODUCTS_PER_PAGE
        );


    if (totalPages <= 1) {

        return;

    }


    /*
       INFORMASI DATA
    */

    const start =
        (
            (currentPage - 1) *
            PRODUCTS_PER_PAGE
        ) + 1;


    const end =
        Math.min(
            currentPage *
                PRODUCTS_PER_PAGE,
            totalProductCount
        );


    const info =
        document.createElement(
            "span"
        );


    info.className =
        "pagination-info";


    info.textContent =
        `Menampilkan ${start}–${end} dari ${totalProductCount} produk`;


    pagination.appendChild(
        info
    );


    /*
       CONTAINER TOMBOL
    */

    const buttonsContainer =
        document.createElement(
            "div"
        );


    buttonsContainer.className =
        "pagination-buttons";


    /*
       TOMBOL SEBELUMNYA
    */

    const previousButton =
        document.createElement(
            "button"
        );


    previousButton.type =
        "button";


    previousButton.textContent =
        "← Sebelumnya";


    previousButton.className =
        "pagination-button";


    previousButton.disabled =
        currentPage === 1;


    previousButton.addEventListener(
        "click",
        function () {

            if (
                currentPage > 1
            ) {

                currentPage--;

                loadProducts();

            }

        }
    );


    buttonsContainer.appendChild(
        previousButton
    );


    /*
       NOMOR HALAMAN
    */

    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const pageButton =
            document.createElement(
                "button"
            );


        pageButton.type =
            "button";


        pageButton.textContent =
            page;


        pageButton.className =
            "pagination-button";


        if (
            page === currentPage
        ) {

            pageButton.classList.add(
                "active"
            );

        }


        pageButton.addEventListener(
            "click",
            function () {

                currentPage =
                    page;

                loadProducts();

            }
        );


        buttonsContainer.appendChild(
            pageButton
        );

    }


    /*
       TOMBOL BERIKUTNYA
    */

    const nextButton =
        document.createElement(
            "button"
        );


    nextButton.type =
        "button";


    nextButton.textContent =
        "Berikutnya →";


    nextButton.className =
        "pagination-button";


    nextButton.disabled =
        currentPage >=
        totalPages;


    nextButton.addEventListener(
        "click",
        function () {

            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                loadProducts();

            }

        }
    );


    buttonsContainer.appendChild(
        nextButton
    );


    pagination.appendChild(
        buttonsContainer
    );

}


/* =====================================
   UPDATE STATISTICS
===================================== */

async function updateStats() {

    const { data, error } =
        await supabaseClient
            .from("products")
            .select(
                "ai_generated"
            );


    if (error) {

        console.error(
            "Gagal mengambil statistik:",
            error
        );

        return;

    }


    const allProducts =
        data || [];


    totalProducts.textContent =
        allProducts.length;


    manualProducts.textContent =
        allProducts.filter(
            function (product) {

                return !product.ai_generated;

            }
        ).length;


    aiProducts.textContent =
        allProducts.filter(
            function (product) {

                return product.ai_generated;

            }
        ).length;

}


/* =====================================
   SAVE PRODUCT
===================================== */

productForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const id =
            productId.value;


        const productData = {

            sku:
                sku.value.trim() ||
                null,

            name:
                name.value.trim(),

            brand:
                brand.value.trim() ||
                null,

            advantages:
                textToArray(
                    advantages.value
                ),

            materials:
                textToArray(
                    materials.value
                ),

            functions:
                textToArray(
                    functions.value
                ),

            source:
                source.value.trim() ||
                "manual",

            source_type:
                "manual",

            ai_generated:
                false,

            updated_at:
                new Date().toISOString()

        };


        let result;


        if (id) {

            result =
                await supabaseClient
                    .from("products")
                    .update(productData)
                    .eq(
                        "id",
                        id
                    );

        } else {

            result =
                await supabaseClient
                    .from("products")
                    .insert([
                        productData
                    ]);

        }


        if (result.error) {

            console.error(
                result.error
            );

            showMessage(
                "Gagal menyimpan: " +
                result.error.message,
                "error"
            );

            return;

        }


        showMessage(
            id
                ? "Produk berhasil diperbarui."
                : "Produk berhasil ditambahkan."
        );


        resetForm();


        /*
           Setelah tambah produk,
           kembali ke halaman pertama
           agar produk terbaru terlihat.
        */

        if (!id) {

            currentPage = 1;

        }


        await loadProducts();

    }
);


/* =====================================
   EDIT PRODUCT
===================================== */

window.editProduct =
    function (id) {

        const product =
            products.find(
                function (item) {

                    return item.id === id;

                }
            );


        if (!product) {

            return;

        }


        productId.value =
            product.id;

        sku.value =
            product.sku || "";

        name.value =
            product.name || "";

        brand.value =
            product.brand || "";

        source.value =
            product.source || "";

        advantages.value =
            arrayToText(
                product.advantages
            );

        materials.value =
            arrayToText(
                product.materials
            );

        functions.value =
            arrayToText(
                product.functions
            );


        formTitle.textContent =
            "Edit Produk";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };


/* =====================================
   DELETE PRODUCT
===================================== */

window.deleteProduct =
    async function (id) {

        const product =
            products.find(
                function (item) {

                    return item.id === id;

                }
            );


        if (!product) {

            return;

        }


        const confirmDelete =
            confirm(
                `Hapus produk "${product.name}"?`
            );


        if (!confirmDelete) {

            return;

        }


        const { error } =
            await supabaseClient
                .from("products")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {

            console.error(error);

            showMessage(
                "Gagal menghapus: " +
                error.message,
                "error"
            );

            return;

        }


        showMessage(
            "Produk berhasil dihapus."
        );


        await loadProducts();

    };


/* =====================================
   SEARCH PRODUCTS
===================================== */

searchProducts.addEventListener(
    "input",
    function () {

        const query =
            this.value
                .toLowerCase()
                .trim();


        if (!query) {

            renderProducts(products);

            return;

        }


        const filtered =
            products.filter(
                function (product) {

                    return (

                        (product.name || "")
                            .toLowerCase()
                            .includes(query)

                        ||

                        (product.sku || "")
                            .toLowerCase()
                            .includes(query)

                        ||

                        (product.brand || "")
                            .toLowerCase()
                            .includes(query)

                    );

                }
            );


        renderProducts(
            filtered
        );

    }
);


/* =====================================
   CANCEL EDIT
===================================== */

cancelButton.addEventListener(
    "click",
    resetForm
);


function resetForm() {

    productForm.reset();

    productId.value =
        "";

    formTitle.textContent =
        "Tambah Produk";

}


/* =====================================
   TEXT TO ARRAY
===================================== */

function textToArray(text) {

    return text
        .split("\n")
        .map(
            function (item) {

                return item.trim();

            }
        )
        .filter(Boolean);

}


/* =====================================
   ARRAY TO TEXT
===================================== */

function arrayToText(array) {

    if (!Array.isArray(array)) {

        return "";

    }

    return array.join("\n");

}


/* =====================================
   SHOW MESSAGE
===================================== */

function showMessage(
    text,
    type = "success"
) {

    message.textContent =
        text;


    message.classList.remove(
        "hidden",
        "error"
    );


    if (type === "error") {

        message.classList.add(
            "error"
        );

    }


    setTimeout(
        function () {

            message.classList.add(
                "hidden"
            );

        },
        3000
    );

}


/* =====================================
   ESCAPE HTML
===================================== */

function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =====================================
   START
===================================== */

checkLogin();