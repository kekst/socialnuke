import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import { useStore } from "../Store";
import { PlatformTarget } from "../platforms/types";
import TargetList from "./TargetList";
import { usePlatform } from "./context";

export interface Channel {
  id: string;
  name: string;
  type: number;
  accountId: string;
}

function TargetSelectorType({ type }: { type: string }) {
  const store = useStore();
  const { platform, accountId, setTarget } = usePlatform();

  const [selectedFirst, setSelectedFirst] = useState<PlatformTarget>();
  const [selectedSecond, setSelectedSecond] = useState<PlatformTarget>();

  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState<PlatformTarget[]>([]);
  const [children, setChildren] = useState<PlatformTarget[]>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (accountId) {
      setSelectedFirst(undefined);
      setSelectedSecond(undefined);
    }
  }, [accountId]);

  const account = store.accounts.find(
    (acc) => acc.platform === platform.key && acc.id === accountId
  );

  useEffect(() => {
    if (!account || !type) {
      setTargets([]);
      return;
    }

    setLoading(true);
    platform
      .withToken(account.token)
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
  }, [account, type, platform]);

  useEffect(() => {
    setSelectedSecond(undefined);
    setChildren([]);
    if (!selectedFirst?.children || !account) {
      return;
    }

    selectedFirst
      .children()
      .then((res) => {
        if (res.type === "ok") {
          setChildren(res.result);
        }
      })
      .catch(() => {});
  }, [selectedFirst, account]);

  useEffect(() => {
    setTarget(selectedSecond || selectedFirst);
  }, [selectedFirst, selectedSecond, setTarget]);

  return (
    <>
      {loading ? <Alert severity="info">Loading...</Alert> : null}
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
    </>
  );
}

export default observer(TargetSelectorType);
