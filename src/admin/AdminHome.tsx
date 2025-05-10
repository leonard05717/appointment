import { ActionIcon, Button, Group, LoadingOverlay, Menu, PasswordInput, Text, TextInput } from "@mantine/core";
import Header from "../components/Header";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { IconLogout2, IconMenu2, IconUser } from '@tabler/icons-react';
import { displayConfirmation, displayError, displaySuccess, LoadingClass, toProper } from "../helpers/methods";
import supabase, { autoCancelAppointment } from "../supabase";
import { useLayoutEffect, useState } from "react";
import { UserProps } from "../types";
import CustomModal from "../components/CustomModal";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import Drawer from "./components/Drawer";



interface AccountFormProps {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
}

function AdminHome() {

  const [loadingAccount, setLoadingAccount] = useState(false)
  const [user, setUser] = useState<UserProps | undefined | null | string>()
  const [loadingPage, setLoadingPage] = useState(true)
  const navigate = useNavigate()
  const [accountState, { open: openAccountState, close: closeAccountState }] = useDisclosure(false)
  const [drawerState, setDrawerState] = useState(false)

  async function logoutEventHandler() {
    const conf = await displayConfirmation('Confirmation', 'Are you sure you want to logout?')
    if (!conf) return;
    const not = new LoadingClass()
    not.show('Logging Out...')
    await supabase.auth.signOut()
    not.close()
    navigate('/')
  }

  const accountForm = useForm<AccountFormProps>({
    mode: 'controlled',
    initialValues: {
      id: 0,
      firstname: '',
      lastname: '',
      email: '',
      role: '',
      password: ''
    }
  })

  async function submitAccountEventHandler(rs: AccountFormProps) {

    setLoadingAccount(true)
    const { error } = await supabase
      .from('users')
      .update({ firstname: rs.firstname, lastname: rs.lastname })
      .eq('id', rs.id);

    if (error) {
      displayError('Error', error.message)
      setLoadingAccount(false)
      return;
    }

    if (rs.password) {
      await supabase.auth.updateUser({
        password: rs.password
      })
    }

    setUser((cr) => {
      if (typeof cr === 'object' && cr !== null) {
        return {
          ...cr,
          firstname: rs.firstname,
          lastname: rs.lastname
        }
      }
      return cr;
    })
    displaySuccess('Success', 'Account Updated Successfully!')
    closeAccountState()
    setLoadingAccount(false)

  }

  useLayoutEffect(() => {
    async function fetch() {
      setLoadingPage(true)
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setLoadingPage(false)
        setUser(error.message)
        return;
      }
      if (data.session) {
        const auth_id = data.session.user.id;
        const email = data.session.user.email;
        const { data: userData, error: err2 } = await supabase.from('users').select("*").eq("auth_id", auth_id).single<UserProps>()

        if (err2) {
          setLoadingPage(false)
          setUser(err2.message)
          return;
        }

        setUser({
          ...userData,
          email: email || ''
        })
        setLoadingPage(false)
        return;
      }
      navigate('/')
      setLoadingPage(false)
    }

    const interval = setInterval(() => {
      autoCancelAppointment();
    }, 10000);

    fetch()

    return () => clearInterval(interval)
  }, [])

  if (user === undefined) {
    return (
      <div className="w-full h-screen flex items-center justify-center font-montserrat-bold text-lg">Loading...</div>
    )
  }

  if (user === null) {
    return (
      <div>Not Allowed to view this page.</div>
    )
  }

  if (typeof user === 'string') {
    return <div className="w-full h-screen space-y-2">
      <Text ff="montserrat-bold" size="xl">{user}</Text>
      <Link to='/'>Back to homepage</Link>
    </div>
  }

  if (user.role === 'student') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="w-full h-screen relative">

      <LoadingOverlay visible={loadingPage} />

      <CustomModal title="Account" opened={accountState} onClose={closeAccountState}>
        <form onSubmit={accountForm.onSubmit(submitAccountEventHandler)} className="space-y-2">
          <Group grow align="center" gap={10}>
            <TextInput {...accountForm.getInputProps('firstname')} label="First Name" placeholder="Enter First Name" />
            <TextInput {...accountForm.getInputProps('lastname')} label="Last Name" placeholder="Enter Last Name" />
          </Group>
          <Group grow align="center" gap={10}>
            <TextInput readOnly {...accountForm.getInputProps('email')} label="Email Address" placeholder="Enter Email Address" />
            <TextInput readOnly {...accountForm.getInputProps('role')} label="Role" placeholder="Enter Role" />
          </Group>
          <PasswordInput {...accountForm.getInputProps('password')} label="New Password" placeholder="Enter New Password" />
          <div className="text-right pt-1">
            <Button loading={loadingAccount} type="submit">Save Changes</Button>
          </div>
        </form>

      </CustomModal>

      <Header leftSection={(
        <div className="pl-3 flex items-center gap-x-3">
          <div className="block md:hidden">
            <ActionIcon onClick={() => setDrawerState(curr => !curr)} variant="transparent" color="dark">
              <IconMenu2 />
            </ActionIcon>
          </div>
          <Text ff="montserrat-bold" size="lg">Administrator</Text>
        </div>
      )} title="Admin" rightSection={(
        <div className="pr-5">
          <Menu withArrow>
            <Menu.Target>
              <div className="w-full cursor-pointer p-1 rounded-md ml-5 flex items-center gap-x-2">
                <Text
                  size="sm"
                >{toProper(`${user.firstname} ${user.lastname}`)}</Text>
                <IconUser size={17} />
              </div>
            </Menu.Target>
            <Menu.Dropdown w={160} style={{
              boxShadow: '1px 2px 5px #0005'
            }}>
              <Menu.Item onClick={async () => {
                console.log(user);

                accountForm.setValues({
                  ...user,
                  password: ''
                })
                openAccountState()
              }} leftSection={<IconUser size={15} />}>Account</Menu.Item>
              <Menu.Item onClick={logoutEventHandler} leftSection={<IconLogout2 size={15} />}>Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )} />
      <Drawer setState={() => {
        setDrawerState(false)
      }} state={drawerState} user={user} />
    </div>
  );
}

export default AdminHome;