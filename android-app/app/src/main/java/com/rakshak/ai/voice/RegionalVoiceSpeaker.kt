package com.rakshak.ai.voice

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.Locale

class RegionalVoiceSpeaker(context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = TextToSpeech(context.applicationContext, this)
    private var isReady = false

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts?.setLanguage(Locale("hi", "IN"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.language = Locale.ENGLISH
            }
            tts?.setSpeechRate(0.9f) // Slower pace for rural comprehension
            isReady = true
        }
    }

    fun speak(text: String, languageCode: String = "hi") {
        if (!isReady || text.isBlank()) return

        when (languageCode.lowercase()) {
            "hi" -> tts?.language = Locale("hi", "IN")
            "ta" -> tts?.language = Locale("ta", "IN")
            "te" -> tts?.language = Locale("te", "IN")
            "mr" -> tts?.language = Locale("mr", "IN")
            "bn" -> tts?.language = Locale("bn", "IN")
            else -> tts?.language = Locale.ENGLISH
        }

        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "RakshakAlertUtterance")
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
    }
}
