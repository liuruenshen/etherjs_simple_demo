import type { ethers } from "ethers";

declare global {
  interface Window {
    ethereum: any;
  }
}

export interface TransferStep {
  stage: "prepare-transaction" | "work-in-progress" | "done";
  label: string;
}

export interface TransferSteps {
  steps: TransferStep[];
  initStep: number;
}

export interface PrepareTransferStep {
  stage: TransferStep["stage"];
  balance: ethers.BigNumber;
  formattedBalance: string;
  TransferAmount: ethers.BigNumber;
  formattedTransferAmount: string;
}

export interface WorkInProgressStep {
  stage: TransferStep["stage"];
  transactionHash: string;
}

export interface TransferDoneStep {
  stage: TransferStep["stage"];
  transactionHash: string;
  receipt: {
    blockNumber: number;
  };
}
