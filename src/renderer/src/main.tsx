import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { configure } from "mobx";
import { StoreProvider } from "./Store";
import HomeQueue from "./home/Queue";
import Purge from "./platform";
import HomeAccounts from "./home/Accounts";
import { platforms } from "./platforms";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import "./index.scss";
import App from "./App";

const router = createMemoryRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        path: "/accounts",
        Component: HomeAccounts
      },
      {
        path: "/queue",
        Component: HomeQueue
      },
      ...Object.values(platforms).map(
        (platform) =>
          ({
            path: `/${platform.key}/purge`,
            Component: () => <Purge platform={platform} />
          }) as any
      )
    ]
  }
]);

configure({
  enforceActions: "never"
});

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  </LocalizationProvider>
);
