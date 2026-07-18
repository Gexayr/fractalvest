import crypto from "crypto";

const API_BASE = process.env.NOWPAYMENTS_SANDBOX === "true"
  ? "https://api-sandbox.nowpayments.io/v1"
  : "https://api.nowpayments.io/v1";

export interface CreateInvoiceParams {
  priceAmount: number;
  priceCurrency: string;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}

export interface NowPaymentsInvoice {
  id: string;
  order_id: string;
  invoice_url: string;
}

export class NowPaymentsError extends Error {
  constructor(message: string, public status: number, public body: unknown) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) {
    throw new Error("NOWPAYMENTS_API_KEY must be set to accept crypto deposits");
  }
  return key;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<NowPaymentsInvoice> {
  const res = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription,
      ipn_callback_url: params.ipnCallbackUrl,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new NowPaymentsError("Failed to create NOWPayments invoice", res.status, body);
  }
  return body as NowPaymentsInvoice;
}

// NOWPayments signs the IPN body with HMAC-SHA512 over the JSON-stringified
// payload with keys sorted alphabetically at every level.
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

export function verifyIpnSignature(body: unknown, signature: string | undefined): boolean {
  if (!signature) return false;

  const secret = process.env.NOWPAYMENTS_IPN_SECRET_KEY;
  if (!secret) return false;

  const sorted = JSON.stringify(sortKeysDeep(body));
  const expected = crypto.createHmac("sha512", secret).update(sorted).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
