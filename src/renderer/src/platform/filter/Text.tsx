import { useFormContext } from "react-hook-form";
import TextField from "@mui/material/TextField";

import { FilterProps } from "./types";

export default function Text({ filter: { key } }: FilterProps) {
  const { register } = useFormContext();

  return <TextField type="text" {...register(key)} />;
}
