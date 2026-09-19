// Rakshak AI browser extension - threat datasets (mirrors web app src/data/*.json)
export const knownThreats = {
  domains: [
    'sbi-bank-kyc-update.top',
    'sbi-reward-points.xyz',
    'hdfc-netbanking-verify.info',
    'icici-pan-card-link.site',
    'paytm-cashback-offer99.buzz',
    'gpay-lottery-winner.online',
    'phonepe-merchant-reward.club',
    'customer-support-app.net',
    'bijli-bill-payment-portal.cc',
    'electricity-disconnection-alert.tk',
    'epfo-claim-status-kyc.top',
    'aadhaar-biometric-unlock.biz',
    'free-recharge-jio-5g.live',
    'anydesk-remote-support.apk.link',
    'rbi-digital-rupee-claim.win'
  ],
  vpas: [
    'cashback-claim@ybl',
    'paytm-refund-dept@paytm',
    'sbi-rewards-executive@oksbi',
    'electricity-nodal-officer@axl',
    'kyc-support-verification@icici',
    'lottery-winner-tax@ibl',
    'phonepe-cashback-gate@ibl',
    'gpay-official-promotions@okaxis',
    'scam-paytm@ybl'
  ]
};

export const legitimateInstitutions = [
  { name: 'State Bank of India (SBI)', officialDomains: ['sbi.co.in', 'onlinesbi.sbi', 'bank.sbi'], helpline: '1800 1234 (SBI)' },
  { name: 'HDFC Bank', officialDomains: ['hdfcbank.com', 'hdfc.com'], helpline: '1800 202 6161' },
  { name: 'ICICI Bank', officialDomains: ['icicibank.com'], helpline: '1800 1080' },
  { name: 'Punjab National Bank (PNB)', officialDomains: ['pnbindia.in'], helpline: '1800 180 2222' },
  { name: 'Bank of Baroda', officialDomains: ['bankofbaroda.in'], helpline: '1800 5700' },
  { name: 'National Cyber Crime Portal', officialDomains: ['cybercrime.gov.in'], helpline: '1930' },
  { name: 'Income Tax Department', officialDomains: ['incometax.gov.in', 'incometaxindia.gov.in'], helpline: '1800 180 1961' },
  { name: 'UIDAI (Aadhaar)', officialDomains: ['uidai.gov.in', 'myaadhaar.uidai.gov.in'], helpline: '1947' },
  { name: 'NPCI / UPI', officialDomains: ['npci.org.in'], helpline: '1800 120 1740' }
];
