# JWT Authentication Setup Guide

## Current Problem

The application uses **Sui wallet connection** for blockchain transactions, but Supabase RLS policies expect **JWT tokens** with a `wallet` field.

**RLS Policy Example:**
```sql
USING (buyer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet')
```

This extracts the wallet address from JWT token claims to check ownership.

---

## Solution Options

### Option 1: Service Role Key (Quick Fix - NOT SECURE)

Use Supabase Service Role key to bypass RLS entirely.

**⚠️ WARNING**: Service role bypasses all RLS policies. Only use server-side!

```typescript
// src/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Server-side only!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

Then modify services to use `supabaseAdmin` instead of `supabase`.

---

### Option 2: Custom JWT with Wallet Address (RECOMMENDED)

Implement proper authentication flow:

#### Step 1: Create Supabase Auth User

When wallet connects, create or sign in Supabase user:

```typescript
// src/lib/auth.ts
import { supabase } from '@/services/categories.service';

export async function signInWithWallet(walletAddress: string) {
    // Generate deterministic email from wallet address
    const email = `${walletAddress.toLowerCase()}@wallet.sui`;
    const password = walletAddress; // In production, use signature verification!

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    // If user doesn't exist, create account
    if (signInError?.message === 'Invalid login credentials') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    wallet_address: walletAddress // Store wallet in user metadata
                }
            }
        });

        if (signUpError) throw signUpError;
        return signUpData;
    }

    if (signInError) throw signInError;
    return signInData;
}

export async function signOutWallet() {
    await supabase.auth.signOut();
}
```

#### Step 2: Update RLS Policies

Modify migrations to use `auth.uid()` instead of JWT wallet field:

```sql
-- Update buyer_addresses RLS policies
DROP POLICY IF EXISTS "Buyers can view own addresses" ON buyer_addresses;
DROP POLICY IF EXISTS "Buyers can create own addresses" ON buyer_addresses;
DROP POLICY IF EXISTS "Buyers can update own addresses" ON buyer_addresses;
DROP POLICY IF EXISTS "Buyers can delete own addresses" ON buyer_addresses;

CREATE POLICY "Buyers can view own addresses" ON buyer_addresses
    FOR SELECT
    USING (auth.uid() IS NOT NULL AND buyer_wallet = (auth.jwt()->>'wallet_address'));

CREATE POLICY "Buyers can create own addresses" ON buyer_addresses
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND buyer_wallet = (auth.jwt()->>'wallet_address'));

CREATE POLICY "Buyers can update own addresses" ON buyer_addresses
    FOR UPDATE
    USING (auth.uid() IS NOT NULL AND buyer_wallet = (auth.jwt()->>'wallet_address'));

CREATE POLICY "Buyers can delete own addresses" ON buyer_addresses
    FOR DELETE
    USING (auth.uid() IS NOT NULL AND buyer_wallet = (auth.jwt()->>'wallet_address'));
```

#### Step 3: Hook into Wallet Connection

Update your app to sign in when wallet connects:

```typescript
// src/components/Navigation.tsx or wherever wallet connects
import { useCurrentAccount } from '@mysten/dapp-kit';
import { signInWithWallet, signOutWallet } from '@/lib/auth';
import { useEffect } from 'react';

export function WalletAuthSync() {
    const account = useCurrentAccount();

    useEffect(() => {
        if (account?.address) {
            // Sign in to Supabase when wallet connects
            signInWithWallet(account.address).catch(console.error);
        } else {
            // Sign out when wallet disconnects
            signOutWallet().catch(console.error);
        }
    }, [account?.address]);

    return null;
}

// Add <WalletAuthSync /> to your app layout
```

---

### Option 3: Supabase Edge Function (Advanced)

Create a Supabase Edge Function to verify wallet signature and issue JWT:

```typescript
// supabase/functions/wallet-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
    const { walletAddress, signature, message } = await req.json();

    // Verify signature (use Sui SDK)
    // ... signature verification logic ...

    // Create custom JWT with wallet claim
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${walletAddress}@wallet.sui`,
        options: {
            data: {
                wallet: walletAddress
            }
        }
    });

    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
    });
});
```

---

## Recommended Implementation Steps

1. **For Development/Testing NOW:**
   - Run migration `99999_temp_disable_rls.sql` to disable RLS
   - Test all address features
   - Remember to re-enable RLS before production!

2. **For Production (Later):**
   - Implement Option 2 (Custom JWT with Wallet Address)
   - Or use signature-based verification (Option 3)
   - Test thoroughly with RLS enabled

---

## Quick Start (Development)

```bash
# Apply the temporary migration
cd web
supabase db push

# Or manually in Supabase SQL editor:
ALTER TABLE buyer_addresses DISABLE ROW LEVEL SECURITY;
```

Now your address features will work without JWT! But remember to implement proper auth before deploying to production.

---

## Further Reading

- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Custom Claims](https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac)
- [Sui Transaction Signing](https://docs.sui.io/guides/developer/cryptography/transaction-signing)
