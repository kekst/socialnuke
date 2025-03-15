import { observer } from "mobx-react-lite";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LinearProgress from "@mui/material/LinearProgress";
import { useStore } from "../Store";

function Queue() {
  const store = useStore();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Platform</TableCell>
          <TableCell>Account</TableCell>
          <TableCell>Details</TableCell>
          <TableCell>State</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {store.queue.map((task) => (
          <TableRow key={task.id}>
            <TableCell>{task.platform}</TableCell>
            <TableCell>{task.userName}</TableCell>
            <TableCell>{task.description}</TableCell>
            <TableCell>
              {task.total && task.current && (
                <LinearProgress variant="determinate" value={(task.current / task.total) * 100} />
              )}
              <div>
                {task.state}{" "}
                {task.total && task.current && (
                  <>
                    {task.current} / {task.total}
                  </>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Button onClick={() => store.cancelTask(task.id)}>Cancel</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default observer(Queue);
