(function init() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
        return;
    }

    // VS Code API for messaging back to extension
    const vscode = acquireVsCodeApi();

    // --- DOM references ---
    const avatar = document.getElementById("mascot");
    const speechBubble = document.getElementById("speech-bubble");
    const speechText = document.getElementById("speech-text");

    // Pomodoro
    const pomodoroSection = document.getElementById("pomodoro-section");
    const pomodoroLabel = document.getElementById("pomodoro-label");
    const pomodoroTimer = document.getElementById("pomodoro-timer");
    const pomodoroBar = document.getElementById("pomodoro-bar");
    const pomodoroBtn = document.getElementById("pomodoro-btn");

    // Stats
    const statLines = document.getElementById("stat-lines");
    const statSaves = document.getElementById("stat-saves");
    const statTime = document.getElementById("stat-time");
    const resetBtn = document.getElementById("reset-btn");

    // Streak
    const streakIcon = document.getElementById("streak-icon");
    const streakValue = document.getElementById("streak-value");

    // Git
    const gitIcon = document.getElementById("git-icon");
    const gitLabel = document.getElementById("git-label");

    // SVG icon templates
    const SVG_CHECK = '<svg class="icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const SVG_PENCIL = '<svg class="icon" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    const SVG_WARNING = '<svg class="icon" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 7V9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/></svg>';

    if (!avatar) {
        console.error("Mascot element not found");
        return;
    }

    // --- Image sources ---
    const idleSrc = avatar.getAttribute("data-idle");
    const blinkSrc = avatar.getAttribute("data-blink");
    const waveSrc = avatar.getAttribute("data-wave");

    // --- State ---
    let isTyping = false;
    let speechTimeout = null;
    let sessionStartTime = Date.now();

    // --- Session timer (updates every second) ---
    setInterval(() => {
        const elapsed = Date.now() - sessionStartTime;
        if (statTime) {
            statTime.textContent = formatDuration(elapsed);
        }
    }, 1000);

    // --- Blink animation ---
    function blink() {
        if (isTyping) return;
        avatar.src = blinkSrc;
        setTimeout(() => {
            if (!isTyping) avatar.src = idleSrc;
        }, 300);
    }

    function randomIdle() {
        if (Math.random() < 0.25) {
            blink();
        }
    }

    setInterval(randomIdle, 5000);

    // --- Wave animation ---
    function wave() {
        avatar.src = waveSrc;
        avatar.classList.add("celebrating");
        setTimeout(() => {
            avatar.src = idleSrc;
            avatar.classList.remove("celebrating");
        }, 1500);
    }

    // --- Speech bubble ---
    function showSpeech(text, duration) {
        if (!speechBubble || !speechText) return;

        if (speechTimeout) clearTimeout(speechTimeout);

        speechText.textContent = text;
        speechBubble.classList.remove("hidden");

        if (duration) {
            speechTimeout = setTimeout(() => {
                speechBubble.classList.add("hidden");
            }, duration);
        }
    }

    function hideSpeech() {
        if (speechBubble) {
            speechBubble.classList.add("hidden");
        }
    }

    // --- Helpers ---
    function formatDuration(ms) {
        const totalMin = Math.floor(ms / 60000);
        const hours = Math.floor(totalMin / 60);
        const mins = totalMin % 60;
        if (hours > 0) return hours + "h " + mins + "m";
        return mins + "m";
    }

    function formatTimer(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return String(m).padStart(2, "0") + ":" +
               String(s).padStart(2, "0");
    }

    // --- Message handler ---
    window.addEventListener("message", (event) => {
        const msg = event.data;

        switch (msg.type) {

            case "wave":
                wave();
                break;

            case "typing":
                isTyping = msg.value;
                if (isTyping) {
                    avatar.classList.add("typing");
                } else {
                    avatar.classList.remove("typing");
                    avatar.src = idleSrc;
                }
                break;

            case "stats":
                if (statLines) {
                    statLines.textContent =
                        msg.value.linesAdded.toLocaleString();
                }
                if (statSaves) {
                    statSaves.textContent =
                        msg.value.saveCount.toLocaleString();
                }
                // Update session start for timer
                sessionStartTime = msg.value.sessionStartTime;
                break;

            case "pomodoro":
                if (!pomodoroSection) break;

                const isOff = msg.value.phase === "off";

                if (isOff) {
                    if (pomodoroTimer) pomodoroTimer.classList.add("hidden");
                    if (pomodoroBar) pomodoroBar.parentElement.classList.add("hidden");
                    if (pomodoroLabel) pomodoroLabel.textContent = "Pomodoro";
                    if (pomodoroBtn) {
                        pomodoroBtn.textContent = "🍅 Start Focus";
                        pomodoroBtn.className = "btn btn-primary";
                        pomodoroBtn.dataset.action = "start";
                    }
                } else {
                    if (pomodoroTimer) {
                        pomodoroTimer.classList.remove("hidden");
                        pomodoroTimer.textContent = formatTimer(msg.value.remainingMs);
                        pomodoroTimer.className = "timer " + msg.value.phase;
                    }
                    if (pomodoroBar) {
                        pomodoroBar.parentElement.classList.remove("hidden");
                        const pct = msg.value.totalMs > 0
                            ? (msg.value.remainingMs / msg.value.totalMs) * 100
                            : 0;
                        pomodoroBar.style.width = pct + "%";
                        const isFocus = msg.value.phase === "focus";
                        pomodoroBar.className = "progress-bar" + (isFocus ? "" : " break");
                    }
                    if (pomodoroLabel) {
                        pomodoroLabel.textContent = msg.value.phase === "focus" ? "Focus" : "Break";
                    }
                    if (pomodoroBtn) {
                        pomodoroBtn.textContent = "🛑 Stop Timer";
                        pomodoroBtn.className = "btn btn-secondary";
                        pomodoroBtn.dataset.action = "stop";
                    }
                }
                break;

            case "pomodoroAlert":
                if (msg.value === "focus") {
                    showSpeech("Great focus session! Take a break.", 8000);
                    wave();
                } else {
                    showSpeech("Break's over! Let's get back to it.", 8000);
                }
                break;

            case "git":
                if (!gitIcon || !gitLabel) break;

                if (msg.value === "clean") {
                    gitIcon.innerHTML = SVG_CHECK;
                    gitIcon.style.color = "#98c379";
                    gitLabel.textContent = "Git: Clean";
                    gitLabel.className = "git-clean";
                } else if (msg.value === "dirty") {
                    gitIcon.innerHTML = SVG_PENCIL;
                    gitIcon.style.color = "#d19a66";
                    gitLabel.textContent = "Git: Uncommitted changes";
                    gitLabel.className = "git-dirty";
                } else if (msg.value === "conflict") {
                    gitIcon.innerHTML = SVG_WARNING;
                    gitIcon.style.color = "#e06c75";
                    gitLabel.textContent = "Git: Merge conflicts!";
                    gitLabel.className = "git-conflict";
                }
                break;

            case "quote":
                showSpeech("\"" + msg.value + "\"", 15000);
                break;

            case "streak": {
                if (!streakValue) break;

                const min = msg.value;
                const label = min >= 60
                    ? Math.floor(min / 60) + "h " + (min % 60) + "m"
                    : min + "m";

                streakValue.textContent = label;
                streakValue.classList.add("hot");

                if (streakIcon) {
                    streakIcon.style.color = "#e06c75";
                }

                showSpeech(
                    label + " coding streak! You're on fire!",
                    8000
                );
                wave();
                break;
            }
        }
    });

    // --- Update streak display from session timer ---
    setInterval(() => {
        if (streakValue && sessionStartTime) {
            const elapsed = Date.now() - sessionStartTime;
            const min = Math.floor(elapsed / 60000);
            if (min < 60) {
                streakValue.textContent = min + "m";
            } else {
                const h = Math.floor(min / 60);
                streakValue.textContent =
                    h + "h " + (min % 60) + "m";
            }
        }
    }, 10000);

    // --- Button Event Listeners ---
    if (pomodoroBtn) {
        pomodoroBtn.addEventListener("click", () => {
            const action = pomodoroBtn.dataset.action || "start";
            if (action === "start") {
                vscode.postMessage({ type: "startPomodoro" });
            } else {
                vscode.postMessage({ type: "stopPomodoro" });
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            vscode.postMessage({ type: "resetStats" });
        });
    }

    // Tell extension we're ready to receive state
    vscode.postMessage({ type: 'ready' });

})();