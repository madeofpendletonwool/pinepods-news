(function () {
    var root = document.documentElement;

    // Theme toggle
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            var current = root.getAttribute('data-theme') ||
                (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
            var next = current === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('pp-theme', next); } catch (e) { /* ignore */ }
        });
    }

    // Copy feed URL
    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    }

    document.querySelectorAll('[data-copy]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var text = btn.getAttribute('data-copy');
            var done = function () {
                btn.classList.add('copied');
                setTimeout(function () { btn.classList.remove('copied'); }, 1800);
            };
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
            } else {
                fallbackCopy(text);
                done();
            }
        });
    });

    // Release filter
    var input = document.getElementById('release-filter');
    if (input) {
        var rows = Array.prototype.slice.call(document.querySelectorAll('.release'));
        var years = Array.prototype.slice.call(document.querySelectorAll('[data-year]'));
        var empty = document.getElementById('filter-empty');
        input.addEventListener('input', function () {
            var terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
            var shown = 0;
            rows.forEach(function (row) {
                var hay = row.getAttribute('data-search');
                var match = terms.every(function (t) { return hay.indexOf(t) !== -1; });
                row.hidden = !match;
                if (match) shown++;
            });
            years.forEach(function (year) {
                year.hidden = !year.querySelector('.release:not([hidden])');
            });
            if (empty) empty.hidden = shown !== 0;
        });
    }
})();
