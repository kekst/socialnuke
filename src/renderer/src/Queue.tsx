import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import LinearProgress from "@mui/material/LinearProgress";
import { observer } from "mobx-react-lite";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { useStore } from "./Store";
import ButtonGroup from "@mui/material/ButtonGroup";
import { BsPauseFill, BsPlayFill, BsX } from "react-icons/bs";
import IconButton from "@mui/material/IconButton";

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
  const remaining = store.queue.length - 1;
  const sum = store.queue.reduce((prev, current, i) => prev + (i > 0 ? current.total || 0 : 0), 0);

  return (
    <List sx={style} className="queue">
      <ListItem className="item">
        <div className="header">
          <div className="info">
            <div className="primary">
              {task.userName} ({task.platform})
            </div>
            <div className="secondary">{task.description}</div>
          </div>
          <div className="actions">
            <ButtonGroup>
              <IconButton onClick={store.togglePause}>
                {store.paused ? <BsPlayFill /> : <BsPauseFill />}
              </IconButton>
              <IconButton onClick={() => store.cancelTask(task.id)}>
                <BsX />
              </IconButton>
            </ButtonGroup>
          </div>
        </div>
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
        </div>
      </ListItem>
      {!!remaining && (
        <ListItem className="item">
          <div className="header">
            <div className="info">
              <div className="primary">
                {remaining} more item{remaining > 1 ? "s" : ""}
              </div>
              <div className="secondary">{sum} messages left</div>
            </div>
            <div className="actions">
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
