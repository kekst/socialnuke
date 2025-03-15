import { Controller, useFormContext } from "react-hook-form";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import Grid from "@mui/material/Grid2";
import dayjs from "dayjs";

import { FilterProps } from "./types";

export default function DateRange({ filter: { key } }: FilterProps) {
  const { control, setValue } = useFormContext();

  return (
    <>
      <ButtonGroup>
        <Button
          onClick={() => {
            const after = new Date();
            after.setHours(0, 0, 0);
            const before = new Date();
            before.setHours(23, 59, 59);

            setValue(key, [after, before]);
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

            setValue(key, [after, before]);
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

            setValue(key, [after, before]);
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

            setValue(key, [after, before]);
          }}
        >
          Year
        </Button>
        <Button
          onClick={() => {
            setValue(key, [undefined, undefined]);
          }}
        >
          All
        </Button>
      </ButtonGroup>
      <Grid container>
        <Grid size={6}>
          <Controller
            control={control}
            name={key}
            render={({ field }) => (
              <DateTimePicker
                label="Start date"
                onChange={(date) => field.onChange([date?.toDate(), field.value?.[1]])}
                value={field.value?.[0] ? dayjs(field.value?.[0]) : undefined}
              />
            )}
          />
        </Grid>
        <Grid size={6}>
          <Controller
            control={control}
            name={key}
            render={({ field }) => (
              <DateTimePicker
                label="End date"
                onChange={(date) => field.onChange([field.value?.[0], date?.toDate()])}
                value={field.value?.[1] ? dayjs(field.value?.[1]) : undefined}
              />
            )}
          />
        </Grid>
      </Grid>
    </>
  );
}
