import React, { useEffect, useState } from "react";

import { Ethereum } from "../../modules/Ethereum";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Alert from "@mui/material/Alert";

import { styled } from "@mui/material/styles";

import { isWeb3ProviderError } from "../../validators/isWeb3ProviderError";
import { EthereumError, EtherumErrorCode } from "../../modules/EthereumError";

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
  const [transactionSteps, setTransctionSteps] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [showEthereumError, setShowEthereumError] = useState<
    EtherumErrorCode | ""
  >("");

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
    try {
      for await (const message of ethereum.transfer(
        walletAddress,
        receiver,
        amount
      )) {
        console.log(message);
      }
    } catch (e) {
      console.error(e);
    }
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
                <Stepper activeStep={-1} sx={{ flexGrow: 1 }}>
                  <Step>
                    <StepLabel>Prepare a transaction</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Work in progress</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Transaction done</StepLabel>
                  </Step>
                </Stepper>
                <Button variant="contained" onClick={() => transfer()}>
                  Transfer
                </Button>
              </Stack>
            </Stack>
          </Group>
        </TitleBadge>
      </Paper>
    </Stack>
  );
}
