
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

        showLogin();

    }
);


/* =====================================
   LOAD PRODUCTS
===================================== */

async function loadProducts() {

    const { data, error } =
        await supabaseClient
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
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


    renderProducts(products);

    updateStats(products);

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
   UPDATE STATISTICS
===================================== */

function updateStats(data) {

    totalProducts.textContent =
        data.length;


    manualProducts.textContent =
        data.filter(
            function (product) {
                return !product.ai_generated;
            }
        ).length;


    aiProducts.textContent =
        data.filter(
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

            console.error(result.error);

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


        renderProducts(filtered);

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
