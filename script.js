/* =========================================================
   SNEAKERS INDEX
   SCRIPT.JS - FINAL VERSION
========================================================= */


/* =========================================================
   KONFIGURASI SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co";


const SEARCH_API_URL =
    `${SUPABASE_URL}/functions/v1/search-shoe`;


const SUGGESTIONS_API_URL =
    `${SUPABASE_URL}/functions/v1/search-suggestions`;


/* =========================================================
   PUBLISHABLE KEY SUPABASE
========================================================= */

const SUPABASE_KEY =
    "sb_publishable_PQbg0iClbuSLCjurjMT_Nw_-YjIply-";


/* =========================================================
   ELEMENT UTAMA
========================================================= */

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


/* =========================================================
   LABEL PRODUK
========================================================= */

const productLabels =
    document.getElementById("productLabels");


const shoeTypeLabel =
    document.getElementById("shoeTypeLabel");


const categoryLabel =
    document.getElementById("categoryLabel");


/* =========================================================
   INFORMASI PRODUK
========================================================= */

const advantages =
    document.getElementById("advantages");


const materials =
    document.getElementById("materials");


const functions =
    document.getElementById("functions");


const technologies =
    document.getElementById("technologies");


const technologiesCard =
    document.getElementById("technologiesAccordion");


/* =========================================================
   ACCORDION CARD
========================================================= */

const advantagesCard =
    document.getElementById("advantagesCard");


const materialsCard =
    document.getElementById("materialsCard");


const functionsCard =
    document.getElementById("functionsCard");


/* =========================================================
   SIDEBAR
========================================================= */

const infoSidebar =
    document.querySelector(".information-sidebar");


/* =========================================================
   MENU TEKNOLOGI
========================================================= */

const technologyNavButton =
    document.getElementById(
        "technologyNav"
    );


/* =========================================================
   BUAT CONTAINER REKOMENDASI
========================================================= */

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
        document.querySelector(
            ".search-section"
        );


    if (searchSection) {

        const searchHint =
            document.querySelector(
                ".search-hint"
            );


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


/* =========================================================
   STATUS REKOMENDASI
========================================================= */

let suggestionTimer =
    null;


let suggestionAbortController =
    null;


let currentSuggestions =
    [];


/* =========================================================
   STATUS BARCODE SCANNER
========================================================= */

let scannerBuffer =
    "";


let scannerStartTime =
    0;


let scannerTimer =
    null;


let scannerSearchTimer =
    null;


const SCANNER_TIME_LIMIT =
    250;


const SCANNER_FINISH_DELAY =
    150;


/* =========================================================
   HELPER RESPONSE JSON
========================================================= */

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


/* =========================================================
   REQUEST HEADER
========================================================= */

function getHeaders() {

    return {

        "Content-Type":
            "application/json",

        "apikey":
            SUPABASE_KEY

    };

}


/* =========================================================
   CEK BARCODE / EAN
========================================================= */

function isBarcodeQuery(query) {

    const value =
        String(query || "").trim();


    return (
        /^\d{8}$/.test(value) ||
        /^\d{13}$/.test(value) ||
        /^\d{9,14}$/.test(value)
    );

}


/* =========================================================
   BERSIHKAN ARRAY
========================================================= */

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


/* =========================================================
   HAPUS DUPLIKAT
========================================================= */

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


/* =========================================================
   DETEKSI BARCODE SCANNER
========================================================= */

function handleScannerInput(event) {

    if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
    ) {

        return;

    }


    if (
        event.key === "Enter"
    ) {

        return;

    }


    if (
        event.key.length !== 1
    ) {

        return;

    }


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


    if (
        scannerBuffer.length === 0
    ) {

        scannerStartTime =
            performance.now();

    }


    scannerBuffer +=
        event.key;


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


    const elapsed =
        performance.now() -
        scannerStartTime;


    if (
        scannerBuffer.length >= 8 &&
        elapsed <= SCANNER_TIME_LIMIT
    ) {

        scannerSearchTimer =
            setTimeout(
                function () {

                    const barcode =
                        shoeInput
                            ? shoeInput.value.trim()
                            : "";


                    if (
                        isBarcodeQuery(
                            barcode
                        )
                    ) {

                        clearTimeout(
                            suggestionTimer
                        );


                        hideSuggestions();


                        searchShoe(
                            barcode
                        );

                    }


                    scannerBuffer =
                        "";


                    scannerStartTime =
                        0;

                },
                SCANNER_FINISH_DELAY
            );

    }

}


