export { default as TextInput } from './input/Text';
export { default as NumberInput } from './input/Number';
export { default as PasswordInput } from './input/Password';
export { default as SelectInput } from './input/Select';
export { default as TransferSelectInput } from './input/TransferSelect';
export { default as DateInput } from './input/DatePicker';
export { default as DateRangeInput } from './input/DateRangePicker';

// Aggregated Input namespace (Ant Design-like)
import * as InputNs from './input/index';
import DatePicker from './input/DatePicker';
import DateRangePicker from './input/DateRangePicker';
import TextArea from './input/TextArea';

export const Input = {
  Text: InputNs.Text,
  Number: InputNs.Number,
  Password: InputNs.Password,
  Select: InputNs.Select,
  TransferSelect: InputNs.TransferSelect,
  Date: DatePicker,
  DateRange: DateRangePicker,
  TextArea: TextArea,
};
