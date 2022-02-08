import React, { useState, useEffect } from "react";

import { AppTheme } from "../../styles/theme";
import { MainLayout } from "../../layout/MainLayout";
import { TransferBoard } from "../TransferBoard/TransferBoard";

import "@fontsource/roboto/400.css";

function App() {
  return (
    <AppTheme>
      <MainLayout>
        <TransferBoard></TransferBoard>
      </MainLayout>
    </AppTheme>
  );
}

export default App;
