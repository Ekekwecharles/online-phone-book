import { requireOptionalNativeModule } from "expo";

type Native = { start(): void; stop(): void };

// Only exists on Android builds. On iPhone and web the calls do nothing.
const native = requireOptionalNativeModule<Native>("ContactWatcher");

/** Android: wake the app's saving job when contacts change, even if the app is closed. */
export function startContactWatcher() {
  try {
    native?.start();
  } catch {}
}

export function stopContactWatcher() {
  try {
    native?.stop();
  } catch {}
}
