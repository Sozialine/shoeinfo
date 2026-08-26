/* =====================================
   KONFIGURASI SUPABASE
===================================== */

const SUPABASE_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co";

const SEARCH_API_URL =
    `${SUPABASE_URL}/functions/v1/search-shoe`;

const SUGGESTIONS_API_URL =
    `${SUPABASE_URL}/functions/v1/search-suggestions`;


/* =====================================
   PUBLISHABLE KEY SUPABASE
===================================== */

const SUPABASE_KEY =
    "sb_publishable_PQbg0iClbuSLCjurjMT_Nw_-YjIply-";


/* =====================================
   ELEMENT UTAMA
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

const productColorway =
    document.getElementById("productColorway");

/* =====================================
   LABEL PRODUK
   TIPE + KATEGORI
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
   STATUS REKOMENDASI
===================================== */

let suggestionTimer =
    null;

let suggestionAbortController =
    null;

let currentSuggestions =
    [];


/* =====================================
   STATUS BARCODE SCANNER
===================================== */

let scannerBuffer =
    "";

let scannerStartTime =
    0;

let scannerTimer =
    null;

let scannerSearchTimer =
    null;


/*
   Scanner barcode biasanya memasukkan
   karakter sangat cepat.

   Jangan terlalu ketat karena beberapa
   scanner atau komputer bisa sedikit
   lebih lambat.
*/

const SCANNER_TIME_LIMIT =
    250;


/*
   Waktu tunggu setelah karakter terakhir.

   Ini penting agar EAN-13 tidak langsung
   dicari ketika baru mencapai 8 digit.
*/

const SCANNER_FINISH_DELAY =
    150;


/* =====================================
   CEK ELEMENT
===================================== */

function hasElement(element) {

    return element !== null &&
        element !== undefined;

}


/* =====================================
   HELPER RESPONSE JSON
===================================== */

