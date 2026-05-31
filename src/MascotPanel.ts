import * as vscode from 'vscode';

export class MascotPanel {

    public static readonly viewType = 'mascotPanel';
    public static currentPanel: MascotPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposed = false;

    public static createOrShow(
        extensionUri: vscode.Uri
    ) {
        // If panel already exists, reveal it
        if (MascotPanel.currentPanel) {
            MascotPanel.currentPanel._panel.reveal(
                undefined, true
            );
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            MascotPanel.viewType,
            '🐾 Mascot',
            {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true
            },
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(
                        extensionUri, 'media'
                    )
                ]
            }
        );

        MascotPanel.currentPanel =
            new MascotPanel(panel, extensionUri);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.webview.html =
            this._getHtml(this._panel.webview);

        this._panel.onDidDispose(() => {
            this._disposed = true;
            MascotPanel.currentPanel = undefined;
        });
    }

    public celebrate() {
        if (this._disposed) return;

        this._panel.webview.postMessage({
            type: 'wave'
        });
    }

    private _getHtml(
        webview: vscode.Webview
    ): string {

        const nonce = getNonce();

        const cssUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'media',
                'mascot.css'
            )
        );

        const jsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'media',
                'mascot.js'
            )
        );

        const idleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'media',
                'idle.png'
            )
        );

        const blinkUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'media',
                'blink.png'
            )
        );

        const waveUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'media',
                'wave.png'
            )
        );

        return `
        <!DOCTYPE html>
        <html>

        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy"
                content="default-src 'none';
                    img-src ${webview.cspSource};
                    style-src ${webview.cspSource};
                    script-src 'nonce-${nonce}';">
            <link href="${cssUri}" rel="stylesheet">
        </head>

        <body>

            <div class="container">
                <img id="mascot"
                    data-idle="${idleUri}"
                    data-blink="${blinkUri}"
                    data-wave="${waveUri}"
                    src="${idleUri}">
            </div>

            <script nonce="${nonce}" src="${jsUri}"></script>

        </body>
        </html>
        `;
    }
}

function getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
    }
    return text;
}
