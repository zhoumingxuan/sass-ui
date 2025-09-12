export { default as TextInput } from './input/Text';
export { default as NumberInput } from './input/Number';
export { default as PasswordInput } from './input/Password';
export { default as SelectInput } from './input/Select';
export { default as DateInput } from './date/DatePicker';
export { default as DateRangeInput } from './date/DateRangePicker';

// Aggregated Input namespace (Ant Design-like)
import * as InputNs from './input/index';
import DatePicker from './date/DatePicker';
import DateRangePicker from './date/DateRangePicker';
import TextArea from './TextArea';

export const Input = {
  Text: InputNs.Text,
  Number: InputNs.Number,
  Password: InputNs.Password,
  Select: InputNs.Select,
  Date: DatePicker,
  DateRange: DateRangePicker,
  TextArea: TextArea,
};
