import React from "react";
import { PropsWithChildren } from "react";
import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes,
} from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    extendBackground: {
      light: string;
    };
  }

  interface ThemeOptions {
    extendBackground?: {
      light?: string;
    };
  }
}

const theme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#3f51b5",
      },
      secondary: {
        main: "#f50057",
      },
      background: {
        default: "#303030",
        paper: "#424242",
      },
      text: {
        primary: "#ffffff",
        secondary: "rgba(255, 255, 255, 0.7)",
        disabled: "rgba(255, 255, 255, 0.5)",
      },
    },
    extendBackground: {
      light: "#808080",
    },
  })
);

export function AppTheme({ children }: PropsWithChildren<unknown>) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
