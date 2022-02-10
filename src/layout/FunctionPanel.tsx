import React, { PropsWithChildren } from "react";

import Paper, { PaperProps } from "@mui/material/Paper";
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
    transformOrigin: "0 0",
    transform: "scale(1) translate(30px, -50%)",
  },
  "&": {
    display: "block",
    height: "100%",
  },
}));

const Group = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.extendBackground.light}`,
  padding: "22px 16px 16px 16px",
  borderRadius: "4px",
  height: "100%",
  boxSizing: "border-box",
}));

export interface FunctionPanelProps {
  badgeContent: string;
  sxProps?: PaperProps["sx"];
}

export function FunctionPanel({
  children,
  badgeContent,
  sxProps,
}: PropsWithChildren<FunctionPanelProps>) {
  return (
    <Paper sx={{ p: 0, ...sxProps }} elevation={0}>
      <TitleBadge badgeContent={badgeContent}>
        <Group>{children}</Group>
      </TitleBadge>
    </Paper>
  );
}
