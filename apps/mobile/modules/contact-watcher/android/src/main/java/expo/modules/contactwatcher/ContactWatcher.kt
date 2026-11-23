package expo.modules.contactwatcher

import android.content.Context
import android.provider.ContactsContract
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

/**
 * Asks Android to wake us when the phone's contacts change, even if the app is closed.
 *
 * Android only allows one wake-up per request. So after each wake-up we ask again.
 * We also need the internet. If there is none, Android waits, then wakes us when it returns.
 */
object ContactWatcher {
  const val WORK_NAME = "phonebook_contact_watcher"

  /** replace = false: keep the request we already have. replace = true: used after a wake-up. */
  fun schedule(context: Context, replace: Boolean) {
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .addContentUriTrigger(ContactsContract.Contacts.CONTENT_URI, true)
      // Wait 10 seconds of quiet, so one edit is not many wake-ups. Never wait more than 2 minutes.
      .setTriggerContentUpdateDelay(10, TimeUnit.SECONDS)
      .setTriggerContentMaxDelay(2, TimeUnit.MINUTES)
      .build()

    val request = OneTimeWorkRequestBuilder<ContactChangeWorker>()
      .setConstraints(constraints)
      .build()

    WorkManager.getInstance(context).enqueueUniqueWork(
      WORK_NAME,
      if (replace) ExistingWorkPolicy.REPLACE else ExistingWorkPolicy.KEEP,
      request
    )
  }

  fun cancel(context: Context) {
    WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
  }
}
