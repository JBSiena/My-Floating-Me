import * as vscode from 'vscode';
import { SessionStats, PomodoroState } from './StatsTracker';

export class MascotViewProvider
    implements vscode.WebviewViewProvider {

    public static readonly viewType = 'mascotView';

    private _view?: vscode.WebviewView;
    private _onReadyCb?: () => void;

    constructor(
        private readonly extensionUri: vscode.Uri
    ) {}

    onReady(cb: () => void) {
        this._onReadyCb = cb;
    }
    
    resolveWebviewView(
        webviewView: vscode.WebviewView
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.extensionUri
            ]
        };

        webviewView.webview.html =
            this._getHtml(webviewView.webview);

        // Webview JS sends "ready" when it initializes
        webviewView.webview.onDidReceiveMessage(
            (msg) => {
                if (msg.type === 'ready') {
                    this._onReadyCb?.();
                }
            }
        );

        // Re-push state when sidebar is expanded
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this._onReadyCb?.();
            }
        });
    }

    // --- Message senders ---

    public celebrate() {
        this._postMessage({ type: 'wave' });
    }

    public sendTyping(isTyping: boolean) {
        this._postMessage({
            type: 'typing',
            value: isTyping
        });
    }

    public sendStats(stats: SessionStats) {
        this._postMessage({
            type: 'stats',
            value: stats
        });
    }

    public sendPomodoro(state: PomodoroState) {
        this._postMessage({
            type: 'pomodoro',
            value: state
        });
    }

    public sendGitStatus(
        status: 'clean' | 'dirty' | 'conflict'
    ) {
        this._postMessage({
            type: 'git',
            value: status
        });
    }

    public sendQuote(quote: string) {
        this._postMessage({
            type: 'quote',
            value: quote
        });
    }

    public sendStreak(minutes: number) {
        this._postMessage({
            type: 'streak',
            value: minutes
        });
    }

    public sendPomodoroAlert(
        phase: 'focus' | 'break'
    ) {
        this._postMessage({
            type: 'pomodoroAlert',
            value: phase
        });
    }

    private _postMessage(message: unknown) {
        if (!this._view) { return; }
        this._view.webview.postMessage(message);
    }

    // --- HTML generation ---

    private _getHtml(
        webview: vscode.Webview
    ): string {

        const nonce = getNonce();

        const cssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.extensionUri,
                'media',
                'mascot.css'
            )
        );

        const jsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.extensionUri,
                'media',
                'mascot.js'
            )
        );

        const idleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.extensionUri,
                'media',
                'idle.png'
            )
        );

        const blinkUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.extensionUri,
                'media',
                'blink.png'
            )
        );

        const waveUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this.extensionUri,
                'media',
                'wave.png'
            )
        );

        return /*html*/`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy"
                content="default-src 'none';
                    img-src ${webview.cspSource};
                    style-src ${webview.cspSource} 'unsafe-inline';
                    script-src 'nonce-${nonce}';">
            <link href="${cssUri}" rel="stylesheet">
        </head>
        <body>

            <!-- Speech bubble -->
            <div id="speech-bubble" class="speech-bubble hidden">
                <span id="speech-text"></span>
            </div>

            <!-- Mascot image -->
            <div class="mascot-container">
                <img id="mascot"
                    data-idle="${idleUri}"
                    data-blink="${blinkUri}"
                    data-wave="${waveUri}"
                    src="${idleUri}">
            </div>

            <!-- Pomodoro timer -->
            <div id="pomodoro-section" class="section hidden">
                <div class="section-header">
                    <svg class="icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 5.5V8.5L10 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 3H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    <span id="pomodoro-label">Pomodoro</span>
                </div>
                <div id="pomodoro-timer" class="timer">25:00</div>
                <div class="progress-bar-bg">
                    <div id="pomodoro-bar" class="progress-bar"></div>
                </div>
            </div>

            <!-- Session stats -->
            <div id="stats-section" class="section">
                <div class="section-header">
                    <svg class="icon" viewBox="0 0 16 16" fill="currentColor"><rect x="1.5" y="9" width="3" height="5" rx="0.5"/><rect x="6.5" y="5" width="3" height="9" rx="0.5"/><rect x="11.5" y="7" width="3" height="7" rx="0.5"/></svg>
                    <span>Session Stats</span>
                </div>
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-value" id="stat-lines">0</span>
                        <span class="stat-label">Lines</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-saves">0</span>
                        <span class="stat-label">Saves</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="stat-time">0m</span>
                        <span class="stat-label">Time</span>
                    </div>
                </div>
            </div>

            <!-- Streak -->
            <div id="streak-section" class="section">
                <div class="section-header">
                    <svg class="icon" id="streak-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 1C8.5 1 4 5.5 4 9C4 12 5.8 14 8.5 14C11.2 14 13 12 13 9C13 5.5 8.5 1 8.5 1ZM8.5 12C7.1 12 6 10.9 6 9.5C6 8 8.5 5 8.5 5C8.5 5 11 8 11 9.5C11 10.9 9.9 12 8.5 12Z"/></svg>
                    <span>Streak</span>
                    <span id="streak-value" class="streak-badge">0m</span>
                </div>
            </div>

            <!-- Git status -->
            <div id="git-section" class="section">
                <div class="section-header">
                    <span id="git-icon" class="icon-wrap"><svg class="icon" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="1.5" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="4" r="1.5" stroke="currentColor" stroke-width="1.3"/><circle cx="4" cy="12" r="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4 5.5V10.5M5.5 4H10.5" stroke="currentColor" stroke-width="1.3"/></svg></span>
                    <span id="git-label">Git: Checking...</span>
                </div>
            </div>

            <script nonce="${nonce}" src="${jsUri}"></script>
        </body>
        </html>
        `;
    }
}

function getNonce(): string {
    let text = '';
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
    }
    return text;
}