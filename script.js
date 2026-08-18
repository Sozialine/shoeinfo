/* =====================================
   SHOEINFO - SUPABASE CONFIGURATION
   ===================================== */

// GANTI dengan Project URL Supabase Anda
const SUPABASE_URL = "MASUKKAN_PROJECT_URL_ANDA";

// GANTI dengan Publishable Key Supabase Anda
const SUPABASE_KEY = "MASUKKAN_PUBLISHABLE_KEY_ANDA";


/* =====================================
   SUPABASE CLIENT
   ===================================== */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =====================================
   ELEMENT
   ===================================== */

const shoeInput = document.getElementById("shoeInput");

const searchButton = document.getElementById("searchButton");

const loading = document.getElementById("loading");

const resultSection = document.getElementById("resultSection");

const emptyState = document.getElementById("emptyState");

const productName = document.getElementById("productName");

const advantages = document.getElementById("advantages");

const materials = document.getElementById("materials");

const functions = document.getElementById("functions");


/* =====================================
   SEARCH FUNCTION
   ===================================== */

async function searchShoe() {

    const query = shoeInput.value.trim();

    // Input kosong
    if (query === "") {

        alert("Silakan masukkan nama sepatu atau SKU.");

        shoeInput.focus();

        return;
    }


    // Tampilkan loading
    emptyState.classList.add("hidden");

    resultSection.classList.add("hidden");

    loading.classList.remove("hidden");

    searchButton.disabled = true;


    try {

        const shoe = await findShoe(query);


        loading.classList.add("hidden");

        searchButton.disabled = false;


        if (!shoe) {

            showNotFound(query);

            return;
        }


        showResult(shoe);


    } catch (error) {

        console.error("Supabase Error:", error);

        loading.classList.add("hidden");

        searchButton.disabled = false;

        showError();

    }

}


/* =====================================
   FIND SHOE FROM SUPABASE
   ===================================== */

async function findShoe(query) {

    const search = query.trim();


    /*
     * 1. Cari berdasarkan SKU terlebih dahulu
     */

    const { data: skuData, error: skuError } = await supabaseClient
        .from("products")
        .select("*")
        .ilike("sku", search)
        .limit(1);


    if (skuError) {

        throw skuError;

    }


    if (skuData && skuData.length > 0) {

        return skuData[0];

    }


    /*
     * 2. Kalau SKU tidak ditemukan,
     *    cari berdasarkan nama sepatu
     */

    const { data: nameData, error: nameError } = await supabaseClient
        .from("products")
        .select("*")
        .ilike("name", `%${search}%`)
        .limit(1);


    if (nameError) {

        throw nameError;

    }


    if (nameData && nameData.length > 0) {

        return nameData[0];

    }


    return null;

}


/* =====================================
   SHOW RESULT
   ===================================== */

function showResult(shoe) {

    productName.textContent = shoe.name || "Nama produk tidak tersedia";


    // Bersihkan hasil sebelumnya

    advantages.innerHTML = "";

    materials.innerHTML = "";

    functions.innerHTML = "";


    /*
     * KEUNGGULAN
     */

    renderList(
        advantages,
        shoe.advantages,
        "Informasi keunggulan belum tersedia."
    );


    /*
     * BAHAN
     */

    renderList(
        materials,
        shoe.materials,
        "Informasi bahan belum tersedia."
    );


    /*
     * FUNGSI
     */

    renderList(
        functions,
        shoe.functions,
        "Informasi fungsi belum tersedia."
    );


    resultSection.classList.remove("hidden");

}


/* =====================================
   RENDER LIST
   ===================================== */

function renderList(element, items, emptyMessage) {

    element.innerHTML = "";


    if (!items || !Array.isArray(items) || items.length === 0) {

        const li = document.createElement("li");

        li.textContent = emptyMessage;

        element.appendChild(li);

        return;

    }


    items.forEach(item => {

        const li = document.createElement("li");

        li.textContent = item;

        element.appendChild(li);

    });

}


/* =====================================
   NOT FOUND
   ===================================== */

function showNotFound(query) {

    productName.textContent = "Informasi tidak ditemukan";


    advantages.innerHTML = `
        <li>
            Produk "${query}" belum tersedia di database ShoeInfo.
        </li>
    `;


    materials.innerHTML = `
        <li>
            Informasi bahan belum tersedia.
        </li>
    `;


    functions.innerHTML = `
        <li>
            Informasi fungsi belum tersedia.
        </li>
    `;


    resultSection.classList.remove("hidden");

}


/* =====================================
   ERROR
   ===================================== */

function showError() {

    productName.textContent = "Terjadi kesalahan";


    advantages.innerHTML = `
        <li>
            Website tidak dapat terhubung ke database.
        </li>
    `;


    materials.innerHTML = `
        <li>
            Silakan coba beberapa saat lagi.
        </li>
    `;


    functions.innerHTML = `
        <li>
            Jika masalah terus terjadi, periksa konfigurasi Supabase.
        </li>
    `;


    resultSection.classList.remove("hidden");

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
    function(event) {

        if (event.key === "Enter") {

            searchShoe();

        }

    }
);
