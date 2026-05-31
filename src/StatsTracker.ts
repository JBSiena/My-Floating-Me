import * as vscode from 'vscode';

export interface SessionStats {
    linesAdded: number;
    saveCount: number;
    sessionStartTime: number;
    streakStartTime: number;
    codingDurationMs: number;
}

export type PomodoroPhase = 'off' | 'focus' | 'break';

export interface PomodoroState {
    phase: PomodoroPhase;
    remainingMs: number;
    totalMs: number;
}

export class StatsTracker {

    private _stats: SessionStats;
    private _stateStorage?: vscode.Memento;
    private _pomodoro: PomodoroState;
    private _pomodoroTimer?: ReturnType<typeof setInterval>;
    private _idleTimer?: ReturnType<typeof setTimeout>;
    private _isTyping = false;
    private _lastActivityTime: number;

    // Callbacks
    private _onStatsUpdate?: (stats: SessionStats) => void;
    private _onPomodoroUpdate?: (state: PomodoroState) => void;
    private _onPomodoroPhaseEnd?: (phase: PomodoroPhase) => void;
    private _onStreakMilestone?: (minutes: number) => void;
    private _onTypingChange?: (isTyping: boolean) => void;

    // Idle timeout: 2 minutes of no typing = idle
    private static readonly IDLE_TIMEOUT_MS = 120_000;
    // Pomodoro defaults
    private static readonly FOCUS_MS = 25 * 60 * 1000;
    private static readonly BREAK_MS = 5 * 60 * 1000;
    // Streak milestones in minutes
    private static readonly MILESTONES = [10, 30, 60, 120];

    private _lastMilestone = 0;

    constructor(stateStorage?: vscode.Memento) {
        this._stateStorage = stateStorage;
        const now = Date.now();

        // Restore stats or set defaults
        const savedStats = this._stateStorage?.get<SessionStats>('codingStats');
        console.log('[StatsTracker] Constructor: restoring stats from storage:', savedStats);
        if (savedStats) {
            this._stats = {
                linesAdded: savedStats.linesAdded ?? 0,
                saveCount: savedStats.saveCount ?? 0,
                sessionStartTime: savedStats.sessionStartTime ?? now,
                streakStartTime: savedStats.streakStartTime ?? now,
                codingDurationMs: savedStats.codingDurationMs ?? 0
            };

            // Call auto-reset check on restored stats
            const resetPerformed = this._checkAndAutoReset();

            if (!resetPerformed) {
                // Re-calculate last milestone so it matches restored streak duration
                const streakMinutes = Math.floor((now - this._stats.streakStartTime) / 60_000);
                for (const milestone of StatsTracker.MILESTONES) {
                    if (streakMinutes >= milestone) {
                        this._lastMilestone = milestone;
                    }
                }
            }
        } else {
            this._stats = {
                linesAdded: 0,
                saveCount: 0,
                sessionStartTime: now,
                streakStartTime: now,
                codingDurationMs: 0
            };
        }

        this._pomodoro = {
            phase: 'off',
            remainingMs: 0,
            totalMs: 0
        };
        this._lastActivityTime = now;
    }

    // --- Event registration ---

    onStatsUpdate(cb: (stats: SessionStats) => void) {
        this._onStatsUpdate = cb;
    }

    onPomodoroUpdate(cb: (state: PomodoroState) => void) {
        this._onPomodoroUpdate = cb;
    }

    onPomodoroPhaseEnd(cb: (phase: PomodoroPhase) => void) {
        this._onPomodoroPhaseEnd = cb;
    }

    onStreakMilestone(cb: (minutes: number) => void) {
        this._onStreakMilestone = cb;
    }

    onTypingChange(cb: (isTyping: boolean) => void) {
        this._onTypingChange = cb;
    }

    // --- Tracking ---

    recordTextChange(event: vscode.TextDocumentChangeEvent) {
        this._checkAndAutoReset();
        for (const change of event.contentChanges) {
            // Count new lines added
            const newLines = change.text.split('\n').length - 1;
            const removedLines =
                change.range.end.line - change.range.start.line;
            this._stats.linesAdded +=
                Math.max(0, newLines - removedLines);
        }

        this._markActivity();
        this._emitStats();
    }

    recordSave() {
        this._checkAndAutoReset();
        this._stats.saveCount++;
        this._markActivity();
        this._emitStats();
    }

    private _markActivity() {
        const now = Date.now();
        this._lastActivityTime = now;

        // Set typing state
        if (!this._isTyping) {
            this._isTyping = true;
            this._onTypingChange?.(true);
        }

        // Reset idle timer
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
        }

        this._idleTimer = setTimeout(() => {
            this._isTyping = false;
            this._onTypingChange?.(false);
        }, 3000); // 3s for typing indicator

