// Supabase Edge Function: SPL token transfer from admin wallet to user wallet.
// Called when a user completes mining a block. Admin key must be set in Supabase secrets.

import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "npm:@solana/web3.js@1.98.4";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "npm:@solana/spl-token@0.4.9";
import { decode as decodeBase58 } from "npm:bs58@5.0.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface TransferBody {
  recipientPublicKey: string;
  amount: number; // Human-readable amount (e.g. 1000, 3500) - converted using mint decimals
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

Deno.serve(async (req: Request) => {
  // CORS preflight – must return 2xx and CORS headers when called from custom domain (e.g. robinadminserver.xyz)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { recipientPublicKey, amount }: TransferBody = await req.json();
    if (!recipientPublicKey || typeof amount !== "number" || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "recipientPublicKey and positive amount required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rpcUrl = getEnv("SOLANA_RPC_URL");
    const adminPrivateKeyBase58 = getEnv("ADMIN_PRIVATE_KEY");
    const tokenMintAddress = getEnv("TOKEN_MINT_ADDRESS");

    const connection = new Connection(rpcUrl);
    const mint = new PublicKey(tokenMintAddress);
    const recipient = new PublicKey(recipientPublicKey);

    const adminSecretKey = decodeBase58(adminPrivateKeyBase58);
    if (adminSecretKey.length !== 64) {
      return new Response(
        JSON.stringify({ error: "Invalid admin key length" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const adminKeypair = Keypair.fromSecretKey(adminSecretKey);
    const adminPubkey = adminKeypair.publicKey;

    const mintInfo = await getMint(connection, mint);
    const decimals = mintInfo.decimals;
    const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));

    const sourceAta = await getAssociatedTokenAddress(
      mint,
      adminPubkey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const destAta = await getAssociatedTokenAddress(
      mint,
      recipient,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tx = new Transaction();

    const destAccountInfo = await connection.getAccountInfo(destAta);
    if (!destAccountInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          adminPubkey,
          destAta,
          recipient,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    tx.add(
      createTransferInstruction(
        sourceAta,
        destAta,
        adminPubkey,
        rawAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const signature = await sendAndConfirmTransaction(connection, tx, [adminKeypair], {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });

    return new Response(
      JSON.stringify({ signature, amount, decimals }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Transfer error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
