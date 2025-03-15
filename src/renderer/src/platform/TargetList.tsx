import { useState } from "react";
import List from "@mui/material/List";
import TextField from "@mui/material/TextField";
import { PlatformTarget } from "../platforms/types";
import ListItemButton from "@mui/material/ListItemButton";
import { InputAdornment, ListItemIcon, ListItemText } from "@mui/material";
import { BsSearch } from "react-icons/bs";

export interface Channel {
  id: string;
  name: string;
  type: number;
  accountId: string;
}

export default function TargetList({
  targets,
  selectedTarget,
  onTargetSelected
}: {
  targets: PlatformTarget[];
  selectedTarget?: PlatformTarget;
  onTargetSelected: (target: PlatformTarget) => void;
}) {
  //todo on loading
  const [search, setSearch] = useState<string>("");

  return (
    <>
      <TextField
        type="search"
        variant="standard"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <BsSearch />
              </InputAdornment>
            )
          }
        }}
      />
      <List style={{ maxHeight: "400px", overflow: "auto" }}>
        {targets
          .filter((target) => {
            const trim = search.trim().toLowerCase();
            if (!trim) {
              return true;
            }

            return target.id.includes(trim) || target.name.toLowerCase().includes(trim);
          })
          .map((target) => (
            <ListItemButton
              className="item-target"
              key={target.id}
              onClick={() => {
                onTargetSelected(target);
              }}
              selected={target.id === selectedTarget?.id}
              disabled={target.disabled}
            >
              <ListItemIcon>
                {target.iconUrl ? (
                  <img src={target.iconUrl} className="target-icon" alt={target.name} />
                ) : (
                  target.icon
                )}
              </ListItemIcon>
              <ListItemText>{target.name}</ListItemText>
            </ListItemButton>
          ))}
      </List>
    </>
  );
}
