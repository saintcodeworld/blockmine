# Deploy the Withdraw (transfer-tokens) Edge Function

The error **"Withdrawal failed: Failed to send a request to the Edge Function"** means the `transfer-tokens` Edge Function is not deployed (or not reachable) for your Supabase project. Follow these steps.

**Supabase supports Windows.** The CLI runs on Windows via Node.js; use `npx supabase` so you don’t need a global install (see below).

---

## 1. Supabase CLI on Windows (Node.js required)

**Recommended: use `npx` (no global install).** From the project folder in PowerShell or CMD:

```powershell
cd "E:\Projects\For punkmonkmeow\token-cubes-quest"

# Check Node (need v20+)
node -v

# Use npx – replace "supabase" with "npx supabase" in all steps below
npx supabase --version
```

If you prefer the `supabase` command globally:

```powershell
npm install -g supabase
# Then open a NEW terminal and run: supabase --version
```

---

## 2. Log in and link your project

**On Windows, use `npx supabase` instead of `supabase` if you didn’t install globally.**

```powershell
cd "E:\Projects\For punkmonkmeow\token-cubes-quest"

# Log in (opens browser)
npx supabase login

# Link this folder to your Supabase project (use your project ref from .env: jmsqvgpsutxusyxephyb)
npx supabase link --project-ref jmsqvgpsutxusyxephyb
```

When prompted for the database password, use your Supabase project database password (Supabase Dashboard → Project Settings → Database → Database password).

---

## 3. Set Edge Function secrets

Your function needs three secrets. Set them in the dashboard (easiest) or via CLI.

**Option A – Dashboard (recommended)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Project Settings** (gear) → **Edge Functions**.
3. Under **Secrets**, add:

| Name                 | Value                                                                 |
|----------------------|-----------------------------------------------------------------------|
| `ADMIN_PRIVATE_KEY`  | Base58 private key of the wallet that holds the tokens (e.g. Phantom export). |
| `TOKEN_MINT_ADDRESS` | Your pump.fun token mint address (Solana address).                     |
| `SOLANA_RPC_URL`     | RPC URL, e.g. `https://api.mainnet-beta.solana.com` or a paid RPC.   |

**Option B – CLI** (on Windows use `npx supabase` if needed)

```powershell
npx supabase secrets set ADMIN_PRIVATE_KEY="your_base58_private_key_here"
npx supabase secrets set TOKEN_MINT_ADDRESS="YourTokenMintAddressHere"
npx supabase secrets set SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

---

## 4. Deploy the function

From the project root (on Windows use `npx supabase` if you didn’t install globally):

```powershell
npx supabase functions deploy transfer-tokens --no-verify-jwt
```

- `--no-verify-jwt` lets the frontend call the function with your anon key. For production you can remove it and use auth.

You should see a success message and the function URL.

---

## 5. Check it’s live

- Dashboard: **Edge Functions** → you should see `transfer-tokens` with a “Deployed” status.
- Or open in browser (replace with your project ref if different):
  `https://jmsqvgpsutxusyxephyb.supabase.co/functions/v1/transfer-tokens`
  You should get a response (e.g. 405 or a JSON error), not “function not found”.

---

## 6. Try withdraw again

In the game, open the wallet and click **Withdraw Tokens**. If you still get an error, the toast message should give more detail (e.g. missing env, RPC error). Ensure:

- The admin wallet has enough of your SPL token.
- The admin wallet has some SOL for transaction fees.

---

## Quick checklist

- [ ] Supabase CLI installed and `supabase login` done
- [ ] Project linked: `supabase link --project-ref jmsqvgpsutxusyxephyb`
- [ ] Secrets set: `ADMIN_PRIVATE_KEY`, `TOKEN_MINT_ADDRESS`, `SOLANA_RPC_URL`
- [ ] Function deployed: `supabase functions deploy transfer-tokens --no-verify-jwt`
- [ ] Admin wallet has tokens + SOL for fees
