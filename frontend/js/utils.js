// File: frontend/js/utils.js
function showLoader() {
    const loader = document.createElement("div");
    loader.id = "loader";
    loader.innerText = "Loading...";
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) loader.remove();
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}