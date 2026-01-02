# Deployment Guide - Sui Smart Contracts

This guide explains how to deploy the Sui Move contracts to the blockchain.

## Prerequisites

1. **Install Sui CLI**
   ```bash
   # Follow official installation guide
   # https://docs.sui.io/build/install
   
   # Verify installation
   sui --version
   ```

2. **Configure Sui Client**
   ```bash
   # Initialize client configuration
   sui client
   
   # This will create ~/.sui/sui_config/client.yaml
   # Default network: testnet
   ```

3. **Get Testnet SUI Tokens**
   - Visit [Sui Testnet Faucet](https://faucet.sui.io)
   - Request tokens for your address
   - Or use CLI: `sui client faucet`

## Deployment Steps

### 1. Navigate to Contracts Directory
```bash
cd "/home/qminh77/Downloads/SUI Project/contracts"
```

### 2. Build the Package
```bash
sui move build
```

This compiles your Move code and checks for errors. Fix any compilation issues before proceeding.

### 3. Test the Package (Optional but Recommended)
```bash
sui move test
```

### 4. Deploy to Sui Testnet
```bash
sui client publish --gas-budget 20000000
```

**Expected Output:**
```
╭──────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                     │
│  ┌──                                                                 │
│  │ ObjectID: 0xabcd1234...                                          │
│  │ Sender: 0x...                                                    │
│  │ Owner: Immutable                                                 │
│  │ ObjectType: 0x2::package::UpgradeCap                            │
│  │ Version: 12345                                                   │
│  │ Digest: ...                                                      │
│  └──                                                                 │
├──────────────────────────────────────────────────────────────────────┤
│ Published Objects:                                                   │
│  ┌──                                                                 │
│  │ PackageID: 0x1234567890abcdef...  ← COPY THIS!                 │
│  │ Version: 1                                                       │
│  │ Digest: ...                                                      │
│  └──                                                                 │
╰──────────────────────────────────────────────────────────────────────╯
```

### 5. Copy the Package ID

From the deployment output, copy the **PackageID** (the long hexadecimal string starting with `0x`).

### 6. Update Frontend Configuration

Edit `/home/qminh77/Downloads/SUI Project/web/.env.local`:

```env
NEXT_PUBLIC_PACKAGE_ID=0x1234567890abcdef...  # Your actual Package ID
```

### 7. Restart the Development Server

```bash
cd ../web
npm run dev
```

## Verification

1. **Check Package on Explorer**
   - Visit [Sui Explorer (Testnet)](https://suiscan.xyz/testnet)
   - Search for your Package ID
   - Verify the modules are published correctly

2. **Test Product Creation**
   - Navigate to http://localhost:3000/seller
   - Connect your wallet
   - Fill in product details
   - Click "Create Product NFT"
   - Approve the transaction in your wallet
   - Check transaction on explorer

## Troubleshooting

### Insufficient Gas
**Error**: `InsufficientGas`
**Solution**: Request more SUI from faucet or increase gas budget

### Module Not Found
**Error**: `ModuleNotFound`
**Solution**: Ensure `NEXT_PUBLIC_PACKAGE_ID` matches your deployed package

### Compilation Errors
**Error**: Build fails
**Solution**: Check Move.toml dependencies and syntax in .move files

## Network Configuration

### Switch to Mainnet (Production)
```bash
# In Move.toml, change dependency to mainnet
[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/mainnet" }

# Deploy with higher gas budget
sui client publish --gas-budget 100000000
```

### Use Devnet (Fast Testing)
```bash
# Change in SuiProviders.tsx
defaultNetwork="devnet"

# Deploy to devnet
sui client switch --env devnet
sui client publish --gas-budget 20000000
```

## Important Notes

⚠️ **Package IDs are permanent** - Once deployed, you cannot change the package ID. To update, you need to deploy a new package.

✅ **Test thoroughly on testnet** before deploying to mainnet

💰 **Gas costs** are paid in SUI tokens from your wallet

🔒 **Keep your keys safe** - Store your recovery phrase securely

## Next Steps

After successful deployment:
1. ✅ Test product creation on seller dashboard
2. ✅ Verify transactions on Sui Explorer  
3. ✅ Implement Sui Kiosk integration for marketplace
4. ✅ Add Payment Kit for secure purchases
5. ✅ Deploy to production (mainnet) when ready

---

For more information, see the [official Sui documentation](https://docs.sui.io).
