import type { WidgetConfig } from "@lifi/widget";
import { ChainType } from "@lifi/sdk";
import {
  parseChainIdForWidget,
  getNativeTokenAddress,
  isSolana,
  isSui,
} from "@/lib/config/network";

export interface CheckoutWidgetOptions {
  /** Required — where the funds go */
  receiverAddress: string;
  /** Optional — if set, locks the destination chain in the widget */
  destinationChain?: string | null;
  /** Optional — if set, locks the destination token in the widget */
  destinationTokenSymbol?: string | null;
  destinationTokenAddress?: string | null;
  /** Optional — if set, pre-fills and locks the amount */
  amount?: string | null;
}

/**
 * Builds the LI.FI WidgetConfig for a payment checkout.
 *
 * If the receiver specified preferences, those fields are locked.
 * If not, the widget runs in open mode — sender picks source AND destination freely.
 */
export function buildCheckoutWidgetConfig(
  opts: CheckoutWidgetOptions,
): WidgetConfig {
  const hasChainPreference = !!opts.destinationChain;
  const hasTokenPreference = !!(
    opts.destinationTokenSymbol || opts.destinationTokenAddress
  );

  const toChainId = hasChainPreference
    ? parseChainIdForWidget(opts.destinationChain!)
    : undefined;

  // Always resolve a toToken when a chain is specified — default to native token.
  // Without toToken the widget clears the "to" side when "from" changes.
  const toTokenAddr = hasTokenPreference
    ? (opts.destinationTokenAddress ??
      getNativeTokenAddress(opts.destinationChain ?? ""))
    : hasChainPreference
      ? getNativeTokenAddress(opts.destinationChain!)
      : undefined;

  // Determine chainType for the receiver address
  const getChainType = (): ChainType => {
    if (opts.destinationChain && isSolana(opts.destinationChain))
      return ChainType.SVM;
    if (opts.destinationChain && isSui(opts.destinationChain))
      return ChainType.MVM;
    // Default to EVM — works for all numeric chain IDs
    return ChainType.EVM;
  };

  const config: WidgetConfig = {
    toAddress: {
      name: "Payment",
      address: opts.receiverAddress,
      chainType: getChainType(),
    },

    // Only set toChain/toToken if the receiver specified them
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(toChainId !== undefined ? { toChain: toChainId as any } : {}),
    ...(toTokenAddr !== undefined ? { toToken: toTokenAddr } : {}),

    // Amount is NOT set here. The sender picks how much to send from their
    // source token; the widget shows what the receiver will get (including
    // USD equivalents). The PaymentCard displays the required amount as
    // reference. Cross-token payments can't enforce exact output via config
    // alone — slippage and rate differences make it impractical.

    // Lock destination token; lock toAddress always
    disabledUI: {
      ...(toTokenAddr ? { toToken: true } : {}),
      toAddress: true,
    },

    // Hide the toAddress input (already shown in PaymentCard)
    hiddenUI: {
      toAddress: true,
      poweredBy: true,
      appearance: true,
      language: true,
    },

    // Restrict destination chain if receiver specified one (EVM numeric chains only)
    ...(hasChainPreference && typeof toChainId === "number"
      ? { chains: { to: { allow: [toChainId] } } }
      : {}),

    // Deny the destination token as a "from" token to prevent same-token-same-chain
    // selection which LiFi can't route (it's a direct transfer, not a swap).
    ...(toTokenAddr && toChainId !== undefined
      ? {
          tokens: {
            from: {
              deny: [{ address: toTokenAddr, chainId: toChainId as number }],
            },
          },
        }
      : {}),

    // Override labels for payment context
    languageResources: {
      en: {
        header: {
          exchange: "Payment",
          from: "Pay from",
          to: "Receive on",
        },
        button: {
          exchange: "Review Payment",
          startSwapping: "Pay Now",
          startBridging: "Pay Now",
          swapReview: "Review Payment",
          bridgeReview: "Review Payment",
        },
      },
    },

    variant: "compact",
    appearance: "light",
    integrator: "justpay",
    keyPrefix: "justpay",
    apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY,

    feeConfig: {
      fee: 0,
    },
  };

  return config;
}
