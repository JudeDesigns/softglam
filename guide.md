# Debugging Guide: Expo/React Native Build Stuck at 99.9%

## Context
This React Native + Expo project (using an API backend and admin dashboard) consistently
hangs at ~99.9% when running on iOS via Expo. This could be either:
1. The **Metro JS bundler** hanging near the end of bundling, or
2. The **native Xcode build** (via `expo run:ios` or a dev build) hanging near the end of compilation.

Follow this guide top to bottom. Each section tells you what to run, what to look for,
and how to decide whether the issue is fixed or you need to move to the next section.
**Do not skip Step 0** — it determines which half of this guide is relevant.

---

## Step 0: Identify which "99.9%" this is

Run:
```bash
cat package.json | grep -E '"expo"|"react-native"'
npx expo --version
```
Report the actual Expo SDK version and React Native version found (note: SDK numbers are
typically in the 49–53 range as of mid-2026; if the version doesn't match a real published
SDK, flag it — package.json may be misconfigured).

Then start the project and watch the terminal output carefully:
```bash
EXPO_DEBUG=true npx expo start -c --ios
```

Determine which type of hang this is:
- **Type A (Metro/JS bundler)**: terminal shows something like `Building JavaScript bundle [=========] 99.9%` and freezes there.
- **Type B (Native/Xcode build)**: terminal/Xcode shows native compiler steps (e.g. `Compiling`, `Linking`, `Codegen`, pod-related steps) and freezes there — this happens with `npx expo run:ios` or when building a dev client.

Record which type it is before proceeding. If unsure, paste the last 20-30 lines of
terminal output before the freeze and use that to decide.

---

## PATH A: Metro / JS Bundler Hang

### A1. Clear all caches (fixes this a large percentage of the time)
```bash
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf node_modules/.cache
rm -rf .expo
npx expo start -c
```
Retest. If fixed, stop here and document that a stale cache was the cause.

### A2. Check for circular imports
Circular `require`/`import` chains (especially through barrel files like `index.ts` that
re-export many modules) can stall Metro's dependency graph resolution without throwing
an explicit error.

- Search for barrel files: `find . -name "index.ts" -o -name "index.tsx" -o -name "index.js" | grep -v node_modules`
- Use `madge` to detect circular dependencies:
  ```bash
  npx madge --circular --extensions ts,tsx,js,jsx ./src
  ```
- If circular dependencies are found, list them and refactor the offending imports to
  remove the cycle (e.g., import directly from the source file instead of the barrel).

### A3. Check for oversized or pathological dependencies
Some libraries (moment.js with all locales, unoptimized lodash imports, full firebase JS SDK)
can make the last module transform take disproportionately long, appearing as a hang
rather than a percentage increase.

- Run a bundle size / dependency analysis:
  ```bash
  npx expo export --platform ios --output-dir /tmp/export-analysis
  ```
  Check `/tmp/export-analysis` for unusually large bundle output.
- Search `package.json` for known heavy offenders: `moment`, `lodash` (full import, not `lodash/specificFn`), `firebase` (full SDK vs modular v9+ imports), any large local JSON/data files bundled into the app.

### A4. File watcher limits (Linux/WSL, sometimes macOS)
```bash
# check current watch limit
cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo "N/A on this OS"

# if low, raise it (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### A5. Check for synced/monitored folders interfering
If the project directory lives inside a cloud-sync folder (OneDrive, iCloud Drive, Dropbox,
Google Drive) or is scanned live by antivirus software, file locks during the build can
cause exactly this symptom.
- Confirm the project's absolute path.
- If it is inside a synced folder, move the project outside of it (e.g., to `~/dev/`) and retest.

### A6. Bisection (only if A1–A5 don't resolve it)
Systematically narrow down which file/module triggers the hang:
1. Comment out roughly half of the screens/navigators/imports from the app's entry point.
2. Rebuild with `npx expo start -c`. Does it still hang?
3. Repeat, narrowing the remaining half each time, until the specific file or import
   causing the hang is isolated.
4. Once isolated, inspect that file for circular imports, infinite loops in module-level
   code, or synchronous heavy computation run at import time (not inside a component/function).

---

## PATH B: Native / Xcode Build Hang

### B1. Clean native build artifacts and reinstall pods
```bash
cd ios
rm -rf build Pods Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod install --repo-update
cd ..
npx expo run:ios
```
Retest. If fixed, stop here.

### B2. Check New Architecture (Fabric/TurboModules) compatibility
Expo SDK 52+ enables the New Architecture by default. Native modules not yet fully
compatible with Fabric/TurboModules are a common cause of native build hangs, particularly
during codegen or linking steps.

Temporarily disable New Architecture in `app.json` (or `app.config.js`):
```json
{
  "expo": {
    "newArchEnabled": false
  }
}
```
Then:
```bash
cd ios && pod install && cd ..
npx expo run:ios
```
- If the hang disappears with New Architecture disabled: the root cause is a native
  dependency incompatible with Fabric. List all native dependencies in `package.json`
  (anything with native iOS code, not pure JS) and check each one's GitHub repo/changelog
  for New Architecture support status. Either update the incompatible library to a
  compatible version, replace it, or keep New Architecture disabled as a workaround.
- If the hang persists with New Architecture disabled: proceed to B3.

### B3. Check Hermes engine compilation
If using Hermes (default in most modern Expo apps), a large or complex JS bundle can make
Hermes bytecode compilation take a very long time, which can look like a hang. Verify:
```bash
grep -A2 "jsEngine" app.json app.config.js 2>/dev/null
```
Try switching to JSC temporarily to see if the hang is Hermes-specific (only for diagnosis,
not necessarily a long-term fix):
```json
{
  "expo": {
    "jsEngine": "jsc"
  }
}
```
Rebuild and compare.

### B4. Check CocoaPods / codegen output directly
Run the underlying xcodebuild command with verbose output to see exactly which build step
is hanging, rather than relying on Expo CLI's wrapper output:
```bash
cd ios
xcodebuild -workspace *.xcworkspace -scheme <YourSchemeName> -configuration Debug -sdk iphonesimulator build -verbose
```
Report the exact last build step or file being compiled when it stalls — this pinpoints
whether it's a specific native module, codegen, or the linking phase.

### B5. Check for excessively large/numerous native assets
Check `ios/<AppName>/Images.xcassets` and any bundled fonts/media for unusually large
files that could slow down the asset-processing build phase:
```bash
find ios -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.ttf" \) -size +5M
```

---

## Reporting back

After going through the relevant path, report:
1. Which path (A or B) applied.
2. Which specific step resolved it (or confirm none did).
3. If unresolved after all steps: the exact last lines of terminal/build output before
   the freeze, the Expo SDK/RN version, and a list of native dependencies from `package.json`.