# transfer-tokens Edge Function

SPL token transfer from the treasury (admin) wallet to the user's game wallet. Called when a user clicks **Withdraw Tokens** in the wallet modal (not on each block mine).

## Required secrets

Set these in the Supabase Dashboard: **Project Settings → Edge Functions → Secrets** (or via Supabase CLI).

| Secret | Description |
|--------|-------------|
| `ADMIN_PRIVATE_KEY` | Base58-encoded private key of the admin wallet that holds the tokens (e.g. export from Phantom). **Never expose in frontend.** |
| `TOKEN_MINT_ADDRESS` | SPL token mint address (your pump.fun token mint). |
| `SOLANA_RPC_URL` | Solana RPC endpoint (e.g. `https://api.mainnet-beta.solana.com` or a paid RPC like Helius/QuickNode). |

## Deploy

```bash
supabase functions deploy transfer-tokens --no-verify-jwt
```

Use `--no-verify-jwt` if you want the frontend to call it with the anon key only. For production you may want to verify JWT and tie transfers to authenticated users.

## Request

POST with JSON body:

```json
{ "recipientPublicKey": "<user Solana address>", "amount": 1000 }
```

`amount` is in human-readable units (same as in-game tokens per block type). The function converts to token decimals internally.
