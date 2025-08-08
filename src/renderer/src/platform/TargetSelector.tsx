import { useState } from "react";
import { observer } from "mobx-react-lite";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { BsPlus, BsPeopleFill } from "react-icons/bs";
import { useStore } from "../Store";
import Link from "@renderer/components/Link";
import { Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { usePlatform } from "./context";
import TargetSelectorType from "./TargetSelectorType";

export interface Channel {
  id: string;
  name: string;
  type: number;
  accountId: string;
}

function TargetSelector() {
  const store = useStore();
  const { platform, accountId, setAccountId } = usePlatform();
  const account = store.accounts.find(
    (acc) => acc.platform === platform.key && acc.id === accountId
  );

  const [type, setType] = useState<string>(platform.targetTypes[0].key);

  const accounts = store.accounts.filter((account) => account.platform === platform.key);

  return (
    <Grid size={6}>
      <div className="accounts">
        <ToggleButtonGroup
          value={accountId}
          exclusive
          onChange={(_, value) => {
            setAccountId(value);
          }}
          className="target"
        >
          {accounts.map((acc) => (
            <ToggleButton
              key={acc.id}
              className={`account ${acc.id === accountId ? "active" : ""}`}
              value={acc.id}
            >
              {acc.iconUrl && <img src={acc.iconUrl} className="target-icon" alt={acc.name} />}
              {acc.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {accounts.length > 0 || <p>No accounts added.</p>}
        <Button onClick={() => store.openLogin(platform.key)} startIcon={<BsPlus />}>
          Add
        </Button>
        <Link to="/accounts">
          <Button startIcon={<BsPeopleFill />}>Manage</Button>
        </Link>
      </div>
      {account ? (
        <TabContext value={type}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={(_, value) => setType(value)}>
              {platform.targetTypes.map((type) => (
                <Tab key={type.key} value={type.key} label={type.name} />
              ))}
            </TabList>
          </Box>
          {platform.targetTypes.map((type) => (
            <TabPanel key={type.key} value={type.key} sx={{ padding: 0 }}>
              <TargetSelectorType type={type.key} />
            </TabPanel>
          ))}
        </TabContext>
      ) : (
        <Alert severity="info">Select an account first.</Alert>
      )}
    </Grid>
  );
}

export default observer(TargetSelector);
