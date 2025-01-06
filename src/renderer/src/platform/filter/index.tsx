import React from 'react';
import Form from 'react-bootstrap/Form';

import { FilterProps } from './types';
import DateRange from './DateRange';
import Select from './Select';
import Text from './Text';
import Toggles from './Toggles';

export default function Filter({ filter }: FilterProps) {
  return (
    <Form.Group className="form-group">
      <Form.Label>{filter.title}</Form.Label>
      {filter.type === 'dateRange' && <DateRange filter={filter} />}
      {filter.type === 'select' && <Select filter={filter} />}
      {filter.type === 'text' && <Text filter={filter} />}
      {filter.type === 'toggles' && <Toggles filter={filter} />}
    </Form.Group>
  );
}
