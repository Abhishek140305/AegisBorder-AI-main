package com.rakshak.ai.ui

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.rakshak.ai.R
import com.rakshak.ai.engine.ApkInspector
import com.rakshak.ai.engine.NativeBloomFilter
import com.rakshak.ai.engine.UpiQrDetector
import com.rakshak.ai.engine.UrlDetector

class MainActivity : AppCompatActivity() {

    private val bloomFilter = NativeBloomFilter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnNotificationPermission = findViewById<Button>(R.id.btnGrantNotificationAccess)
        val btnOverlayPermission = findViewById<Button>(R.id.btnGrantOverlayAccess)
        val tvStatus = findViewById<TextView>(R.id.tvProtectionStatus)
        val tvResult = findViewById<TextView>(R.id.tvScanResult)

        btnNotificationPermission?.setOnClickListener {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            startActivity(intent)
            Toast.makeText(this, "Enable 'Rakshak AI' in notification access", Toast.LENGTH_LONG).show()
        }

        btnOverlayPermission?.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(intent)
                } else {
                    Toast.makeText(this, "Floating Overlay Permission already active!", Toast.LENGTH_SHORT).show()
                }
            }
        }

        val etUrl = findViewById<EditText>(R.id.etUrlInput)
        findViewById<Button>(R.id.btnScanUrl)?.setOnClickListener {
            val input = etUrl?.text.toString()
            if (input.isBlank()) {
                toast("Paste a URL to scan")
                return@setOnClickListener
            }
            val hostname = UrlDetector.parseHostname(input).first
            val inBloom = bloomFilter.contains(hostname)
            val result = UrlDetector.inspectUrl(input, inBloom)
            showResult(tvResult, buildString {
                append("URL SCAN RESULT\n")
                append("Domain: ${result.domain}\n")
                append(riskLine(result.riskScore))
                append(result.explanationHi + "\n\n")
                result.reasons.forEach { append("• $it\n") }
                if (result.spoofedTarget != null) {
                    append("Mimics: ${result.spoofedTarget} (Off: ${result.officialDomain})\n")
                }
                append("Call 1930 (National Cyber Helpline)\n")
            })
        }

        val etUpi = findViewById<EditText>(R.id.etUpiInput)
        findViewById<Button>(R.id.btnScanUpi)?.setOnClickListener {
            val input = etUpi?.text.toString()
            if (input.isBlank()) {
                toast("Paste a UPI payload or VPA to scan")
                return@setOnClickListener
            }
            val vpaCheck = extractVpa(input)
            val inBloom = bloomFilter.contains(vpaCheck)
            val result = UpiQrDetector.parseUpiPayload(input, inBloom)
            if (result == null) {
                toast("Not a valid UPI payload or VPA")
                return@setOnClickListener
            }
            showResult(tvResult, buildString {
                append("UPI / QR SCAN RESULT\n")
                append("VPA: ${result.vpa}\n")
                append("Payee: ${result.payeeName}\n")
                if (result.amount != null) append("Amount: ₹${result.amount}\n")
                append(riskLine(result.riskScore))
                append(result.frictionMessageHi + "\n\n")
                result.riskReasons.forEach { append("• $it\n") }
            })
        }

        val etApk = findViewById<EditText>(R.id.etApkInput)
        findViewById<Button>(R.id.btnScanApk)?.setOnClickListener {
            val input = etApk?.text.toString()
            if (input.isBlank()) {
                toast("Paste an APK URL or package name to scan")
                return@setOnClickListener
            }
            val result = ApkInspector.inspectApk(input)
            if (result == null) {
                toast("Invalid APK identifier")
                return@setOnClickListener
            }
            showResult(tvResult, buildString {
                append("APK SCAN RESULT\n")
                append("App: ${result.appName}\n")
                append("Package: ${result.packageName}\n")
                append(riskLine(result.riskScore))
                if (result.isRatThreat) append("⚠️ RAT MALWARE DETECTED\n")
                append(result.warningHi + "\n\n")
                result.permissions.forEach { append("• [${it.severity}] ${it.name}\n") }
            })
        }

        updateStatus(tvStatus)
    }

    override fun onResume() {
        super.onResume()
        findViewById<TextView>(R.id.tvProtectionStatus)?.let { updateStatus(it) }
    }

    private fun updateStatus(tvStatus: TextView) {
        val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else true

        if (hasOverlay) {
            tvStatus.text = "🛡️ ON-DEVICE PROTECTION: ACTIVE"
            tvStatus.setTextColor(getColor(android.R.color.holo_green_light))
        } else {
            tvStatus.text = "⚠️ SETUP REQUIRED: GRANT PERMISSIONS"
            tvStatus.setTextColor(getColor(android.R.color.holo_orange_light))
        }
    }

    private fun showResult(tv: TextView?, text: String) {
        tv?.text = text
        tv?.visibility = TextView.VISIBLE
    }

    private fun extractVpa(input: String): String {
        val raw = input.trim()
        if (raw.startsWith("upi://pay")) {
            val pa = raw.substringAfter("?", "")
                .split("&")
                .firstOrNull { it.startsWith("pa=", ignoreCase = true) }
                ?.substringAfter("=")
            if (pa != null) {
                return android.net.Uri.decode(pa)
            }
        }
        return raw
    }

    private fun riskLine(score: Int): String {
        return if (score >= 85) "🚨 RISK LEVEL: CRITICAL ($score)\n"
        else if (score >= 70) "⚠️ RISK LEVEL: HIGH ($score)\n"
        else if (score >= 40) "⚠️ RISK LEVEL: MEDIUM ($score)\n"
        else "✅ RISK LEVEL: SAFE ($score)\n"
    }

    private fun toast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }
}
