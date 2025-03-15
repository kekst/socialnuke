import { Controller, useFormContext } from "react-hook-form";

import { FilterProps } from "./types";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function Select({ filter: { key, options } }: FilterProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={key}
      render={({ field }) => (
        <ToggleButtonGroup
          exclusive
          value={field.value}
          onChange={(_, value) => field.onChange(value)}
        >
          {options?.map((v) => (
            <ToggleButton
              key={v.value || "undefined"}
              value={v.value || "undefined"}
              onClick={() => {
                field.onChange(v.value);
              }}
            >
              {v.icon} {v.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
    />
  );
}
