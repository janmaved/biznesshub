// Per-store payment gateway helpers for REAL customer payments.
// Each store owner enters their own credentials in the dashboard:
//   - Razorpay:  Key ID + Key Secret           -> seamless checkout popup
//   - PayU:      Merchant Key + Salt            -> hosted redirect (SHA-512 hash)
//   - Cashfree:  App ID + Secret Key            -> hosted order, redirect
//   - PhonePe:   Merchant ID + Salt Key (+index)-> hosted redirect
// Razorpay is fully seamless. Others use hosted redirect which is the
// standard, secure flow for those providers.

async function sha512(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-512', enc)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function b64(s: string): string {
  // btoa is available in Workers
  return btoa(unescape(encodeURIComponent(s)))
}

export interface GatewayInput {
  provider: string
  keyId: string
  keySecret: string
  extra?: string
  amount: number          // in major units (INR rupees)
  orderId: number | string
  storeName: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  origin: string
  slug: string
}

// Returns an object the client uses to launch payment.
export async function startPayment(p: GatewayInput): Promise<any> {
  const amountPaise = Math.round(p.amount * 100)

  if (p.provider === 'razorpay') {
    // Create an order on Razorpay so the popup is trusted & verifiable.
    const auth = b64(`${p.keyId}:${p.keySecret}`)
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: 'order_' + p.orderId })
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error('Razorpay error: ' + t.slice(0, 200))
    }
    const order = await res.json<any>()
    return { ok: true, mode: 'razorpay', key: p.keyId, amount: amountPaise, currency: 'INR', order_id: order.id }
  }

  if (p.provider === 'payu') {
    const txnid = 'ORD' + p.orderId + 'T' + Date.now()
    const productinfo = `Order from ${p.storeName}`
    const firstname = (p.customerName || 'Customer').replace(/\|/g, '')
    const email = p.customerEmail || 'customer@example.com'
    const amount = String(p.amount)
    const udf = ['', '', '', '', '']
    const hashString = [p.keyId, txnid, amount, productinfo, firstname, email, ...udf, '', '', '', '', '', p.keySecret].join('|')
    const hash = await sha512(hashString)
    return {
      ok: true, mode: 'redirect', action: 'https://secure.payu.in/_payment',
      fields: {
        key: p.keyId, txnid, amount, productinfo, firstname, email,
        phone: p.customerPhone || '9999999999',
        surl: `${p.origin}/api/store/${p.slug}/pay/return?o=${p.orderId}`,
        furl: `${p.origin}/api/store/${p.slug}/pay/return?o=${p.orderId}&f=1`,
        hash
      }
    }
  }

  if (p.provider === 'cashfree') {
    // Cashfree PG v2023 - create order, return payment_link.
    const res = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'x-client-id': p.keyId,
        'x-client-secret': p.keySecret,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: 'order_' + p.orderId + '_' + Date.now(),
        order_amount: p.amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: 'cust_' + p.orderId,
          customer_name: p.customerName || 'Customer',
          customer_email: p.customerEmail || 'customer@example.com',
          customer_phone: p.customerPhone || '9999999999'
        },
        order_meta: { return_url: `${p.origin}/api/store/${p.slug}/pay/return?o=${p.orderId}` }
      })
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error('Cashfree error: ' + t.slice(0, 200))
    }
    const data = await res.json<any>()
    const link = data.payment_link || data?.payments?.url
    if (!link) throw new Error('Cashfree: no payment link returned')
    return { ok: true, mode: 'redirect', url: link }
  }

  if (p.provider === 'phonepe') {
    // PhonePe standard checkout (hosted redirect).
    const merchantId = p.keyId
    const saltKey = p.keySecret
    const saltIndex = p.extra || '1'
    const payload = {
      merchantId,
      merchantTransactionId: 'ORD' + p.orderId + 'T' + Date.now(),
      merchantUserId: 'cust_' + p.orderId,
      amount: amountPaise,
      redirectUrl: `${p.origin}/api/store/${p.slug}/pay/return?o=${p.orderId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${p.origin}/api/store/${p.slug}/pay/return?o=${p.orderId}`,
      paymentInstrument: { type: 'PAY_PAGE' }
    }
    const base = b64(JSON.stringify(payload))
    const toHash = base + '/pg/v1/pay' + saltKey
    const hash = (await sha256hex(toHash)) + '###' + saltIndex
    const res = await fetch('https://api.phonepe.com/apis/hermes/pg/v1/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-VERIFY': hash, accept: 'application/json' },
      body: JSON.stringify({ request: base })
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error('PhonePe error: ' + t.slice(0, 200))
    }
    const data = await res.json<any>()
    const url = data?.data?.instrumentResponse?.redirectInfo?.url
    if (!url) throw new Error('PhonePe: no redirect url')
    return { ok: true, mode: 'redirect', url }
  }

  throw new Error('Unsupported payment provider')
}

async function sha256hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Verify a Razorpay payment signature server-side.
export async function verifyRazorpay(keySecret: string, orderId: string, paymentId: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(keySecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(orderId + '|' + paymentId))
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex === signature
}
