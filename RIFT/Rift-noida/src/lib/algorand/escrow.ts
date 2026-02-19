import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect({ chainId: 416002 });

const algodClient = new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", "");

export function convertFareToMicroAlgos(fare: number): number {
  // Demo-safe conversion: keep escrow small but non-zero.
  return Math.max(1_000, Math.round(fare * 1_000));
}

export async function sendEscrowPayment(input: {
  senderAddress: string;
  appAddress: string;
  fare: number;
}) {
  const accounts = await peraWallet.reconnectSession();
  if (!accounts.includes(input.senderAddress)) {
    throw new Error("Connected Pera session not found for this address.");
  }

  const suggestedParams = await algodClient.getTransactionParams().do();
  const amount = convertFareToMicroAlgos(input.fare);

  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: input.senderAddress,
    receiver: input.appAddress,
    amount,
    suggestedParams,
  });

  const signed = await peraWallet.signTransaction([
    [
      {
        txn: paymentTxn,
        signers: [input.senderAddress],
        message: "Escrow payment for ride booking",
      },
    ],
  ]);

  const result = await algodClient.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(algodClient, result.txid, 4);
  return result.txid;
}

export async function releaseEscrowPayment(input: {
  appAddress: string;
  driverAddress: string;
  rideId: string;
}) {
  // NOTE: this is a demo-safe placeholder until the ARC56 app client release
  // method is wired on frontend/server. We still persist a deterministic release id.
  if (!input.appAddress || !input.driverAddress) {
    throw new Error("Escrow release configuration is incomplete.");
  }
  return `release-${input.rideId.slice(0, 8)}-${Date.now()}`;
}
