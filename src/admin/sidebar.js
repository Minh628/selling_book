document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".admin_sidebar");
    const adminContainer = document.querySelector(".admin_container"); // Renamed to avoid confusion with 'container' in previous logic

    if (!btn || !sidebar || !adminContainer) {
        console.warn(
            "Sidebar elements not found. Toggle functionality may be impaired."
        );
        return;
    } 
    // Toggle sidebar on button click
    btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent this click from immediately closing the sidebar
        sidebar.classList.toggle("open");
        adminContainer.classList.toggle("overlay");
    });

    // Close sidebar when clicking outside of it or the toggle button
    document.addEventListener("click", (e) => {
        // If sidebar is open AND the click is not inside the sidebar AND the click is not on the toggle button
        if (
            sidebar.classList.contains("open") &&
            !sidebar.contains(e.target) &&
            !btn.contains(e.target)
        ) {
            sidebar.classList.remove("open");
            adminContainer.classList.remove("overlay");
        }
    });
});