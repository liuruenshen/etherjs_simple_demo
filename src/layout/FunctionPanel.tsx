import React, { PropsWithChildren } from "react";

import Paper from "@mui/material/Paper";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";

import { styled } from "@mui/material/styles";

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

export interface FunctionPanelProps {
  badgeContent: string;
}

export function FunctionPanel({
  children,
  badgeContent,
}: PropsWithChildren<FunctionPanelProps>) {
  return (
    <Paper sx={{ p: 0 }} elevation={0}>
      <TitleBadge badgeContent={badgeContent}>
        <Group>{children}</Group>
      </TitleBadge>
    </Paper>
  );
}
