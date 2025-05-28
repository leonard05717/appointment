import { useEffect, useState } from "react";
import {
  ActionIcon,
  Divider,
  List,
  LoadingOverlay,
  Menu,
  Select,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import PageContainer from "../../components/PageContainer";
import { AppointmentProps, UserProps } from "../../types";
import supabase from "../../supabase";
import { tmpStatusList } from "../../tmp_data";
import { DefaultSelectProps } from "../../assets/styles";
import { DatePickerInput } from "@mantine/dates";
import {
  formatDate,
  formatDateAndTime,
  formatDateString,
  formatDateToAppointmentDate,
  toProper,
} from "../../helpers/methods";
import { IconDotsVertical, IconSearch } from "@tabler/icons-react";
import { modals } from "@mantine/modals";

interface AppointmentWithStudent extends AppointmentProps {
  student: UserProps;
  section: { course: string; year_level: string; section: string };
}

function AdminMainHome() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithStudent[]>(
    []
  );
  const [loadingPage, setLoadingPage] = useState(true);

  async function viewDetailsEventHandler(appointment: AppointmentWithStudent) {
    const studentName = toProper(
      `${appointment.student.firstname} ${appointment.student.lastname}`
    );
    modals.open({
      size: "lg",
      title: <Text fw="bold">Code: {appointment.qrcode}</Text>,
      children: (
        <div>
          <Text size="sm" mb={3}>
            Reasons:
          </Text>
          <List listStyleType="disc">
            {appointment.reasons.map((v, i) => (
              <List.Item key={i}>{v}</List.Item>
            ))}
          </List>
          <Divider mt={10} mb={7} />
          <Text size="sm">Student Name:</Text>
          <Text mb={8} ff="montserrat-bold">
            {studentName}
          </Text>
          <Text size="sm">Student ID:</Text>
          <Text mb={8} ff="montserrat-bold">
            {appointment.student.student_id}
          </Text>
          <Text size="sm">Staff Name:</Text>
          <Text mb={8} ff="montserrat-bold">
            {appointment.staff_name ||
              "It hasn't been handled by the staff yet."}
          </Text>
          <Text size="sm">Staff Message:</Text>
          <Text mb={8} ff="montserrat-bold">
            {appointment.message || "There's no message from the staff yet."}
          </Text>
          <Text size="sm">Date and Time:</Text>
          <Text mb={8} ff="montserrat-bold">{`${
            appointment.appointment_date
              ? formatDate(new Date(appointment.appointment_date))
              : "No Date"
          } | ${appointment.appointment_time || "No Time"}`}</Text>
          <Divider />
          <Text c="dimmed" size="xs" mt={10}>
            {formatDateAndTime(new Date(appointment.updated_at))}
          </Text>
        </div>
      ),
    });
  }

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoadingPage(true);
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "*, student:users(*), section:sections(course,year_level,section)"
        )
        .order("datetime", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
        setLoadingPage(false);
        return;
      }
      setLoadingPage(false);
      setAppointments(data || []);
    };

    fetchAppointments();

    const subscription = supabase
      .channel("realtime:appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const appointments_ = appointments
    .filter((v) => {
      if (!selectedDate) return true;
      return v.appointment_date === formatDateToAppointmentDate(selectedDate);
    })
    .filter((v) => {
      if (!selectedStatus) return true;
      return selectedStatus.toLowerCase() === v.status.toLowerCase();
    });

  return (
    <PageContainer
      title="Appointments"
      rightSection={
        <div className="flex items-center gap-x-2">
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            w={150}
            placeholder="Search any"
            rightSection={<IconSearch size={16} />}
          />
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="Filter by"
            data={tmpStatusList}
            w={150}
            {...DefaultSelectProps}
            required={false}
          />
          <DatePickerInput
            clearable
            minDate={new Date(1900, 1, 1)}
            maxDate={new Date(new Date().setMonth(new Date().getMonth() + 3))}
            value={selectedDate}
            onChange={setSelectedDate}
            placeholder="Select Date"
            w={150}
            popoverProps={{
              position: "bottom-end",
              withArrow: true,
              shadow: "md",
              styles: { dropdown: { border: "1px solid #0005" } },
            }}
          />
        </div>
      }
    >
      <LoadingOverlay visible={loadingPage} />

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
                const s = search.toLowerCase().trim();
                const qrCond = v.qrcode.toLowerCase().includes(s);
                const sidCond = v.student.student_id.toLowerCase().includes(s);
                const secCond = `${course} ${year_level[0]}${section}`
                  .toLowerCase()
                  .includes(s);
                const nmCond = `${v.student.firstname} ${v.student.lastname}`
                  .toLowerCase()
                  .includes(s);
                return qrCond || sidCond || secCond || nmCond;
              })
              .map((appointment) => (
                <Table.Tr
                  bg={
                    appointment.status.toLowerCase() === "pending"
                      ? "blue.2"
                      : appointment.status.toLowerCase() === "cancelled"
                      ? "red.2"
                      : appointment.status.toLowerCase() === "return"
                      ? "orange.2"
                      : "green.2"
                  }
                  key={appointment.qrcode}
                >
                  <Table.Td>{appointment.qrcode}</Table.Td>
                  <Table.Td
                    style={{
                      textWrap: "nowrap",
                    }}
                  >
                    {appointment.student?.student_id || "N/A"}
                  </Table.Td>
                  <Table.Td
                    style={{
                      textWrap: "nowrap",
                    }}
                  >{`${appointment.section.course} ${appointment.section.year_level[0]}${appointment.section.section}`}</Table.Td>
                  <Table.Td>
                    <List listStyleType="disc">
                      {appointment.reasons.map((li, i) => (
                        <List.Item key={i}>
                          <Text size="sm" px={10}>
                            {li}
                          </Text>
                        </List.Item>
                      ))}
                    </List>
                  </Table.Td>
                  <Table.Td>{appointment.note || "-"}</Table.Td>
                  <Table.Td>
                    {appointment.appointment_date
                      ? formatDateString(
                          appointment.appointment_date.toString()
                        )
                      : "-"}
                  </Table.Td>
                  <Table.Td>{appointment.appointment_time || "-"}</Table.Td>
                  <Table.Td>{appointment.status.toUpperCase() || "-"}</Table.Td>
                  <Table.Td>
                    <Menu withArrow shadow="lg">
                      <Menu.Target>
                        <ActionIcon color="dark">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          onClick={() => {
                            viewDetailsEventHandler(appointment);
                          }}
                        >
                          View Other Details
                        </Menu.Item>
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
