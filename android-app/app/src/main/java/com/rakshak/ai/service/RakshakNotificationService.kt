package com.rakshak.ai.service

import android.app.Notification
import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.rakshak.ai.engine.ContactsWhitelistHelper
import com.rakshak.ai.engine.IndicNlpEngine
import com.rakshak.ai.engine.NativeBloomFilter
import com.rakshak.ai.overlay.FloatingAlertOverlayService
import com.rakshak.ai.voice.RegionalVoiceSpeaker

class RakshakNotificationService : NotificationListenerService() {

    private val bloomFilter = NativeBloomFilter()
    private var voiceSpeaker: RegionalVoiceSpeaker? = null

    companion object {
        private const val TAG = "RakshakService"
        private val TARGET_PACKAGES = setOf(
            "com.whatsapp",
            "com.whatsapp.w4b",
            "com.google.android.apps.messaging",
            "com.android.mms",
            "org.telegram.messenger"
        )
    }

    override fun onCreate() {
        super.onCreate()
        voiceSpeaker = RegionalVoiceSpeaker(this)
        Log.i(TAG, "RakshakNotificationService started in background.")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName
        if (!TARGET_PACKAGES.contains(packageName)) return

        val extras = sbn.notification.extras ?: return
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        if (text.isBlank()) return

        // 1. Check if sender is in saved contacts (Privacy Guard)
        val isSavedContact = ContactsWhitelistHelper.isSavedContact(this, title)
        if (isSavedContact) {
            Log.d(TAG, "Notification from saved contact '$title'. Bypassing deep scan for privacy.")
            return
        }

        Log.w(TAG, "Intercepted message from UNKNOWN sender: '$title'. Running on-device defense.")

        // 2. Perform Sub-2ms On-Device Indic NLP & Bloom Filter Analysis
        val nlpResult = IndicNlpEngine.analyze(text, "hi")
        val containsMaliciousUrl = nlpResult.matchedUrls.any { bloomFilter.contains(it) }

        if (nlpResult.isThreat || containsMaliciousUrl) {
            Log.e(TAG, "DANGER DETECTED from unknown sender '$title': ${nlpResult.title}")

            // 3. Play immediate regional spoken voice alert
            val alertVoice = if (nlpResult.voiceMessage.isNotBlank()) {
                nlpResult.voiceMessage
            } else {
                "सावधान! अज्ञात नंबर से खतरनाक लिंक आया है। इसे न खोलें।"
            }
            voiceSpeaker?.speak(alertVoice, "hi")

            // 4. Launch Floating Alert Shield over WhatsApp / SMS
            val overlayIntent = Intent(this, FloatingAlertOverlayService::class.java).apply {
                putExtra("EXTRA_TITLE", nlpResult.title)
                putExtra("EXTRA_SENDER", title)
                putExtra("EXTRA_MESSAGE", text)
                putExtra("EXTRA_RISK_SCORE", nlpResult.riskScore)
            }
            startService(overlayIntent)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        voiceSpeaker?.shutdown()
    }
}
