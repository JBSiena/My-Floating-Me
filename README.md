# My Floating Me 🐾

Your personal coding mascot companion that lives in the VS Code sidebar — tracking your stats, keeping streaks, running pomodoro timers, monitoring git status, and keeping you motivated with quotes!

## Features

### 🎭 Reactive Mascot
- **Typing companion** — the mascot gently bounces while you type and rests when you're idle
- **Celebrates saves** — waves every time you save a file
- **Blinks randomly** — subtle idle animations keep it feeling alive

### 📊 Session Stats
Tracks your coding session in real-time with automatic saving/restoring (persists across VS Code restarts!):
- **Lines added** — total new lines written this session
- **Files saved** — how many times you've saved
- **Time coded** — elapsed session duration
- **Reset options** — automatically resets daily or weekly, or can be cleared manually

### 🔥 Coding Streak
Monitors how long you've been continuously coding and celebrates milestones at 10min, 30min, 1hr, and 2hr marks with notifications and animations.

### 🍅 Pomodoro Timer
Built-in focus/break timer:
- **Interactive Control** — Start and stop timers directly from the sidebar button!
- **Customizable sessions** — Set custom minutes for focus and break intervals in VS Code settings
- **Progress bar** — Visual progress bar and countdown timer
- **Auto-cycles** — Automatically switches between focus and break phases
- **Alerts** — VS Code notifications when phases end

### ✅ Git Status
Polls your git repository every 10 seconds and displays:
- ✅ **Clean** — no uncommitted changes
- ✏️ **Dirty** — uncommitted changes detected
- ⚠️ **Conflict** — merge conflicts found

### 💬 Motivational Quotes
Displays random coding wisdom and motivation every 10 minutes via a speech bubble above the mascot.

---

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `F1`) and search for **Mascot**:

| Command ID | Title | Description |
|------------|-------|-------------|
| `my-floating-me.startPomodoro` | `Mascot: 🍅 Start Pomodoro` | Starts a Pomodoro focus session. |
| `my-floating-me.stopPomodoro` | `Mascot: 🍅 Stop Pomodoro` | Stops/pauses the active Pomodoro session. |
| `my-floating-me.resetStats` | `Mascot: 📊 Reset Session Stats` | Resets all accumulated session counters (lines, saves, time). |

---

## Configuration Settings

Customize the mascot extension by going to VS Code Settings (`Ctrl+,`) and searching for **My Floating Me**:

| Setting Name | Type | Default | Description |
|--------------|------|---------|-------------|
| `my-floating-me.resetInterval` | `enum` | `"manual"` | How often session stats should automatically reset. Choices: `"manual"`, `"daily"`, `"weekly"`. |
| `my-floating-me.pomodoroFocusDuration` | `integer` | `25` | Duration of Pomodoro focus sessions in minutes. |
| `my-floating-me.pomodoroBreakDuration` | `integer` | `5` | Duration of Pomodoro break sessions in minutes. |

---

## Getting Started

1. Install the extension VSIX.
2. Open the Explorer sidebar — you'll see **"My Floating Me"** at the bottom.
3. Drag it to your preferred position (below Outline/Timeline works great!).
4. Start coding — the mascot will react to your activity in real-time.
5. Use the **🍅 Start Focus** and **📊 Reset Stats** buttons directly in the sidebar for easy control.

---

## Development, Compilation, and Installation

To make changes to the extension, compile, and install it locally:

### 1. Build & Compile TypeScript Code
Compile the TypeScript code using Webpack:
```bash
npm run compile
```

### 2. Package into a VSIX File
Run the VS Code Extension packaging command:
```bash
npx @vscode/vsce package
```
This generates an installer named **`my-floating-me-0.0.1.vsix`** in the root of your project directory.

### 3. Install in VS Code
Open a terminal in the folder where the VSIX is located and run:
```bash
code --install-extension my-floating-me-0.0.1.vsix
```

### 4. Reload Window
Inside VS Code, open the Command Palette (`Ctrl+Shift+P`) and run the **Developer: Reload Window** command to apply the newly compiled changes!
