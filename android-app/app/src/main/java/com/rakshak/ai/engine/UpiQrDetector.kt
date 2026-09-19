package com.rakshak.ai.engine

import java.net.URLDecoder

data class UpiResult(
    val isThreat: Boolean,
    val riskScore: Int,
    val vpa: String,
    val payeeName: String,
    val amount: Double?,
    val transactionNote: String,
    val riskReasons: List<String>,
    val hasDeceptiveIntent: Boolean,
    val frictionMessageEn: String,
    val frictionMessageHi: String
)

object UpiQrDetector {

    private val DECEPTIVE_KEYWORDS = listOf(
        "cashback", "reward", "refund", "winner", "lottery", "prize", "gift", "claim", "bonus"
    )

    fun parseUpiPayload(payload: String, isInBloom: Boolean = false): UpiResult? {
        val raw = payload.trim()
        if (raw.isEmpty()) return null

        var vpa = ""
        var payeeName = "Unknown Merchant / Receiver"
        var amount: Double? = null
        var transactionNote = ""

        if (raw.startsWith("upi://pay")) {
            val query = raw.substringAfter("?", "")
            val params = query.split("&")
            for (param in params) {
                val parts = param.split("=", limit = 2)
                if (parts.size != 2) continue
                val key = parts[0].lowercase()
                val value = safeDecode(parts[1])
                when (key) {
                    "pa" -> vpa = value
                    "pn" -> payeeName = value
                    "am" -> amount = value.toDoubleOrNull()
                    "tn" -> transactionNote = value
                }
            }
        } else if (raw.contains("@")) {
            vpa = raw
        } else {
            return null
        }

        val hasDeceptiveIntent = DECEPTIVE_KEYWORDS.any { kw ->
            vpa.contains(kw, ignoreCase = true) ||
                payeeName.contains(kw, ignoreCase = true) ||
                transactionNote.contains(kw, ignoreCase = true)
        }

        var riskScore = 10
        val riskReasons = mutableListOf<String>()

        if (isInBloom) {
            riskScore = 99
            riskReasons.add("VPA is listed on the National Fraud & Sybil Registry.")
        }
        if (hasDeceptiveIntent) {
            riskScore = maxOf(riskScore, 92)
            riskReasons.add("Deceptive 'Cashback/Reward' name detected to lure user into completing a payment.")
        }
        if (amount != null && hasDeceptiveIntent) {
            riskScore = maxOf(riskScore, 98)
            riskReasons.add("Automated ₹${amount} DEBIT transaction disguised as reward claim.")
        }

        val isThreat = riskScore >= 70

        return UpiResult(
            isThreat = isThreat,
            riskScore = riskScore,
            vpa = vpa,
            payeeName = payeeName,
            amount = amount,
            transactionNote = transactionNote,
            riskReasons = riskReasons,
            hasDeceptiveIntent = hasDeceptiveIntent,
            frictionMessageEn = if (amount != null)
                "DANGER: This QR/link will DEDUCT ₹$amount from YOUR bank account. UPI PIN is NEVER needed to receive money!"
            else
                "DANGER: You are about to initiate a payment to $payeeName. You cannot receive money by scanning this code!",
            frictionMessageHi = if (amount != null)
                "सावधान: यह क्यूआर कोड स्कैन करने पर आपके खाते से ₹$amount कट जाएंगे। पैसे प्राप्त करने के लिए कभी भी पिन डालने की आवश्यकता नहीं होती!"
            else
                "सावधान: आप $payeeName को पैसे भेज रहे हैं। यह कोड स्कैन करके आपको कोई पैसा या कैशबैक नहीं मिलेगा!"
        )
    }

    private fun safeDecode(value: String): String {
        return try {
            URLDecoder.decode(value, "UTF-8")
        } catch (e: Exception) {
            value
        }
    }
}
