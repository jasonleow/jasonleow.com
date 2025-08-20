// ==UserScript==
// @name         Auto-select Class 3 Motorcar (visible overlay)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Selects 'Class 3 Motorcar' and shows the selection in a visible corner overlay, then hard-refreshes after 1 minute
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function showOverlay(text) {
        let overlay = document.getElementById('tm-selected-course-info-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'tm-selected-course-info-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '20px';
            overlay.style.right = '20px';
            overlay.style.zIndex = '9999';
            overlay.style.background = '#e8f5e9';
            overlay.style.color = '#222';
            overlay.style.border = '1px solid #46b946';
            overlay.style.borderRadius = '6px';
            overlay.style.padding = '10px 18px';
            overlay.style.fontSize = '15px';
            overlay.style.boxShadow = '0 2px 8px rgba(80,150,90,0.2)';
            document.body.appendChild(overlay);
        }
        overlay.textContent = text;
        // Automatically hide after 7 seconds
        setTimeout(function() {
            if (overlay) overlay.remove();
        }, 7000);
    }

    function selectCourse() {
        var select = document.getElementById("ctl00_ContentPlaceHolder1_ddlCourse");
        if (select) {
            select.value = "MANUAL-C3           "; // exact value
            select.dispatchEvent(new Event('change', { bubbles: true }));
            var selectedText = select.options[select.selectedIndex].text;
            showOverlay('Auto-selected: ' + selectedText);

            // Hard refresh the page 1 minute after this function runs
            setTimeout(function() {
                location.reload(); // location.reload(true) for hard refresh (force-reload), but it's deprecated
            }, 60000); // 1 minute = 60000 ms
        }
    }

    window.addEventListener('DOMContentLoaded', selectCourse);
    setTimeout(selectCourse, 180000); // Set this 3min time interval to click on <select>

    // Add hotkey: ESC runs selectCourse()
    window.addEventListener('keydown', function(e) {
        if (
            // For modern browsers
            e.key === "Escape" ||
            // For legacy browsers
            e.key === "Esc" ||
            e.keyCode === 27
        ) {
            selectCourse();
        }
    });
})();
