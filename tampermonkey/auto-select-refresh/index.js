// ==UserScript==
// @name         Auto-select Class 3 Motorcar (visible overlay + hotkey + click next button)
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Select course, show overlay, hard-refresh, Esc hotkey, click next button after auto-select
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
        setTimeout(function() {
            if (overlay) overlay.remove();
        }, 7000);
    }

    // Try to click the "view available sessions" button with retries
    function clickNextButton(attempt = 1) {
        // ctl00_ContentPlaceHolder1_IBtnM2 is element ID for Sept calender icon
        var btn = document.getElementById("ctl00_ContentPlaceHolder1_IBtnM2");
        if (btn) {
            btn.click();
            showOverlay('Clicked: View Available Sessions');
        } else if (attempt <= 5) {
            // Try again in 400ms, up to 5 times
            setTimeout(function() {
                clickNextButton(attempt + 1);
            }, 400);
        } else {
            showOverlay('🗓 Sept cal was not found after selection.');
        }
    }

    function selectCourse() {
        var select = document.getElementById("ctl00_ContentPlaceHolder1_ddlCourse");
        if (select) {
            select.value = "MANUAL-C3           ";
            select.dispatchEvent(new Event('change', { bubbles: true }));
            var selectedText = select.options[select.selectedIndex].text;
            showOverlay('Auto-selected: ' + selectedText);

            // Try to click next button after short delay (page logic needs time to render it)
            setTimeout(clickNextButton, 800);

            setTimeout(function() {
                location.reload();
            }, 60000);
        }
    }

    window.addEventListener('DOMContentLoaded', selectCourse);
    setTimeout(selectCourse, 180000);

    // ESC hotkey
    window.addEventListener('keydown', function(e) {
        if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
            selectCourse();
        }
    });
})();
