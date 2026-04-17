# Track Workout — Expo React Native App

A mobile workout tracking app built with Expo and React Native. Runs on Android and iOS phones and tablets.

**Expo** is a framework that makes React Native development easier — it handles a lot of the complex native setup for you. This is the recommended mobile app if you're new to React Native.

## What You Need

Before starting, install these if you don't already have them:

1. **Node.js** (version 18 or later) — [download here](https://nodejs.org/)
   - This also installs **npm**, the package manager
2. **Git** — [download here](https://git-scm.com/)

You also need **one** of the following to run the app:

- **A physical Android or iOS phone** with the [Expo Go](https://expo.dev/go) app installed (free from the App Store or Google Play Store)
- **Android Studio** with an Android emulator — [setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?mode=development-build&buildEnv=local&platform=android)
- **Xcode** (macOS only) with an iOS simulator — [setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?mode=development-build&buildEnv=local&platform=ios)

The easiest option is using a physical phone with Expo Go — no emulator setup required.

## Getting Started

### Step 1: Get the code

```bash
git clone https://github.com/blaine-2050/track-workout.git
cd track-workout/apps/android-react-native
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Start the development server

```bash
npm start
```

This starts the Expo development server and displays a QR code in your terminal.

### Step 4: Open the app on your device

**On a physical phone (recommended for beginners):**
1. Install the **Expo Go** app from your phone's app store
2. Open your phone's camera and scan the QR code shown in the terminal
3. The app will load inside Expo Go

**On an Android emulator:**
1. Make sure Android Studio is installed and an emulator is running
2. Press `a` in the terminal where the Expo server is running

**On an iOS simulator (macOS only):**
1. Make sure Xcode is installed
2. Press `i` in the terminal where the Expo server is running

## How to Use the App

### Starting a Workout

1. When you first open the app, you'll see a login screen — tap **Use Offline Mode** to skip login
2. Select an exercise from the dropdown (e.g. "Bench Press", "Squat")
3. A workout starts automatically when you select your first exercise

### Logging a Set

1. The **numeric keypad** fills the screen at the bottom — tap numbers to enter the weight
2. Tap the **Reps** field to switch to reps entry
3. Enter the number of reps
4. Tap **Log** to record the set

### Sticky Inputs

After logging, weight and reps stay filled in (highlighted in yellow). This lets you quickly log another identical set. Start typing to replace the values.

### Timers

- **Workout timer**: total workout duration (top of screen)
- **Set timer**: time since your last log (useful for tracking rest between sets)

### Interval/Cardio Mode

For cardio exercises (MTB, Elliptical, Treadmill), the input switches to a time entry format (hours:minutes:seconds) instead of weight/reps.

### Stopping a Workout

Tap **Stop** in the status bar at the top. The app shows a workout summary with total duration, number of sets, and total weight moved.

### Exporting Your Log

Tap the **share icon** in the status bar to:
- **Copy** your workout log to the clipboard
- **Share** via your phone's share sheet (text messages, email, notes, etc.)
- **Remote DB** — coming soon

### Switching Units

Toggle between **kg** and **lbs** using the unit buttons next to the set timer.

## Project Structure

```
android-react-native/
├── api/                  # API client for server communication
├── components/           # UI components
│   ├── WorkoutScreen.tsx     # Main screen with all workout logic
│   ├── WorkoutStatusBar.tsx  # Top bar (title, Start/Stop, export)
│   ├── EventHistory.tsx      # Workout log display with grouping
│   ├── NumericKeypad.tsx     # Number pad with haptic feedback
│   ├── MoveSelector.tsx      # Exercise picker
│   └── IntervalEntry.tsx     # Time input for cardio exercises
├── utils/                # Shared helper functions
│   └── formatElapsed.ts      # Human-readable time formatting
├── types/                # TypeScript type definitions
│   └── index.ts
├── App.tsx               # App entry point
└── package.json
```

## Other Commands

| Command | What it does |
|---------|-------------|
| `npm start` | Start the Expo development server |
| `npm run android` | Start and open on Android emulator |
| `npm run ios` | Start and open on iOS simulator |
| `npm run typecheck` | Check for TypeScript type errors |

## Troubleshooting

**"command not found: npm"**
Node.js is not installed. Download it from [nodejs.org](https://nodejs.org/).

**QR code doesn't work on my phone**
Make sure your phone and computer are on the same WiFi network. If that doesn't help, try pressing `s` in the terminal to switch to "tunnel" mode, which works across different networks.

**"Unable to resolve module" errors**
Run `npm install` to make sure all dependencies are downloaded.

**App crashes on launch**
Try clearing the Expo cache: `npx expo start --clear`

**Emulator not detected**
Make sure the emulator is fully booted before pressing `a` or `i` in the terminal.

## Tech Stack

For those interested in the technical details:

- **Expo** (v54) — managed React Native framework with simplified tooling
- **React Native** — cross-platform mobile UI framework
- **TypeScript** — JavaScript with type safety
- **AsyncStorage** — local on-device data persistence
- **expo-haptics** — vibration feedback on keypad taps
- **expo-clipboard** — copy text to clipboard
