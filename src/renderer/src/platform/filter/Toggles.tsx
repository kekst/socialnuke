import React from 'react';
import { useFormContext } from 'react-hook-form';
import Form from 'react-bootstrap/Form';

import { FilterProps } from './types';

export default function Toggles({ filter: { toggles } }: FilterProps) {
  const { register } = useFormContext();

  return (
    <>
      {toggles?.map((toggle) => (
        <Form.Check
          type="switch"
          key={toggle.key}
          label={toggle.title}
          {...register(toggle.key)}
        />
      ))}
    </>
  );
}
