export type EthereumErrorCode = "missWeb3Provider" | "insufficientBalance";

export class EthereumError extends Error {
  public errorCode: EthereumErrorCode;
  public constructor(message: string, code: EthereumErrorCode) {
    super(message);
    this.errorCode = code;
  }
}
