/* =====================================
   CONFIG BACKEND LOGIN
===================================== */

const LOGIN_API_URL =
    "https://kqwfxglzelhdjsxeceld.supabase.co/functions/v1/admin-login";

const SUPABASE_KEY =
    "sb_publishable_PQbg0iClbuSLCjurjMT_Nw_-YjIply-";


/* =====================================
   ELEMENT
===================================== */

const loginForm =
    document.getElementById("loginForm");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");


/* =====================================
   CEK ELEMENT
===================================== */

if (
    !loginForm ||
    !usernameInput ||
    !passwordInput ||
    !loginButton ||
    !loginMessage
) {
    console.error(
        "Element login tidak ditemukan. Periksa login.html."
    );
}


/* =====================================
   TAMPILKAN PESAN
===================================== */

function showMessage(
    text,
    type = "error"
) {
    loginMessage.textContent =
        text;

    loginMessage.classList.remove(
        "hidden",
        "success"
    );

    if (type === "success") {
        loginMessage.classList.add(
            "success"
        );
    }
}


/* =====================================
   SEMBUNYIKAN PESAN
===================================== */

function hideMessage() {
    loginMessage.textContent =
        "";

    loginMessage.classList.add(
        "hidden"
    );

    loginMessage.classList.remove(
        "success"
    );
}


/* =====================================
   LOGIN KE BACKEND
===================================== */

async function loginAdmin(
    username,
    password
) {
    const response =
        await fetch(
            LOGIN_API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "apikey":
                        SUPABASE_KEY
                },

                body:
                    JSON.stringify({
                        username:
                            username,

                        password:
                            password
                    })
            }
        );


    let data = {};


    try {
        data =
            await response.json();

    } catch (error) {
        throw new Error(
            "Backend mengembalikan respons yang tidak valid."
        );
    }


    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `Login gagal. HTTP ${response.status}`
        );
    }


    if (
        data.success !== true
    ) {
        throw new Error(
            data.error ||
            "Username atau password salah."
        );
    }


    return data;
}


/* =====================================
   SUBMIT FORM LOGIN
===================================== */

loginForm.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();


        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        /* VALIDASI USERNAME */

        if (!username) {
            showMessage(
                "Username wajib diisi."
            );

            usernameInput.focus();

            return;
        }


        /* VALIDASI PASSWORD */

        if (!password) {
            showMessage(
                "Password wajib diisi."
            );

            passwordInput.focus();

            return;
        }


        /* MULAI LOGIN */

        hideMessage();


        loginButton.disabled =
            true;

        loginButton.textContent =
            "Memeriksa...";


        try {
            const result =
                await loginAdmin(
                    username,
                    password
                );


            /* PASTIKAN TOKEN ADA */

            if (!result.token) {
                throw new Error(
                    "Token login tidak diterima dari server."
                );
            }


            /* SIMPAN TOKEN LOGIN */

            localStorage.setItem(
                "shoeinfo_admin_token",
                result.token
            );


            /* SIMPAN USERNAME */

            localStorage.setItem(
                "shoeinfo_admin_username",
                result.username || username
            );


            /* PESAN BERHASIL */

            showMessage(
                "Login berhasil. Mengalihkan ke dashboard...",
                "success"
            );


            /* PINDAH KE ADMIN.HTML */

            setTimeout(
                function () {
                    window.location.href =
                        "admin.html";
                },
                700
            );


        } catch (error) {
            console.error(
                "Login error:",
                error
            );


            showMessage(
                error.message ||
                "Terjadi kesalahan saat login."
            );


            passwordInput.value =
                "";

            passwordInput.focus();


        } finally {
            loginButton.disabled =
                false;

            loginButton.textContent =
                "Masuk ke Dashboard";
        }

    }
);


/* =====================================
   FOCUS USERNAME
===================================== */

window.addEventListener(
    "DOMContentLoaded",
    function () {
        usernameInput.focus();
    }
);