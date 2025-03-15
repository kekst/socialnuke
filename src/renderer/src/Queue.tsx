import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import LinearProgress from "@mui/material/LinearProgress";
import { observer } from "mobx-react-lite";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { useStore } from "./Store";

const style = {
  position: "absolute",
  bottom: "1rem",
  left: "1rem",
  width: 300,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  zIndex: 99999
};

function Queue() {
  const store = useStore();

  if (store.queue.length === 0) {
    return null;
  }

  const task = store.queue[0];

  return (
    <List sx={style} className="queue">
      <ListItem className="item">
        <p>
          <b>{task.platform}:&nbsp;</b>
          {task.userName}
        </p>
        <p>{task.description}</p>
        {!!(task.total && task.current) && (
          <LinearProgress variant="determinate" value={(task.current / task.total) * 100} />
        )}
        <div className="queue-item-progress">
          <div>
            {task.state !== "progress" && task.state}
            {task.state === "progress" && !!(task.total && task.current) && (
              <>
                {task.current} / {task.total}
              </>
            )}
          </div>
          <Button variant="contained" onClick={() => store.cancelTask(task.id)}>
            Cancel
          </Button>
        </div>
      </ListItem>
      {store.queue.length > 1 && (
        <ListItem className="item">
          <div className="queue-item-progress">
            <div>
              <strong>{store.queue.length - 1} more items</strong>
            </div>
            <div>
              <Link to="/queue">
                <Button>View queue</Button>
              </Link>
            </div>
          </div>
        </ListItem>
      )}
    </List>
  );
}

export default observer(Queue);
