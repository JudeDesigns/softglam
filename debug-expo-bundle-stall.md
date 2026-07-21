# Debug Session: expo-bundle-stall
- **Status**: [OPEN]
- **Issue**: Expo iOS bundle stalls at `99.9%` and Expo Go reports it cannot connect to the development server because the bundle request never completes.
- **Debug Server**: Pending initialization
- **Log File**: `.dbg/trae-debug-log-expo-bundle-stall.ndjson`

## Reproduction Steps
1. Start Expo from `apps/mobile` with `npx expo start --clear`.
2. Open Expo Go on iPhone on the same Wi-Fi.
3. Scan the QR code and wait for the iOS bundle request.
4. Observe Metro stall at `99.9%` and Expo Go fail to load the app.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | A NativeWind/Tailwind child process is failing before returning generated CSS to Metro. | High | Low | Pending |
| B | A Node-readable config/import path used during bundling is crashing only in the Metro worker path. | High | Low | Pending |
| C | A single iOS-only dependency transform is hanging inside Metro after graph resolution. | Medium | Medium | Pending |
| D | Metro is waiting on a stale worker/cache/process rather than application code. | Medium | Low | Pending |

## Log Evidence
- Pending

## Verification Conclusion
- Pending
