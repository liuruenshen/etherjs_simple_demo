import React, { useEffect, useState, useRef } from "react";

import { Ethereum } from "../../modules/Ethereum";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stepper from "@mui/material/Stepper";
import Step, { StepProps } from "@mui/material/Step";
import StepLabel, { StepLabelProps } from "@mui/material/StepLabel";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Alert from "@mui/material/Alert";
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";

import { FunctionPanel } from "../../layout/FunctionPanel";

import {
  isWeb3ProviderError,
  Web3ProviderError,
  isError,
} from "../../validators/isWeb3ProviderError";
import { EthereumError, EthereumErrorCode } from "../../modules/EthereumError";
import {
  isTransferStepsPayload,
  isDoneTransferStepPayload,
  isWorkInProgressTransferStepPayload,
} from "../../validators/isTransferStepPayload";
import {
  TransferSteps,
  PrepareTransferStep,
  WorkInProgressStep,
  TransferDoneStep,
} from "../../type";
import { TransactionHistory } from "../TransactionHistory/TransactionHistory";

const ethereum = new Ethereum();

export function TransferBoard() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  /**
   * Save the latest transaction hash for displaying the detail of the transaction
   */
  const transactionHash = useRef<string>("");

  const [openDialog, setOpenDialog] = useState(false);

  /**
   * The error is thrown by the Ethereum instance, indicating
   * there are some problems when interacting with the Web3 provider.
   */
  const [showEthereumError, setShowEthereumError] = useState<
    EthereumErrorCode | ""
  >("");

  /**
   * Ethereum.transfer is an async generator, which reports the ongoing transaction progress by
   * yielding all sorts of payload; the reference here will save these payloads for further processing.
   */
  const [transferSteps, setTransferSteps] = useState<{
    steps: TransferSteps | null;
    payloads: (
      | PrepareTransferStep
      | WorkInProgressStep
      | TransferDoneStep
      | Web3ProviderError
      | Error
    )[];
  }>({ steps: null, payloads: [] });

  /**
   * Get the active wallet address & balance when the following conditions are met:
   *  the wallet address or the balance is not known
   *  the user reloads the app after he has been told to log in or unlock MetaMask
   */
  useEffect(() => {
    async function getInfo() {
      try {
        const [walletAddress, walletBalance] = await Promise.all([
          ethereum.getWalletAddress(),
          ethereum.getFormattedWalletBalance(),
        ]);
        setWalletAddress(walletAddress);
        setWalletBalance(walletBalance);
      } catch (e) {
        if (
          isWeb3ProviderError(e) &&
          ethereum.isWaitingUserApproveAccountRequest(e)
        ) {
          setOpenDialog(true);
        } else if (e instanceof EthereumError) {
          setShowEthereumError(e.errorCode);
        }
      }
    }

    /**
     * Proceed to get the wallet information after the user closes the dialog by pressing the reload button
     */
    if (openDialog) {
      return;
    }

    if (!walletAddress || !walletBalance) {
      getInfo();
    }
  }, [walletAddress, walletBalance, openDialog]);

  async function transfer() {
    // clean up previous transaction records
    setTransferSteps((state) => ({ ...state, payloads: [] }));

    try {
      for await (const payload of ethereum.transfer(
        walletAddress,
        receiver,
        amount
      )) {
        if (isTransferStepsPayload(payload)) {
          setTransferSteps((state) => ({ ...state, steps: payload }));
        } else {
          setTransferSteps((state) => ({
            ...state,
            payloads: [...state.payloads, payload],
          }));
        }
      }

      // force to refresh the balance after transfer succeed
      setWalletBalance("");
    } catch (e) {
      setTransferSteps((state) => ({
        ...state,
        payloads: [...state.payloads, ...(isError(e) ? [e] : [])],
      }));
    }
  }

  function isTransferDone() {
    const payloads = transferSteps.payloads;

    return (
      !!payloads.length &&
      isDoneTransferStepPayload(payloads[payloads.length - 1])
    );
  }

  function isTransferFailed() {
    const payloads = transferSteps.payloads;

    return !!payloads.length && isError(payloads[payloads.length - 1]);
  }

  function getTransactionHash() {
    const payloads = transferSteps.payloads;

    const target = payloads.find((payload) =>
      isWorkInProgressTransferStepPayload(payload)
    ) as WorkInProgressStep | undefined;

    return target ? target.transactionHash : "";
  }

  const txHash = getTransactionHash();
  if (txHash) {
    transactionHash.current = txHash;
  }

  if (showEthereumError) {
    if (showEthereumError === "missWeb3Provider")
      return (
        <Alert variant="filled" severity="error" sx={{ fontSize: "1em" }}>
          You have to install MetaMask browser extension so that you can use the
          App.
        </Alert>
      );
  }

  return (
    <Stack direction="column" spacing={3} sx={{ p: 2 }}>
      <Dialog open={openDialog}>
        <DialogContent>
          <DialogContentText>
            Login/Unlock Metamask first, then press reload button to proceed
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setOpenDialog(false);
            }}
          >
            Reload
          </Button>
        </DialogActions>
      </Dialog>
      <FunctionPanel badgeContent="Information">
        <Stack direction="row" spacing={2}>
          <Stack
            direction="row"
            spacing={1}
            sx={(theme) => ({
              background: theme.extendBackground.light,
              p: 2,
            })}
          >
            <Box>Wallet Address</Box>
            <Divider orientation="vertical"></Divider>
            <Box>{walletAddress}</Box>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={(theme) => ({
              background: theme.extendBackground.light,
              p: 2,
            })}
          >
            <Box>Balance</Box>
            <Divider orientation="vertical"></Divider>
            <Box>{walletBalance}</Box>
          </Stack>
        </Stack>
      </FunctionPanel>
      <FunctionPanel badgeContent="Transfer ETH">
        <Stack direction="column" spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField
              variant="filled"
              required
              label="Receiver Address"
              fullWidth
              value={receiver}
              onChange={(event) => setReceiver(event.target.value)}
            ></TextField>
            <TextField
              variant="filled"
              value={amount}
              required
              label="Amount"
              type="number"
              onChange={(event) => setAmount(event.target.value)}
            ></TextField>
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            alignItems="end"
          >
            {transferSteps.steps ? (
              <Stepper
                activeStep={
                  transferSteps.payloads.length
                    ? transferSteps.payloads.length - 1
                    : transferSteps.steps.initStep
                }
                sx={{ flexGrow: 1 }}
              >
                {transferSteps.steps.steps.map((step, index) => {
                  const stepProps: StepProps =
                    index === transferSteps.steps!.steps.length - 1
                      ? {
                          completed: isTransferDone(),
                        }
                      : {};

                  const payload = transferSteps.payloads[index];

                  const stepLabelProps: StepLabelProps = {};
                  if (isError(payload)) {
                    stepLabelProps.optional = (
                      <Typography variant="caption" color="error">
                        {payload.message}
                      </Typography>
                    );
                    stepLabelProps.error = true;
                  } else if (isWorkInProgressTransferStepPayload(payload)) {
                    stepLabelProps.optional = (
                      <Typography variant="caption" color="info">
                        {`TX Hash: ${payload.transactionHash}`}
                      </Typography>
                    );
                  }

                  return (
                    <Step key={step.stage} {...stepProps}>
                      <StepLabel {...stepLabelProps}>{step.label}</StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
            ) : null}
            <LoadingButton
              loading={
                !!transferSteps.steps &&
                !isTransferDone() &&
                !isTransferFailed()
              }
              variant="contained"
              onClick={() => transfer()}
            >
              Transfer
            </LoadingButton>
          </Stack>
        </Stack>
      </FunctionPanel>
      <TransactionHistory
        newTransactionHash={transactionHash.current}
        ethereum={ethereum}
      ></TransactionHistory>
    </Stack>
  );
}
