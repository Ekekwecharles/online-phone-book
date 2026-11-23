import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { runSync } from "./sync";

export const SYNC_TASK = "phonebook-sync";

// The phone wakes the app now and then (about every 15 minutes or more) to run this.
// This must be defined when the app loads, before any screen.
TaskManager.defineTask(SYNC_TASK, async () => {
  try {
    const s = await runSync();
    return s.state === "error" ? BackgroundTask.BackgroundTaskResult.Failed : BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
