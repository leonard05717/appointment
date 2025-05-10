import { MantineSize, Modal, Text } from '@mantine/core';
import { ReactNode } from 'react';

interface CustomModalProps {
  title: string;
  children: ReactNode;
  opened: boolean;
  onClose: () => void;
  size?: MantineSize | any;
}

function CustomModal(props: CustomModalProps) {
  return (
    <Modal
      size={props.size || 'md'}
      opened={props.opened}
      onClose={props.onClose}
      title={
        <Text ff="montserrat-bold" size="sm">
          {props.title}
        </Text>
      }
    >
      {props.children}
    </Modal>
  );
}

export default CustomModal;
