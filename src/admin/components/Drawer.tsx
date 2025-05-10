import { CloseButton, Image, ScrollAreaAutosize, Text } from "@mantine/core";
import { Icon, IconDashboardFilled, IconProps, IconQrcode, IconReceipt2, IconSettings2, IconTools, IconUsers, IconUserShield } from "@tabler/icons-react";
import { NavLink, Outlet } from "react-router-dom";
import { UserProps } from "../../types";

interface DrawerProps {
  user: UserProps | undefined | null | string;
  state: boolean;
  setState: () => void;
}

interface NavButtonProps {
  to: string;
  label: string;
  icon?: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
  onClick: () => void;
}

function NavButton(props: NavButtonProps) {
  return <NavLink onClick={props.onClick} to={props.to}>
    {({ isActive }) => (
      <div className={`flex items-center gap-x-2 py-3 px-2 border-b border-b-slate-400 ${isActive ? 'bg-[#222] text-white' : 'hover:bg-slate-200'}`}>
        {props.icon && <props.icon size={17} />}
        <Text size="sm">{props.label}</Text>
      </div>
    )}
  </NavLink>
}

function Drawer({ user, state, setState }: DrawerProps) {
  return (
    <div className="w-full h-[calc(100%-3.5rem)] flex overflow-hidden">
      <div data-open={state} className="w-[18rem] h-full flex fixed md:relative duration-200 -left-[18.5rem] md:left-0 bg-white z-10 top-0 border-r border-slate-300 shadow-md items-center py-5 flex-col data-[open=true]:left-0">
        <ScrollAreaAutosize>
          <div className="absolute top-3 right-3 md:hidden block">
            <CloseButton onClick={setState} />
          </div>
          <Image className="border-b border-b-slate-400 pb-4 mb-2" w='16rem' h='16rem' src='/assets/appointment-bg.jpg' />
          <div className="w-[18rem] px-4">
            <NavButton onClick={setState} icon={IconDashboardFilled} label="Appointments" to="appointment" />
            <NavButton onClick={setState} icon={IconQrcode} label="Scan QR Code" to="scan" />
            {typeof user === 'object' && user !== null && user?.role === 'superadmin' && (
              <>
                <NavButton onClick={setState} icon={IconTools} label="Maintenance" to="maintenance" />
                <NavButton onClick={setState} icon={IconUsers} label="Students" to="students" />
                <NavButton onClick={setState} icon={IconUserShield} label="Users" to="users" />
                <NavButton onClick={setState} icon={IconReceipt2} label="Reports" to="report" />
                <NavButton onClick={setState} icon={IconSettings2} label="Settings" to="settings" />
              </>
            )}
          </div>
        </ScrollAreaAutosize>
      </div>
      <ScrollAreaAutosize h='100%' className="md:w-[calc(100%-18rem)] w-full" py={10}>
        <Outlet />
      </ScrollAreaAutosize>
    </div>
  );
}

export default Drawer;