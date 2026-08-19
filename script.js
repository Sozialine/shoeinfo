/* =====================================
   CONFIG BACKEND API
   ===================================== */

const API_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co/functions/v1/search-shoe";


/* =====================================
   ELEMENT
===================================== */

const shoeInput =
    document.getElementById("shoeInput");

const searchButton =
    document.getElementById("searchButton");

const loading =
    document.getElementById("loading");

const resultSection =
    document.getElementById("resultSection");

const emptyState =
    document.getElementById("emptyState");

const productName =
    document.getElementById("productName");

const advantages =
    document.getElementById("advantages");

const materials =
    document.getElementById("materials");

const functions =
    document.getElementById("functions");


/* =====================================
   SEARCH FUNCTION
===================================== */

async function searchShoe() {

    const query =
        shoeInput.value.trim();


    // Validasi input
    if (!query) {

        alert(
            "Silakan masukkan nama sepatu atau SKU."
        );

        shoeInput.focus();

        return;

    }


    // =====================================
    // TAMPILKAN LOADING
    // =====================================

    emptyState.classList.add(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );

    loading.classList.remove(
        "hidden"
    );


    // Nonaktifkan tombol saat request berjalan
    searchButton.disabled = true;


    try {

        // =====================================
        // REQUEST KE EDGE FUNCTION
        // =====================================

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            query: query
                        })
                }
            );


        // Ambil response dengan aman
        const data =
            await response.json();


        // =====================================
        // SERVER ERROR
        // =====================================

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Terjadi kesalahan pada server."
            );

        }


        // =====================================
        // PRODUK DITEMUKAN
        // =====================================

        if (
            data.success === true &&
            data.found === true &&
            data.product
        ) {

            showResult(
                data.product
            );

            return;

        }


        // =====================================
        // PRODUK TIDAK DITEMUKAN
        // =====================================

        showNotFound(
            query
        );


    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        showError(
            error.message
        );

    } finally {

        // =====================================
        // SELALU SEMBUNYIKAN LOADING
        // =====================================

        loading.classList.add(
            "hidden"
        );


        // Aktifkan kembali tombol
        searchButton.disabled = false;

    }

}


/* =====================================
   SHOW RESULT
===================================== */

function showResult(shoe) {

    // =====================================
    // NAMA PRODUK
    // =====================================

    productName.textContent =
        shoe.name ||
        "Nama produk tidak tersedia";


    // Bersihkan hasil lama
    advantages.innerHTML = "";
    materials.innerHTML = "";
    functions.innerHTML = "";


    // =====================================
    // KEUNGGULAN
    // =====================================

    renderList(
        advantages,
        shoe.advantages,
        "Informasi keunggulan belum tersedia."
    );


    // =====================================
    // MATERIAL
    // =====================================

    renderList(
        materials,
        shoe.materials,
        "Informasi bahan belum tersedia."
    );


    // =====================================
    // FUNGSI
    // =====================================

    renderList(
        functions,
        shoe.functions,
        "Informasi fungsi belum tersedia."
    );


    // Tampilkan hasil
    resultSection.classList.remove(
        "hidden"
    );

}


/* =====================================
   RENDER LIST
===================================== */

function renderList(
    container,
    items,
    emptyMessage
) {

    container.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        const li =
            document.createElement("li");

        li.textContent =
            emptyMessage;

        container.appendChild(li);

        return;

    }


    items.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent =
            String(item);

        container.appendChild(li);

    });

}


/* =====================================
   NOT FOUND
===================================== */

function showNotFound(query) {

    productName.textContent =
        "Informasi tidak ditemukan";


    advantages.innerHTML = "";

    materials.innerHTML = "";

    functions.innerHTML = "";


    addListItem(
        advantages,
        `Data untuk "${query}" belum tersedia.`
    );


    addListItem(
        materials,
        "Informasi bahan belum tersedia."
    );


    addListItem(
        functions,
        "Informasi fungsi belum tersedia."
    );


    resultSection.classList.remove(
        "hidden"
    );

}


/* =====================================
   ERROR
===================================== */

function showError(message) {

    productName.textContent =
        "Terjadi kesalahan koneksi";


    advantages.innerHTML = "";

    materials.innerHTML = "";

    functions.innerHTML = "";


    addListItem(
        advantages,
        message ||
        "Frontend belum dapat terhubung ke backend."
    );


    addListItem(
        materials,
        "Silakan periksa koneksi dan konfigurasi backend."
    );


    addListItem(
        functions,
        "Coba lakukan pencarian kembali."
    );


    resultSection.classList.remove(
        "hidden"
    );

}


/* =====================================
   HELPER: TAMBAH LIST ITEM
===================================== */

function addListItem(
    container,
    text
) {

    const li =
        document.createElement("li");

    li.textContent =
        text;

    container.appendChild(li);

}


/* =====================================
   BUTTON EVENT
===================================== */

searchButton.addEventListener(
    "click",
    searchShoe
);


/* =====================================
   ENTER KEY
===================================== */

shoeInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            searchShoe();

        }

    }
);