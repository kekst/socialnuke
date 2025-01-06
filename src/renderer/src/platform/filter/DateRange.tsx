import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ReactDatePicker from 'react-datepicker';

import { FilterProps } from './types';

export default function DateRange({ filter: { key } }: FilterProps) {
  const { control, setValue } = useFormContext();

  return (
    <>
      <ButtonGroup>
        <Button
          variant="secondary"
          size="sm"
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
          variant="secondary"
          size="sm"
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
          variant="secondary"
          size="sm"
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
          variant="secondary"
          size="sm"
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
          variant="secondary"
          size="sm"
          onClick={() => {
            setValue(key, [undefined, undefined]);
          }}
        >
          All
        </Button>
      </ButtonGroup>
      <div className="date-range">
        <div>
          <label htmlFor="after">Start date</label>
          <Controller
            control={control}
            name={key}
            render={({ field }) => (
              <ReactDatePicker
                isClearable
                showTimeSelect
                timeFormat="p"
                timeIntervals={15}
                dateFormat="Pp"
                onChange={(date) => field.onChange([date, field.value?.[1]])}
                selected={field.value?.[0]}
                id="after"
                placeholderText="Click to select date..."
              />
            )}
          />
        </div>
        <div>
          <label htmlFor="before">End date</label>
          <Controller
            control={control}
            name={key}
            render={({ field }) => (
              <ReactDatePicker
                isClearable
                showTimeSelect
                timeFormat="p"
                timeIntervals={15}
                dateFormat="Pp"
                onChange={(date) => field.onChange([field.value?.[0], date])}
                selected={field.value?.[1]}
                id="before"
                placeholderText="Click to select date..."
              />
            )}
          />
        </div>
      </div>
    </>
  );
}
