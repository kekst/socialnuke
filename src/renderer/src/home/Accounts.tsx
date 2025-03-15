import { observer } from "mobx-react-lite";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { BsCopy, BsFillTrashFill } from "react-icons/bs";
import { useStore } from "../Store";
import { ButtonGroup } from "@mui/material";

function Accounts() {
  const store = useStore();

  return (
    <>
      <ButtonGroup>
        <Button onClick={() => store.openLogin("discord")}>Add Discord account</Button>
        <Button onClick={() => store.refreshAccounts()}>Refresh accounts</Button>
      </ButtonGroup>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Platform</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {store.accounts.map((acc) => (
            <TableRow key={acc.id}>
              <TableCell>{acc.platform}</TableCell>
              <TableCell>
                <div className="target">
                  {acc.iconUrl && <img src={acc.iconUrl} className="target-icon" alt={acc.name} />}
                  <span>{acc.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  title="Copy token"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(acc.token);
                    } catch {}
                  }}
                >
                  <BsCopy />
                </Button>
                <Button title="Remove account">
                  <BsFillTrashFill />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

export default observer(Accounts);
