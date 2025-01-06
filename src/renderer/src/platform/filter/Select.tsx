import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

import { FilterProps } from './types';

export default function Select({ filter: { key, options } }: FilterProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={key}
      render={({ field }) => (
        <ButtonGroup>
          {options?.map((v) => (
            <Button
              active={field.value === v.value}
              key={v.value || 'undefined'}
              variant="secondary"
              className="ibtn"
              size="sm"
              onClick={() => {
                field.onChange(v.value);
              }}
            >
              {v.icon} {v.label}
            </Button>
          ))}
        </ButtonGroup>
      )}
    />
  );
}
