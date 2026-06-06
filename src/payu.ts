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

// Verify the response hash from PayU callback (reverse sequence).
export async function verifyPayuResponse(salt: string, params: Record<string, string>): Promise<boolean> {
  const { status, key, txnid, amount, productinfo, firstname, email, hash } = params;
  if (!hash) return false;
  const udf = [
    params.udf5 || '', params.udf4 || '', params.udf3 || '', params.udf2 || '', params.udf1 || ''
  ];
  // reverse: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const hashString = [
    salt, status, '', '', '', '', '', '',
    ...udf,
    email, firstname, productinfo, amount, txnid, key
  ].join('|');
  const calc = await sha512(hashString);
  return calc.toLowerCase() === hash.toLowerCase();
}
