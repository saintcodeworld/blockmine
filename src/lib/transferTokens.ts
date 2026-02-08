/**
 * Requests a real SPL token transfer from the admin wallet to the user's wallet.
 * Calls same-origin /api/transfer-tokens to avoid CORS (proxied to Supabase Edge Function).
 */
export interface TransferResult {
  signature?: string;
  amount?: number;
  decimals?: number;
  error?: string;
}

const TRANSFER_API = '/api/transfer-tokens';

export async function transferTokensToUser(
  recipientPublicKey: string,
  amount: number
): Promise<TransferResult> {
  try {
    const res = await fetch(TRANSFER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientPublicKey, amount }),
    });
    const data: TransferResult & { error?: string } = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { error: data?.error ?? `Request failed: ${res.status}` };
    }

    // Validate response has actual data
    if (data?.error) {
      return { error: data.error };
    }

    if (!data || !data.signature) {
      return { error: "Invalid response from server (missing signature)" };
    }

    return data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      error: `Request failed: ${msg}. Ensure /api/transfer-tokens is proxied (see README).`,
    };
  }
}
