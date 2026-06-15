import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, createTransferInstruction } from '@solana/spl-token'
import { WalletContextState } from '@solana/wallet-adapter-react'

interface ExecuteSolanaParams {
  wallet: WalletContextState
  connection: Connection
  tokenAddress: string | null
  recipientAddress: string
  amount: string
  decimals: number
}

export async function executeSolanaTransfer({
  wallet,
  connection,
  tokenAddress,
  recipientAddress,
  amount,
  decimals
}: ExecuteSolanaParams) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected')
  }

  const toPubkey = new PublicKey(recipientAddress)
  const amountLamports = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)))

  let instruction;

  if (!tokenAddress) {
    // Native SOL Transfer
    instruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey,
      lamports: amountLamports,
    })
  } else {
    // SPL Token Transfer
    const mintPubkey = new PublicKey(tokenAddress)
    
    // Get sender and recipient ATAs
    const fromAta = getAssociatedTokenAddressSync(mintPubkey, wallet.publicKey)
    const toAta = getAssociatedTokenAddressSync(mintPubkey, toPubkey)

    instruction = createTransferInstruction(
      fromAta,
      toAta,
      wallet.publicKey,
      amountLamports
    )
  }

  const latestBlockhash = await connection.getLatestBlockhash('confirmed')

  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: [instruction],
  }).compileToV0Message()

  const transaction = new VersionedTransaction(messageV0)

  // Send transaction through the wallet adapter
  const signature = await wallet.sendTransaction(transaction, connection)
  
  return signature
}
