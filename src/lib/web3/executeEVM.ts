import { encodeFunctionData, parseUnits } from 'viem'
import { SendTransactionMutateAsync } from 'wagmi/query'

// Minimal ERC-20 ABI for transfer
const erc20Abi = [
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
] as const

interface ExecuteEVMParams {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendTransactionAsync: SendTransactionMutateAsync<any, any>
  tokenAddress: string | null
  recipientAddress: `0x${string}`
  amount: string
  decimals: number
}

export async function executeEVMTransfer({
  sendTransactionAsync,
  tokenAddress,
  recipientAddress,
  amount,
  decimals
}: ExecuteEVMParams) {
  const value = parseUnits(amount, decimals)

  if (!tokenAddress) {
    // Native ETH Transfer
    const hash = await sendTransactionAsync({
      to: recipientAddress,
      value: value,
    })
    return hash
  } else {
    // ERC-20 Transfer
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress, value]
    })
    
    const hash = await sendTransactionAsync({
      to: tokenAddress as `0x${string}`,
      data,
    })
    return hash
  }
}
