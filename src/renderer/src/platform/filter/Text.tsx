import React from 'react';
import { useFormContext } from 'react-hook-form';
import Form from 'react-bootstrap/Form';

import { FilterProps } from './types';

export default function Text({ filter: { key } }: FilterProps) {
  const { register } = useFormContext();

  return <Form.Control type="text" {...register(key)} />;
}
