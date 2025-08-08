import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import Grid from "@mui/material/Grid";
import dayjs from "dayjs";

import { FilterProps } from "./types";
import { usePlatform } from "../context";

export default function DateRange({ filter: { key } }: FilterProps) {
  const { filters, setFilter } = usePlatform();
  const value = filters[key];

  return (
    <>
      <ButtonGroup>
        <Button
          onClick={() => {
            const after = new Date();
            after.setHours(0, 0, 0);
            const before = new Date();
            before.setHours(23, 59, 59);

            setFilter(key, [after, before]);
          }}
        >
          Today
        </Button>
        <Button
          onClick={() => {
            const after = new Date();
            after.setHours(0, 0, 0);
            after.setDate(after.getDate() - after.getDay());
            const before = new Date(after);
            before.setHours(23, 59, 59);
            before.setDate(after.getDate() + 7);

            setFilter(key, [after, before]);
          }}
        >
          Week
        </Button>
        <Button
          onClick={() => {
            const after = new Date();
            after.setHours(0, 0, 0);
            after.setDate(1);
            const before = new Date();
            before.setHours(23, 59, 59);
            before.setMonth(before.getMonth() + 1, 0);

            setFilter(key, [after, before]);
          }}
        >
          Month
        </Button>
        <Button
          onClick={() => {
            const after = new Date();
            after.setHours(0, 0, 0);
            after.setMonth(0);
            after.setDate(1);
            const before = new Date();
            before.setHours(23, 59, 59);
            before.setFullYear(before.getFullYear() + 1);
            before.setMonth(0, 0);

            setFilter(key, [after, before]);
          }}
        >
          Year
        </Button>
        <Button
          onClick={() => {
            setFilter(key, [undefined, undefined]);
          }}
        >
          All
        </Button>
      </ButtonGroup>
      <Grid container>
        <Grid size={6}>
          <DateTimePicker
            label="Start date"
            onChange={(date) => setFilter(key, [date?.toDate(), value?.[1]])}
            value={value?.[0] ? dayjs(value?.[0]) : undefined}
            ampmInClock={false}
            ampm={false}
          />
        </Grid>
        <Grid size={6}>
          <DateTimePicker
            label="End date"
            onChange={(date) => setFilter(key, [value?.[0], date?.toDate()])}
            value={value?.[1] ? dayjs(value?.[1]) : undefined}
            ampmInClock={false}
            ampm={false}
          />
        </Grid>
      </Grid>
    </>
  );
}
