/* =====================================
   KONFIGURASI LOGIN LOKAL (ADMIN)
===================================== */

// Tentukan username dan password admin pilihanmu di sini:
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";


/* =====================================
   LOGIN
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

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


        /* =============================
           CEK SEMUA ELEMENT
        ============================== */

        if (
            !loginForm ||
            !usernameInput ||
            !passwordInput ||
            !loginButton ||
            !loginMessage
        ) {

            console.error(
                "Element login tidak ditemukan."
            );

            return;

        }


        /* =============================
           TAMPILKAN PESAN
        ============================== */

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


        /* =============================
           SEMBUNYIKAN PESAN
        ============================== */

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


        /* =============================
           SUBMIT LOGIN
        ============================== */

        loginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const username =
                    usernameInput.value.trim();

                const password =
                    passwordInput.value;


                /* VALIDASI */

                if (!username) {

                    showMessage(
                        "Username wajib diisi."
                    );

                    usernameInput.focus();

                    return;

                }


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


                // Simulasi pengecekan login secara lokal
                setTimeout(function () {

                    if (
                        username === ADMIN_USER &&
                        password === ADMIN_PASS
                    ) {

                        /* SIMPAN TOKEN LOKAL */

                        localStorage.setItem(
                            "shoeinfo_admin_token",
                            "local_admin_token_secure"
                        );

                        localStorage.setItem(
                            "shoeinfo_admin_username",
                            username
                        );

                        showMessage(
                            "Login berhasil. Mengalihkan...",
                            "success"
                        );

                        setTimeout(
                            function () {

                                window.location.href =
                                    "admin.html";

                            },
                            700
                        );

                    } else {

                        loginButton.disabled =
                            false;

                        loginButton.textContent =
                            "Masuk ke Dashboard";

                        showMessage(
                            "Username atau password salah."
                        );

                    }

                }, 500);

            }
        );


        usernameInput.focus();

    }
);