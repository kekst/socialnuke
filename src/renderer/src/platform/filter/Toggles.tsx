import { useFormContext } from "react-hook-form";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

import { FilterProps } from "./types";

export default function Toggles({ filter: { toggles } }: FilterProps) {
  const { register } = useFormContext();

  return (
    <>
      {toggles?.map((toggle) => (
        <FormControlLabel
          key={toggle.key}
          control={<Switch {...register(toggle.key)} />}
          label={toggle.title}
        />
      ))}
    </>
  );
}
