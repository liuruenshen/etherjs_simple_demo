import { ethers } from "ethers";
import isUndefined from "lodash/isUndefined";

declare global {
  interface Window {
    ethereum: any;
  }
}

export class Ethereum {
  private provider: ethers.providers.Web3Provider;
  private signer: ethers.providers.JsonRpcSigner | null = null;

  public constructor() {
    if (isUndefined(window.ethereum)) {
      throw new Error("Install MetaMask extension before using the app");
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
  }

  public async getSigner() {
    if (this.signer) {
      return this.signer;
    }

    await this.provider.send("eth_requestAccounts", []);
    this.signer = this.provider.getSigner();

    return this.signer;
  }

  public async userAddress() {
    const signer = await this.getSigner();

    return await signer.getAddress();
  }

  public async *transfer(from: string, to: string, amountString: string) {
    const signer = await this.getSigner();

    const balance = await signer.getBalance();

    const transferringAmount = ethers.utils.parseEther(amountString);

    const formattedTransferringAmount =
      ethers.utils.formatEther(transferringAmount);
    const formattedBalance = ethers.utils.formatEther(balance);

    if (balance.lt(transferringAmount)) {
      throw new Error(
        `Insufficient balance, transferring amount: ${formattedTransferringAmount}. You have ${formattedBalance}`
      );
    }

    yield {
      stage: "prepare-transaction",
      balance,
      formattedBalance,
      transferringAmount,
      formattedTransferringAmount,
    };

    const transaction = await signer.sendTransaction({
      from,
      to,
      value: transferringAmount,
    });

    yield {
      stage: "in-progress",
      transactionHash: transaction.hash,
      transferringAmount,
    };

    const receipt = await transaction.wait();

    yield {
      stage: "done",
      transactionHash: transaction.hash,
      receiptInfo: { blockNumber: receipt.blockNumber },
    };
  }
}
