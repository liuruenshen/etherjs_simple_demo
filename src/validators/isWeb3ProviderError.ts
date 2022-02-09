import { isPlainObject } from "../utilities/isPlainObject";
import isFinite from "lodash/isFinite";

interface Web3ProviderError {
  code: number;
  message: string;
}

export function isWeb3ProviderError(e: unknown): e is Web3ProviderError {
  return isPlainObject(e) && isFinite((e as any).code);
}
