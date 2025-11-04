export { default as TextInput } from './input/Text';
export { default as NumberInput } from './input/Number';
export { default as PasswordInput } from './input/Password';
export { default as SelectInput } from './input/Select';
export { default as TransferSelectInput } from './input/TransferSelect';
export { default as DateInput } from './input/DatePicker';
export { default as DateRangeInput } from './input/DateRangePicker';

// Aggregated Input namespace (Ant Design-like)
import DatePicker from './input/DatePicker';
import DateRangePicker from './input/DateRangePicker';
import TextArea from './input/TextArea';

import Text from './input/Text';
import Number from './input/Number';
import Password from './input/Password';
import Select from './input/Select';
import TransferSelect from './input/TransferSelect';

export const Input = {
  Text: Text,
  Number: Number,
  Password: Password,
  Select: Select,
  TransferSelect: TransferSelect,
  Date: DatePicker,
  DateRange: DateRangePicker,
  TextArea: TextArea,
};
