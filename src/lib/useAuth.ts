"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount as useLiFiAccount } from "@lifi/wallet-management";
import { ChainType } from "@lifi/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccount } from "wagmi";

/**
 * Returns the current wallet address and whether the user has
 * authenticated (signed a message) for that address.
 *
 * Auth state is stored per-address in localStorage under
 * `justpay_auth_<address>`.
 */
export function useAuth() {
  const { publicKey } = useWallet();
  const { address: evmAddress } = useAccount();
  const { account: suiAccount } = useLiFiAccount({ chainType: ChainType.MVM });

  const currentAddress =
    publicKey?.toBase58() || evmAddress || suiAccount?.address;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevAddressRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear auth when wallet disconnects (address goes from defined → undefined)
  useEffect(() => {
    if (!mounted) return;
    const prevAddr = prevAddressRef.current;
    prevAddressRef.current = currentAddress;

    if (prevAddr && !currentAddress) {
      // Wallet disconnected — clear auth for previous address
      localStorage.removeItem(`justpay_auth_${prevAddr}`);
      setIsAuthenticated(false);
      window.dispatchEvent(new Event("justpay_auth_changed"));
    }
  }, [currentAddress, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (currentAddress) {
      const stored = localStorage.getItem(`justpay_auth_${currentAddress}`);
      console.log("[useAuth] checking localStorage:", {
        key: `justpay_auth_${currentAddress?.slice(0, 10)}`,
        stored,
      });
      setIsAuthenticated(stored === "true");
    } else {
      setIsAuthenticated(false);
    }
  }, [currentAddress, mounted]);

  // Listen for auth changes from other components (e.g. AuthGate signs,
  // Navbar should update). We use the storage event for cross-tab and a
  // custom event for same-tab updates.
  useEffect(() => {
    if (!mounted) return;
    const sync = () => {
      if (currentAddress) {
        setIsAuthenticated(
          localStorage.getItem(`justpay_auth_${currentAddress}`) === "true",
        );
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener("justpay_auth_changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("justpay_auth_changed", sync);
    };
  }, [currentAddress, mounted]);

  const markAuthenticated = useCallback((address: string) => {
    localStorage.setItem(`justpay_auth_${address}`, "true");
    setIsAuthenticated(true);
    window.dispatchEvent(new Event("justpay_auth_changed"));
  }, []);

  const clearAuth = useCallback((address: string) => {
    localStorage.removeItem(`justpay_auth_${address}`);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("justpay_auth_changed"));
  }, []);

  return {
    currentAddress,
    isAuthenticated: mounted && isAuthenticated,
    isConnected: mounted && !!currentAddress,
    markAuthenticated,
    clearAuth,
  };
}
