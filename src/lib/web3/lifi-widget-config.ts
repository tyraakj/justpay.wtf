import type { WidgetConfig } from "@lifi/widget";
import {
  parseChainIdForWidget,
  getNativeTokenAddress,
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
  const toTokenAddr = hasTokenPreference
    ? (opts.destinationTokenAddress ??
      getNativeTokenAddress(opts.destinationChain ?? ""))
    : undefined;

  const config: WidgetConfig = {
    toAddress: {
      address: opts.receiverAddress,
    },

    // Only set toChain/toToken if the receiver specified them
    ...(toChainId !== undefined ? { toChain: toChainId as any } : {}),
    ...(toTokenAddr !== undefined ? { toToken: toTokenAddr } : {}),

    // Pre-fill amount for fixed links; leave undefined for open links
    ...(opts.amount && Number(opts.amount) > 0
      ? { toAmount: opts.amount }
      : {}),

    // Lock destination token if the receiver specified one
    ...(hasTokenPreference ? { disabledUI: { toToken: true } } : {}),

    // Restrict destination chain if receiver specified one (EVM numeric chains only)
    ...(hasChainPreference && typeof toChainId === "number"
      ? { chains: { to: { allow: [toChainId] } } }
      : {}),

    // UI presentation — brutalist dark theme to match the app
    variant: "compact",
    appearance: "dark",
    theme: {
      colorSchemes: {
        dark: {
          palette: {
            primary: { main: "#ffffff" },
            secondary: { main: "#a3a3a3" },
            background: { default: "transparent", paper: "#111111" },
            text: { primary: "#ffffff", secondary: "#a3a3a3" },
          },
        },
      },
      shape: { borderRadius: 12 } as any,
      typography: { fontFamily: '"Darker Grotesque", sans-serif' },
      container: {
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        background: "transparent",
      },
    },

    integrator: "justpay",

    // Revenue model: LI.FI integrator fee split.
    // Set feeConfig.fee: 0.005 and add a recipient to collect 0.5% of every
    // swap/bridge automatically. LI.FI deducts and routes it during execution.
    feeConfig: {
      fee: 0, // set to 0.005 when ready to activate fee collection
    },
  };

  return config;
}
