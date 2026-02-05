# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Running on VPS – fix "player_progress" and Realtime errors

If you see **"Could not find the table 'public.player_progress'"**, **WebSocket/Realtime failed**, or **Error loading player progress**:

1. **Create the table in Supabase**
   - Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
   - Go to **SQL Editor** → **New query**.
   - Copy the contents of **`supabase/migrations/RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql`** and run it.
   - This creates `player_progress` and the required RLS policies.

2. **Check env on the VPS**
   - Ensure `.env` (or your build env) has:
     - `VITE_SUPABASE_URL` = your project URL (e.g. `https://jmsqvgpsutxusyxephyb.supabase.co`)
     - `VITE_SUPABASE_PUBLISHABLE_KEY` = your project **anon** (or publishable) key.
   - Rebuild after changing env: `npm run build`.

3. **Realtime / WebSocket**
   - After the table exists and env is correct, reload the app. Realtime and multiplayer should connect once the table and auth work.

The **"Module buffer externalized"** warning comes from Solana libraries in the browser; it’s a Vite compatibility warning and doesn’t stop the app.

## Real token transfer (Solana)

When a user withdraws their balance (clicks Withdraw Tokens), real SPL tokens are sent from a pre-defined treasury (admin) wallet to the user's game wallet. Mining only increases the displayed balance until they withdraw. This is handled by the Supabase Edge Function `transfer-tokens`.

**Setup:**

1. Deploy the Edge Function and set secrets (see `supabase/functions/transfer-tokens/README.md`):
   - `ADMIN_PRIVATE_KEY` – admin wallet private key (base58)
   - `TOKEN_MINT_ADDRESS` – your pump.fun token mint address
   - `SOLANA_RPC_URL` – Solana RPC URL
2. Ensure the admin wallet holds enough of the token and some SOL for transaction fees.

### Withdraw CORS fix (custom domain, e.g. robinadminserver.xyz)

The app calls **same-origin** `/api/transfer-tokens` so the browser never hits Supabase directly (no CORS).

- **Development** (`npm run dev`): Vite proxies `/api/transfer-tokens` to the Supabase function (uses `.env`).
- **Production (VPS)**: You must proxy `/api/transfer-tokens` on your server.

**Nginx example** (add inside your `server { ... }` for robinadminserver.xyz):

```nginx
location /api/transfer-tokens {
    proxy_pass https://jmsqvgpsutxusyxephyb.supabase.co/functions/v1/transfer-tokens;
    proxy_http_version 1.1;
    proxy_set_header Host jmsqvgpsutxusyxephyb.supabase.co;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Content-Type application/json;
    proxy_set_header Authorization "Bearer YOUR_SUPABASE_ANON_KEY";
}
```

Replace `YOUR_SUPABASE_ANON_KEY` with your project’s anon (publishable) key. Reload nginx and try Withdraw again.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
