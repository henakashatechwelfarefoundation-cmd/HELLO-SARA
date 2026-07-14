package com.emergent.completepromptpdf

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Foreground service that keeps the microphone hot for wake-word detection.
 *
 * Load a small Porcupine / Snowboy model at start-up and, on trigger,
 * broadcast a `com.hellosara.WAKE` intent for the JS side to consume via
 * an expo-notifications or expo-modules bridge.
 *
 * NOTE: This is a scaffold. Add your wake-word engine of choice
 * (Porcupine is battery-efficient and free for personal use, Vosk is
 * fully open-source). Neither is bundled here — plug it in during
 * your `eas build` step.
 */
class WakeWordService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "hello_sara_wake"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(channelId, "Sara listening", NotificationManager.IMPORTANCE_LOW)
            mgr.createNotificationChannel(channel)
        }
        val notif = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Sara")
            .setContentText("Listening for \"Hey Sara\"")
            .setOngoing(true)
            .build()
        startForeground(1042, notif)

        // TODO: initialise Porcupine / Vosk here and register the callback that
        // broadcasts `com.hellosara.WAKE` when the wake word fires.

        return START_STICKY
    }
}
