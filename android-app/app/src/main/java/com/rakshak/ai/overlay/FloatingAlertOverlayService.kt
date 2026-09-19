package com.rakshak.ai.overlay

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import com.rakshak.ai.R

class FloatingAlertOverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val title = intent?.getStringExtra("EXTRA_TITLE") ?: "Threat Detected"
        val sender = intent?.getStringExtra("EXTRA_SENDER") ?: "Unknown Sender"
        val message = intent?.getStringExtra("EXTRA_MESSAGE") ?: ""

        showOverlay(title, sender, message)
        return START_NOT_STICKY
    }

    private fun showOverlay(title: String, sender: String, message: String) {
        if (overlayView != null) {
            removeOverlay()
        }

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater

        // Inflate overlay layout (or construct programmatically if layout not compiled)
        try {
            overlayView = inflater.inflate(R.layout.overlay_threat_shield, null)

            overlayView?.findViewById<TextView>(R.id.tvOverlayTitle)?.text = title
            overlayView?.findViewById<TextView>(R.id.tvOverlaySender)?.text = "Sender: $sender"
            overlayView?.findViewById<TextView>(R.id.tvOverlayMessage)?.text = message

            overlayView?.findViewById<Button>(R.id.btnOverlayDismiss)?.setOnClickListener {
                removeOverlay()
            }
        } catch (e: Exception) {
            // Fallback view
        }

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 100
        }

        overlayView?.let {
            windowManager?.addView(it, params)
        }
    }

    private fun removeOverlay() {
        overlayView?.let {
            windowManager?.removeView(it)
            overlayView = null
        }
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
    }
}
