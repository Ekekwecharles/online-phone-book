package expo.modules.contactwatcher

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ContactWatcherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ContactWatcher")

    // Call after login, and each time the app opens. Safe to call many times.
    Function("start") {
      val context = appContext.reactContext
      if (context != null) {
        ContactWatcher.schedule(context.applicationContext, replace = false)
      }
    }

    // Call on log out.
    Function("stop") {
      val context = appContext.reactContext
      if (context != null) {
        ContactWatcher.cancel(context.applicationContext)
      }
    }
  }
}
