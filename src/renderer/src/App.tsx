import { observer } from "mobx-react-lite";
import { BsPeopleFill, BsListCheck } from "react-icons/bs";
import { Outlet } from "react-router";
import { DashboardLayout, PageContainer } from "@toolpad/core";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";

import Queue from "./Queue";
import { platforms } from "./platforms";

function App() {
  return (
    <ReactRouterAppProvider
      navigation={[
        {
          segment: "accounts",
          title: "Accounts",
          icon: <BsPeopleFill />
        },
        {
          segment: "queue",
          title: "Queue",
          icon: <BsListCheck />
        },
        ...Object.values(platforms).map((platform) => ({
          segment: `${platform.key}/purge`,
          title: platform.name,
          icon: platform.icon
        }))
      ]}
      branding={{
        logo: <div />,
        title: "socialnuke"
      }}
    >
      <DashboardLayout>
        <PageContainer>
          <Queue />
          <Outlet />
        </PageContainer>
      </DashboardLayout>
    </ReactRouterAppProvider>
  );
}

export default observer(App);
