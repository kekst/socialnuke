import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid2";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { BsPlus, BsPeopleFill } from "react-icons/bs";
import { useStore } from "../Store";
import { Platform, PlatformTarget } from "../platforms/types";
import TargetList from "./TargetList";
import Link from "@renderer/components/Link";
import { Button, ToggleButton, ToggleButtonGroup } from "@mui/material";

export interface Channel {
  id: string;
  name: string;
  type: number;
  accountId: string;
}

function TargetSelector({
  onTargetSelected,
  platform
}: {
  onTargetSelected: (target?: PlatformTarget) => void;
  platform: Platform;
}) {
  const store = useStore();

  const [selected, setSelected] = useState<string>();
  const [selectedFirst, setSelectedFirst] = useState<PlatformTarget>();
  const [selectedSecond, setSelectedSecond] = useState<PlatformTarget>();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<string>(platform.targetTypes[0].key);
  const [targets, setTargets] = useState<PlatformTarget[]>([]);
  const [children, setChildren] = useState<PlatformTarget[]>();
  const [error, setError] = useState<string | undefined>();

  const changeType = (type: "channel" | "guild") => {
    setSelectedFirst(undefined);
    setSelectedSecond(undefined);
    setType(type);
  };

  useEffect(() => {
    if (!selected || !type) {
      setTargets([]);
      return;
    }

    const acc = store.accounts.find((acc) => acc.platform === platform.key && acc.id === selected);
    if (acc) {
      setLoading(true);
      platform
        .withToken(acc.token)
        .then((actor) => actor.targets(type))
        .then((res) => {
          if (res.type === "ok") {
            setTargets(res.result);
            setLoading(false);
          }
        })
        .catch((e) => {
          setError(`${e}`);
          setLoading(false);
        });
    }
  }, [selected, type, platform, store, setTargets, setError, setLoading]);

  useEffect(() => {
    setSelectedSecond(undefined);
    setChildren([]);
    if (!selectedFirst?.children || !selected) {
      return;
    }

    const acc = store.accounts.find((acc) => acc.platform === platform.key && acc.id === selected);
    if (acc) {
      selectedFirst
        .children()
        .then((res) => {
          if (res.type === "ok") {
            setChildren(res.result);
          }
        })
        .catch(() => {});
    }
  }, [selectedFirst, selected, store, setChildren, platform]);

  useEffect(() => {
    onTargetSelected(selectedSecond || selectedFirst);
  }, [selectedFirst, selectedSecond, onTargetSelected]);

  const accounts = store.accounts.filter((account) => account.platform === platform.key);

  return (
    <Grid size={6}>
      <div className="accounts">
        <ToggleButtonGroup
          value={selected}
          exclusive
          onChange={(_, value) => {
            setSelectedFirst(undefined);
            setSelected(value);
          }}
          className="target"
        >
          {accounts.map((acc) => (
            <ToggleButton
              key={acc.id}
              className={`account ${acc.id === selected ? "active" : ""}`}
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
      <Tabs value={type} onChange={(_, k) => changeType(k as any)}>
        {platform.targetTypes.map((type) => (
          <Tab key={type.key} value={type.key} label={type.name} />
        ))}
      </Tabs>
      {loading ? <Alert severity="info">Loading...</Alert> : null}
      {!selected ? <Alert severity="info">Select an account first.</Alert> : null}
      {error ? (
        <Alert severity="error">
          <b>Error:</b> {error}
        </Alert>
      ) : null}

      {!loading && (
        <Grid container style={{ padding: 0 }}>
          <Grid size={selectedFirst?.children ? 6 : 12}>
            <TargetList
              targets={targets}
              onTargetSelected={setSelectedFirst}
              selectedTarget={selectedFirst}
            />
          </Grid>
          {selectedFirst?.children && children && (
            <Grid size={6}>
              <TargetList
                targets={children}
                onTargetSelected={setSelectedSecond}
                selectedTarget={selectedSecond}
              />
            </Grid>
          )}
        </Grid>
      )}
    </Grid>
  );
}

export default observer(TargetSelector);
