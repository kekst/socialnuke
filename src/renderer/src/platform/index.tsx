import { useCallback, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";
import { v4 } from "uuid";
import Modal from "@mui/material/Modal";
import Grid from "@mui/material/Grid2";
import TargetSelector from "./TargetSelector";
import { Platform, PlatformTarget } from "../platforms/types";
import { defaultValues, waitFor } from "../platforms/utils";
import Filter from "./filter";
import { Task, useStore } from "../Store";
import Box from "@mui/material/Box";
import ButtonGroup from "@mui/material/ButtonGroup";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface PurgeProps {
  platform: Platform;
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4
};

function Purge({ platform }: PurgeProps) {
  const form = useForm<any>({
    defaultValues: defaultValues(platform)
  });

  const [target, setTarget] = useState<PlatformTarget>();
  const store = useStore();

  const [preparing, setPreparing] = useState(false);
  const [numberOfMessages, setNumberOfMessages] = useState(-1);
  const preparePurge = useCallback(
    async (values: any) => {
      if (preparing || !target?.estimate) return;

      setNumberOfMessages(-1);
      setPreparing(true);

      const estimate = await waitFor(() => target.estimate!(values));
      setNumberOfMessages(estimate);
      setPreparing(false);
    },
    [preparing, setPreparing, setNumberOfMessages, target]
  );

  const confirmPurge = () => {
    if (!target) return;

    const task: Task = {
      id: v4(),
      type: "purge",
      generator: target.query(form.getValues()),
      userName: target.user.name,
      iconUrl: target.user.iconUrl,
      description: `${target.type}: ${target.name}`,
      platform: platform.key,
      state: "queued",
      total: numberOfMessages
    };

    store.addTask(task);
    setNumberOfMessages(-1);
  };

  return (
    <>
      <Container style={{ padding: 0 }}>
        <Grid container spacing={4}>
          <TargetSelector platform={platform} onTargetSelected={setTarget} />
          <Grid size={6}>
            <Box
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={form.handleSubmit((values) => {
                preparePurge(values);
              })}
            >
              <FormProvider {...form}>
                {platform.filters.map((filter) => (
                  <Filter key={filter.key} filter={filter} />
                ))}
              </FormProvider>
              <p>
                Deleting only <b>own</b> messages.
              </p>
              <Button disabled={!target} type="submit">
                Purge
              </Button>
            </Box>
          </Grid>
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