async function getResponseData(response) {

    try {

        return await response.json();

    } catch (error) {

        console.warn(
            "Response bukan JSON:",
            error
        );

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
   CEK BARCODE / EAN
===================================== */

function isBarcodeQuery(query) {

    const value =
        String(query || "").trim();


    return (
        /^\d{8}$/.test(value) ||
        /^\d{13}$/.test(value) ||
        /^\d{9,14}$/.test(value)
    );

}


/* =====================================
   BERSIHKAN ARRAY DATA
===================================== */

function cleanArray(items) {

    if (!Array.isArray(items)) {

        return [];

    }


    return items
        .filter(
            item =>
                item !== null &&
                item !== undefined &&
                String(item).trim() !== ""
        )
        .map(
            item =>
                String(item).trim()
        );

}


/* =====================================
   HAPUS DUPLIKAT ARRAY
===================================== */

function uniqueArray(items) {

    const seen =
        new Set();


    return cleanArray(items).filter(
        item => {

            const normalized =
                item
                    .toLowerCase()
                    .replace(/\s+/g, " ")
                    .trim();


            if (
                seen.has(normalized)
            ) {

                return false;

            }


            seen.add(
                normalized
            );

            return true;

        }
    );

}


/* =====================================
   DETEKSI BARCODE SCANNER
===================================== */

function handleScannerInput(event) {

    /*
       Jangan proses shortcut keyboard.
    */

    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
    ) {

        return;

    }


    /*
       Enter akan ditangani oleh event
       Enter utama.
    */

    if (
        event.key === "Enter"
    ) {

        return;

    }


    /*
       Hanya karakter biasa.
    */

    if (
        event.key.length !== 1
    ) {

        return;

    }


    /*
       Scanner barcode EAN pada umumnya
       menghasilkan angka.
    */

    if (
        !/^\d$/.test(event.key)
    ) {

        scannerBuffer =
            "";

        scannerStartTime =
            0;

        clearTimeout(
            scannerTimer
        );

        clearTimeout(
            scannerSearchTimer
        );

        return;

    }


    /*
       Karakter pertama.
    */

    if (
        scannerBuffer.length === 0
    ) {

        scannerStartTime =
            performance.now();

    }


    /*
       Tambahkan karakter.
    */

    scannerBuffer +=
        event.key;


    /*
       Reset timer.
    */

    clearTimeout(
        scannerTimer
    );


    clearTimeout(
        scannerSearchTimer
    );


    scannerTimer =
        setTimeout(
            function () {

                scannerBuffer =
                    "";

                scannerStartTime =
                    0;

            },
            500
        );


    /*
       Hitung kecepatan input.
    */

    const elapsed =
        performance.now() -
        scannerStartTime;


    /*
       Minimal 8 digit dan masuk cepat.
    */

    if (
        scannerBuffer.length >= 8 &&
        elapsed <= SCANNER_TIME_LIMIT
    ) {

        /*
           Tunggu sebentar sampai scanner
           selesai memasukkan semua digit.

           Dengan cara ini EAN-13 tidak akan
           dicari saat baru 8 digit.
        */

        scannerSearchTimer =
            setTimeout(
                function () {

                    const barcode =
                        shoeInput.value
                            .trim();


                    const elapsedFinal =
                        performance.now() -
                        scannerStartTime;


                    /*
                       Pastikan masih scanner
                       dan barcode valid.
                    */

                    if (
                        elapsedFinal <=
                        SCANNER_TIME_LIMIT + 1000
                    ) {

                        if (
                            isBarcodeQuery(
                                barcode
                            )
                        ) {

                            console.log(
                                "Scanner barcode terdeteksi:",
                                barcode,
                                `${Math.round(elapsedFinal)}ms`
                            );


                            clearTimeout(
                                suggestionTimer
                            );


                            hideSuggestions();


                            searchShoe(
                                barcode
                            );

                        }

                    }


                    /*
                       Reset scanner.
                    */

                    scannerBuffer =
                        "";

                    scannerStartTime =
                        0;

                },
                SCANNER_FINISH_DELAY
            );

    }

}


/* =====================================
   EVENT DETEKSI SCANNER
===================================== */

if (shoeInput) {

    shoeInput.addEventListener(
        "keydown",
        handleScannerInput
    );

}


/* =====================================
   SEARCH SEPATU
===================================== */

async function searchShoe(
    customQuery = null
) {

    if (
        !shoeInput
    ) {

        console.error(
            "Element #shoeInput tidak ditemukan."
        );

        return;

    }


    const query =
        String(
            customQuery ||
            shoeInput.value
        ).trim();


    /* =====================================
       VALIDASI
    ===================================== */

    if (!query) {

        alert(
            "Silakan masukkan nama sepatu, SKU, atau barcode."
        );

        shoeInput.focus();

        return;

    }


    /* =====================================
       MASUKKAN QUERY KE INPUT
    ===================================== */

    shoeInput.value =
        query;


    /* =====================================
       SEMBUNYIKAN REKOMENDASI
    ===================================== */

    clearTimeout(
        suggestionTimer
    );

    hideSuggestions();


    /* =====================================
       SEMBUNYIKAN HASIL SEBELUMNYA
    ===================================== */

    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    if (resultSection) {

        resultSection.classList.add(
            "hidden"
        );

    }


    hideAdditionalProductInfo();


    /* =====================================
       TAMPILKAN LOADING
    ===================================== */

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    /* =====================================
       NONAKTIFKAN TOMBOL
    ===================================== */

    if (searchButton) {

        searchButton.disabled =
            true;

        searchButton.textContent =
            "Mencari...";

    }


    try {

        console.log(
            "Searching:",
            query
        );


        /* =====================================
           REQUEST KE SEARCH-SHOE
        ===================================== */

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
                            query:
                                query
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


        /* =====================================
           ERROR HTTP
        ===================================== */

        if (
            !response.ok
        ) {

            const errorMessage =
                getErrorMessage(
                    data,
                    response.status
                );


            throw new Error(
                errorMessage
            );

        }


        /* =====================================
           ERROR DARI BACKEND
        ===================================== */

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


        /* =====================================
           PRODUK DITEMUKAN
        ===================================== */

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


        /* =====================================
           PRODUK TIDAK DITEMUKAN
        ===================================== */

        showNotFound(
            query,
            data.message
        );


    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        showError(
            error?.message ||
            "Terjadi kesalahan saat melakukan pencarian."
        );

    } finally {

        /* =====================================
           SEMBUNYIKAN LOADING
        ===================================== */

        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }


        /* =====================================
           AKTIFKAN TOMBOL
        ===================================== */

        if (searchButton) {

            searchButton.disabled =
                false;

            searchButton.textContent =
                "Cari Informasi";

        }


        /* =====================================
           SIAP UNTUK SCAN BERIKUTNYA
        ===================================== */

        if (shoeInput) {

            shoeInput.focus();

            shoeInput.select();

        }

    }

}


