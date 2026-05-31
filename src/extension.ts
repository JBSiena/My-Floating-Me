import * as vscode from 'vscode';
import { MascotViewProvider } from './MascotViewProvider';
import { StatsTracker } from './StatsTracker';
import { QUOTES } from './quotes';

export function activate(
    context: vscode.ExtensionContext
) {
    const provider = new MascotViewProvider(
        context.extensionUri
    );

    const tracker = new StatsTracker();

    // --- Register webview view ---

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            MascotViewProvider.viewType,
            provider
        )
    );

    // Re-push state when webview is recreated
    provider.onReady(() => {
        provider.sendStats(tracker.getStats());
        provider.sendPomodoro(tracker.getPomodoro());
        updateGitStatus(provider);
    });

    // --- Typing companion ---

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(
            (e) => {
                // Ignore output channels, etc.
                if (e.document.uri.scheme !== 'file') {
                    return;
                }
                tracker.recordTextChange(e);
            }
        )
    );

    tracker.onTypingChange((isTyping) => {
        provider.sendTyping(isTyping);
    });

    // --- File save ---

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(() => {
            provider.celebrate();
            tracker.recordSave();
        })
    );

    // --- Stats updates ---

    tracker.onStatsUpdate((stats) => {
        provider.sendStats(stats);
    });

    // --- Streak milestones ---

    tracker.onStreakMilestone((minutes) => {
        provider.sendStreak(minutes);

        const label = minutes >= 60
            ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
            : `${minutes}m`;

        vscode.window.showInformationMessage(
            `🔥 ${label} coding streak! Keep it up!`
        );
    });

    // --- Pomodoro ---

    tracker.onPomodoroUpdate((state) => {
        provider.sendPomodoro(state);
    });

    tracker.onPomodoroPhaseEnd((phase) => {
        if (phase === 'off') { return; }
        provider.sendPomodoroAlert(phase);

        if (phase === 'focus') {
            vscode.window.showInformationMessage(
                '🍅 Focus session done! Time for a break.'
            );
        } else {
            vscode.window.showInformationMessage(
                '🍅 Break over! Ready to focus again?'
            );
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'my-floating-me.startPomodoro',
            () => {
                tracker.startPomodoro();
                vscode.window.showInformationMessage(
                    '🍅 Pomodoro started! 25 minutes of focus.'
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'my-floating-me.stopPomodoro',
            () => {
                tracker.stopPomodoro();
                vscode.window.showInformationMessage(
                    '🍅 Pomodoro stopped.'
                );
            }
        )
    );

    // --- Reset stats ---

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'my-floating-me.resetStats',
            () => {
                tracker.resetStats();
                vscode.window.showInformationMessage(
                    '📊 Session stats reset.'
                );
            }
        )
    );

    // --- Git status polling ---

    const gitPollInterval = setInterval(() => {
        updateGitStatus(provider);
    }, 10_000); // Poll every 10 seconds

    // Initial git check
    updateGitStatus(provider);

    context.subscriptions.push({
        dispose: () => clearInterval(gitPollInterval)
    });

    // --- Motivational quotes ---

    let quoteIndex = randomIndex(QUOTES.length);

    // Show first quote after 30 seconds
    const firstQuoteTimer = setTimeout(() => {
        provider.sendQuote(QUOTES[quoteIndex]);
    }, 30_000);

    // Then every 10 minutes
    const quoteInterval = setInterval(() => {
        quoteIndex = randomIndex(QUOTES.length);
        provider.sendQuote(QUOTES[quoteIndex]);
    }, 10 * 60 * 1000);

    context.subscriptions.push({
        dispose: () => {
            clearTimeout(firstQuoteTimer);
            clearInterval(quoteInterval);
        }
    });

    // --- Cleanup ---

    context.subscriptions.push({
        dispose: () => tracker.dispose()
    });
}

// --- Helpers ---

function randomIndex(max: number): number {
    return Math.floor(Math.random() * max);
}

async function updateGitStatus(
    provider: MascotViewProvider
) {
    try {
        const gitExt = vscode.extensions.getExtension(
            'vscode.git'
        );

        if (!gitExt) {
            provider.sendGitStatus('clean');
            return;
        }

        const git = gitExt.isActive
            ? gitExt.exports
            : await gitExt.activate();

        const api = git.getAPI(1);

        if (!api || api.repositories.length === 0) {
            provider.sendGitStatus('clean');
            return;
        }

        const repo = api.repositories[0];
        const state = repo.state;

        // Check for merge conflicts
        if (
            state.mergeChanges &&
            state.mergeChanges.length > 0
        ) {
            provider.sendGitStatus('conflict');
            return;
        }

        // Check for uncommitted changes
        const hasChanges =
            (state.workingTreeChanges &&
                state.workingTreeChanges.length > 0) ||
            (state.indexChanges &&
                state.indexChanges.length > 0);

        provider.sendGitStatus(
            hasChanges ? 'dirty' : 'clean'
        );
    } catch {
        // Git not available, default to clean
        provider.sendGitStatus('clean');
    }
}

export function deactivate() {}
