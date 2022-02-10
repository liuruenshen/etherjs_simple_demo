export type EthereumErrorCode =
  | "missWeb3Provider"
  | "insufficientBalance"
  | "needInitialize";

export class EthereumError extends Error {
  public errorCode: EthereumErrorCode;
  public constructor(message: string, code: EthereumErrorCode) {
    super(message);
    this.errorCode = code;
  }
}
