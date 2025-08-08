import TextField from "@mui/material/TextField";

import { usePlatform } from "../context";
import { FilterProps } from "./types";

export default function Text({ filter: { key } }: FilterProps) {
  const { filters, setFilter } = usePlatform();
  const value = filters[key];

  return <TextField type="text" value={value} onChange={(e) => setFilter(key, e.target.value)} />;
}
