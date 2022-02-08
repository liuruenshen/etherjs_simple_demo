import { ethers } from "ethers";
import isUndefined from "lodash/isUndefined";
import { EthereumError } from "./EthereumError";

declare global {
  interface Window {
    ethereum: any;
  }
}

interface TransferringStep {
  stage: "prepare-transaction" | "work-in-progress" | "done";
  label: string;
}
interface TransferringSteps {
  steps: TransferringStep[];
  initStep: number;
}

interface PrepareTransferringStep {
  stage: TransferringStep["stage"];
  balance: ethers.BigNumber;
  formattedBalance: string;
  transferringAmount: ethers.BigNumber;
  formattedTransferringAmount: string;
}

interface WorkInProgressStep {
  stage: TransferringStep["stage"];
  transactionHash: string;
}

export class Ethereum {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.providers.JsonRpcSigner | null = null;

  public initialize() {
    if (isUndefined(window.ethereum)) {
      throw new EthereumError(
        "Install MetaMask extension before using the app",
        "missWeb3Provider"
      );
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
  }

  public isWaitingUserApproveAccountRequest(e: { code: number }) {
    return e.code === -32002;
  }

  public async getSigner() {
    if (this.signer) {
      return this.signer;
    }

    if (!this.provider) {
      this.initialize();
    }

    await this.provider!.send("eth_requestAccounts", []);
    this.signer = this.provider!.getSigner();

    return this.signer;
  }

  public async getWalletAddress() {
    const signer = await this.getSigner();

    return await signer.getAddress();
  }

  public async getWalletBalance() {
    const signer = await this.getSigner();

    return await signer.getBalance();
  }

  public async getFormattedWalletBalance() {
    const balance = await this.getWalletBalance();

    return ethers.utils.formatEther(balance);
  }

  public async *transfer(from: string, to: string, amountString: string) {
    const steps: TransferringSteps = {
      steps: [
        { stage: "prepare-transaction", label: "Prepare a transaction" },
        { stage: "work-in-progress", label: "Work in progress" },
        { stage: "done", label: "Transaction Done" },
      ],
      initStep: -1,
    };

    yield steps;

    const signer = await this.getSigner();

    const balance = await this.getWalletBalance();

    const transferringAmount = ethers.utils.parseEther(amountString);

    const formattedTransferringAmount =
      ethers.utils.formatEther(transferringAmount);
    const formattedBalance = ethers.utils.formatEther(balance);

    if (balance.lt(transferringAmount)) {
      throw new Error(
        `Insufficient balance, transferring amount: ${formattedTransferringAmount}. You have ${formattedBalance}`
      );
    }

    const prepareTransaction: PrepareTransferringStep = {
      stage: "prepare-transaction",
      balance,
      formattedBalance,
      transferringAmount,
      formattedTransferringAmount,
    };
    yield prepareTransaction;

    const transaction = await signer.sendTransaction({
      from,
      to,
      value: transferringAmount,
    });

    const workInProgress: WorkInProgressStep = {
      stage: "work-in-progress",
      transactionHash: transaction.hash,
    };
    yield workInProgress;

    const receipt = await transaction.wait();

    yield {
      stage: "done",
      transactionHash: transaction.hash,
      receiptInfo: { blockNumber: receipt.blockNumber },
    };
  }
}
