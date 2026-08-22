```javascript
/* =====================================
   CONFIG BACKEND API
===================================== */

const SUPABASE_FUNCTION_BASE =
    "https://kqwfxglzelhdjsxeceld.supabase.co/functions/v1";

const SEARCH_API_URL =
    `${SUPABASE_FUNCTION_BASE}/search-shoe`;

const SUGGESTIONS_API_URL =
    `${SUPABASE_FUNCTION_BASE}/search-suggestions`;

const SUPABASE_ANON_KEY =
    "sb_publishable_PQbg0iClbuSLCjurjMT_Nw_-YjIply-";


/* =====================================
   CONFIG SEARCH SUGGESTIONS
===================================== */

const MIN_SUGGESTION_LENGTH = 3;
const SUGGESTION_DELAY = 800;
const MAX_CACHE_ITEMS = 50;


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

let suggestionAbortController = null;

let currentSuggestions = [];


/* =====================================
   API HEADERS
===================================== */

const apiHeaders = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY
};


/* =====================================
   SEARCH FUNCTION
===================================== */

async function searchShoe(
    customQuery = null
) {

    const query =
        (
            customQuery ||
            shoeInput.value
        ).trim();


    /* ================================
       VALIDASI INPUT
    ================================= */

    if (!query) {

        alert(
            "Silakan masukkan nama sepatu atau SKU."
        );

        shoeInput.focus();

        return;

    }


    /* ================================
       UPDATE INPUT
    ================================= */

    shoeInput.value = query;


    /* ================================
       SEMBUNYIKAN SUGGESTIONS
    ================================= */

    hideSuggestions();


    /* ================================
       TAMPILKAN LOADING
    ================================= */

    emptyState.classList.add(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );

    loading.classList.remove(
        "hidden"
    );


    /* ================================
       NONAKTIFKAN BUTTON
    ================================= */

    searchButton.disabled = true;

    searchButton.textContent =
        "Mencari...";


    try {

        /* ================================
           REQUEST SEARCH-SHOE
        ================================= */

        const response =
            await fetch(
                SEARCH_API_URL,
                {
                    method: "POST",

                    headers:
                        apiHeaders,

                    body:
                        JSON.stringify({
                            query: query
                        })
                }
            );


        /* ================================
           PARSE RESPONSE
        ================================= */

        let data = null;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                "Response server tidak dapat dibaca."
            );

        }


        console.log(
            "Search status:",
            response.status
        );

        console.log(
            "Search response:",
            data
        );


        /* ================================
           HTTP ERROR
        ================================= */

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


        /* ================================
           PRODUK DITEMUKAN
        ================================= */

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


        /* ================================
           PRODUK TIDAK DITEMUKAN
        ================================= */

        showNotFound(
            query
        );


    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        /* ================================
           JIKA KUOTA GEMINI HABIS
        ================================= */

        if (
            isQuotaError(
                error.message
            )
        ) {

            showQuotaError(
                query
            );

            return;

        }


        /* ================================
           ERROR LAIN
        ================================= */

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
   INPUT SUGGESTIONS
===================================== */

shoeInput.addEventListener(
    "input",
    function () {

        const query =
            shoeInput.value.trim();


        /* ================================
           HAPUS TIMER LAMA
        ================================= */

        clearTimeout(
            suggestionTimer
        );


        /* ================================
           QUERY TERLALU PENDEK
        ================================= */

        if (
            query.length <
            MIN_SUGGESTION_LENGTH
        ) {

            hideSuggestions();

            return;

        }


        /* ================================
           DEBOUNCE
           Tunggu 800 ms setelah
           pengguna berhenti mengetik
        ================================= */

        suggestionTimer =
            setTimeout(
                function () {

                    getSuggestions(
                        query
                    );

                },
                SUGGESTION_DELAY
            );

    }
);


/* =====================================
   GET SUGGESTIONS
===================================== */

async function getSuggestions(
    query
) {

    const cleanQuery =
        query.trim();


    /* ================================
       VALIDASI
    ================================= */

    if (
        cleanQuery.length <
        MIN_SUGGESTION_LENGTH
    ) {

        hideSuggestions();

        return;

    }


    /* ================================
       JANGAN TAMPILKAN JIKA INPUT
       SUDAH BERUBAH
    ================================= */

    if (
        shoeInput.value.trim() !==
        cleanQuery
    ) {

        return;

    }


    /* ================================
       CEK CACHE
    ================================= */

    const cachedSuggestions =
        getCachedSuggestions(
            cleanQuery
        );


    if (
        cachedSuggestions &&
        cachedSuggestions.length > 0
    ) {

        showSuggestions(
            cachedSuggestions
        );

        return;

    }


    /* ================================
       BATALKAN REQUEST SEBELUMNYA
    ================================= */

    if (
        suggestionAbortController
    ) {

        suggestionAbortController.abort();

    }


    suggestionAbortController =
        new AbortController();


    try {

        /* ================================
           REQUEST SEARCH-SUGGESTIONS
        ================================= */

        const response =
            await fetch(
                SUGGESTIONS_API_URL,
                {
                    method: "POST",

                    headers:
                        apiHeaders,

                    body:
                        JSON.stringify({
                            query:
                                cleanQuery
                        }),

                    signal:
                        suggestionAbortController.signal
                }
            );


        let data = null;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            console.error(
                "Suggestion JSON error:",
                jsonError
            );

            hideSuggestions();

            return;

        }


        console.log(
            "Suggestions status:",
            response.status
        );

        console.log(
            "Suggestions response:",
            data
        );


        /* ================================
           INPUT SUDAH BERUBAH
        ================================= */

        if (
            shoeInput.value.trim() !==
            cleanQuery
        ) {

            return;

        }


        /* ================================
           JIKA ERROR
        ================================= */

        if (!response.ok) {

            const errorMessage =
                getErrorMessage(
                    data,
                    response.status
                );

            console.error(
                "Suggestions API error:",
                errorMessage
            );

            /*
             * Jika Gemini quota habis,
             * jangan tampilkan sebagai
             * kesalahan koneksi.
             */

            hideSuggestions();

            return;

        }


        /* ================================
           AMBIL SUGGESTIONS
        ================================= */

        const suggestionList =
            Array.isArray(
                data.suggestions
            )
                ? data.suggestions
                : [];


        /* ================================
           SIMPAN CACHE
        ================================= */

        if (
            suggestionList.length > 0
        ) {

            saveSuggestionsToCache(
                cleanQuery,
                suggestionList
            );

        }


        /* ================================
           TAMPILKAN
        ================================= */

        showSuggestions(
            suggestionList
        );


    } catch (error) {

        /* ================================
           REQUEST DIBATALKAN
        ================================= */

        if (
            error.name ===
            "AbortError"
        ) {

            return;

        }


        console.error(
            "Suggestion error:",
            error
        );


        /*
         * Jangan mengubah halaman hasil
         * menjadi error hanya karena
         * rekomendasi gagal.
         */

        hideSuggestions();

    }

}


/* =====================================
   SHOW SUGGESTIONS
===================================== */

function showSuggestions(
    suggestionList
) {

    if (
        !suggestions
    ) {

        console.error(
            "Element #suggestions tidak ditemukan."
        );

        return;

    }


    /* ================================
       BERSIHKAN
    ================================= */

    suggestions.innerHTML = "";


    /* ================================
       VALIDASI DATA
    ================================= */

    if (
        !Array.isArray(
            suggestionList
        ) ||
        suggestionList.length === 0
    ) {

        hideSuggestions();

        return;

    }


    /* ================================
       BATASI DAN HILANGKAN DUPLIKAT
    ================================= */

    const uniqueSuggestions =
        [
            ...new Set(
                suggestionList
                    .map(
                        item =>
                            String(
                                item
                            ).trim()
                    )
                    .filter(
                        item =>
                            item.length > 0
                    )
            )
        ]
        .slice(
            0,
            6
        );


    if (
        uniqueSuggestions.length === 0
    ) {

        hideSuggestions();

        return;

    }


    /* ================================
       JUDUL
    ================================= */

    const title =
        document.createElement(
            "div"
        );

    title.className =
        "suggestions-title";

    title.textContent =
        "Rekomendasi pencarian";


    suggestions.appendChild(
        title
    );


    /* ================================
       BUAT SETIAP REKOMENDASI
    ================================= */

    uniqueSuggestions.forEach(
        function (suggestion) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "suggestion-item";


            button.textContent =
                suggestion;


            /* ============================
               KLIK REKOMENDASI
            ============================ */

            button.addEventListener(
                "click",
                function () {

                    shoeInput.value =
                        suggestion;

                    hideSuggestions();

                    searchShoe(
                        suggestion
                    );

                }
            );


            suggestions.appendChild(
                button
            );

        }
    );


    /* ================================
       TAMPILKAN
    ================================= */

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

    suggestions.innerHTML = "";

    currentSuggestions = [];

}


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
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            clearTimeout(
                suggestionTimer
            );

            searchShoe();

        }


        /* ================================
           ESC UNTUK MENUTUP REKOMENDASI
        ================================= */

        if (
            event.key ===
            "Escape"
        ) {

            hideSuggestions();

        }

    }
);


/* =====================================
   KLIK DI LUAR SUGGESTIONS
===================================== */

document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".search-section"
            )
        ) {

            hideSuggestions();

        }

    }
);


/* =====================================
   SHOW RESULT
===================================== */

function showResult(
    shoe
) {

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

    container.innerHTML = "";


    if (
        !Array.isArray(
            items
        ) ||
        items.length === 0
    ) {

        addListItem(
            container,
            emptyMessage
        );

        return;

    }


    items.forEach(
        function (item) {

            addListItem(
                container,
                String(
                    item
                )
            );

        }
    );

}


/* =====================================
   NOT FOUND
===================================== */

function showNotFound(
    query
) {

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
        "Coba pilih rekomendasi nama produk yang lebih spesifik."
    );


    addListItem(
        functions,
        "Anda juga dapat mencoba kata kunci atau SKU produk."
    );


    resultSection.classList.remove(
        "hidden"
    );

}


/* =====================================
   ERROR UMUM
===================================== */

function showError(
    message
) {

    productName.textContent =
        "Terjadi kesalahan";


    advantages.innerHTML = "";

    materials.innerHTML = "";

    functions.innerHTML = "";


    addListItem(
        advantages,
        message ||
        "Terjadi kesalahan saat memproses pencarian."
    );


    addListItem(
        materials,
        "Silakan periksa koneksi internet dan coba lagi."
    );


    addListItem(
        functions,
        "Jika masalah berlanjut, coba lakukan pencarian beberapa saat lagi."
    );


    resultSection.classList.remove(
        "hidden"
    );

}


/* =====================================
   ERROR KUOTA GEMINI
===================================== */

function showQuotaError(
    query
) {

    productName.textContent =
        "Informasi sedang tidak tersedia";


    advantages.innerHTML = "";

    materials.innerHTML = "";

    functions.innerHTML = "";


    addListItem(
        advantages,
        `Informasi "${query}" belum ditemukan di database dan layanan AI sedang mencapai batas penggunaan sementara.`
    );


    addListItem(
        materials,
        "Coba gunakan nama produk yang lebih lengkap atau coba kembali beberapa saat lagi."
    );


    addListItem(
        functions,
        "Rekomendasi dari database tetap dapat digunakan apabila tersedia."
    );


    resultSection.classList.remove(
        "hidden"
    );

}


/* =====================================
   HELPER TAMBAH LIST ITEM
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
   DETEKSI ERROR QUOTA
===================================== */

function isQuotaError(
    message
) {

    const text =
        String(
            message || ""
        ).toLowerCase();


    return (
        text.includes(
            "quota"
        ) ||
        text.includes(
            "rate limit"
        ) ||
        text.includes(
            "exceeded your current quota"
        ) ||
        text.includes(
            "resource_exhausted"
        ) ||
        text.includes(
            "limit: 20"
        )
    );

}


/* =====================================
   GET ERROR MESSAGE
===================================== */

function getErrorMessage(
    data,
    status
) {

    if (
        data &&
        typeof data.error ===
        "string"
    ) {

        return data.error;

    }


    if (
        data &&
        typeof data.message ===
        "string"
    ) {

        return data.message;

    }


    if (
        status === 429
    ) {

        return (
            "Batas penggunaan layanan AI sementara telah tercapai."
        );

    }


    return (
        `Terjadi kesalahan pada server. HTTP ${status}`
    );

}


/* =====================================
   CACHE SUGGESTIONS
   Mengurangi request Gemini berulang
===================================== */

function getCachedSuggestions(
    query
) {

    try {

        const cache =
            JSON.parse(
                sessionStorage.getItem(
                    "shoeinfo_suggestions_cache"
                ) ||
                "{}"
            );


        const key =
            query
                .toLowerCase()
                .trim();


        if (
            !cache[key]
        ) {

            return null;

        }


        if (
            !Array.isArray(
                cache[key]
            )
        ) {

            return null;

        }


        return cache[key];


    } catch (error) {

        console.warn(
            "Cache suggestions error:",
            error
        );

        return null;

    }

}


/* =====================================
   SAVE SUGGESTIONS TO CACHE
===================================== */

function saveSuggestionsToCache(
    query,
    suggestionList
) {

    try {

        const cache =
            JSON.parse(
                sessionStorage.getItem(
                    "shoeinfo_suggestions_cache"
                ) ||
                "{}"
            );


        const key =
            query
                .toLowerCase()
                .trim();


        cache[key] =
            suggestionList;


        /* ================================
           BATASI CACHE
        ================================= */

        const keys =
            Object.keys(
                cache
            );


        if (
            keys.length >
            MAX_CACHE_ITEMS
        ) {

            const keysToRemove =
                keys.slice(
                    0,
                    keys.length -
                    MAX_CACHE_ITEMS
                );


            keysToRemove.forEach(
                function (oldKey) {

                    delete cache[
                        oldKey
                    ];

                }
            );

        }


        sessionStorage.setItem(
            "shoeinfo_suggestions_cache",
            JSON.stringify(
                cache
            )
        );


    } catch (error) {

        console.warn(
            "Save suggestion cache error:",
            error
        );

    }

}


/* =====================================
   INITIAL STATE
===================================== */

hideSuggestions();
```
