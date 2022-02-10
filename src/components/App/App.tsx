import React from "react";
import Box from "@mui/material/Box";

import { AppTheme } from "../../styles/theme";
import { MainLayout } from "../../layout/MainLayout";
import { TransferBoard } from "../TransferBoard/TransferBoard";

import { styled } from "@mui/material/styles";

import "@fontsource/roboto/400.css";

function App() {
  return (
    <AppTheme>
      <MainLayout>
        <Box
          sx={{
            width: 1,
            height: 1,
            overflowY: "auto",
            p: 2,
            boxSizing: "border-box",
          }}
        >
          <TransferBoard></TransferBoard>
        </Box>
      </MainLayout>
    </AppTheme>
  );
}

export default App;
