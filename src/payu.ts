// PayU integration helper (server-side only).
// Uses Web Crypto API (available in Cloudflare Workers) for SHA-512 hashing.

const PAYU_TEST_URL = 'https://test.payu.in/_payment';
const PAYU_PROD_URL = 'https://secure.payu.in/_payment';

async function sha512(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-512', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface PayuParams {
  key: string;
  salt: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  test?: boolean;
}

// Build the form payload + hash needed to POST to PayU.
export async function buildPayuRequest(p: PayuParams) {
  const udf = ['', '', '', '', '']; // udf1..udf5 empty
  // Hash sequence per PayU docs:
  // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  const hashString = [
    p.key,
    p.txnid,
    p.amount,
    p.productinfo,
    p.firstname,
    p.email,
    ...udf,
    '', '', '', '', '', // 5 empty after udf5
    p.salt
  ].join('|');

  const hash = await sha512(hashString);

  return {
    action: p.test ? PAYU_TEST_URL : PAYU_PROD_URL,
    fields: {
      key: p.key,
      txnid: p.txnid,
      amount: p.amount,
      productinfo: p.productinfo,
      firstname: p.firstname,
      email: p.email,
      phone: p.phone,
      surl: p.surl,
      furl: p.furl,
      hash
    }
  };
}

// Authoritative server-to-server check: ask PayU directly whether a txn succeeded.
// command=verify_payment, hash = sha512(key|command|var1(txnid)|salt)
export async function payuVerifyPayment(key: string, salt: string, txnid: string): Promise<boolean> {
  try {
    const command = 'verify_payment'
    const hash = await sha512([key, command, txnid, salt].join('|'))
    const body = new URLSearchParams({ key, command, var1: txnid, hash })
    const res = await fetch('https://info.payu.in/merchant/postservice.php?form=2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
    const j: any = await res.json().catch(() => null)
    const tx = j?.transaction_details?.[txnid]
    const st = (tx?.status || '').toLowerCase()
    return st === 'success' || st === 'captured'
  } catch {
    return false
  }
}

// Verify the response hash from PayU callback (reverse sequence).
// PayU's reverse hash can vary slightly (with/without additionalCharges, and
// whether 'amount' is normalised), so we compute a few accepted variants and
// accept the response if ANY of them matches the hash PayU sent.
export async function verifyPayuResponse(salt: string, params: Record<string, string>): Promise<boolean> {
  const { status, key, txnid, productinfo, firstname, email, hash } = params;
  if (!hash) return false;
  const udf = [
    params.udf5 || '', params.udf4 || '', params.udf3 || '', params.udf2 || '', params.udf1 || ''
  ];
  // PayU may send amount as "99" or "99.00" — try both.
  const amounts = Array.from(new Set([
    params.amount || '',
    (params.amount && /^\d+$/.test(params.amount)) ? params.amount + '.00' : '',
    (params.amount || '').replace(/\.00$/, '')
  ].filter(Boolean)))

  const target = (hash || '').toLowerCase()
  for (const amount of amounts) {
    // Standard reverse: SALT|status||||||udf5..udf1|email|firstname|productinfo|amount|txnid|key
    const base = [salt, status, '', '', '', '', '', '', ...udf, email, firstname, productinfo, amount, txnid, key].join('|')
    if ((await sha512(base)).toLowerCase() === target) return true
    // With additionalCharges prepended (PayU adds it when extra charges apply).
    const addl = params.additionalCharges || params.additional_charges
    if (addl) {
      const withAddl = [addl, salt, status, '', '', '', '', '', '', ...udf, email, firstname, productinfo, amount, txnid, key].join('|')
      if ((await sha512(withAddl)).toLowerCase() === target) return true
    }
  }
  return false
}