if (shoeInput) {

    shoeInput.addEventListener(
        "keydown",
        handleScannerInput
    );

}


/* =========================================================
   SEARCH SEPATU
========================================================= */

async function searchShoe(
    customQuery = null
) {

    if (!shoeInput) {

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


    if (!query) {

        alert(
            "Silakan masukkan nama sepatu, SKU, atau barcode."
        );


        shoeInput.focus();


        return;

    }


    shoeInput.value =
        query;


    clearTimeout(
        suggestionTimer
    );


    hideSuggestions();


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


    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (searchButton) {

        searchButton.disabled =
            true;


        searchButton.textContent =
            "Mencari...";

    }


    try {

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


        if (!response.ok) {

            throw new Error(
                getErrorMessage(
                    data,
                    response.status
                )
            );

        }


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

        if (loading) {

            loading.classList.add(
                "hidden"
            );

        }


        if (searchButton) {

            searchButton.disabled =
                false;


            searchButton.textContent =
                "Cari Informasi";

        }


        if (shoeInput) {

            shoeInput.focus();

        }

    }

}


/* =========================================================
   PESAN ERROR
========================================================= */

function getErrorMessage(
    data,
    status
) {

    const rawMessage =
        data?.error ||
        data?.message ||
        "";


    if (
        status === 429 ||
        /quota|rate limit|too many requests|resource exhausted/i.test(
            rawMessage
        )
    ) {

        return (
            "Batas penggunaan layanan sedang tercapai. " +
            "Silakan tunggu beberapa saat lalu coba lagi."
        );

    }


    if (
        /api key|unauthorized|forbidden/i.test(
            rawMessage
        )
    ) {

        return (
            "Konfigurasi API backend bermasalah."
        );

    }


    if (
        status >= 500
    ) {

        return (
            rawMessage ||
            "Terjadi kesalahan pada server."
        );

    }


    return (
        rawMessage ||
        `Terjadi kesalahan. HTTP ${status}`
    );

}


/* =========================================================
   TAMPILKAN HASIL PRODUK
========================================================= */

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
       COLORWAY
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
       TIPE DAN KATEGORI
    ===================================== */

    const shoeType =
        shoe.shoe_type
            ? String(
                shoe.shoe_type
            ).trim()
            : "";


    const category =
        shoe.category
            ? String(
                shoe.category
            ).trim()
            : "";


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
       MATERIAL
    ===================================== */

    renderList(
        materials,
        shoe.materials,
        "Informasi material belum tersedia."
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


            /*
               Tampilkan menu sidebar
               Teknologi.
            */

            if (
                technologyNavButton
            ) {

                technologyNavButton.classList.remove(
                    "hidden"
                );

            }

        } else {

            technologies.innerHTML =
                "";


            technologiesCard.classList.add(
                "hidden"
            );


            /*
               Sembunyikan menu sidebar
               Teknologi.
            */

            if (
                technologyNavButton
            ) {

                technologyNavButton.classList.add(
                    "hidden"
                );

                technologyNavButton.classList.remove(
                    "active"
                );

            }

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


    /* =====================================
       RESET ACCORDION
    ===================================== */

    resetAccordion();

}


/* =========================================================
   TAMPILKAN LABEL PRODUK
========================================================= */

function showProductLabels(
    shoeType,
    category
) {

    if (
        !productLabels ||
        !shoeTypeLabel ||
        !categoryLabel
    ) {

        return;

    }


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


    if (shoeType) {

        shoeTypeLabel.textContent =
            shoeType;


        shoeTypeLabel.classList.remove(
            "hidden"
        );

    }


    if (category) {

        categoryLabel.textContent =
            category;


        categoryLabel.classList.remove(
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


/* =========================================================
   RENDER LIST
========================================================= */

function renderList(
    container,
    items,
    emptyMessage = ""
) {

    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    const cleanItems =
        uniqueArray(
            items
        );


    if (
        cleanItems.length === 0
    ) {

        if (emptyMessage) {

            addListItem(
                container,
                emptyMessage
            );

        }


        return;

    }


    cleanItems.forEach(
        item => {

            addListItem(
                container,
                item
            );

        }
    );

}


/* =========================================================
   TAMBAH LIST ITEM
========================================================= */

function addListItem(
    container,
    text
) {

    if (!container) {

        return;

    }


    const cleanText =
        String(
            text || ""
        ).trim();


    if (!cleanText) {

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


/* =========================================================
   SEMBUNYIKAN INFORMASI TAMBAHAN
========================================================= */

function hideAdditionalProductInfo() {

    if (productColorway) {

        productColorway.textContent =
            "";


        productColorway.classList.add(
            "hidden"
        );

    }


    if (productLabels) {

        productLabels.classList.add(
            "hidden"
        );

    }


    if (shoeTypeLabel) {

        shoeTypeLabel.textContent =
            "";


        shoeTypeLabel.classList.add(
            "hidden"
        );

    }


    if (categoryLabel) {

        categoryLabel.textContent =
            "";


        categoryLabel.classList.add(
            "hidden"
        );

    }


    if (technologies) {

        technologies.innerHTML =
            "";

    }


    if (technologiesCard) {

        technologiesCard.classList.add(
            "hidden"
        );

    }


    if (technologyNavButton) {

        technologyNavButton.classList.add(
            "hidden"
        );


        technologyNavButton.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   PRODUK TIDAK DITEMUKAN
========================================================= */

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
        "Anda juga dapat mencoba SKU, artikel produk, atau barcode."
    );


    if (resultSection) {

        resultSection.classList.remove(
            "hidden"
        );

    }


    resetAccordion();

}


/* =========================================================
   TAMPILKAN ERROR
========================================================= */

function showError(message) {

    hideAdditionalProductInfo();


    if (productName) {

        productName.textContent =
            "Terjadi kesalahan koneksi";

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


    if (resultSection) {

        resultSection.classList.remove(
            "hidden"
        );

    }


    resetAccordion();

}


/* =========================================================
   AMBIL REKOMENDASI
========================================================= */

async function getSuggestions(query) {

    if (!shoeInput) {

        return;

    }


    const cleanQuery =
        String(
            query || ""
        ).trim();


    if (
        isBarcodeQuery(
            cleanQuery
        )
    ) {

        hideSuggestions();

        return;

    }


    if (
        cleanQuery.length < 3
    ) {

        hideSuggestions();

        return;

    }


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


        if (
            shoeInput.value.trim() !==
            cleanQuery
        ) {

            return;

        }


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


/* =========================================================
   TAMPILKAN REKOMENDASI
========================================================= */

function showSuggestions(items) {

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

                    if (shoeInput) {

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


/* =========================================================
   SEMBUNYIKAN REKOMENDASI
========================================================= */

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


/* =========================================================
   INPUT + DEBOUNCE
========================================================= */

if (shoeInput) {

    shoeInput.addEventListener(
        "input",
        function () {

            clearTimeout(
                suggestionTimer
            );


            const query =
                shoeInput.value.trim();


            if (
                isBarcodeQuery(
                    query
                )
            ) {

                hideSuggestions();

                return;

            }


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

}


/* =========================================================
   TOMBOL CARI
========================================================= */

if (searchButton) {

    searchButton.addEventListener(
        "click",
        function () {

            searchShoe();

        }
    );

}


/* =========================================================
   ENTER UNTUK SEARCH
========================================================= */

if (shoeInput) {

    shoeInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key !== "Enter"
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


            if (!query) {

                return;

            }


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


/* =========================================================
   ESC TUTUP REKOMENDASI
========================================================= */

if (shoeInput) {

    shoeInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape"
            ) {

                hideSuggestions();

            }

        }
    );

}


/* =========================================================
   FOCUS INPUT
========================================================= */

if (shoeInput) {

    shoeInput.addEventListener(
        "focus",
        function() {

            const query =
                shoeInput.value.trim();


            if (
                isBarcodeQuery(
                    query
                )
            ) {

                hideSuggestions();

                return;

            }


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


/* =========================================================
   KLIK DI LUAR REKOMENDASI
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        if (
            suggestionsContainer &&
            !suggestionsContainer.contains(
                event.target
            ) &&
            event.target !== shoeInput
        ) {

            hideSuggestions();

        }

    }
);


/* =========================================================
   ACCORDION
========================================================= */

function getAccordionItems() {

    return document.querySelectorAll(
        ".accordion-item"
    );

}


function getInfoNavButtons() {

    return document.querySelectorAll(
        ".info-nav"
    );

}


/* =========================================================
   BUKA ACCORDION
========================================================= */

function openAccordion(targetId) {

    const target =
        document.getElementById(
            targetId
        );


    if (!target) {

        return;

    }


    const accordionItems =
        getAccordionItems();


    accordionItems.forEach(
        item => {

            if (
                item.classList.contains(
                    "hidden"
                )
            ) {

                return;

            }


            item.classList.remove(
                "open"
            );


            const trigger =
                item.querySelector(
                    ".accordion-trigger"
                );


            if (trigger) {

                trigger.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    target.classList.add(
        "open"
    );


    const targetTrigger =
        target.querySelector(
            ".accordion-trigger"
        );


    if (targetTrigger) {

        targetTrigger.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    const infoNavButtons =
        getInfoNavButtons();


    infoNavButtons.forEach(
        button => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.target ===
                targetId
            ) {

                if (
                    !button.classList.contains(
                        "hidden"
                    )
                ) {

                    button.classList.add(
                        "active"
                    );

                }

            }

        }
    );

}


/* =========================================================
   RESET ACCORDION
========================================================= */

function resetAccordion() {

    const accordionItems =
        getAccordionItems();


    const infoNavButtons =
        getInfoNavButtons();


    accordionItems.forEach(
        item => {

            item.classList.remove(
                "open"
            );


            const trigger =
                item.querySelector(
                    ".accordion-trigger"
                );


            if (trigger) {

                trigger.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    infoNavButtons.forEach(
        button => {

            button.classList.remove(
                "active"
            );

        }
    );


    /*
       Urutan default:
       1. Keunggulan
       2. Material
       3. Fungsi
       4. Teknologi

       Keunggulan dibuka otomatis
       jika tersedia.
    */

    const firstAvailableAccordion =
        Array.from(
            accordionItems
        ).find(
            item =>
                !item.classList.contains(
                    "hidden"
                )
        );


    if (
        firstAvailableAccordion
    ) {

        openAccordion(
            firstAvailableAccordion.id
        );

    }

}


/* =========================================================
   EVENT KLIK ACCORDION
========================================================= */

function initializeAccordionEvents() {

    const accordionItems =
        getAccordionItems();


    accordionItems.forEach(
        item => {

            const trigger =
                item.querySelector(
                    ".accordion-trigger"
                );


            if (!trigger) {

                return;

            }


            /*
               Hindari event listener
               dipasang dua kali.
            */

            if (
                trigger.dataset.initialized ===
                "true"
            ) {

                return;

            }


            trigger.dataset.initialized =
                "true";


            trigger.addEventListener(
                "click",
                function() {

                    const isOpen =
                        item.classList.contains(
                            "open"
                        );


                    const itemId =
                        item.id;


                    if (isOpen) {

                        item.classList.remove(
                            "open"
                        );


                        trigger.setAttribute(
                            "aria-expanded",
                            "false"
                        );


                        getInfoNavButtons().forEach(
                            button => {

                                if (
                                    button.dataset.target ===
                                    itemId
                                ) {

                                    button.classList.remove(
                                        "active"
                                    );

                                }

                            }
                        );


                        return;

                    }


                    openAccordion(
                        itemId
                    );

                }
            );

        }
    );

}


/* =========================================================
   EVENT MENU SIDEBAR
========================================================= */

function initializeSidebarEvents() {

    const infoNavButtons =
        getInfoNavButtons();


    infoNavButtons.forEach(
        button => {

            if (
                button.dataset.initialized ===
                "true"
            ) {

                return;

            }


            button.dataset.initialized =
                "true";


            button.addEventListener(
                "click",
                function() {

                    const targetId =
                        button.dataset.target;


                    if (!targetId) {

                        return;

                    }


                    const target =
                        document.getElementById(
                            targetId
                        );


                    /*
                       Jangan buka menu
                       jika card tersembunyi.
                    */

                    if (
                        !target ||
                        target.classList.contains(
                            "hidden"
                        )
                    ) {

                        return;

                    }


                    openAccordion(
                        targetId
                    );


                    /*
                       Scroll halus
                       pada mobile.
                    */

                    if (
                        window.innerWidth <= 768
                    ) {

                        target.scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "start"
                        });

                    }

                }
            );

        }
    );

}


/* =========================================================
   INISIALISASI ACCORDION
========================================================= */

initializeAccordionEvents();


initializeSidebarEvents();


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "SNEAKERS INDEX frontend berhasil dimuat."
);


console.log(
    {
        shoeInput:
            !!shoeInput,

        searchButton:
            !!searchButton,

        resultSection:
            !!resultSection,

        advantagesCard:
            !!advantagesCard,

        materialsCard:
            !!materialsCard,

        functionsCard:
            !!functionsCard,

        technologiesCard:
            !!technologiesCard,

        technologyNavButton:
            !!technologyNavButton,

        advantages:
            !!advantages,

        materials:
            !!materials,

        functions:
            !!functions,

        technologies:
            !!technologies
    }
);