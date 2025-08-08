import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

import { FilterProps } from "./types";
import { usePlatform } from "../context";

export default function Toggles({ filter: { toggles } }: FilterProps) {
  const { filters, setFilter } = usePlatform();

  return (
    <>
      {toggles?.map((toggle) => (
        <FormControlLabel
          key={toggle.key}
          control={
            <Switch
              checked={filters[toggle.key]}
              onChange={(e) => setFilter(toggle.key, e.target.checked)}
            />
          }
          label={toggle.title}
        />
      ))}
    </>
  );
}
