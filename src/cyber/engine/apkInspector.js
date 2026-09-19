// APK Download & Remote Access Trojan (RAT) Permission Auditor
import knownThreats from '../data/knownThreats.json';

export const HIGH_RISK_PERMISSIONS = {
  "android.permission.BIND_ACCESSIBILITY_SERVICE": {
    name: "Accessibility Service (Full Device Control)",
    severity: "CRITICAL",
    riskWeight: 45,
    userExplanation: {
      en: "Allows the app to read all screen content, tap buttons automatically, and steal banking passwords.",
      hi: "यह ऐप को आपकी स्क्रीन पर सब कुछ देखने, पासवर्ड चुराने और बिना आपकी मर्जी के बटन दबाने की अनुमति देता है।"
    }
  },
  "android.permission.READ_SMS": {
    name: "Read SMS (OTP Interception)",
    severity: "CRITICAL",
    riskWeight: 35,
    userExplanation: {
      en: "Allows the app to intercept Bank OTPs silently and drain your savings.",
      hi: "यह ऐप को आपके बैंक ओटीपी (OTP) चुपचाप पढ़ने और पैसे चुराने की अनुमति देता है।"
    }
  },
  "android.permission.RECEIVE_SMS": {
    name: "Receive SMS (OTP Auto-Forwarding)",
    severity: "HIGH",
    riskWeight: 30,
    userExplanation: {
      en: "Allows the app to capture incoming banking authorization messages.",
      hi: "यह ऐप को बैंक से आने वाले जरूरी संदेशों को अपने पास कॉपी करने देता है।"
    }
  },
  "android.permission.SYSTEM_ALERT_WINDOW": {
    name: "Draw Over Apps (Fake Phishing Screen Overlay)",
    severity: "HIGH",
    riskWeight: 25,
    userExplanation: {
      en: "Allows the app to display fake login screens on top of genuine banking apps.",
      hi: "यह असली बैंक ऐप के ऊपर नकली लॉगिन स्क्रीन दिखाकर पासवर्ड चुरा सकता है।"
    }
  },
  "android.permission.REQUEST_INSTALL_PACKAGES": {
    name: "Silent App Dropper / Installer",
    severity: "HIGH",
    riskWeight: 20,
    userExplanation: {
      en: "Allows this app to secretly download and install additional malware in the background.",
      hi: "यह ऐप आपके फोन में छुपकर दूसरे खतरनाक वायरस और ऐप डाउनलोड कर सकता है।"
    }
  },
  "android.permission.RECORD_AUDIO": {
    name: "Microphone Audio Recording",
    severity: "MEDIUM",
    riskWeight: 15,
    userExplanation: {
      en: "Allows the app to secretly record your phone calls and conversations.",
      hi: "यह आपकी फोन कॉल्स और बातों को गुप्त रूप से रिकॉर्ड कर सकता है।"
    }
  }
};

export function inspectApk(apkIdentifier) {
  if (!apkIdentifier) return null;

  const id = apkIdentifier.trim().toLowerCase();
  
  // 1. Check known signatures database
  const signatureMatch = knownThreats.apkSignatures.find(
    sig => id.includes(sig.packageName) || id.includes(sig.appName.toLowerCase()) || id.includes('anydesk') || id.includes('kyc') || id.includes('support')
  );

  let detectedPermissions = [];
  let riskScore = 0;
  let packageName = "com.unverified.thirdparty.package";
  let appName = "Unverified APK Installer";

  if (signatureMatch) {
    packageName = signatureMatch.packageName;
    appName = signatureMatch.appName;
    detectedPermissions = signatureMatch.dangerousPermissions;
    riskScore = signatureMatch.riskScore;
  } else if (id.includes('.apk')) {
    // Generic APK download URL or file
    appName = id.split('/').pop().replace('.apk', '') || "Downloaded_App.apk";
    // Simulate high-risk default payload common in RATs
    detectedPermissions = [
      "android.permission.BIND_ACCESSIBILITY_SERVICE",
      "android.permission.READ_SMS",
      "android.permission.SYSTEM_ALERT_WINDOW"
    ];
    riskScore = 96;
  }

  const permissionDetails = detectedPermissions.map(perm => {
    const meta = HIGH_RISK_PERMISSIONS[perm] || {
      name: perm,
      severity: "MEDIUM",
      riskWeight: 10,
      userExplanation: {
        en: "Requests access to sensitive system resources.",
        hi: "फोन के संवेदनशील डेटा तक पहुंच मांगता है।"
      }
    };

    return {
      permission: perm,
      ...meta
    };
  });

  const isRat = detectedPermissions.includes("android.permission.BIND_ACCESSIBILITY_SERVICE") &&
                (detectedPermissions.includes("android.permission.READ_SMS") || detectedPermissions.includes("android.permission.RECEIVE_SMS"));

  return {
    isApk: true,
    appName,
    packageName,
    isRatThreat: isRat,
    riskScore: Math.min(100, riskScore),
    severity: riskScore >= 80 ? "CRITICAL" : "HIGH",
    permissionCount: detectedPermissions.length,
    permissions: permissionDetails,
    warning: {
      en: isRat 
        ? "CRITICAL RAT MALWARE: This application requests full screen control and OTP reading rights. Do NOT install." 
        : "UNVERIFIED APK: Direct APK installation bypasses Google Play Protect verification.",
      hi: isRat
        ? "अत्यधिक खतरनाक वायरस (RAT): यह ऐप आपके पूरे फोन का नियंत्रण और बैंक ओटीपी पढ़ने की अनुमति मांगता है। इसे कभी इंस्टॉल न करें।"
        : "अपुष्ट ऐप: बाहर से डाउनलोड किया गया ऐप जो आपकी सुरक्षा के लिए हानिकारक हो सकता है।"
    }
  };
}
