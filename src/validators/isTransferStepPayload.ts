import * as Type from "../type";
import { isPlainObject } from "../utilities/isPlainObject";

export function isTransferStepsPayload(e: unknown): e is Type.TransferSteps {
  return isPlainObject<Type.TransferSteps>(e) && Array.isArray(e.steps);
}

export function isPrepareTransferStepPayload(
  e: unknown
): e is Type.PrepareTransferStep {
  return (
    isPlainObject<Type.PrepareTransferStep>(e) &&
    e.stage === "prepare-transaction"
  );
}

export function isWorkInProgressTransferStepPayload(
  e: unknown
): e is Type.PrepareTransferStep {
  return (
    isPlainObject<Type.WorkInProgressStep>(e) && e.stage === "work-in-progress"
  );
}

export function isDoneTransferStepPayload(
  e: unknown
): e is Type.TransferDoneStep {
  return isPlainObject<Type.TransferDoneStep>(e) && e.stage === "done";
}
