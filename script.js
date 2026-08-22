/* =====================================
   CONFIG BACKEND API
===================================== */

const API_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co/functions/v1/search-shoe";

const SUGGESTIONS_API_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co/functions/v1/search-suggestions";

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

const suggestions =
    document.getElementById("suggestions");


/* =====================================
   STATE
===================================== */

let suggestionTimer = null;

let lastSuggestionQuery = "";

let isSelectingSuggestion = false;


/* =====================================
   SEARCH FUNCTION
===================================== */

async function searchShoe() {

    const query =
        shoeInput.value.trim();


    if (!query) {

        alert(
            "Silakan masukkan nama sepatu atau SKU."
        );

        shoeInput.focus();

        return;

    }


    // Sembunyikan rekomendasi saat pencarian
    hideSuggestions();


    // Tampilkan loading
    emptyState.classList.add(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );

    loading.classList.remove(
        "hidden"
    );


    // Nonaktifkan tombol
    searchButton.disabled = true;


    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "apikey":
                            SUPABASE_ANON_KEY,
                    },

                    body: JSON.stringify({
                        query: query,
                    }),
                }
            );


        const data =
            await response.json();


        console.log(
            "Search response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                `HTTP Error ${response.status}`
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
            query
        );


    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        showError(
            error.message ||
            "Terjadi kesalahan koneksi."
        );

    } finally {

        loading.classList.add(
            "hidden"
        );

        searchButton.disabled =
            false;

    }

}


/* =====================================
   GET AI SUGGESTIONS
===================================== */

async function getSuggestions(query) {

    const cleanQuery =
        query.trim();


    if (
        cleanQuery.length < 2
    ) {

        hideSuggestions();

        return;

    }


    // Hindari request yang sama
    if (
        cleanQuery.toLowerCase() ===
        lastSuggestionQuery.toLowerCase()
    ) {
        return;
    }


    lastSuggestionQuery =
        cleanQuery;


    try {

        const response =
            await fetch(
                SUGGESTIONS_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "apikey":
                            SUPABASE_ANON_KEY,
                    },

                    body: JSON.stringify({
                        query:
                            cleanQuery,
                    }),
                }
            );


        const data =
            await response.json();


        console.log(
            "Suggestions response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.error ||
                `HTTP Error ${response.status}`
            );

        }


        // Pastikan input belum berubah
        // selama request berjalan
        if (
            shoeInput.value.trim()
            !== cleanQuery
        ) {
            return;
        }


        if (
            data.success === true &&
            Array.isArray(
                data.suggestions
            ) &&
            data.suggestions.length > 0
        ) {

            showSuggestions(
                data.suggestions
            );

        } else {

            hideSuggestions();

        }


    } catch (error) {

        console.error(
            "Suggestions error:",
            error
        );

        // Jangan tampilkan error ke pengguna
        // karena fitur utama pencarian
        // tetap bisa digunakan
        hideSuggestions();

    }

}


/* =====================================
   SHOW SUGGESTIONS
===================================== */

function showSuggestions(items) {

    if (!suggestions) {
        return;
    }


    suggestions.innerHTML =
        "";


    const title =
        document.createElement("div");

    title.className =
        "suggestion-title";

    title.textContent =
        "Rekomendasi pencarian";

    suggestions.appendChild(
        title
    );


    items.forEach(
        (item) => {

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

                    isSelectingSuggestion =
                        true;


                    shoeInput.value =
                        item;


                    hideSuggestions();


                    // Reset agar input baru
                    // dapat meminta rekomendasi
                    lastSuggestionQuery =
                        "";


                    // Langsung cari
                    searchShoe();


                    setTimeout(
                        () => {

                            isSelectingSuggestion =
                                false;

                        },
                        100
                    );

                }
            );


            suggestions.appendChild(
                button
            );

        }
    );


    suggestions.classList.remove(
        "hidden"
    );

}


/* =====================================
   HIDE SUGGESTIONS
===================================== */

function hideSuggestions() {

    if (!suggestions) {
        return;
    }


    suggestions.classList.add(
        "hidden"
    );

    suggestions.innerHTML =
        "";

}


/* =====================================
   SHOW RESULT
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


    items.forEach(
        (item) => {

            addListItem(
                container,
                String(item)
            );

        }
    );

}


/* =====================================
   NOT FOUND
===================================== */

function showNotFound(query) {

    productName.textContent =
        "Informasi tidak ditemukan";


    renderList(
        advantages,
        [
            `Data untuk "${query}" belum tersedia.`,
        ],
        ""
    );


    renderList(
        materials,
        [
            "Informasi bahan belum tersedia.",
        ],
        ""
    );


    renderList(
        functions,
        [
            "Coba gunakan nama produk yang lebih spesifik.",
        ],
        ""
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


    renderList(
        advantages,
        [
            message ||
            "Frontend belum dapat terhubung ke backend.",
        ],
        ""
    );


    renderList(
        materials,
        [
            "Silakan periksa koneksi dan konfigurasi backend.",
        ],
        ""
    );


    renderList(
        functions,
        [
            "Coba lakukan pencarian kembali.",
        ],
        ""
    );


    resultSection.classList.remove(
        "hidden"
    );

}


/* =====================================
   HELPER
===================================== */

function addListItem(
    container,
    text
) {

    const li =
        document.createElement(
            "li"
        );

    li.textContent =
        text;

    container.appendChild(
        li
    );

}


/* =====================================
   INPUT EVENT
   DEBOUNCE 500ms
===================================== */

shoeInput.addEventListener(
    "input",
    function () {

        if (
            isSelectingSuggestion
        ) {
            return;
        }


        clearTimeout(
            suggestionTimer
        );


        const query =
            shoeInput.value.trim();


        if (
            query.length < 2
        ) {

            lastSuggestionQuery =
                "";

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
   SEARCH BUTTON
===================================== */

searchButton.addEventListener(
    "click",
    function () {

        searchShoe();

    }
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


/* =====================================
   HIDE SUGGESTIONS
   SAAT KLIK DI LUAR
===================================== */

document.addEventListener(
    "click",
    function (event) {

        const target =
            event.target;


        if (
            !target.closest(
                ".search-section"
            )
        ) {

            hideSuggestions();

        }

    }
);