import { useEffect, useState } from "react";
import { ActionIcon, Divider, List, LoadingOverlay, Menu, Select, Table, Text, TextInput } from "@mantine/core";
import PageContainer from "../../components/PageContainer";
import { AppointmentProps, UserProps } from "../../types";
import supabase from "../../supabase";
import { tmpStatusList } from "../../tmp_data";
import { DefaultSelectProps } from "../../assets/styles";
import { DatePickerInput } from "@mantine/dates";
import { formatDate, formatDateAndTime, toProper } from "../../helpers/methods";
import { IconDotsVertical, IconSearch } from "@tabler/icons-react";
import { modals } from "@mantine/modals";

interface AppointmentWithStudent extends AppointmentProps {
  student: UserProps;
  section: { course: string; year_level: string; section: string; }
}

function AdminMainHome() {
  // const [message, setMessage] = useState("")
  // const [messageState, { open: openMessageState, close: closeMessageState }] = useDisclosure(false)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [appointments, setAppointments] = useState<AppointmentWithStudent[]>([]);
  const [loadingPage, setLoadingPage] = useState(true)
  // const [loadingConfirm, setLoadingConfirm] = useState(false)
  // const [status, setStatus] = useState("")
  // const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithStudent | null>(null)

  // async function submitMessageEventHandler() {
  //   if (!selectedAppointment) return;
  //   const appointment = selectedAppointment;
  //   setLoadingConfirm(true)

  //   const auth_id = (await supabase.auth.getSession()).data.session?.user.id;

  //   if (!auth_id) return;

  //   const user = (await supabase.from("users").select("*").eq("auth_id", auth_id).single()).data;
  //   const currentDate = new Date()

  //   await supabase.from('appointments').update({
  //     status: status,
  //     staff_name: user ? toProper(`${user.firstname} ${user.lastname}`) : null,
  //     message: message,
  //     updated_at: currentDate
  //   }).eq("id", appointment.id)

  //   setAppointments((curr) => curr.map((app) => {
  //     if (app.id === appointment.id) {
  //       return {
  //         ...app,
  //         status: status,
  //         staff_name: user ? toProper(`${user.firstname} ${user.lastname}`) : null,
  //         message: message,
  //         updated_at: currentDate
  //       }
  //     }
  //     return app;
  //   }))

  //   setLoadingConfirm(false)
  //   setMessage("")
  //   closeMessageState()
  // }

  async function viewDetailsEventHandler(appointment: AppointmentWithStudent) {
    const studentName = toProper(`${appointment.student.firstname} ${appointment.student.lastname}`)
    modals.open({
      size: 'lg',
      title: <Text fw="bold">Code: {appointment.qrcode}</Text>,
      children: (
        <div>
          <Text size="sm" mb={3}>Reasons:</Text>
          <List listStyleType="disc">
            {appointment.reasons.map((v, i) => (
              <List.Item key={i}>{v}</List.Item>
            ))}
          </List>
          <Divider mt={10} mb={7} />
          <Text size="sm">Student Name:</Text>
          <Text mb={8} ff="montserrat-bold">{studentName}</Text>
          <Text size="sm">Student ID:</Text>
          <Text mb={8} ff="montserrat-bold">{appointment.student.student_id}</Text>
          <Text size="sm">Staff Name:</Text>
          <Text mb={8} ff="montserrat-bold">{appointment.staff_name || "It hasn't been handled by the staff yet."}</Text>
          <Text size="sm">Staff Message:</Text>
          <Text mb={8} ff="montserrat-bold">{appointment.message || "There's no message from the staff yet."}</Text>
          <Text size="sm">Date and Time:</Text>
          <Text mb={8} ff="montserrat-bold">{`${appointment.appointment_date ? formatDate(new Date(appointment.appointment_date)) : 'No Date'} | ${appointment.appointment_time || 'No Time'}`}</Text>
          <Divider />
          <Text c="dimmed" size="xs" mt={10}>{formatDateAndTime(new Date(appointment.updated_at))}</Text>
        </div>
      )
    })
  }

  // async function statusEventHandler(appointment: AppointmentWithStudent, value: string | null) {
  //   setStatus(value || "")
  //   setSelectedAppointment(appointment)
  //   openMessageState()
  // }

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoadingPage(true)
      const { data, error } = await supabase
        .from("appointments")
        .select("*, student:users(*), section:sections(course,year_level,section)")
        .order("datetime", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
        setLoadingPage(false)
        return;
      }
      setLoadingPage(false)
      setAppointments(data || []);
    };

    fetchAppointments();

    const subscription = supabase
      .channel("realtime:appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const appointments_ = appointments.filter((v) => {
    if (!selectedDate) return true;
    return new Date(v.appointment_date).toDateString() === new Date(selectedDate).toDateString()
  })
    .filter((v) => {
      if (!selectedStatus) return true;
      return selectedStatus === v.status.toLowerCase()
    })

  return (
    <PageContainer title="Appointments" rightSection={(
      <div className="flex items-center gap-x-2">
        <TextInput value={search} onChange={(e) => setSearch(e.target.value)} w={150} placeholder="Search any" rightSection={<IconSearch size={16} />} />
        <Select value={selectedStatus} onChange={setSelectedStatus} placeholder="Filter by" data={tmpStatusList} w={150} {...DefaultSelectProps} required={false} />
        <DatePickerInput clearable minDate={new Date(1900, 1, 1)} maxDate={new Date(new Date().setMonth(new Date().getMonth() + 3))} value={selectedDate} onChange={setSelectedDate} placeholder="Select Date" w={150} popoverProps={{ position: 'bottom-end', withArrow: true, shadow: 'md', styles: { dropdown: { border: '1px solid #0005' } } }} />
      </div>)}>

      <LoadingOverlay visible={loadingPage} />

      {/* <CustomModal opened={messageState} title="Confirmation" onClose={closeMessageState}>
        <div>
          <Text mb={5}>Are you sure you want to mark this as <span className="text-blue-500 ">"{status}"</span>?</Text>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} label="Message (Optional)" placeholder="You can leave a message here." />
          <div className="flex justify-end">
            <ButtonGroup mt={10}>
              <Button color="red" onClick={() => {
                setMessage("");
                closeMessageState()
              }}>Cancel</Button>
              <Button loading={loadingConfirm} color="dark" onClick={submitMessageEventHandler}>Okay</Button>
            </ButtonGroup>
          </div>
        </div>
      </CustomModal> */}

      <div className="w-[calc(100vw-25px)] md:w-full overflow-x-scroll">
        <Table striped highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>QR Code</Table.Th>
              <Table.Th>Student ID</Table.Th>
              <Table.Th>Section</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Note</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Time</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {appointments_
              .filter((v) => {
                if (!search) return true;
                const { course, section, year_level } = v.section;
                const s = search.toLowerCase().trim()
                const qrCond = v.qrcode.toLowerCase().includes(s);
                const sidCond = v.student.student_id.toLowerCase().includes(s);
                const secCond = `${course} ${year_level[0]}${section}`.toLowerCase().includes(s);
                const nmCond = `${v.student.firstname} ${v.student.lastname}`.toLowerCase().includes(s)
                return qrCond || sidCond || secCond || nmCond;
              })
              .map((appointment) => (
                <Table.Tr bg={appointment.status.toLowerCase() === 'pending' ? 'blue.2' : (
                  appointment.status.toLowerCase() === 'cancelled' ? 'red.2' : (appointment.status.toLowerCase() === 'return' ? 'orange.2' : 'green.2')
                )} key={appointment.qrcode}>
                  <Table.Td>{appointment.qrcode}</Table.Td>
                  <Table.Td style={{
                    textWrap: 'nowrap'
                  }}>{appointment.student?.student_id || "N/A"}</Table.Td>
                  <Table.Td style={{
                    textWrap: 'nowrap'
                  }}>{`${appointment.section.course} ${appointment.section.year_level[0]}${appointment.section.section}`}</Table.Td>
                  <Table.Td>
                    <List listStyleType="disc">
                      {appointment.reasons.map((li, i) => (
                        <List.Item key={i}>
                          <Text size="sm" px={10}>{li}</Text>
                        </List.Item>
                      ))}
                    </List>
                  </Table.Td>
                  <Table.Td>{appointment.note || '-'}</Table.Td>
                  <Table.Td>{appointment.appointment_date ? formatDate(new Date(appointment.appointment_date)) : '-'}</Table.Td>
                  <Table.Td>{appointment.appointment_time || '-'}</Table.Td>
                  <Table.Td>
                    {appointment.status.toUpperCase() || '-'}
                    {/* <Select onChange={(v) => statusEventHandler(appointment, v)} value={appointment.status.toLowerCase()} {...DefaultSelectProps} clearable={false} w={120} placeholder="Mark as" data={tmpStatusList} /> */}
                  </Table.Td>
                  <Table.Td>
                    <Menu withArrow shadow="lg">
                      <Menu.Target>
                        <ActionIcon color="dark">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item onClick={() => {
                          viewDetailsEventHandler(appointment)
                        }}>View Other Details</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
          {appointments_.length === 0 && (
            <Table.Caption>No Appointment Found</Table.Caption>
          )}
        </Table>
      </div>
    </PageContainer>
  );
}

export default AdminMainHome;
