// =============================================
// 🔒 Anti-DevTools & Source Protection
// =============================================

(function () {
    'use strict';

    // Detect if user is on a mobile/touch device
    var _isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                    ('ontouchstart' in window);

    // 1. Disable right-click context menu
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    // 2. Disable keyboard shortcuts — desktop only
    if (!_isMobile) {
        document.addEventListener('keydown', function (e) {
            // F12
            if (e.keyCode === 123) { e.preventDefault(); return false; }
            // Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { e.preventDefault(); return false; }
            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { e.preventDefault(); return false; }
            // Ctrl+Shift+C (Inspector)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 67) { e.preventDefault(); return false; }
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
            // Ctrl+S (Save Page)
            if (e.ctrlKey && e.keyCode === 83) { e.preventDefault(); return false; }
        });

        // 3. DevTools open detection — DESKTOP ONLY
        var _devOpen = false;
        var _threshold = 200;

        setInterval(function () {
            var widthDiff = window.outerWidth - window.innerWidth;
            var heightDiff = window.outerHeight - window.innerHeight;

            if (widthDiff > _threshold || heightDiff > _threshold) {
                if (!_devOpen) {
                    _devOpen = true;
                    document.body.innerHTML =
                        '<div style="background:#0f0f0f;color:#fe2c55;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;">' +
                        '<h1 style="font-size:60px;">🚫</h1>' +
                        '<h2>ڕێگەپێنەدراوە!</h2>' +
                        '<p>تکایە DevTools داخە و پەرەکە نوێ بکەرەوە.</p>' +
                        '</div>';
                }
            } else {
                _devOpen = false;
            }
        }, 500);
    }

    // NOTE: We intentionally do NOT nullify console methods
    // because Firebase SDK uses them internally for error handling.
    // Doing so breaks Firebase on mobile browsers.

})();
