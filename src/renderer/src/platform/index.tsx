import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import { v4 } from "uuid";
import Grid from "@mui/material/Grid";
import TargetSelector from "./TargetSelector";
import { Platform, PlatformTarget } from "../platforms/types";
import { waitFor } from "../platforms/utils";
import Filter from "./filter";
import { Task, useStore } from "../Store";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { PlatformContext, PlatformContextValue } from "./context";

interface PurgeProps {
  platform: Platform;
}

function Purge({ platform }: PurgeProps) {
  const store = useStore();
  const platformState = store.platformState[platform.key];

  const [target, setTarget] = useState<PlatformTarget>();

  const [preparing, setPreparing] = useState(false);
  const [numberOfMessages, setNumberOfMessages] = useState(-1);
  const startPurge = (total: number) => {
    if (!target) return;

    const task: Task = {
      id: v4(),
      type: "purge",
      generator: target.query(platformState.filters),
      userName: target.user.name,
      iconUrl: target.user.iconUrl,
      description: `${target.type}: ${target.name}`,
      platform: platform.key,
      state: "queued",
      total
    };

    store.addTask(task);
  };

  const preparePurge = async (values: any, skipConfirm = false) => {
    if (preparing || !target?.estimate) return;

    setNumberOfMessages(-1);
    setPreparing(true);

    const estimate = await waitFor(() => target.estimate!(values));
    if (skipConfirm) {
      startPurge(estimate);
    } else {
      setNumberOfMessages(estimate);
    }
    setPreparing(false);
  };

  const confirmPurge = () => {
    startPurge(numberOfMessages);
    setNumberOfMessages(-1);
  };

  const platformContextValue: PlatformContextValue = useMemo(() => {
    return {
      filters: platformState.filters,
      setTarget,
      target,
      setFilter: (key, value) => {
        const current = store.platformState[platform.key].filters;
        store.platformState[platform.key].filters = { ...current, [key]: value };
      },
      accountId: platformState.accountId,
      setAccountId: (id) => {
        store.platformState[platform.key].accountId = id;
      },
      platform
    };
  }, [platformState.filters, platformState.accountId, store, platform, target]);

  return (
    <>
      <Container style={{ padding: 0 }}>
        <Grid container spacing={4}>
          <PlatformContext.Provider value={platformContextValue}>
            <TargetSelector />
            <Grid size={6}>
              <Box
                component="form"
                noValidate
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  preparePurge(platformState.filters);
                }}
              >
                {platform.filters.map((filter) => (
                  <Filter key={filter.key} filter={filter} />
                ))}
                <p>
                  Deleting only <b>own</b> messages.
                </p>
                <Button
                  disabled={!target}
                  type="submit"
                  onClick={(e) => {
                    if (e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      preparePurge(platformState.filters, true);
                    }
                  }}
                >
                  Purge
                </Button>
              </Box>
            </Grid>
          </PlatformContext.Provider>
        </Grid>
      </Container>
      {preparing && (
        <div className="block">{/* <Spinner animation="border" variant="light" /> */}</div>
      )}
      <Dialog open={numberOfMessages !== -1} onClose={() => setNumberOfMessages(-1)}>
        <DialogTitle>Confirm purge</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <p>
              This action will remove <b>{numberOfMessages}</b> messages.
            </p>
            {numberOfMessages > 0 && (
              <Alert severity="info">
                Due to caching, the count reflected above might be inaccurate.
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNumberOfMessages(-1)}>Cancel</Button>
          <Button onClick={() => confirmPurge()}>Purge</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default observer(Purge);
