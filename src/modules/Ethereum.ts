import { ethers } from "ethers";
import isUndefined from "lodash/isUndefined";
import { EthereumError } from "./EthereumError";
import * as Type from "../type";
import erc20ContractAbi from "./contract/FaucetToken.json";

const WAIT_USER_APPROVE_ETH_ACCOUNT_REQUEST_CODE = -32002;
const DEFAULT_NETWORK = "ropsten";
const DEFAULT_TRANSFER_STEPS: Type.TransferSteps = {
  steps: [
    { stage: "prepare-transaction", label: "Prepare a transaction" },
    { stage: "work-in-progress", label: "Work in progress" },
    { stage: "done", label: "Transaction Done" },
  ],
  initStep: -1,
};

export type TransferrableTokens = "ETH" | "FAU";

export const TRANSFERRABLE_TOKENS: TransferrableTokens[] = ["ETH", "FAU"];

export class Ethereum {
  private web3Provider: ethers.providers.Web3Provider | null = null;
  private etherScanProivder: ethers.providers.EtherscanProvider | null = null;
  private signer: ethers.providers.JsonRpcSigner | null = null;
  private _erc20Contract: ethers.Contract | null = null;

  public initialize() {
    if (isUndefined(window.ethereum)) {
      throw new EthereumError(
        "Install MetaMask extension before using the app",
        "missWeb3Provider"
      );
    }

    this.web3Provider = new ethers.providers.Web3Provider(
      window.ethereum,
      DEFAULT_NETWORK
    );

    this.etherScanProivder = new ethers.providers.EtherscanProvider(
      DEFAULT_NETWORK,
      process.env.REACT_APP_ETHERSCAN_API_KEY
    );

    /**
     * Ethereum ERC20 Token Faucet: https://erc20faucet.com/
     * View FAU transactions on the Ropsten network: https://ropsten.etherscan.io/token/0xfab46e002bbf0b4509813474841e0716e6730136
     */
    this._erc20Contract = new ethers.Contract(
      "0xfab46e002bbf0b4509813474841e0716e6730136",
      erc20ContractAbi,
      this.web3Provider
    );
  }

  public isWaitingUserApproveAccountRequest(e: { code: number }) {
    return e.code === WAIT_USER_APPROVE_ETH_ACCOUNT_REQUEST_CODE;
  }

  public async getSigner() {
    if (this.signer) {
      return this.signer;
    }

    if (!this.web3Provider) {
      this.initialize();
    }

    await this.web3Provider!.send("eth_requestAccounts", []);
    this.signer = this.web3Provider!.getSigner();

    return this.signer;
  }

  public getFormattedEther(value: ethers.BigNumberish) {
    return ethers.utils.formatEther(value);
  }

  public getFormattedGwei(value: ethers.BigNumberish) {
    return ethers.utils.formatUnits(value, "gwei");
  }

  public async getWalletAddress() {
    const signer = await this.getSigner();

    return await signer.getAddress();
  }

  public async getWalletBalance(
    contract?: ethers.Contract,
    walletAddress?: string
  ) {
    if (contract && walletAddress) {
      return contract.balanceOf(walletAddress);
    } else {
      const signer = await this.getSigner();

      return await signer.getBalance();
    }
  }

  public async getFormattedWalletBalance() {
    const balance = await this.getWalletBalance();

    return ethers.utils.formatEther(balance);
  }

  public async getHistory() {
    return this.etherScanProivder?.getHistory(this.getWalletAddress());
  }

  public getBlock(blockNumber: number) {
    if (!this.web3Provider) {
      throw new EthereumError(
        "call initialize before getting the transaction detail",
        "needInitialize"
      );
    }

    return this.web3Provider.getBlock(blockNumber);
  }

  public get erc20Contract() {
    return this._erc20Contract;
  }

  public async *contractTransfer(
    contract: ethers.Contract,
    from: string,
    to: string,
    amountString: string
  ) {
    yield DEFAULT_TRANSFER_STEPS;

    const signer = await this.getSigner();

    const signedContract = contract.connect(signer);

    const balance = await contract.balanceOf(from);
    const transferAmount = ethers.utils.parseUnits(amountString);

    const formattedTransferAmount = ethers.utils.formatUnits(transferAmount);
    const formattedBalance = ethers.utils.formatUnits(balance);

    if (balance.lt(transferAmount)) {
      throw new EthereumError(
        `Insufficient balance, transfer amount: ${formattedTransferAmount}. You have ${formattedBalance}`,
        "insufficientBalance"
      );
    }

    const prepareTransaction: Type.PrepareTransferStep = {
      stage: "prepare-transaction",
      balance,
      formattedBalance,
      transferAmount,
      formattedTransferAmount,
    };
    yield prepareTransaction;

    const transaction = await signedContract.transfer(to, transferAmount);

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

  public async *ethTransfer(from: string, to: string, amountString: string) {
    yield DEFAULT_TRANSFER_STEPS;

    const signer = await this.getSigner();

    const balance = await this.getWalletBalance();

    const transferAmount = ethers.utils.parseEther(amountString);

    const formattedTransferAmount = ethers.utils.formatEther(transferAmount);
    const formattedBalance = ethers.utils.formatEther(balance);

    if (balance.lt(transferAmount)) {
      throw new EthereumError(
        `Insufficient balance, transfer amount: ${formattedTransferAmount}. You have ${formattedBalance}`,
        "insufficientBalance"
      );
    }

    const prepareTransaction: Type.PrepareTransferStep = {
      stage: "prepare-transaction",
      balance,
      formattedBalance,
      transferAmount: transferAmount,
      formattedTransferAmount,
    };
    yield prepareTransaction;

    const transaction = await signer.sendTransaction({
      from,
      to,
      value: transferAmount,
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

  public async *transfer(
    from: string,
    to: string,
    amountString: string,
    token: TransferrableTokens = "ETH"
  ) {
    if (token === "ETH") {
      for await (const payload of this.ethTransfer(from, to, amountString)) {
        yield payload;
      }
    } else if (token === "FAU") {
      if (!this._erc20Contract) {
        throw new EthereumError(
          "Call initialize method before performing contract transfer",
          "needInitialize"
        );
      }

      for await (const payload of this.contractTransfer(
        this._erc20Contract,
        from,
        to,
        amountString
      )) {
        yield payload;
      }
    }
  }
}
