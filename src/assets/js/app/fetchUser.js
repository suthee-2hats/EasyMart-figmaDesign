const USER_API = "https://dummyapi.codesmash.in/api/users/1";

const userImage = document.querySelector("#filter-user-image");
const userName = document.querySelector("#filter-user-name");

async function fetchSidebarUser() {
    try {
        const response = await fetch(USER_API);

        if (!response.ok) {
            throw new Error("Failed to fetch user");
        }

        const user = await response.json();

        const fullName = `${user.firstName} ${user.lastName}`;

        userImage.src = user.image;
        userImage.alt = fullName;

        userName.textContent = fullName;

    } catch (error) {
        console.error("User fetch failed:", error);

        userName.textContent = "Guest";
        userImage.alt = "Guest";
    }
}

fetchSidebarUser();