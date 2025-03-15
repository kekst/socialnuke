import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormGroup from "@mui/material/FormGroup";

import { FilterProps } from "./types";
import DateRange from "./DateRange";
import Select from "./Select";
import Text from "./Text";
import Toggles from "./Toggles";

export default function Filter({ filter }: FilterProps) {
  return (
    <FormControl component="fieldset" variant="standard">
      <FormLabel component="legend">{filter.title}</FormLabel>
      <FormGroup>
        {filter.type === "dateRange" && <DateRange filter={filter} />}
        {filter.type === "select" && <Select filter={filter} />}
        {filter.type === "text" && <Text filter={filter} />}
        {filter.type === "toggles" && <Toggles filter={filter} />}
      </FormGroup>
    </FormControl>
  );
}
