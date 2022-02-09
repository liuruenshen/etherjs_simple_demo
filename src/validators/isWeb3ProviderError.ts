import { isPlainObject } from "../utilities/isPlainObject";
import isFinite from "lodash/isFinite";

export interface Web3ProviderError {
  code: number;
  message: string;
}

export function isWeb3ProviderError(e: unknown): e is Web3ProviderError {
  return isPlainObject(e) && isFinite((e as any).code);
}

export function isError(e: unknown): e is Error {
  return isWeb3ProviderError(e) || e instanceof Error;
}
