import { usePlatform } from "../context";
import { FilterProps } from "./types";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function Select({ filter: { key, options } }: FilterProps) {
  const { filters, setFilter } = usePlatform();
  const value = filters[key];

  return (
    <ToggleButtonGroup exclusive value={value} onChange={(_, value) => setFilter(key, value)}>
      {options?.map((v) => (
        <ToggleButton key={v.value || "undefined"} value={v.value || "undefined"}>
          {v.icon} {v.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
