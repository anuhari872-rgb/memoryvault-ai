    function getHomePlantSVG(streak) {
        // Pot base used for early stages
        const potHtml = \
            <rect x="36" y="126" width="68" height="10" rx="3" fill="#D8A94E"/>
            <path d="M40 136 L48 172 Q52 178 70 178 Q88 178 92 172 L100 136Z" fill="#C49A3C"/>
            <path d="M44 136 L50 168 Q52 172 62 172 L62 136Z" fill="#D8A94E" opacity="0.3"/>
            <ellipse cx="70" cy="131" rx="30" ry="6" fill="#8B7355"/>
        \;
        
        // Ground base used for tree stages
        const groundHtml = \
            <ellipse cx="70" cy="160" rx="50" ry="12" fill="#8B7355"/>
            <ellipse cx="70" cy="160" rx="45" ry="10" fill="#79A96B" opacity="0.8"/>
        \;
        
        let innerSvg = '';
        
        if (streak >= 100) { // Life Tree
            innerSvg = groundHtml + \
                <path d="M70 160 L70 60" stroke="#7A5135" stroke-width="20" fill="none" stroke-linecap="round"/>
                <path d="M70 130 C50 110 25 95 15 85" stroke="#7A5135" stroke-width="10" fill="none" stroke-linecap="round"/>
                <path d="M70 115 C90 95 115 80 125 70" stroke="#7A5135" stroke-width="10" fill="none" stroke-linecap="round"/>
                <path d="M70 90 C55 70 45 50 40 40" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <path d="M70 80 C85 60 95 45 100 35" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <circle cx="15" cy="75" r="40" fill="#79A96B"/>
                <circle cx="125" cy="65" r="40" fill="#5F9F55"/>
                <circle cx="40" cy="35" r="35" fill="#9BBF8F"/>
                <circle cx="100" cy="30" r="35" fill="#79A96B"/>
                <circle cx="70" cy="20" r="50" fill="#DDEBD8"/>
                <circle cx="70" cy="60" r="30" fill="#5F9F55" opacity="0.8"/>
                <!-- Magical sparkles -->
                <circle cx="30" cy="30" r="3" fill="#FFF" opacity="0.8"/>
                <circle cx="110" cy="20" r="4" fill="#FFF" opacity="0.8"/>
                <circle cx="70" cy="5" r="2" fill="#FFF" opacity="0.8"/>
            \;
        } else if (streak >= 60) { // Mature Tree
            innerSvg = groundHtml + \
                <path d="M70 160 L70 70" stroke="#7A5135" stroke-width="16" fill="none" stroke-linecap="round"/>
                <path d="M70 130 C60 110 40 90 30 80" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <path d="M70 120 C80 100 100 85 110 75" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <path d="M70 95 L55 60" stroke="#7A5135" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M70 85 L85 55" stroke="#7A5135" stroke-width="6" fill="none" stroke-linecap="round"/>
                <circle cx="25" cy="70" r="35" fill="#79A96B"/>
                <circle cx="115" cy="65" r="35" fill="#5F9F55"/>
                <circle cx="70" cy="40" r="45" fill="#9BBF8F"/>
                <circle cx="50" cy="35" r="30" fill="#DDEBD8" opacity="0.5"/>
                <circle cx="90" cy="40" r="25" fill="#79A96B" opacity="0.8"/>
            \;
        } else if (streak >= 30) { // Growing Tree
            innerSvg = groundHtml + \
                <path d="M70 160 L70 80" stroke="#7A5135" stroke-width="12" fill="none" stroke-linecap="round"/>
                <path d="M70 130 L45 95" stroke="#7A5135" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M70 110 L95 80" stroke="#7A5135" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M70 95 L60 70" stroke="#7A5135" stroke-width="5" fill="none" stroke-linecap="round"/>
                <circle cx="40" cy="85" r="30" fill="#79A96B"/>
                <circle cx="100" cy="75" r="32" fill="#5F9F55"/>
                <circle cx="70" cy="55" r="38" fill="#9BBF8F"/>
                <circle cx="55" cy="50" r="25" fill="#DDEBD8" opacity="0.6"/>
            \;
        } else if (streak >= 14) { // Small Tree
            innerSvg = groundHtml + \
                <path d="M70 160 L70 90" stroke="#7A5135" stroke-width="8" fill="none" stroke-linecap="round"/>
                <path d="M70 120 L55 95" stroke="#7A5135" stroke-width="4" fill="none" stroke-linecap="round"/>
                <path d="M70 105 L85 85" stroke="#7A5135" stroke-width="4" fill="none" stroke-linecap="round"/>
                <circle cx="50" cy="85" r="25" fill="#79A96B" opacity="0.9"/>
                <circle cx="90" cy="75" r="22" fill="#5F9F55" opacity="0.9"/>
                <circle cx="70" cy="65" r="28" fill="#9BBF8F" opacity="0.9"/>
            \;
        } else if (streak >= 7) { // Growing Plant
            innerSvg = potHtml + \
                <path d="M70 126 C66 100 74 75 68 45" stroke="#1C5A48" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M70 115 C55 105 45 100 35 95" stroke="#1C5A48" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M69 95 C85 85 95 80 105 75" stroke="#1C5A48" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M68 75 C55 65 48 60 40 55" stroke="#1C5A48" stroke-width="2" fill="none" stroke-linecap="round"/>
                <path d="M68 60 C80 50 88 45 95 40" stroke="#1C5A48" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <ellipse cx="30" cy="90" rx="18" ry="9" transform="rotate(-35 30 90)" fill="#9BBF8F"/>
                <ellipse cx="110" cy="70" rx="18" ry="9" transform="rotate(35 110 70)" fill="#DDEBD8"/>
                <ellipse cx="35" cy="50" rx="15" ry="7.5" transform="rotate(-25 35 50)" fill="#DDEBD8"/>
                <ellipse cx="100" cy="35" rx="14" ry="7" transform="rotate(25 100 35)" fill="#9BBF8F"/>
                <ellipse cx="65" cy="35" rx="15" ry="7.5" transform="rotate(-15 65 35)" fill="#9BBF8F"/>
            \;
        } else if (streak >= 3) { // Young Plant (current index.html default)
            innerSvg = potHtml + \
                <path d="M70 126 C68 108 72 92 68 68" stroke="#1C5A48" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                <path d="M70 110 C62 102 54 98 46 96" stroke="#1C5A48" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <path d="M69 94 C78 86 86 83 96 82" stroke="#1C5A48" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                <path d="M69 78 C62 74 56 72 50 70" stroke="#1C5A48" stroke-width="1.4" fill="none" stroke-linecap="round"/>
                <ellipse cx="42" cy="92" rx="16" ry="8" transform="rotate(-32 42 92)" fill="#9BBF8F"/>
                <ellipse cx="100" cy="78" rx="14" ry="7" transform="rotate(28 100 78)" fill="#DDEBD8"/>
                <ellipse cx="46" cy="66" rx="12" ry="6" transform="rotate(-20 46 66)" fill="#DDEBD8"/>
                <ellipse cx="68" cy="54" rx="14" ry="7" transform="rotate(-10 68 54)" fill="#9BBF8F"/>
                <path d="M82 95 C83 92 85 92 85 95 C85 98 82 102 82 102 C82 102 79 98 79 95 C79 92 81 92 82 95Z" fill="#E9A6A6" opacity="0.8"/>
            \;
        } else if (streak >= 1) { // Sprout
            innerSvg = potHtml + \
                <path d="M70 126 C69 120 71 115 70 110" stroke="#1C5A48" stroke-width="2" fill="none" stroke-linecap="round"/>
                <ellipse cx="64" cy="116" rx="6" ry="3" transform="rotate(-30 64 116)" fill="#9BBF8F"/>
                <ellipse cx="76" cy="114" rx="5" ry="2.5" transform="rotate(30 76 114)" fill="#DDEBD8"/>
            \;
        } else { // Seed (0 days)
            innerSvg = potHtml + \
                <ellipse cx="70" cy="128" rx="4" ry="2" fill="#5F9F55"/>
            \;
        }
        
        return \<svg viewBox="0 0 140 190" width="120">\</svg>\;
    }

    function getStageLabel(streak) {
        if (streak >= 100) return 'Life Tree';
        if (streak >= 60) return 'Mature Tree';
        if (streak >= 30) return 'Growing Tree';
        if (streak >= 14) return 'Small Tree';
        if (streak >= 7) return 'Growing Plant';
        if (streak >= 3) return 'Young Plant';
        if (streak >= 1) return 'Sprout';
        return 'Seed';
    }

    function updateHomeStats() {
        if (!window.streakService) return;
        const stats = window.streakService.getStats();
        if (!stats) return;

        const healthEl = \#home-plant-health;
        if (healthEl) healthEl.innerHTML = \\ <span>/ 100</span>\;
        
        const healthBarEl = \#home-plant-health-bar;
        if (healthBarEl) healthBarEl.style.width = \\%\;

        const streakEl = \#home-day-streak;
        if (streakEl) streakEl.innerHTML = \\ <span class="stat-unit">Days</span>\;

        const streakBarEl = \#home-day-streak-bar;
        if (streakBarEl) streakBarEl.style.width = \\%\;

        const actualStage = getStageLabel(stats.currentStreak);
        const stageEl = \#home-plant-stage;
        if (stageEl) stageEl.innerHTML = \?? \\;

        // Update the visual svg!
        const visualEl = \.plant-visual;
        if (visualEl) {
            visualEl.innerHTML = getPlantSVG(stats.currentStreak);
        }

        const progressTextEl = \#home-plant-progress-text;
        if (progressTextEl) progressTextEl.innerHTML = \\ days to go<br>for \\;

        const progressFillEl = \#home-plant-progress-fill;
        if (progressFillEl) progressFillEl.style.width = \\%\;

        const progressValEl = \#home-plant-progress-value;
        if (progressValEl) progressValEl.innerHTML = \\ / 100\;
    }
