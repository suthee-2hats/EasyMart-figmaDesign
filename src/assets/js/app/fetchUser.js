const USER_API = "https://dummyapi.codesmash.in/api/users/1";

/* Sidebar user */
const userImage = document.querySelector("#filter-user-image");
const userName = document.querySelector("#filter-user-name");

/* Header login */
const headerLogin = document.querySelector("#header-login");
const headerLoginImage = document.querySelector("#header-login-image");
const headerLoginName = document.querySelector("#header-login-name");


/**
 * Fetches and displays the sidebar user.
 */
async function fetchSidebarUser() {
    try {
        const response = await fetch(USER_API);

        if (!response.ok) {
            throw new Error("Failed to fetch user");
        }

        const user = await response.json();

        const fullName = `${user.firstName} ${user.lastName}`;

        if (userImage) {
            userImage.src = user.image;
            userImage.alt = fullName;
        }

        if (userName) {
            userName.textContent = fullName;
        }

    } catch (error) {
        console.error("User fetch failed:", error);

        if (userName) {
            userName.textContent = "Guest";
        }

        if (userImage) {
            userImage.alt = "Guest";
        }
    }
}


/**
 * Fetches the user when the header Login button is clicked.
 */
async function handleHeaderLogin(event) {
    event.preventDefault();

    if (!headerLogin) {
        return;
    }

    try {
        headerLoginName.textContent = "Loading...";

        const response = await fetch(USER_API);

        if (!response.ok) {
            throw new Error("Failed to fetch user");
        }

        const user = await response.json();

        const fullName = `${user.firstName} ${user.lastName}`;

        headerLoginImage.src = user.image;
        headerLoginImage.alt = fullName;
        
        headerLoginName.textContent = fullName;
        
        // Change Login button to logged-in avatar + name style
        headerLogin.classList.add("is-logged-in");
        
        headerLogin.setAttribute(
            "aria-label",
            `Open ${fullName}'s EasyMart account`
        );

    } catch (error) {
        console.error("Login failed:", error);

        headerLoginName.textContent = "Login";

        headerLoginImage.src = "../assets/img/icons/Login.svg";
        headerLoginImage.alt = "";

        headerLogin.setAttribute(
            "aria-label",
            "Login to your EasyMart account"
        );
    }
}


/* Sidebar loads automatically */
fetchSidebarUser();


/* Header only fetches after clicking Login */
if (headerLogin) {
    headerLogin.addEventListener("click", handleHeaderLogin);
}