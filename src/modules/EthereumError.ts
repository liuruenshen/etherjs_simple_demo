export type EtherumErrorCode = "missWeb3Provider";

export class EthereumError extends Error {
  public errorCode: EtherumErrorCode;
  public constructor(message: string, code: EtherumErrorCode) {
    super(message);
    this.errorCode = code;
  }
}
