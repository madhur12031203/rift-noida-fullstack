"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();

type UsePeraWalletArgs = {
  appId: number;
  appAddress: string;
};

export type UsePeraWalletResult = {
  address: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  bookTrip: (driverAddr: string, amountMicroAlgos: number) => Promise<void>;
  completeTrip: () => Promise<void>;
  cancelTrip: () => Promise<void>;
};

export function usePeraWallet({
  appId,
  appAddress,
}: UsePeraWalletArgs): UsePeraWalletResult {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const algodClient = useMemo(
    () => new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", ""),
    []
  );

  useEffect(() => {
    void peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      })
      .catch(() => {
        // No existing session.
      });
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const accounts = await peraWallet.connect();
      setAddress(accounts[0] ?? null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    await peraWallet.disconnect();
    setAddress(null);
  }, []);

  // Placeholders for later ARC4 call wiring.
  const bookTrip = useCallback(
    async (driverAddr: string, amountMicroAlgos: number) => {
      if (!address) throw new Error("Wallet not connected");
      const suggestedParams = await algodClient.getTransactionParams().do();

      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: address,
        receiver: appAddress,
        amount: amountMicroAlgos,
        suggestedParams,
      });

      console.log("TODO: group payment + app call for book_trip()", {
        appId,
        driverAddr,
        paymentTxn,
      });
    },
    [address, algodClient, appAddress, appId]
  );

  const completeTrip = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    console.log("TODO: app call complete_trip()", { appId, address });
  }, [address, appId]);

  const cancelTrip = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    console.log("TODO: app call cancel_trip()", { appId, address });
  }, [address, appId]);

  return {
    address,
    isConnecting,
    connectWallet,
    disconnectWallet,
    bookTrip,
    completeTrip,
    cancelTrip,
  };
}
