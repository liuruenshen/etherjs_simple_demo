import React, { useEffect, useState, useRef } from "react";

import { Ethereum } from "../../modules/Ethereum";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stepper from "@mui/material/Stepper";
import Step, { StepProps } from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Alert from "@mui/material/Alert";
import LoadingButton from "@mui/lab/LoadingButton";

import { styled } from "@mui/material/styles";

import { isWeb3ProviderError } from "../../validators/isWeb3ProviderError";
import { EthereumError, EthereumErrorCode } from "../../modules/EthereumError";
import {
  isTransferStepsPayload,
  isDoneTransferStepPayload,
} from "../../validators/isTransferStepPayload";
import {
  TransferSteps,
  PrepareTransferStep,
  WorkInProgressStep,
  TransferDoneStep,
} from "../../type";

const ethereum = new Ethereum();

const TitleBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    left: 0,
    borderRadius: 2,
    background: `${theme.extendBackground.light}`,
    fontSize: "0.8em",
    right: "unset",
  },
  "&": {
    display: "block",
  },
}));

const Group = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.extendBackground.light}`,
  padding: "22px 16px 16px 16px",
  borderRadius: "4px",
}));

export function TransferBoard() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [transferActiveStep, setTransferActiveStep] = useState<number>(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [showEthereumError, setShowEthereumError] = useState<
    EthereumErrorCode | ""
  >("");
  const transferStepsPayloadRef = useRef<{
    steps: TransferSteps | null;
    payloads: (PrepareTransferStep | WorkInProgressStep | TransferDoneStep)[];
  }>({ steps: null, payloads: [] });

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
    transferStepsPayloadRef.current.payloads = [];

    try {
      for await (const payload of ethereum.transfer(
        walletAddress,
        receiver,
        amount
      )) {
        if (isTransferStepsPayload(payload)) {
          transferStepsPayloadRef.current.steps = payload;
          setTransferActiveStep(payload.initStep);
        } else {
          transferStepsPayloadRef.current.payloads.push(payload);
          setTransferActiveStep((step) => step + 1);
        }
      }

      // force to refresh the balance after transfer succeed
      setWalletBalance("");
    } catch (e) {
      if (e instanceof Error) {
        transferStepsPayloadRef.current.payloads.push(e);
      }
    }
  }

  function getTransferSteps() {
    return transferStepsPayloadRef.current.steps;
  }

  function isTransferDone() {
    return (
      !!transferStepsPayloadRef.current.payloads.length &&
      isDoneTransferStepPayload(
        transferStepsPayloadRef.current.payloads[
          transferStepsPayloadRef.current.payloads.length - 1
        ]
      )
    );
  }

  const transferSteps = getTransferSteps();

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
    <Stack direction="column" spacing={3} sx={{ p: 3 }}>
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
      <Paper sx={{ p: 0 }} elevation={0}>
        <TitleBadge badgeContent="Information">
          <Group>
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
          </Group>
        </TitleBadge>
      </Paper>
      <Paper sx={{ p: 0 }} elevation={0}>
        <TitleBadge badgeContent="Transfer ETH">
          <Group>
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
                {transferSteps ? (
                  <Stepper activeStep={transferActiveStep} sx={{ flexGrow: 1 }}>
                    {transferSteps.steps.map((step, index) => {
                      const stepProps: StepProps =
                        index === transferSteps.steps.length - 1
                          ? {
                              completed: isTransferDone(),
                            }
                          : {};
                      return (
                        <Step key={step.stage} {...stepProps}>
                          <StepLabel>{step.label}</StepLabel>
                        </Step>
                      );
                    })}
                  </Stepper>
                ) : null}
                <LoadingButton
                  loading={!!transferSteps && !isTransferDone()}
                  variant="contained"
                  onClick={() => transfer()}
                >
                  Transfer
                </LoadingButton>
              </Stack>
            </Stack>
          </Group>
        </TitleBadge>
      </Paper>
    </Stack>
  );
}
