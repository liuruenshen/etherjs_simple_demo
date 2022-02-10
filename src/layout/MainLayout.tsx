import React, { PropsWithChildren } from "react";
import Box from "@mui/material/Box";

export function MainLayout({ children }: PropsWithChildren<unknown>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          backgroundColor: theme.palette.background.paper,
          borderRadius: "10px",
          overflow: "hidden",
          [theme.breakpoints.down("sm")]: {
            width: "95%",
            height: "95%",
          },
          [theme.breakpoints.up("sm")]: {
            width: "80%",
            height: "80%",
          },
          [theme.breakpoints.up("lg")]: {
            width: "70%",
            height: "70%",
          },
        })}
      >
        {children}
      </Box>
    </Box>
  );
}
