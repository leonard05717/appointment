import { SelectProps } from "@mantine/core";

export const DefaultSelectProps: SelectProps = {
  checkIconPosition: "right",
  allowDeselect: false,
  size: 'sm',
  required: true,
  clearable: true,
  searchable: true,
  styles: {
    dropdown: {
      boxShadow: "1px 2px 5px #0005",
    },
  },
};