        // Check streak milestones
        this._checkStreakMilestones();
    }

    private _checkStreakMilestones() {
        const streakMinutes = Math.floor(
            (Date.now() - this._stats.streakStartTime)
            / 60_000
        );

        for (const milestone of StatsTracker.MILESTONES) {
            if (
                streakMinutes >= milestone &&
                this._lastMilestone < milestone
            ) {
                this._lastMilestone = milestone;
                this._onStreakMilestone?.(milestone);
            }
        }
    }

    // --- Pomodoro ---

    startPomodoro() {
        this.stopPomodoro();

        const focusMs = this._getFocusDurationMs();
        const breakMs = this._getBreakDurationMs();

        this._pomodoro = {
            phase: 'focus',
            remainingMs: focusMs,
            totalMs: focusMs
        };

        this._pomodoroTimer = setInterval(() => {
            this._pomodoro.remainingMs -= 1000;

            if (this._pomodoro.remainingMs <= 0) {
                const endedPhase = this._pomodoro.phase;
                this._onPomodoroPhaseEnd?.(endedPhase);

                if (endedPhase === 'focus') {
                    // Switch to break
                    const currentBreakMs = this._getBreakDurationMs();
                    this._pomodoro = {
                        phase: 'break',
                        remainingMs: currentBreakMs,
                        totalMs: currentBreakMs
                    };
                } else {
                    // Break ended, back to focus
                    const currentFocusMs = this._getFocusDurationMs();
                    this._pomodoro = {
                        phase: 'focus',
                        remainingMs: currentFocusMs,
                        totalMs: currentFocusMs
                    };
                }
            }

            this._onPomodoroUpdate?.(this._pomodoro);
        }, 1000);

        this._onPomodoroUpdate?.(this._pomodoro);
    }

    stopPomodoro() {
        if (this._pomodoroTimer) {
            clearInterval(this._pomodoroTimer);
            this._pomodoroTimer = undefined;
        }

        this._pomodoro = {
            phase: 'off',
            remainingMs: 0,
            totalMs: 0
        };

        this._onPomodoroUpdate?.(this._pomodoro);
    }

    resetStats() {
        const now = Date.now();
        this._stats = {
            linesAdded: 0,
            saveCount: 0,
            sessionStartTime: now,
            streakStartTime: now,
            codingDurationMs: 0
        };
        this._lastMilestone = 0;
        this._emitStats();
    }

    getStats(): SessionStats {
        return { ...this._stats };
    }

    getPomodoro(): PomodoroState {
        return { ...this._pomodoro };
    }

    private _emitStats() {
        if (this._stateStorage) {
            console.log('[StatsTracker] Saving stats to storage:', this._stats);
            // Shallow clone the stats object to ensure Memento change detection picks it up correctly
            this._stateStorage.update('codingStats', { ...this._stats });
        }
        this._onStatsUpdate?.({ ...this._stats });
    }

    private _isSameDay(t1: number, t2: number): boolean {
        const d1 = new Date(t1);
        const d2 = new Date(t2);
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    private _isSameWeek(t1: number, t2: number): boolean {
        const d1 = new Date(t1);
        const d2 = new Date(t2);
        
        const startOfWeek = (d: Date) => {
            const result = new Date(d);
            const day = result.getDay();
            const diff = result.getDate() - day;
            result.setDate(diff);
            result.setHours(0, 0, 0, 0);
            return result.getTime();
        };
        
        return startOfWeek(d1) === startOfWeek(d2);
    }

    private _checkAndAutoReset(): boolean {
        const now = Date.now();
        const config = vscode.workspace.getConfiguration('my-floating-me');
        const interval = config.get<string>('resetInterval', 'manual');

        if (interval === 'daily' && !this._isSameDay(this._stats.sessionStartTime, now)) {
            console.log('[StatsTracker] Auto-resetting stats (daily boundary passed)');
            this.resetStats();
            return true;
        }

        if (interval === 'weekly' && !this._isSameWeek(this._stats.sessionStartTime, now)) {
            console.log('[StatsTracker] Auto-resetting stats (weekly boundary passed)');
            this.resetStats();
            return true;
        }

        return false;
    }

    private _getFocusDurationMs(): number {
        const config = vscode.workspace.getConfiguration('my-floating-me');
        const minutes = config.get<number>('pomodoroFocusDuration', 25);
        return minutes * 60 * 1000;
    }

    private _getBreakDurationMs(): number {
        const config = vscode.workspace.getConfiguration('my-floating-me');
        const minutes = config.get<number>('pomodoroBreakDuration', 5);
        return minutes * 60 * 1000;
    }

    dispose() {
        if (this._pomodoroTimer) {
            clearInterval(this._pomodoroTimer);
        }
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
        }
    }
}
