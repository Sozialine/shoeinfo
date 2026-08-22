/* =====================================
   KONFIGURASI SUPABASE
===================================== */

const SUPABASE_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co";

const SEARCH_API_URL =
    `${SUPABASE_URL}/functions/v1/search-shoe`;

const SUGGESTIONS_API_URL =
    `${SUPABASE_URL}/functions/v1/search-suggestions`;

/*
   Publishable key Supabase
*/
const SUPABASE_KEY =
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
   BUAT CONTAINER REKOMENDASI
   OTOMATIS JIKA BELUM ADA
===================================== */

let suggestionsContainer =
    document.getElementById("suggestions");

if (!suggestionsContainer) {

    suggestionsContainer =
        document.createElement("div");

    suggestionsContainer.id =
        "suggestions";

    suggestionsContainer.className =
        "suggestions hidden";

    const searchSection =
        document.querySelector(".search-section");

    if (searchSection) {

        const searchHint =
            document.querySelector(".search-hint");

        if (searchHint) {

            searchHint.insertAdjacentElement(
                "beforebegin",
                suggestionsContainer
            );

        } else {

            searchSection.appendChild(
                suggestionsContainer
            );

        }

    }

}


/* =====================================
   STATUS
===================================== */

let suggestionTimer = null;

let currentSuggestions = [];


/* =====================================
   HELPER RESPONSE JSON
===================================== */

async function getResponseData(response) {

    try {

        return await response.json();

    } catch (error) {

        return {};

    }

}


/* =====================================
   REQUEST HEADER
===================================== */

function getHeaders() {

    return {

        "Content-Type":
            "application/json",

        "apikey":
            SUPABASE_KEY

    };

}


/* =====================================
   SEARCH SEPATU
===================================== */

async function searchShoe(customQuery = null) {

    const query =
        String(
            customQuery || shoeInput.value
        ).trim();


    /* Validasi */

    if (!query) {

        alert(
            "Silakan masukkan nama sepatu atau SKU."
        );

        shoeInput.focus();

        return;

    }


    /* Masukkan query ke input */

    shoeInput.value =
        query;


    /* Sembunyikan rekomendasi */

    hideSuggestions();


    /* Tampilkan loading */

    emptyState.classList.add(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );

    loading.classList.remove(
        "hidden"
    );


    /* Nonaktifkan tombol */

    searchButton.disabled =
        true;

    searchButton.textContent =
        "Mencari...";


    try {

        console.log(
            "Searching:",
            query
        );


        /* Request ke search-shoe */

        const response =
            await fetch(
                SEARCH_API_URL,
                {

                    method:
                        "POST",

                    headers:
                        getHeaders(),

                    body:
                        JSON.stringify({
                            query: query
                        })

                }
            );


        const data =
            await getResponseData(
                response
            );


        console.log(
            "Search status:",
            response.status
        );

        console.log(
            "Search response:",
            data
        );


        /* Error HTTP */

        if (!response.ok) {

            const errorMessage =
                getErrorMessage(
                    data,
                    response.status
                );

            throw new Error(
                errorMessage
            );

        }


        /* Error dari backend */

        if (
            data.success === false
        ) {

            throw new Error(
                getErrorMessage(
                    data,
                    response.status
                )
            );

        }


        /* Produk ditemukan */

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


        /* Produk tidak ditemukan */

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

        loading.classList.add(
            "hidden"
        );

        searchButton.disabled =
            false;

        searchButton.textContent =
            "Cari Informasi";

    }

}


/* =====================================
   PESAN ERROR YANG LEBIH JELAS
===================================== */

function getErrorMessage(
    data,
    status
) {

    const rawMessage =
        data?.error ||
        data?.message ||
        "";


    /* Gemini quota / rate limit */

    if (
        status === 429 ||
        /quota|rate limit|too many requests/i.test(
            rawMessage
        )
    ) {

        return (
            "Batas penggunaan AI Gemini sedang tercapai. " +
            "Silakan tunggu beberapa saat lalu coba lagi."
        );

    }


    /* API key */

    if (
        /api key|gemini_api_key|unauthorized|forbidden/i.test(
            rawMessage
        )
    ) {

        return (
            "Konfigurasi API backend bermasalah. " +
            "Silakan periksa Supabase Edge Function dan GEMINI_API_KEY."
        );

    }


    /* Server */

    if (status >= 500) {

        return (
            rawMessage ||
            "Terjadi kesalahan pada server. Silakan coba lagi."
        );

    }


    return (
        rawMessage ||
        `Terjadi kesalahan. HTTP ${status}`
    );

}


/* =====================================
   TAMPILKAN HASIL
===================================== */

function showResult(shoe) {

    productName.textContent =
        shoe.name ||
        "Nama produk tidak tersedia";


    renderList(
        advantages,
        shoe.advantages,
        "Informasi keunggulan belum tersedia."
    );


    renderList(
        materials,
        shoe.materials,
        "Informasi bahan belum tersedia."
    );


    renderList(
        functions,
        shoe.functions,
        "Informasi fungsi belum tersedia."
    );


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

    container.innerHTML =
        "";


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


    items.forEach(item => {

        if (
            item === null ||
            item === undefined
        ) {

            return;

        }


        addListItem(
            container,
            String(item)
        );

    });

}


