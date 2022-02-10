import React, { useState, useEffect } from "react";
import { backOff } from "exponential-backoff";

import { DataGrid, DataGridProps } from "@mui/x-data-grid";
import Box from "@mui/material/Box";

import type { Ethereum } from "../../modules/Ethereum";

import { FunctionPanel, FunctionPanelProps } from "../../layout/FunctionPanel";

export interface TransactionHistoryProps {
  ethereum: Ethereum;
  newTransactionHash: string;
  containerProps?: Pick<FunctionPanelProps, "sxProps">;
}

const TableColumns: DataGridProps["columns"] = [
  {
    field: "formattedDate",
    headerName: "Date",
    width: 130,
    editable: false,
    flex: 0.5,
  },
  {
    field: "hash",
    headerName: "TX hash",
    width: 200,
    editable: false,
    flex: 1,
  },
  {
    field: "from",
    headerName: "Sender",
    width: 200,
    editable: false,
    flex: 1,
  },
  {
    field: "to",
    headerName: "Receiver",
    width: 200,
    editable: false,
    flex: 1,
  },
  {
    field: "formattedEther",
    headerName: "Value",
    width: 50,
    editable: false,
    flex: 0.2,
  },
  {
    field: "formattedGas",
    headerName: "Gas(Gwei)",
    width: 50,
    editable: false,
    flex: 0.5,
  },
];

type GetPromiseResolvedType<T> = T extends Promise<infer R> ? R : never;

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

export function TransactionHistory({
  ethereum,
  newTransactionHash,
  containerProps,
}: TransactionHistoryProps) {
  type GetHistoryType = Exclude<
    GetPromiseResolvedType<ReturnType<typeof ethereum.getHistory>>,
    undefined
  >;

  const [historyRows, setHistoryRows] = useState<GetHistoryType>([]);

  useEffect(() => {
    async function getHistory() {
      const rows = ((await ethereum.getHistory()) || []).map((item) => {
        return {
          ...item,
          formattedEther: ethereum.getFormattedEther(item.value),
          formattedGas: ethereum.getFormattedGwei(item.gasPrice || 0),
          formattedDate: item.timestamp
            ? new Intl.DateTimeFormat("default", DATE_TIME_FORMAT).format(
                new Date(item.timestamp * 1000)
              )
            : "",
        };
      });

      if (
        !rows.length ||
        (newTransactionHash &&
          !rows.some((item) => item.hash === newTransactionHash))
      ) {
        throw new Error("empty transaction history");
      }

      return rows;
    }

    /**
     * I don't know why it often returns the empty set the first time,
     * so wrapping getHistory function call up with the backOff function to bypass this issue
     */
    async function backOffGetHistory() {
      try {
        setHistoryRows(
          (await backOff(getHistory, {
            numOfAttempts: 8,
            startingDelay: 500,
          })) || []
        );
      } catch (e) {
        if (e instanceof Error) {
          console.warn(`Failed to get the transaction history: ${e.message}`);
        }
      }
    }

    backOffGetHistory();
  }, [newTransactionHash]);

  return (
    <FunctionPanel badgeContent="History" {...containerProps}>
      <Box sx={{ height: 1 }}>
        <DataGrid
          columns={TableColumns}
          rows={historyRows}
          getRowId={(row) => row.hash}
        ></DataGrid>
      </Box>
    </FunctionPanel>
  );
}
