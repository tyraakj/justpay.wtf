import { SuiGrpcClient } from '@mysten/sui/grpc'
import { Transaction } from '@mysten/sui/transactions'

const suiClient = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' })

export const SUI_NETWORK = 'testnet'
export const SUI_EXPLORER = 'https://suiexplorer.com/txblock'
export const SUI_MIST_PER_SUI = BigInt(1_000_000_000) // 1 SUI = 1,000,000,000 MIST

/**
 * Build an unsigned SUI transfer transaction.
 * Pass the result to signAndExecuteTransaction from @mysten/dapp-kit.
 */
export function buildSuiTransferTx(
  recipientAddress: string,
  amountInSui: number
): Transaction {
  const amountInMist = BigInt(Math.round(amountInSui * Number(SUI_MIST_PER_SUI)))
  const tx = new Transaction()
  const [coin] = tx.splitCoins(tx.gas, [amountInMist])
  tx.transferObjects([coin], recipientAddress)
  return tx
}

/**
 * Verify a submitted Sui transaction via RPC.
 * Called by the sui-webhook edge function.
 */
export async function verifySuiTransaction(txDigest: string): Promise<{
  confirmed: boolean
  amountReceived: number
  sender: string
}> {
  const tx = await suiClient.getTransactionBlock({
    digest: txDigest,
    options: { showBalanceChanges: true, showInput: true },
  })

  if (!tx || tx.effects?.status?.status !== 'success') {
    return { confirmed: false, amountReceived: 0, sender: '' }
  }

  const totalMist =
    tx.balanceChanges
      ?.filter((c) => Number(c.amount) > 0)
      .reduce((sum, c) => sum + BigInt(c.amount), 0n) ?? 0n

  return {
    confirmed: true,
    amountReceived: Number(totalMist) / Number(SUI_MIST_PER_SUI),
    sender: tx.transaction?.data?.sender ?? '',
  }
}

/**
 * Get SUI balance for an address in human-readable SUI (not MIST).
 */
export async function getSuiBalance(address: string): Promise<number> {
  const balance = await suiClient.getBalance({ owner: address })
  return Number(balance.totalBalance) / Number(SUI_MIST_PER_SUI)
}

/**
 * Get Sui explorer URL for a transaction digest.
 */
export function getSuiExplorerUrl(digest: string): string {
  return `${SUI_EXPLORER}/${digest}?network=${SUI_NETWORK}`
}
