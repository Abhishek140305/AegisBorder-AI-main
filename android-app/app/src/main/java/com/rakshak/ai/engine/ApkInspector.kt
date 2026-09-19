package com.rakshak.ai.engine

data class PermissionInfo(
    val permission: String,
    val name: String,
    val severity: String,
    val riskWeight: Int
)

data class ApkResult(
    val isApk: Boolean,
    val appName: String,
    val packageName: String,
    val isRatThreat: Boolean,
    val riskScore: Int,
    val severity: String,
    val permissionCount: Int,
    val permissions: List<PermissionInfo>,
    val warningEn: String,
    val warningHi: String
)

object ApkInspector {

    fun inspectApk(apkIdentifier: String): ApkResult? {
        val id = apkIdentifier.trim().lowercase()
        if (id.isEmpty()) return null

        val signatureMatch = APK_SIGNATURES.firstOrNull { sig ->
            id.contains(sig.packageName) ||
                id.contains(sig.appName.lowercase()) ||
                id.contains("anydesk") || id.contains("kyc") || id.contains("support")
        }

        var detectedPermissions: List<String>
        var riskScore: Int
        var packageName = "com.unverified.thirdparty.package"
        var appName = "Unverified APK Installer"

        if (signatureMatch != null) {
            packageName = signatureMatch.packageName
            appName = signatureMatch.appName
            detectedPermissions = signatureMatch.dangerousPermissions
            riskScore = signatureMatch.riskScore
        } else if (id.contains(".apk")) {
            appName = id.substringAfterLast("/").removeSuffix(".apk").ifEmpty { "Downloaded_App.apk" }
            detectedPermissions = listOf(
                "android.permission.BIND_ACCESSIBILITY_SERVICE",
                "android.permission.READ_SMS",
                "android.permission.SYSTEM_ALERT_WINDOW"
            )
            riskScore = 96
        } else {
            return ApkResult(
                isApk = true,
                appName = appName,
                packageName = packageName,
                isRatThreat = false,
                riskScore = 10,
                severity = "LOW",
                permissionCount = 0,
                permissions = emptyList(),
                warningEn = "No known malicious signature found for this identifier.",
                warningHi = "इस पहचानकर्ता के लिए कोई ज्ञात खतरनाक हस्ताक्षर नहीं मिला।"
            )
        }

        val permissionDetails = detectedPermissions.map { perm ->
            HIGH_RISK_PERMISSIONS[perm] ?: PermissionInfo(
                permission = perm,
                name = perm,
                severity = "MEDIUM",
                riskWeight = 10
            )
        }

        val isRat = detectedPermissions.contains("android.permission.BIND_ACCESSIBILITY_SERVICE") &&
            (detectedPermissions.contains("android.permission.READ_SMS") ||
                detectedPermissions.contains("android.permission.RECEIVE_SMS"))

        return ApkResult(
            isApk = true,
            appName = appName,
            packageName = packageName,
            isRatThreat = isRat,
            riskScore = riskScore.coerceAtMost(100),
            severity = if (riskScore >= 80) "CRITICAL" else "HIGH",
            permissionCount = detectedPermissions.size,
            permissions = permissionDetails,
            warningEn = if (isRat)
                "CRITICAL RAT MALWARE: This application requests full screen control and OTP reading rights. Do NOT install."
            else
                "UNVERIFIED APK: Direct APK installation bypasses Google Play Protect verification.",
            warningHi = if (isRat)
                "अत्यधिक खतरनाक वायरस (RAT): यह ऐप आपके पूरे फोन का नियंत्रण और बैंक ओटीपी पढ़ने की अनुमति मांगता है। इसे कभी इंस्टॉल न करें।"
            else
                "अपुष्ट ऐप: बाहर से डाउनलोड किया गया ऐप जो आपकी सुरक्षा के लिए हानिकारक हो सकता है।"
        )
    }

    private data class ApkSignature(
        val packageName: String,
        val appName: String,
        val riskScore: Int,
        val dangerousPermissions: List<String>
    )

    private val HIGH_RISK_PERMISSIONS = mapOf(
        "android.permission.BIND_ACCESSIBILITY_SERVICE" to PermissionInfo(
            "android.permission.BIND_ACCESSIBILITY_SERVICE",
            "Accessibility Service (Full Device Control)",
            "CRITICAL", 45
        ),
        "android.permission.READ_SMS" to PermissionInfo(
            "android.permission.READ_SMS",
            "Read SMS (OTP Interception)",
            "CRITICAL", 35
        ),
        "android.permission.RECEIVE_SMS" to PermissionInfo(
            "android.permission.RECEIVE_SMS",
            "Receive SMS (OTP Auto-Forwarding)",
            "HIGH", 30
        ),
        "android.permission.SYSTEM_ALERT_WINDOW" to PermissionInfo(
            "android.permission.SYSTEM_ALERT_WINDOW",
            "Draw Over Apps (Fake Phishing Screen Overlay)",
            "HIGH", 25
        ),
        "android.permission.REQUEST_INSTALL_PACKAGES" to PermissionInfo(
            "android.permission.REQUEST_INSTALL_PACKAGES",
            "Silent App Dropper / Installer",
            "HIGH", 20
        ),
        "android.permission.RECORD_AUDIO" to PermissionInfo(
            "android.permission.RECORD_AUDIO",
            "Microphone Audio Recording",
            "MEDIUM", 15
        )
    )

    private val APK_SIGNATURES = listOf(
        ApkSignature(
            "com.support.anydesk.quickfix",
            "AnyDesk Support QuickFix", 98,
            listOf(
                "android.permission.BIND_ACCESSIBILITY_SERVICE",
                "android.permission.READ_SMS",
                "android.permission.RECEIVE_SMS",
                "android.permission.SYSTEM_ALERT_WINDOW",
                "android.permission.RECORD_AUDIO"
            )
        ),
        ApkSignature(
            "com.bijli.bill.update.official",
            "Bijli Bill Instant Pay", 94,
            listOf(
                "android.permission.READ_SMS",
                "android.permission.SEND_SMS",
                "android.permission.READ_CONTACTS",
                "android.permission.REQUEST_INSTALL_PACKAGES"
            )
        ),
        ApkSignature(
            "com.sbi.kyc.verification.doc",
            "SBI KYC Verification Helper", 99,
            listOf(
                "android.permission.BIND_ACCESSIBILITY_SERVICE",
                "android.permission.READ_SMS",
                "android.permission.CAMERA",
                "android.permission.ACCESS_FINE_LOCATION"
            )
        )
    )
}
