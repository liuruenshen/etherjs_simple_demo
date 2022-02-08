import React, { useState, useEffect } from "react";

import { Ethereum } from "../../modules/Ethereum";
import { AppTheme } from "../../styles/theme";
import { MainLayout } from "../../layout/MainLayout";

import "@fontsource/roboto/400.css";

const ethereum = new Ethereum();

function App() {
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    async function getAddress() {
      setUserAddress(await ethereum.userAddress());
    }

    getAddress();
  }, []);

  async function transfer() {
    try {
      for await (const message of ethereum.transfer(
        "0x467d6be7aBA5c04D8744eA135290B0D0aa593dBA",
        "0x211b8364fD6a8C7De6972F2d443a2ee4dfE61A54",
        "1"
      )) {
        console.log(message);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <AppTheme>
      <MainLayout></MainLayout>
    </AppTheme>
  );
}

export default App;