/* =====================================
   TAMBAH LIST ITEM
===================================== */

function addListItem(
    container,
    text
) {

    const li =
        document.createElement("li");

    li.textContent =
        text;

    container.appendChild(
        li
    );

}


/* =====================================
   PRODUK TIDAK DITEMUKAN
===================================== */

function showNotFound(query) {

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
        `Data untuk "${query}" belum ditemukan.`
    );


    addListItem(
        materials,
        "Coba pilih nama produk yang lebih spesifik dari rekomendasi."
    );


    addListItem(
        functions,
        "Anda juga dapat mencoba SKU atau artikel produk."
    );


    resultSection.classList.remove(
        "hidden"
    );

}


/* =====================================
   TAMPILKAN ERROR
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
        "Periksa koneksi internet dan konfigurasi Supabase."
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
   AMBIL REKOMENDASI
===================================== */

async function getSuggestions(query) {

    const cleanQuery =
        String(query).trim();


    /* Jangan mencari rekomendasi
       jika terlalu pendek */

    if (
        cleanQuery.length < 3
    ) {

        hideSuggestions();

        return;

    }


    try {

        const response =
            await fetch(
                SUGGESTIONS_API_URL,
                {

                    method:
                        "POST",

                    headers:
                        getHeaders(),

                    body:
                        JSON.stringify({
                            query: cleanQuery
                        })

                }
            );


        const data =
            await getResponseData(
                response
            );


        console.log(
            "Suggestions response:",
            data
        );


        if (!response.ok) {

            hideSuggestions();

            return;

        }


        if (
            data.success !== true ||
            !Array.isArray(
                data.suggestions
            )
        ) {

            hideSuggestions();

            return;

        }


        /* Pastikan input belum berubah
           saat request selesai */

        if (
            shoeInput.value.trim() !==
            cleanQuery
        ) {

            return;

        }


        /* Hilangkan duplikat */

        const uniqueSuggestions =
            [
                ...new Set(
                    data.suggestions
                        .map(item =>
                            String(item).trim()
                        )
                        .filter(Boolean)
                )
            ];


        currentSuggestions =
            uniqueSuggestions;


        showSuggestions(
            uniqueSuggestions
        );


    } catch (error) {

        console.error(
            "Suggestions error:",
            error
        );

        hideSuggestions();

    }

}


/* =====================================
   TAMPILKAN REKOMENDASI
===================================== */

function showSuggestions(items) {

    suggestionsContainer.innerHTML =
        "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        hideSuggestions();

        return;

    }


    const title =
        document.createElement("p");

    title.className =
        "suggestions-title";

    title.textContent =
        "Rekomendasi pencarian";

    suggestionsContainer.appendChild(
        title
    );


    const list =
        document.createElement("div");

    list.className =
        "suggestions-list";


    items.forEach(item => {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "suggestion-item";

        button.textContent =
            item;


        button.addEventListener(
            "click",
            function () {

                shoeInput.value =
                    item;

                hideSuggestions();

                searchShoe(
                    item
                );

            }
        );


        list.appendChild(
            button
        );

    });


    suggestionsContainer.appendChild(
        list
    );


    suggestionsContainer.classList.remove(
        "hidden"
    );

}


/* =====================================
   SEMBUNYIKAN REKOMENDASI
===================================== */

function hideSuggestions() {

    suggestionsContainer.classList.add(
        "hidden"
    );

    suggestionsContainer.innerHTML =
        "";

    currentSuggestions =
        [];

}


/* =====================================
   EVENT INPUT + DEBOUNCE
===================================== */

shoeInput.addEventListener(
    "input",
    function () {

        clearTimeout(
            suggestionTimer
        );


        const query =
            shoeInput.value.trim();


        if (
            query.length < 3
        ) {

            hideSuggestions();

            return;

        }


        suggestionTimer =
            setTimeout(
                function () {

                    getSuggestions(
                        query
                    );

                },
                500
            );

    }
);


/* =====================================
   EVENT BUTTON SEARCH
===================================== */

searchButton.addEventListener(
    "click",
    function () {

        searchShoe();

    }
);


/* =====================================
   ENTER UNTUK SEARCH
===================================== */

shoeInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            clearTimeout(
                suggestionTimer
            );

            hideSuggestions();

            searchShoe();

        }

    }
);


/* =====================================
   ESC UNTUK TUTUP REKOMENDASI
===================================== */

shoeInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            hideSuggestions();

        }

    }
);


/* =====================================
   KLIK DI LUAR REKOMENDASI
===================================== */

document.addEventListener(
    "click",
    function (event) {

        if (
            !suggestionsContainer.contains(
                event.target
            ) &&
            event.target !== shoeInput
        ) {

            hideSuggestions();

        }

    }
);


/* =====================================
   FOCUS INPUT
===================================== */

shoeInput.addEventListener(
    "focus",
    function () {

        const query =
            shoeInput.value.trim();


        if (
            query.length >= 3
        ) {

            getSuggestions(
                query
            );

        }

    }
);