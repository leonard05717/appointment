import { Text } from "@mantine/core";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  rightSection?: ReactNode;
}

function PageContainer(props: PageContainerProps) {
  return (
    <div className="w-full py-4 relative h-[calc(100vh-5rem)] px-3">
      <div className={`flex items-center justify-between w-full ${props.title && 'pb-3'}`}>
        {props.title && <Text ff="montserrat-bold" size="lg">{props.title}</Text>}
        {props.rightSection}
      </div>
      <div className="pb-5">
        {props.children}
      </div>
    </div>
  );
}

export default PageContainer;