
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


/* =====================================
   LABEL TIPE DAN KATEGORI
===================================== */

const productLabels =
    document.getElementById("productLabels");

const shoeTypeLabel =
    document.getElementById("shoeTypeLabel");

const categoryLabel =
    document.getElementById("categoryLabel");


/* =====================================
   INFORMASI PRODUK
===================================== */

const advantages =
    document.getElementById("advantages");

const materials =
    document.getElementById("materials");

const functions =
    document.getElementById("functions");

const technologies =
    document.getElementById("technologies");

const technologiesCard =
    document.getElementById("technologiesCard");


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
   DETEKSI BARCODE SCANNER
===================================== */

let scannerBuffer = "";

let scannerStartTime = 0;

let scannerTimer = null;


/*
 * Scanner barcode biasanya memasukkan
 * banyak karakter dalam waktu sangat cepat.
 *
 * Nilai ini menentukan batas waktu
 * untuk membedakan scanner dengan
 * ketikan manusia.
 */

const SCANNER_TIME_LIMIT = 150;


/* =====================================
   DETEKSI INPUT SCANNER
===================================== */

function handleScannerInput(event) {

    /*
     * Abaikan tombol kontrol.
     */

    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
    ) {

        return;

    }


    /*
     * Enter ditangani oleh event
     * pencarian utama.
     */

    if (
        event.key === "Enter"
    ) {

        return;

    }


    /*
     * Hanya karakter biasa.
     */

    if (
        event.key.length !== 1
    ) {

        return;

    }


    /*
     * Jika karakter pertama,
     * mulai timer scanner.
     */

    if (
        scannerBuffer.length === 0
    ) {

        scannerStartTime =
            performance.now();

    }


    scannerBuffer +=
        event.key;


    /*
     * Reset timer setiap ada
     * karakter baru.
     */

    clearTimeout(
        scannerTimer
    );


    scannerTimer =
        setTimeout(
            function () {

                scannerBuffer =
                    "";

                scannerStartTime =
                    0;

            },
            300
        );


    /*
     * Hitung kecepatan input.
     */

    const elapsed =
        performance.now() -
        scannerStartTime;


    /*
     * Minimal 8 karakter dan
     * masuk sangat cepat.
     */

    if (
        scannerBuffer.length >= 8 &&
        elapsed <= SCANNER_TIME_LIMIT
    ) {

        console.log(
            "Scanner barcode terdeteksi:",
            scannerBuffer,
            `${Math.round(elapsed)}ms`
        );


        /*
         * Tunggu sebentar sampai
         * karakter terakhir masuk
         * ke input.
         */

        setTimeout(
            function () {

                const barcode =
                    shoeInput.value.trim();


                /*
                 * Pastikan barcode berupa
                 * EAN 8 atau EAN 13 digit.
                 */

                const isEAN =
                    /^\d{8}$/.test(barcode) ||
                    /^\d{13}$/.test(barcode);


                if (
                    isEAN
                ) {

                    clearTimeout(
                        suggestionTimer
                    );


                    hideSuggestions();


                    console.log(
                        "Auto-search EAN:",
                        barcode
                    );


                    /*
                     * Langsung lakukan pencarian.
                     */

                    searchShoe(
                        barcode
                    );

                }


                /*
                 * Reset scanner buffer.
                 */

                scannerBuffer =
                    "";

                scannerStartTime =
                    0;

            },
            20
        );

    }

}
/* =====================================
   EVENT DETEKSI SCANNER
===================================== */

shoeInput.addEventListener(
    "keydown",
    handleScannerInput
);


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

            /*
     * =====================================
     * SIAP UNTUK SCAN BERIKUTNYA
     * =====================================
     */

    shoeInput.focus();

    shoeInput.select();



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


    /* =====================================
       TAMPILKAN TIPE DAN KATEGORI
    ===================================== */

    const shoeType =
        shoe.shoe_type
            ? String(shoe.shoe_type).trim()
            : "";

    const category =
        shoe.category
            ? String(shoe.category).trim()
            : "";


    if (
        productLabels &&
        shoeTypeLabel &&
        categoryLabel
    ) {

        if (shoeType) {

            shoeTypeLabel.textContent =
                `Tipe: ${shoeType}`;

            shoeTypeLabel.classList.remove(
                "hidden"
            );

        } else {

            shoeTypeLabel.textContent =
                "";

            shoeTypeLabel.classList.add(
                "hidden"
            );

        }


        if (category) {

            categoryLabel.textContent =
                `Kategori: ${category}`;

            categoryLabel.classList.remove(
                "hidden"
            );

        } else {

            categoryLabel.textContent =
                "";

            categoryLabel.classList.add(
                "hidden"
            );

        }


        if (
            shoeType ||
            category
        ) {

            productLabels.classList.remove(
                "hidden"
            );

        } else {

            productLabels.classList.add(
                "hidden"
            );

        }

    }


    /* =====================================
       KEUNGGULAN
    ===================================== */

    renderList(
        advantages,
        shoe.advantages,
        "Informasi keunggulan belum tersedia."
    );


    /* =====================================
       BAHAN
    ===================================== */

    renderList(
        materials,
        shoe.materials,
        "Informasi bahan belum tersedia."
    );


    /* =====================================
       FUNGSI
    ===================================== */

    renderList(
        functions,
        shoe.functions,
        "Informasi fungsi belum tersedia."
    );


    /* =====================================
       TEKNOLOGI
    ===================================== */

    if (
        technologies &&
        technologiesCard
    ) {

        if (
            Array.isArray(
                shoe.technologies
            ) &&
            shoe.technologies.length > 0
        ) {

            renderList(
                technologies,
                shoe.technologies,
                ""
            );

            technologiesCard.classList.remove(
                "hidden"
            );

        } else {

            technologies.innerHTML =
                "";

            technologiesCard.classList.add(
                "hidden"
            );

        }

    }


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

    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        if (emptyMessage) {

            addListItem(
                container,
                emptyMessage
            );

        }

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
   SEMBUNYIKAN INFO TAMBAHAN
===================================== */

function hideAdditionalProductInfo() {

    if (
        productLabels
    ) {

        productLabels.classList.add(
            "hidden"
        );

    }


    if (
        shoeTypeLabel
    ) {

        shoeTypeLabel.textContent =
            "";

    }


    if (
        categoryLabel
    ) {

        categoryLabel.textContent =
            "";

    }


    if (
        technologies
    ) {

        technologies.innerHTML =
            "";

    }


    if (
        technologiesCard
    ) {

        technologiesCard.classList.add(
            "hidden"
        );

    }

}


/* =====================================
   PRODUK TIDAK DITEMUKAN
===================================== */

function showNotFound(query) {

    hideAdditionalProductInfo();


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

    hideAdditionalProductInfo();


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
            event.key !== "Enter"
        ) {
            return;
        }


        event.preventDefault();


        clearTimeout(
            suggestionTimer
        );


        hideSuggestions();


        const query =
            shoeInput.value.trim();


        if (!query) {
            return;
        }


        console.log(
            "Search dengan Enter:",
            query
        );


        searchShoe(
            query
        );

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
   SIAP MENERIMA SCAN BERIKUTNYA
===================================== */

shoeInput.addEventListener(
    "focus",
    function () {

        /*
         * Jika input berisi EAN sebelumnya,
         * pilih seluruh teks agar hasil scan
         * berikutnya langsung menggantikannya.
         */

        if (
            shoeInput.value.trim()
        ) {

            shoeInput.select();

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