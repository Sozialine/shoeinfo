/* =====================================
   CONFIG BACKEND API
===================================== */

const API_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co/functions/v1/search-shoe";

const SUPABASE_ANON_KEY =
    "sb_publishable_PQbg0iClbuSLCjurjMT_Nw_-YjIply-";


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


    // Tampilkan loading
    emptyState?.classList.add(
        "hidden"
    );

    resultSection?.classList.add(
        "hidden"
    );

    loading?.classList.remove(
        "hidden"
    );


    // Nonaktifkan tombol
    searchButton.disabled = true;


    try {

        console.log(
            "Mencari produk:",
            query
        );


        // Request ke Supabase Edge Function
        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "apikey":
                        SUPABASE_ANON_KEY,
                },

                body:
                    JSON.stringify({
                        query: query
                    }),

            });


        // Ambil response
        let data;

        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                "Server tidak mengembalikan JSON yang valid."
            );

        }


        console.log(
            "HTTP Status:",
            response.status
        );

        console.log(
            "Response ShoeInfo:",
            data
        );


        // =====================================
        // ERROR DARI SERVER
        // =====================================

        if (!response.ok) {

            throw new Error(
                data?.error ||
                data?.message ||
                `Terjadi kesalahan pada server (${response.status}).`
            );

        }


        // =====================================
        // PRODUK DITEMUKAN
        // =====================================

        if (
            data?.success === true &&
            data?.found === true &&
            data?.product
        ) {

            showResult(
                data.product
            );

            console.log(
                data.cached
                    ? "Produk ditemukan dari database."
                    : "Produk berhasil dibuat oleh Gemini."
            );

            return;

        }


        // =====================================
        // PRODUK TIDAK DITEMUKAN
        // =====================================

        showNotFound(
            query,
            data?.message
        );


    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        showError(
            error?.message ||
            "Terjadi kesalahan saat menghubungkan ke ShoeInfo."
        );


    } finally {

        // Sembunyikan loading
        loading?.classList.add(
            "hidden"
        );


        // Aktifkan kembali tombol
        searchButton.disabled =
            false;

    }

}


/* =====================================
   SHOW RESULT
===================================== */

function showResult(shoe) {

    productName.textContent =
        shoe?.name ||
        "Nama produk tidak tersedia";


    // Render keunggulan
    renderList(
        advantages,
        shoe?.advantages,
        "Informasi keunggulan belum tersedia."
    );


    // Render bahan
    renderList(
        materials,
        shoe?.materials,
        "Informasi bahan belum tersedia."
    );


    // Render fungsi
    renderList(
        functions,
        shoe?.functions,
        "Informasi fungsi belum tersedia."
    );


    // Tampilkan hasil
    resultSection.classList.remove(
        "hidden"
    );


    // Scroll ke hasil
    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =====================================
   RENDER LIST
===================================== */

function renderList(
    container,
    items,
    emptyMessage
) {

    if (!container) {
        return;
    }


    // Bersihkan isi sebelumnya
    container.innerHTML =
        "";


    // Jika data kosong
    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        addListItem(
            container,
            emptyMessage
        );

        return;

    }


    // Tambahkan setiap item
    items.forEach(
        function (item) {

            if (
                item === null ||
                item === undefined ||
                String(item).trim() === ""
            ) {
                return;
            }


            addListItem(
                container,
                String(item)
            );

        }
    );

}


/* =====================================
   SHOW NOT FOUND
===================================== */

function showNotFound(
    query,
    message
) {

    productName.textContent =
        "Informasi tidak ditemukan";


    advantages.innerHTML =
        "";

    materials.innerHTML =
        "";

    functions.innerHTML =
        "";


    addListItem(
        advantages,
        message ||
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
   SHOW ERROR
===================================== */

function showError(message) {

    productName.textContent =
        "Terjadi kesalahan koneksi";


    advantages.innerHTML =
        "";

    materials.innerHTML =
        "";

    functions.innerHTML =
        "";


    addListItem(
        advantages,
        message ||
        "Frontend belum dapat terhubung ke backend."
    );


    addListItem(
        materials,
        "Periksa koneksi internet dan konfigurasi backend."
    );


    addListItem(
        functions,
        "Silakan coba lakukan pencarian kembali."
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

    if (!container) {
        return;
    }


    const li =
        document.createElement("li");


    li.textContent =
        text;


    container.appendChild(
        li
    );

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