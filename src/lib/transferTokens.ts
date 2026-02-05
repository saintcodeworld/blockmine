/**
 * Requests a real SPL token transfer from the admin wallet to the user's wallet.
 * Backend (Supabase Edge Function) holds the admin key and performs the on-chain transfer.
 */
import { supabase } from '@/integrations/supabase/client';

export interface TransferResult {
  signature?: string;
  amount?: number;
  decimals?: number;
  error?: string;
}

export async function transferTokensToUser(
  recipientPublicKey: string,
  amount: number
): Promise<TransferResult> {
  let data: TransferResult | null = null;
  let error: { message: string; context?: unknown } | null = null;

  try {
    const result = await supabase.functions.invoke<TransferResult>('transfer-tokens', {
      body: { recipientPublicKey, amount },
    });
    data = result.data;
    error = result.error;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      error: `Request failed: ${msg}. Make sure the Edge Function is deployed and secrets are set (see docs).`,
    };
  }

  if (error) {
    const hint =
      error.message?.includes('fetch') || error.message?.includes('Failed to send')
        ? ' Is the transfer-tokens Edge Function deployed to this Supabase project?'
        : '';
    return { error: (error.message ?? 'Transfer request failed') + hint };
  }
  if (data?.error) {
    return { error: data.error };
  }
  return data ?? {};
}
