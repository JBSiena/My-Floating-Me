# My Floating Me 🐾

Your personal coding mascot companion that lives in the VS Code sidebar — tracking your stats, keeping streaks, running pomodoro timers, monitoring git status, and keeping you motivated with quotes!

## Features

### 🎭 Reactive Mascot
- **Typing companion** — the mascot gently bounces while you type and rests when you're idle
- **Celebrates saves** — waves every time you save a file
- **Blinks randomly** — subtle idle animations keep it feeling alive

### 📊 Session Stats
Tracks your coding session in real-time:
- **Lines added** — total new lines written this session
- **Files saved** — how many times you've saved
- **Time coded** — elapsed session duration

### 🔥 Coding Streak
Monitors how long you've been continuously coding and celebrates milestones at 10min, 30min, 1hr, and 2hr marks with notifications and animations.

### 🍅 Pomodoro Timer
Built-in focus/break timer:
- **25 minutes focus** + **5 minutes break** cycles
- Visual progress bar and countdown timer
- Auto-cycles between focus and break phases
- VS Code notifications when phases end

### ✅ Git Status
Polls your git repository every 10 seconds and displays:
- ✅ **Clean** — no uncommitted changes
- ✏️ **Dirty** — uncommitted changes detected
- ⚠️ **Conflict** — merge conflicts found

### 💬 Motivational Quotes
Displays random coding wisdom and motivation every 10 minutes via a speech bubble above the mascot.

## Commands

Open the Command Palette (`Ctrl+Shift+P`) and type "Mascot":

| Command | Description |
|---------|-------------|
| `Mascot: 🍅 Start Pomodoro` | Start a 25-min focus session |
| `Mascot: 🍅 Stop Pomodoro` | Stop the current pomodoro |
| `Mascot: 📊 Reset Session Stats` | Reset all session counters |

## Getting Started

1. Install the extension
2. Open the Explorer sidebar — you'll see **"My Floating Me"** at the bottom
3. Drag it to your preferred position (below Outline/Timeline works great!)
4. Start coding — the mascot will react to your activity

## License

MIT

## Compile and Installation

Run this to your terminal:

**npx @vscode/vsce package**

then it will generate file named **my-floating-me-0.0.1.vsix**

run this to your folder where **my-floating-me-0.0.1.vsix** is located

**code --install-extension my-floating-me-0.0.1.vsix**