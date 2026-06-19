'use client'

import { useState } from 'react'
import { useAccount, useSendTransaction } from 'wagmi'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit'
import { fetchLifiQuote, getLifiChainId } from '@/lib/web3/router/lifi'
import { Loader2 } from 'lucide-react'
import { VersionedTransaction } from '@solana/web3.js'
import { Transaction } from '@mysten/sui/transactions'
import { createDirectTransferNativeTx } from '@/lib/web3/directTransfer'
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"

interface SmartButtonProps {
  linkId: string
  chain: string
  recipientAddress: string
  tokenAddress: string | null
  payerChain: string
  inputTokenAddress: string | null
  amount: string
  decimals?: number
  onSuccess: (txHash: string, isBridge?: boolean) => void
  onError?: (error: any) => void
}

export function SmartButton({
  linkId,
  chain,
  recipientAddress,
  tokenAddress,
  payerChain,
  inputTokenAddress,
  amount,
  decimals = 18,
  onSuccess,
  onError
}: SmartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const { address: evmAddress } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()

  const wallet = useWallet()
  const { connection } = useConnection()

  const suiAccount = useCurrentAccount()
  const { mutateAsync: signAndExecuteSui } = useSignAndExecuteTransaction()

  const recordTx = useMutation(api.transactions.recordTransaction)

  // Helper to determine family
  const isEvm = payerChain === 'ethereum' || payerChain === 'base' || payerChain === 'sepolia' || payerChain === 'baseSepolia';
  const isSolana = payerChain === 'solana' || payerChain === 'solanaDevnet';
  const isSui = payerChain === 'sui' || payerChain === 'suiTestnet';

  let payerAddress: string | undefined
  if (isEvm) payerAddress = evmAddress
  else if (isSolana) payerAddress = wallet.publicKey?.toBase58()
  else if (isSui) payerAddress = suiAccount?.address

  const handleExecute = async () => {
    setIsLoading(true)
    try {
      if (!payerAddress) throw new Error('Wallet not connected')

      if (isSolana && wallet.publicKey) {
        const solBalance = await connection.getBalance(wallet.publicKey)
        if (solBalance === 0) {
          throw new Error('Insufficient SOL for transaction fees. Please fund your wallet.')
        }
      }

      const isBridge = payerChain !== chain

      const amountBase = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString()

      // 1. Get Quote or Fallback
      let txHash: string;
      let finalFromAmount = amountBase;

      try {
        const { quote, fromAmount } = await fetchLifiQuote({
          fromChain: getLifiChainId(payerChain),
          toChain: getLifiChainId(chain),
          fromToken: inputTokenAddress || (isSolana ? '11111111111111111111111111111111' : isSui ? '0x2::sui::SUI' : '0x0000000000000000000000000000000000000000'),
          toToken: tokenAddress || (chain === 'sol' ? '11111111111111111111111111111111' : chain === 'sui' ? '0x2::sui::SUI' : '0x0000000000000000000000000000000000000000'),
          fromAddress: payerAddress,
          toAddress: recipientAddress,
          destinationAmountBase: amountBase
        })

        if (!quote.transactionRequest) {
          throw new Error('No transaction request returned from LI.FI')
        }

        finalFromAmount = fromAmount;

        // 2a. Execute LI.FI Transaction
        if (isEvm) {
          txHash = await sendTransactionAsync({
            to: quote.transactionRequest.to as `0x${string}`,
            data: quote.transactionRequest.data as `0x${string}`,
            value: BigInt(quote.transactionRequest.value || 0),
          })
        } else if (isSolana) {
          if (!quote.transactionRequest.data) throw new Error('No tx data');
          const txBuf = Buffer.from(quote.transactionRequest.data, 'base64')
          const transaction = VersionedTransaction.deserialize(txBuf)
          txHash = await wallet.sendTransaction(transaction, connection)
        } else if (isSui) {
          if (!quote.transactionRequest.data) throw new Error('No tx data');
          const txBuf = Buffer.from(quote.transactionRequest.data, 'base64')
          const transaction = Transaction.from(txBuf)
          const result = await signAndExecuteSui({ transaction })
          txHash = result.digest
        } else {
          throw new Error('Unsupported payer chain')
        }
      } catch (err: any) {
        // Fallback: If it's a same-chain, native-token transfer, try a direct wallet transfer!
        if (!isBridge && !inputTokenAddress && !tokenAddress) {
          console.log('LI.FI failed, falling back to direct native transfer', err.message);
          const directTx = await createDirectTransferNativeTx({
            chain: payerChain,
            payerAddress,
            recipientAddress,
            amountBase
          });

          if (isEvm) {
            txHash = await sendTransactionAsync(directTx as any);
          } else if (isSolana) {
            txHash = await wallet.sendTransaction(directTx as any, connection);
          } else if (isSui) {
            const result = await signAndExecuteSui({ transaction: directTx as any });
            txHash = result.digest;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // Record the transaction intent
      const fromDecimals = inputTokenAddress ? (payerChain === 'ethereum' && inputTokenAddress !== '0x0000000000000000000000000000000000000000' ? 6 : 18) : 18;
      const amountPaidFloat = Number(finalFromAmount) / Math.pow(10, fromDecimals);

      try {
        await recordTx({
          linkId: linkId as Id<"paymentLinks">,
          payerAddress: payerAddress!,
          sourceChain: payerChain,
          sourceToken: inputTokenAddress || tokenAddress || "NATIVE",
          sourceTxHash: txHash,
          sourceAmount: String(amountPaidFloat),
        });
      } catch (recordError) {
        console.error("Failed to record transaction:", recordError);
      }

      onSuccess(txHash, isBridge)

    } catch (error) {
      console.error(error)
      if (onError) {
        onError(error)
      } else {
        alert(error instanceof Error ? error.message : 'Transaction failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isReady = !!payerAddress

  return (
    <button
      onClick={handleExecute}
      disabled={isLoading || !isReady}
      className="btn-primary-lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing with LI.FI...
        </>
      ) : (
        `Pay ${amount} ${payerChain !== chain ? 'Cross-Chain' : ''}`
      )}
    </button>
  )
}
