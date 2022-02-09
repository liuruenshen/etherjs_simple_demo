import { ethers } from "ethers";
import isUndefined from "lodash/isUndefined";
import { EthereumError } from "./EthereumError";
import * as Type from "../type";

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
    console.log(
      "🚀 ~ file: Ethereum.ts ~ line 59 ~ Ethereum ~ *transfer ~ to",
      to
    );
    const steps: Type.TransferSteps = {
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

    const TransferAmount = ethers.utils.parseEther(amountString);

    const formattedTransferAmount = ethers.utils.formatEther(TransferAmount);
    const formattedBalance = ethers.utils.formatEther(balance);

    if (balance.lt(TransferAmount)) {
      throw new Error(
        `Insufficient balance, Transfer amount: ${formattedTransferAmount}. You have ${formattedBalance}`
      );
    }

    const prepareTransaction: Type.PrepareTransferStep = {
      stage: "prepare-transaction",
      balance,
      formattedBalance,
      TransferAmount,
      formattedTransferAmount,
    };
    yield prepareTransaction;

    const transaction = await signer.sendTransaction({
      from,
      to,
      value: TransferAmount,
    });

    const workInProgress: Type.WorkInProgressStep = {
      stage: "work-in-progress",
      transactionHash: transaction.hash,
    };
    yield workInProgress;

    const receipt = await transaction.wait();

    const transactionDone: Type.TransferDoneStep = {
      stage: "done",
      transactionHash: transaction.hash,
      receipt: { blockNumber: receipt.blockNumber },
    };
    yield transactionDone;
  }
}
