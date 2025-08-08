import { observer } from "mobx-react-lite";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LinearProgress from "@mui/material/LinearProgress";
import ButtonGroup from "@mui/material/ButtonGroup";
import { useStore } from "../Store";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

function Queue() {
  const store = useStore();

  return (
    <>
      <ButtonGroup>
        <Button
          onClick={store.togglePause}
          startIcon={store.paused ? <BsPlayFill /> : <BsPauseFill />}
        >
          {store.paused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={store.cancelAll}>Cancel all</Button>
      </ButtonGroup>
      <div>
        <FormControlLabel
          control={
            <Switch
              checked={store.turbo}
              onChange={(e) => {
                store.turbo = e.target.checked;
              }}
            />
          }
          label="Turbo"
        />
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Account</TableCell>
            <TableCell>Details</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {store.queue.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                {task.userName} ({task.platform})
              </TableCell>
              <TableCell>{task.description}</TableCell>
              <TableCell>
                <div>{task.state}</div>
              </TableCell>
              <TableCell>
                {task.total && task.current && (
                  <LinearProgress variant="determinate" value={(task.current / task.total) * 100} />
                )}
                <div>
                  (
                  {!!task.total && (
                    <>
                      {task.current || 0} / {task.total}
                    </>
                  )}
                  )
                </div>
              </TableCell>
              <TableCell>
                <Button onClick={() => store.cancelTask(task.id)}>Cancel</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

export default observer(Queue);