/* =====================================
   PESAN ERROR LEBIH JELAS
===================================== */

function getErrorMessage(
    data,
    status
) {

    const rawMessage =
        data?.error ||
        data?.message ||
        "";


    /* =====================================
       QUOTA / RATE LIMIT
    ===================================== */

    if (
        status === 429 ||
        /quota|rate limit|too many requests|resource exhausted/i.test(
            rawMessage
        )
    ) {

        return (
            "Batas penggunaan layanan AI sedang tercapai. " +
            "Silakan tunggu beberapa saat lalu coba lagi."
        );

    }


    /* =====================================
       GEMINI
    ===================================== */

    if (
        /gemini/i.test(
            rawMessage
        ) &&
        /quota|limit|exceeded/i.test(
            rawMessage
        )
    ) {

        return (
            "Batas penggunaan Gemini sedang tercapai. " +
            "Silakan coba kembali beberapa saat lagi."
        );

    }


    /* =====================================
       API KEY
    ===================================== */

    if (
        /api key|gemini_api_key|deepseek_api_key|unauthorized|forbidden/i.test(
            rawMessage
        )
    ) {

        return (
            "Konfigurasi API backend bermasalah. " +
            "Silakan periksa Environment Variables di Supabase."
        );

    }


    /* =====================================
       SERVER
    ===================================== */

    if (
        status >= 500
    ) {

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
   TAMPILKAN HASIL PRODUK
===================================== */

function showResult(shoe) {

    if (!shoe) {

        return;

    }


    /* =====================================
       NAMA PRODUK
    ===================================== */

    if (productName) {

        productName.textContent =
            shoe.name ||
            "Nama produk tidak tersedia";

    }

    /* =====================================
   COLORWAY PRODUK
===================================== */

const colorway =
    shoe.colorway
        ? String(
            shoe.colorway
        ).trim()
        : "";


if (productColorway) {

    productColorway.textContent =
        colorway;

    if (colorway) {

        productColorway.classList.remove(
            "hidden"
        );

    } else {

        productColorway.classList.add(
            "hidden"
        );

    }

}

    /* =====================================
       TIPE PRODUK
    ===================================== */

    const shoeType =
        shoe.shoe_type
            ? String(
                shoe.shoe_type
            ).trim()
            : "";


    /* =====================================
       KATEGORI PRODUK
    ===================================== */

    const category =
        shoe.category
            ? String(
                shoe.category
            ).trim()
            : "";


    /* =====================================
       TAMPILKAN LABEL
    ===================================== */

    showProductLabels(
        shoeType,
        category
    );


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

       Backend harus mengirim:

       technologies: [
           "Nike Air",
           "Zoom Air",
           "React"
       ]
    ===================================== */

    const technologyItems =
        uniqueArray(
            shoe.technologies
        );


    if (
        technologies &&
        technologiesCard
    ) {

        if (
            technologyItems.length > 0
        ) {

            renderList(
                technologies,
                technologyItems,
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


    /* =====================================
       TAMPILKAN HASIL
    ===================================== */

    if (resultSection) {

        resultSection.classList.remove(
            "hidden"
        );

    }

}


/* =====================================
   TAMPILKAN LABEL PRODUK
===================================== */

function showProductLabels(
    shoeType,
    category
) {

    if (
        !productLabels ||
        !shoeTypeLabel ||
        !categoryLabel
    ) {

        console.warn(
            "Element label produk belum ditemukan."
        );

        return;

    }


    /* =====================================
       RESET
    ===================================== */

    shoeTypeLabel.textContent =
        "";

    categoryLabel.textContent =
        "";


    shoeTypeLabel.classList.add(
        "hidden"
    );

    categoryLabel.classList.add(
        "hidden"
    );


    /* =====================================
       TIPE
    ===================================== */

    if (
        shoeType
    ) {

        shoeTypeLabel.textContent =
            shoeType;


        shoeTypeLabel.classList.remove(
            "hidden"
        );

    }


    /* =====================================
       KATEGORI
    ===================================== */

    if (
        category
    ) {

        categoryLabel.textContent =
            category;


        categoryLabel.classList.remove(
            "hidden"
        );

    }


    /* =====================================
       CONTAINER LABEL
    ===================================== */

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
   RENDER LIST
===================================== */

function renderList(
    container,
    items,
    emptyMessage = ""
) {

    if (
        !container
    ) {

        return;

    }


    container.innerHTML =
        "";


    const cleanItems =
        uniqueArray(
            items
        );


    /* =====================================
       DATA KOSONG
    ===================================== */

    if (
        cleanItems.length === 0
    ) {

        if (
            emptyMessage
        ) {

            addListItem(
                container,
                emptyMessage
            );

        }

        return;

    }


    /* =====================================
       TAMBAHKAN SEMUA ITEM

       Tidak dibatasi 2 item.
       Semua data dari backend akan
       ditampilkan selama backend mengirimnya.
    ===================================== */

    cleanItems.forEach(
        item => {

            addListItem(
                container,
                item
            );

        }
    );

}


/* =====================================
   TAMBAH LIST ITEM
===================================== */

function addListItem(
    container,
    text
) {

    if (
        !container
    ) {

        return;

    }


    const cleanText =
        String(
            text || ""
        ).trim();


    if (
        !cleanText
    ) {

        return;

    }


    const li =
        document.createElement(
            "li"
        );


    li.textContent =
        cleanText;


    container.appendChild(
        li
    );

}


/* =====================================
   SEMBUNYIKAN INFO TAMBAHAN
===================================== */

function hideAdditionalProductInfo() {

    /* =====================================
       LABEL CONTAINER
    ===================================== */

    if (
        productLabels
    ) {

        productLabels.classList.add(
            "hidden"
        );

        /* =====================================
   COLORWAY
===================================== */

if (
    productColorway
) {

    productColorway.textContent =
        "";

    productColorway.classList.add(
        "hidden"
    );

}

    }


    /* =====================================
       LABEL TIPE
    ===================================== */

    if (
        shoeTypeLabel
    ) {

        shoeTypeLabel.textContent =
            "";

        shoeTypeLabel.classList.add(
            "hidden"
        );

    }


    /* =====================================
       LABEL KATEGORI
    ===================================== */

    if (
        categoryLabel
    ) {

        categoryLabel.textContent =
            "";

        categoryLabel.classList.add(
            "hidden"
        );

    }


    /* =====================================
       TEKNOLOGI
    ===================================== */

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

function showNotFound(
    query,
    backendMessage = ""
) {

    hideAdditionalProductInfo();


    if (productName) {

        productName.textContent =
            "Informasi tidak ditemukan";

    }


    if (advantages) {

        advantages.innerHTML =
            "";

    }


    if (materials) {

        materials.innerHTML =
            "";

    }


    if (functions) {

        functions.innerHTML =
            "";

    }


    addListItem(
        advantages,
        backendMessage ||
        `Data untuk "${query}" belum ditemukan.`
    );


    addListItem(
        materials,
        "Coba gunakan nama produk yang lebih spesifik."
    );


    addListItem(
        functions,
        "Anda juga dapat mencoba SKU, artikel produk, atau barcode toko."
    );


    if (
        resultSection
    ) {

        resultSection.classList.remove(
            "hidden"
        );

    }

}


/* =====================================
   TAMPILKAN ERROR
===================================== */

function showError(
    message
) {

    hideAdditionalProductInfo();


    if (
        productName
    ) {

        productName.textContent =
            "Terjadi kesalahan koneksi";

    }


    if (
        advantages
    ) {

        advantages.innerHTML =
            "";

    }


    if (
        materials
    ) {

        materials.innerHTML =
            "";

    }


    if (
        functions
    ) {

        functions.innerHTML =
            "";

    }


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


    if (
        resultSection
    ) {

        resultSection.classList.remove(
            "hidden"
        );

    }

}


/* =====================================
   AMBIL REKOMENDASI
===================================== */

async function getSuggestions(
    query
) {

    if (
        !shoeInput
    ) {

        return;

    }


    const cleanQuery =
        String(
            query || ""
        ).trim();


    /* =====================================
       JANGAN REKOMENDASI UNTUK BARCODE
    ===================================== */

    if (
        isBarcodeQuery(
            cleanQuery
        )
    ) {

        hideSuggestions();

        return;

    }


    /* =====================================
       QUERY TERLALU PENDEK
    ===================================== */

    if (
        cleanQuery.length < 3
    ) {

        hideSuggestions();

        return;

    }


    /* =====================================
       BATALKAN REQUEST SEBELUMNYA
    ===================================== */

    if (
        suggestionAbortController
    ) {

        suggestionAbortController.abort();

    }


    suggestionAbortController =
        new AbortController();


    try {

        const response =
            await fetch(
                SUGGESTIONS_API_URL,
                {

                    method:
                        "POST",

                    headers:
                        getHeaders(),

                    signal:
                        suggestionAbortController.signal,

                    body:
                        JSON.stringify({
                            query:
                                cleanQuery
                        })

                }
            );


        const data =
            await getResponseData(
                response
            );


        console.log(
            "Suggestions status:",
            response.status
        );


        console.log(
            "Suggestions response:",
            data
        );


        /* =====================================
           JIKA GAGAL, JANGAN TAMPILKAN ERROR
           DI LAYAR UTAMA

           Rekomendasi hanyalah fitur tambahan.
           Pencarian utama tetap bisa digunakan.
        ===================================== */

        if (
            !response.ok
        ) {

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


        /* =====================================
           PASTIKAN INPUT BELUM BERUBAH
        ===================================== */

        if (
            shoeInput.value.trim() !==
            cleanQuery
        ) {

            return;

        }


        /* =====================================
           HILANGKAN DUPLIKAT
        ===================================== */

        const uniqueSuggestions =
            uniqueArray(
                data.suggestions
            );


        currentSuggestions =
            uniqueSuggestions;


        showSuggestions(
            uniqueSuggestions
        );


    } catch (error) {

        /*
           Abort adalah normal ketika user
           mengetik karakter baru.
        */

        if (
            error?.name ===
            "AbortError"
        ) {

            return;

        }


        console.error(
            "Suggestions error:",
            error
        );


        hideSuggestions();

    } finally {

        suggestionAbortController =
            null;

    }

}


/* =====================================
   TAMPILKAN REKOMENDASI
===================================== */

function showSuggestions(
    items
) {

    if (
        !suggestionsContainer
    ) {

        return;

    }


    suggestionsContainer.innerHTML =
        "";


    const cleanItems =
        uniqueArray(
            items
        );


    if (
        cleanItems.length === 0
    ) {

        hideSuggestions();

        return;

    }


    /* =====================================
       JUDUL
    ===================================== */

    const title =
        document.createElement(
            "p"
        );


    title.className =
        "suggestions-title";


    title.textContent =
        "Rekomendasi pencarian";


    suggestionsContainer.appendChild(
        title
    );


    /* =====================================
       LIST
    ===================================== */

    const list =
        document.createElement(
            "div"
        );


    list.className =
        "suggestions-list";


    cleanItems.forEach(
        item => {

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

                    if (
                        shoeInput
                    ) {

                        shoeInput.value =
                            item;

                    }


                    clearTimeout(
                        suggestionTimer
                    );


                    hideSuggestions();


                    searchShoe(
                        item
                    );

                }
            );


            list.appendChild(
                button
            );

        }
    );


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

    if (
        !suggestionsContainer
    ) {

        return;

    }


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

if (
    shoeInput
) {

    shoeInput.addEventListener(
        "input",
        function () {

            clearTimeout(
                suggestionTimer
            );


            const query =
                shoeInput.value.trim();


            /* =====================================
               JANGAN MINTA REKOMENDASI
               UNTUK BARCODE
            ===================================== */

            if (
                isBarcodeQuery(
                    query
                )
            ) {

                hideSuggestions();

                return;

            }


            /* =====================================
               QUERY TERLALU PENDEK
            ===================================== */

            if (
                query.length < 3
            ) {

                hideSuggestions();

                return;

            }


            /* =====================================
               DEBOUNCE
            ===================================== */

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

}


/* =====================================
   EVENT TOMBOL CARI
===================================== */

if (
    searchButton
) {

    searchButton.addEventListener(
        "click",
        function () {

            searchShoe();

        }
    );

}


/* =====================================
   ENTER UNTUK SEARCH
===================================== */

if (
    shoeInput
) {

    shoeInput.addEventListener(
        "keydown",
        function (
            event
        ) {

            if (
                event.key !==
                "Enter"
            ) {

                return;

            }


            event.preventDefault();


            clearTimeout(
                suggestionTimer
            );


            clearTimeout(
                scannerSearchTimer
            );


            hideSuggestions();


            const query =
                shoeInput.value.trim();


            if (
                !query
            ) {

                return;

            }


            console.log(
                "Search dengan Enter:",
                query
            );


            /*
               Reset scanner agar pencarian
               tidak dipanggil dua kali.
            */

            scannerBuffer =
                "";

            scannerStartTime =
                0;


            searchShoe(
                query
            );

        }
    );

}


/* =====================================
   ESC UNTUK TUTUP REKOMENDASI
===================================== */

if (
    shoeInput
) {

    shoeInput.addEventListener(
        "keydown",
        function (
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                hideSuggestions();

            }

        }
    );

}


/* =====================================
   FOCUS INPUT
===================================== */

if (
    shoeInput
) {

    shoeInput.addEventListener(
        "focus",
        function () {

            const query =
                shoeInput.value.trim();


            /* =====================================
               JANGAN REKOMENDASI BARCODE
            ===================================== */

            if (
                isBarcodeQuery(
                    query
                )
            ) {

                hideSuggestions();

                return;

            }


            /*
               Jika ada query teks cukup panjang,
               ambil rekomendasi.
            */

            if (
                query.length >= 3
            ) {

                getSuggestions(
                    query
                );

            }

        }
    );

}


/* =====================================
   KLIK DI LUAR REKOMENDASI
===================================== */

document.addEventListener(
    "click",
    function (
        event
    ) {

        if (
            suggestionsContainer &&
            !suggestionsContainer.contains(
                event.target
            ) &&
            event.target !==
            shoeInput
        ) {

            hideSuggestions();

        }

    }
);


/* =====================================
   DEBUG AWAL
===================================== */

console.log(
    "ShoeInfo frontend berhasil dimuat."
);


console.log(
    {
        shoeInput:
            !!shoeInput,

        searchButton:
            !!searchButton,

        resultSection:
            !!resultSection,

        productName:
            !!productName,

        advantages:
            !!advantages,

        materials:
            !!materials,

        functions:
            !!functions,

        technologies:
            !!technologies,

        technologiesCard:
            !!technologiesCard,

        productLabels:
            !!productLabels,

        shoeTypeLabel:
            !!shoeTypeLabel,

        categoryLabel:
            !!categoryLabel
    }
);