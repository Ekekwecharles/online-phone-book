package expo.modules.contactwatcher

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.ListenableWorker
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import androidx.work.WorkerParameters

/**
 * Runs when the phone's contacts changed.
 *
 * It asks Android to run Expo's own background worker (from expo-background-task) one time now.
 * That worker starts our JS job "phonebook-sync", which saves the contacts online.
 * If the app is open, Expo skips the job. The app saves by itself in that case.
 *
 * We find Expo's worker by its class name, so this code does not need to be built against it.
 * If a future Expo version renames it, we log a message and do nothing. Nothing crashes.
 */
class ContactChangeWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
  companion object {
    private val TAG = ContactChangeWorker::class.java.simpleName
    private const val EXPO_WORKER = "expo.modules.backgroundtask.BackgroundTaskWork"
    private const val RUN_NAME = "phonebook_run_sync"
  }

  override suspend fun doWork(): Result {
    try {
      runExpoWorker()
    } catch (e: Exception) {
      Log.w(TAG, "Could not start the saving job: ${e.javaClass.simpleName}")
    }
    // Ask Android to wake us again for the next change.
    ContactWatcher.schedule(applicationContext, replace = true)
    return Result.success()
  }

  private fun runExpoWorker() {
    val worker = try {
      Class.forName(EXPO_WORKER).asSubclass(ListenableWorker::class.java)
    } catch (e: ClassNotFoundException) {
      Log.w(TAG, "Expo background worker not found. Contacts will save when the app opens.")
      return
    }
    val request = OneTimeWorkRequest.Builder(worker)
      .setInputData(Data.Builder().putString("appScopeKey", applicationContext.packageName).build())
      .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
      .build()
    // If a save is already running, this one waits for it. A change is never lost.
    WorkManager.getInstance(applicationContext).enqueueUniqueWork(RUN_NAME, ExistingWorkPolicy.APPEND_OR_REPLACE, request)
  }
}
