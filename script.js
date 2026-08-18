/* =====================================
   DATA DEMO
   ===================================== */

const shoeDatabase = {

    "nike air max 270": {
        name: "Nike Air Max 270",

        advantages: [
            "Menggunakan Air unit besar untuk memberikan cushioning yang nyaman.",
            "Desain modern dan cocok digunakan untuk aktivitas sehari-hari.",
            "Upper dirancang agar memberikan kenyamanan dan sirkulasi udara yang baik."
        ],

        materials: [
            "Mesh pada bagian upper.",
            "Foam pada bagian midsole.",
            "Rubber pada bagian outsole."
        ],

        functions: [
            "Cocok untuk penggunaan sehari-hari.",
            "Nyaman digunakan untuk berjalan dan aktivitas ringan.",
            "Lebih ditujukan untuk lifestyle dibanding olahraga performa tinggi."
        ]
    },


    "ah8050-100": {
        name: "Nike Air Max 270 - AH8050-100",

        advantages: [
            "Menggunakan Air Max 270 cushioning.",
            "Memberikan kenyamanan untuk penggunaan harian.",
            "Memiliki desain lifestyle yang modern."
        ],

        materials: [
            "Mesh dan material sintetis pada upper.",
            "Foam pada midsole.",
            "Rubber pada outsole."
        ],

        functions: [
            "Untuk penggunaan sehari-hari.",
            "Cocok untuk berjalan dan aktivitas ringan.",
            "Cocok sebagai sepatu lifestyle."
        ]
    },


    "adidas ultraboost": {
        name: "adidas Ultraboost",

        advantages: [
            "Cushioning dirancang untuk memberikan respons yang nyaman.",
            "Desain upper memberikan dukungan pada kaki.",
            "Cocok digunakan untuk aktivitas yang membutuhkan kenyamanan."
        ],

        materials: [
            "Textile atau knit pada bagian upper.",
            "Foam cushioning pada bagian midsole.",
            "Rubber pada bagian outsole."
        ],

        functions: [
            "Cocok untuk running dan aktivitas sehari-hari tergantung variannya.",
            "Dapat digunakan untuk berjalan.",
            "Dirancang untuk memberikan kenyamanan pada kaki."
        ]
    }

};


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

function searchShoe() {

    const query = shoeInput.value.trim().toLowerCase();


    // Jika input kosong
    if (query === "") {

        alert("Silakan masukkan nama sepatu atau SKU.");

        shoeInput.focus();

        return;
    }


    // Tampilkan loading
    emptyState.classList.add("hidden");

    resultSection.classList.add("hidden");

    loading.classList.remove("hidden");


    // Simulasi proses pencarian
    setTimeout(() => {

        const shoe = findShoe(query);


        loading.classList.add("hidden");


        if (!shoe) {

            showNotFound(query);

            return;
        }


        showResult(shoe);

    }, 700);

}


/* =====================================
   FIND SHOE
   ===================================== */

function findShoe(query) {

    // Pencarian berdasarkan nama/SKU
    for (const key in shoeDatabase) {

        if (
            query.includes(key) ||
            key.includes(query)
        ) {

            return shoeDatabase[key];

        }

    }


    return null;

}


/* =====================================
   SHOW RESULT
   ===================================== */

function showResult(shoe) {

    productName.textContent = shoe.name;


    // Bersihkan hasil sebelumnya
    advantages.innerHTML = "";

    materials.innerHTML = "";

    functions.innerHTML = "";


    // Keunggulan
    shoe.advantages.forEach(item => {

        const li = document.createElement("li");

        li.textContent = item;

        advantages.appendChild(li);

    });


    // Bahan
    shoe.materials.forEach(item => {

        const li = document.createElement("li");

        li.textContent = item;

        materials.appendChild(li);

    });


    // Fungsi
    shoe.functions.forEach(item => {

        const li = document.createElement("li");

        li.textContent = item;

        functions.appendChild(li);

    });


    resultSection.classList.remove("hidden");

}


/* =====================================
   NOT FOUND
   ===================================== */

function showNotFound(query) {

    productName.textContent = "Informasi tidak ditemukan";


    advantages.innerHTML = `
        <li>
            Belum ada data untuk "${query}" pada versi demo.
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
   BUTTON EVENT
   ===================================== */

searchButton.addEventListener("click", searchShoe);


/* =====================================
   ENTER KEY
   ===================================== */

shoeInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {

        searchShoe();

    }

});