// Runs in <head> before paint so the chosen theme never flashes.
(function () {
    try {
        var saved = localStorage.getItem('pp-theme');
        if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);
    } catch (e) { /* storage unavailable */ }
})();
