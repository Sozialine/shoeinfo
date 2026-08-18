const SUPABASE_URL = "https://kqwfxglzelhdjsxeceld.supabase.co";

const SUPABASE_KEY = "sb_publishable_PQbg0iClbuSLCjurjMT_Nw_-YjIply-";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ==============================
   ELEMENT
================================ */

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


/* ==============================
   LOAD PRODUCTS
================================ */

async function loadProducts() {

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        showMessage(
            "Gagal mengambil data: " + error.message
        );

        return;
    }

    products = data || [];

    renderProducts(products);

    updateStats(products);
}


/* ==============================
   RENDER PRODUCTS
================================ */

function renderProducts(data) {

    productsTable.innerHTML = "";

    if (data.length === 0) {

        productsTable.innerHTML = `
            <tr>
                <td colspan="6">
                    Belum ada produk.
                </td>
            </tr>
        `;

        return;
    }


    data.forEach(product => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

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
                    : 'Manual'
                }

            </td>

            <td>

                <button
                    class="action-button edit-button"
                    onclick="editProduct(${product.id})"
                >
                    Edit
                </button>

                <button
                    class="action-button delete-button"
                    onclick="deleteProduct(${product.id})"
                >
                    Hapus
                </button>

            </td>

        `;

        productsTable.appendChild(row);

    });

}


/* ==============================
   STATISTICS
================================ */

function updateStats(data) {

    totalProducts.textContent =
        data.length;

    manualProducts.textContent =
        data.filter(
            product => !product.ai_generated
        ).length;

    aiProducts.textContent =
        data.filter(
            product => product.ai_generated
        ).length;
}


/* ==============================
   SAVE PRODUCT
================================ */

productForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const id =
            productId.value;


        const productData = {

            sku:
                sku.value.trim() || null,

            name:
                name.value.trim(),

            brand:
                brand.value.trim() || null,

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
                source.value.trim() || "manual",

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
                    .eq("id", id);

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
                result.error.message
            );

            return;
        }


        showMessage(
            id
            ? "Produk berhasil diperbarui."
            : "Produk berhasil ditambahkan."
        );


        resetForm();

        loadProducts();

    }
);


/* ==============================
   EDIT
================================ */

window.editProduct =
async function(id) {

    const product =
        products.find(
            item => item.id === id
        );


    if (!product) return;


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


/* ==============================
   DELETE
================================ */

window.deleteProduct =
async function(id) {

    const product =
        products.find(
            item => item.id === id
        );


    if (!product) return;


    const confirmDelete =
        confirm(
            `Hapus produk "${product.name}"?`
        );


    if (!confirmDelete) return;


    const { error } =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);


    if (error) {

        showMessage(
            "Gagal menghapus: " +
            error.message
        );

        return;
    }


    showMessage(
        "Produk berhasil dihapus."
    );


    loadProducts();

};


/* ==============================
   SEARCH
================================ */

searchProducts.addEventListener(
    "input",
    function() {

        const query =
            this.value
                .toLowerCase()
                .trim();


        if (!query) {

            renderProducts(products);

            return;
        }


        const filtered =
            products.filter(product =>

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


        renderProducts(filtered);

    }
);


/* ==============================
   CANCEL
================================ */

cancelButton.addEventListener(
    "click",
    resetForm
);


function resetForm() {

    productForm.reset();

    productId.value = "";

    formTitle.textContent =
        "Tambah Produk";

}


/* ==============================
   HELPER
================================ */

function textToArray(text) {

    return text
        .split("\n")
        .map(item => item.trim())
        .filter(Boolean);

}


function arrayToText(array) {

    if (!Array.isArray(array)) {
        return "";
    }

    return array.join("\n");

}


function showMessage(text) {

    message.textContent = text;

    message.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        message.classList.add(
            "hidden"
        );

    }, 3000);

}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ==============================
   START
================================ */

loadProducts();