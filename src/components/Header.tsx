import { Text } from "@mantine/core";
import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  rightSection?: ReactNode;
  leftSection?: ReactNode;
}

/**
 * height: 3.5rem
 */
function Header(props: HeaderProps) {
  return (
    <div className="flex items-center justify-between h-14 border-b border-b-slate-400">
      {props.leftSection ? (
        props.leftSection
      ) : (
        <Text ff="montserrat-bold" size="lg">{props.title}</Text>
      )}
      {props.rightSection}
    </div>
  );
}

export default Header;