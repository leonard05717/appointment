import { Button, Text } from "@mantine/core";
import CustomTable from "./CustomTable";
import { IconPlus } from "@tabler/icons-react";

interface SimpleTableProps {
  title: string;
  columns: any[];
  rows: any[];
  addButtonLabel?: string;
  onDelete?: (data: any) => void;
  onEdit?: (data: any) => void;
  onAdd?: () => void;
}

function SimpleTable(props: SimpleTableProps) {
  return (
    <div className="w-full pt-3 pb-5 px-4 border">
      <div className="flex items-center justify-between">
        <Text ff="montserrat-bold">{props.title}</Text>
        {props.onAdd && (
          <Button rightSection={<IconPlus size={15} />} size="xs" onClick={props.onAdd}>{props.addButtonLabel || 'Add Data'}</Button>
        )}
      </div>
      <CustomTable
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        withNumbering
        columns={props.columns}
        rows={props.rows}
      />
    </div>
  );
}

export default SimpleTable;