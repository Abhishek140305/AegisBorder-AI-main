package com.rakshak.ai.engine

import java.net.URI

data class Institution(
    val name: String,
    val officialDomains: List<String>,
    val helpline: String,
    val category: String
)

data class UrlResult(
    val isThreat: Boolean,
    val riskScore: Int,
    val domain: String,
    val fullUrl: String,
    val isApkDownload: Boolean,
    val spoofedTarget: String?,
    val officialDomain: String?,
    val reasons: List<String>,
    val explanationEn: String,
    val explanationHi: String
)

object UrlDetector {

    private val HIGH_RISK_TLDS = listOf(
        ".top", ".xyz", ".buzz", ".club", ".online", ".info", ".site",
        ".cc", ".tk", ".biz", ".live", ".win", ".icu", ".apk", ".app.net"
    )

    private val INSTITUTIONS: List<Institution> = listOf(
        Institution("State Bank of India (SBI)", listOf("sbi.co.in", "onlinesbi.sbi", "bank.sbi"), "1800 1234 / 1800 2100", "Public Sector Bank"),
        Institution("HDFC Bank", listOf("hdfcbank.com", "hdfc.com"), "1800 202 6161", "Private Bank"),
        Institution("ICICI Bank", listOf("icicibank.com"), "1800 1080", "Private Bank"),
        Institution("Punjab National Bank (PNB)", listOf("pnbindia.in"), "1800 180 2222", "Public Sector Bank"),
        Institution("Bank of Baroda", listOf("bankofbaroda.in"), "1800 5700", "Public Sector Bank"),
        Institution("National Cyber Crime Reporting Portal", listOf("cybercrime.gov.in"), "1930 (Toll-Free National Helpline)", "Law Enforcement"),
        Institution("Income Tax Department", listOf("incometax.gov.in", "incometaxindia.gov.in"), "1800 180 1961", "Government"),
        Institution("UIDAI (Aadhaar)", listOf("uidai.gov.in", "myaadhaar.uidai.gov.in"), "1947", "Government"),
        Institution("NPCI / UPI (National Payments Corp)", listOf("npci.org.in"), "1800 120 1740", "Payment Network")
    )

    fun levenshteinDistance(a: String, b: String): Int {
        val matrix = Array(a.length + 1) { IntArray(b.length + 1) }
        for (i in 0..a.length) matrix[i][0] = i
        for (j in 0..b.length) matrix[0][j] = j
        for (i in 1..a.length) {
            for (j in 1..b.length) {
                matrix[i][j] = if (a[i - 1] == b[j - 1]) {
                    matrix[i - 1][j - 1]
                } else {
                    minOf(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                }
            }
        }
        return matrix[a.length][b.length]
    }

    fun parseHostname(rawUrl: String): Pair<String, String> {
        var clean = rawUrl.trim()
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = "http://$clean"
        }
        return try {
            val uri = URI(clean)
            val path = uri.path ?: ""
            (uri.host?.lowercase() ?: clean.substringBefore("/").lowercase()) to path
        } catch (e: Exception) {
            (clean.substringBefore("/").lowercase()) to ""
        }
    }

    fun inspectUrl(inputUrl: String, isInBloom: Boolean = false): UrlResult {
        val (hostname, pathname) = parseHostname(inputUrl)

        val matchedLegitimate = INSTITUTIONS.firstOrNull { inst ->
            inst.officialDomains.any { it.lowercase() == hostname }
        }

        if (matchedLegitimate != null) {
            return UrlResult(
                isThreat = false,
                riskScore = 0,
                domain = hostname,
                fullUrl = inputUrl,
                isApkDownload = pathname.lowercase().endsWith(".apk"),
                spoofedTarget = null,
                officialDomain = null,
                reasons = emptyList(),
                explanationEn = "Verified official domain for ${matchedLegitimate.name}.",
                explanationHi = "${matchedLegitimate.name} की आधिकारिक एवं सत्यापित वेबसाइट।"
            )
        }

        var closestMatch: Pair<Institution, String>? = null
        var minDistance = Int.MAX_VALUE
        for (inst in INSTITUTIONS) {
            for (officialDomain in inst.officialDomains) {
                val officialClean = officialDomain.removePrefix("www.")
                val hostClean = hostname.removePrefix("www.")
                if (hostClean.contains(officialClean.substringBefore("."))) {
                    val dist = levenshteinDistance(hostClean, officialClean)
                    if (dist < minDistance) {
                        minDistance = dist
                        closestMatch = inst to officialDomain
                    }
                }
            }
        }

        val hasRiskyTld = HIGH_RISK_TLDS.any { hostname.endsWith(it) }
        val isApkDownload = pathname.lowercase().endsWith(".apk") || hostname.contains(".apk")
        val hasHomograph = hostname.any { !it.isAscii() } || hostname.startsWith("xn--")

        var riskScore = 15
        val reasons = mutableListOf<String>()

        if (isInBloom) {
            riskScore = 99
            reasons.add("Direct match in on-device Cyber Crime Blacklist (Bloom Filter).")
        }
        if (closestMatch != null && minDistance > 0) {
            riskScore = maxOf(riskScore, 95)
            reasons.add("Domain spoofing / typosquatting target: ${closestMatch.first.name} (Official: ${closestMatch.second}).")
        }
        if (hasRiskyTld) {
            riskScore = maxOf(riskScore, 80)
            reasons.add("Suspicious top-level domain frequently used in phishing campaigns.")
        }
        if (isApkDownload) {
            riskScore = maxOf(riskScore, 96)
            reasons.add("Attempts to directly download Android package (.apk) bypassing Google Play Store.")
        }
        if (hasHomograph) {
            riskScore = maxOf(riskScore, 92)
            reasons.add("Punycode / Homograph character substitution detected.")
        }

        val isThreat = riskScore >= 70
        val target = closestMatch?.first?.name ?: "a banking portal"

        return UrlResult(
            isThreat = isThreat,
            riskScore = riskScore,
            domain = hostname,
            fullUrl = inputUrl,
            isApkDownload = isApkDownload,
            spoofedTarget = closestMatch?.first?.name,
            officialDomain = closestMatch?.second,
            reasons = reasons,
            explanationEn = if (isThreat) "HIGH-RISK PHISHING DETECTED: This domain mimics $target to steal your credentials."
            else "Unverified domain. Proceed with caution.",
            explanationHi = if (isThreat) "फिशिंग का गंभीर खतरा: यह वेबसाइट $target के नाम की नकल करके बनाई गई है ताकि आपकी जानकारी चुराई जा सके।"
            else "अपुष्ट वेबसाइट। सावधानी बरतें।"
        )
    }
}
