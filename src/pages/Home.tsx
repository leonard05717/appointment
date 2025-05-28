import {
  ActionIcon,
  Button,
  Checkbox,
  CheckboxCard,
  CheckboxGroup,
  Container,
  Divider,
  Group,
  List,
  LoadingOverlay,
  Menu,
  PasswordInput,
  Popover,
  Select,
  Stepper,
  Table,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import {
  IconArrowRight,
  IconCapProjecting,
  IconDotsVertical,
  IconDownload,
  IconLogout2,
  IconUser,
} from "@tabler/icons-react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import supabase, { autoCancelAppointment } from "../supabase";
import {
  AppointmentProps,
  AppointmentTimeProps,
  DisabledDateProps,
  ReasonProps,
  SectionProps,
  UserProps,
} from "../types";
import { notifications } from "@mantine/notifications";
import {
  displayConfirmation,
  displayError,
  displaySuccess,
  formatDate,
  generateRandomString,
  LoadingClass,
  toProper,
} from "../helpers/methods";
import { DefaultSelectProps } from "../assets/styles";
import { admin_uuid } from "../tmp_data";
import { DateInput, DatePicker } from "@mantine/dates";
import QRCode from "qrcode";
import CustomModal from "../components/CustomModal";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";

interface AccountFormProps {
  email: string;
  password: string;
}

interface StepsProps {
  step1: UserProps | undefined;
  step2: string[] | undefined;
  step3: Date | undefined;
  step4: undefined;
}

interface ActiveAccountProps {
  id: number;
  firstname: string;
  lastname: string;
  gender: string;
  auth_id: string;
  birthday?: Date;
  email: string;
  student_id: string;
  address?: string;
  password: string;
}

interface ForgotPasswordFormProps {
  email: string;
}

interface EditAppointmentProps {
  id: number;
  section_id: string | null;
  reasons: string[];
  note: string;
  appointment_date: string | null;
  appointment_time: string;
}

function Home() {
  const navigate = useNavigate();
  const [loadingEditAppointment, setLoadingEditAppointment] = useState(false);
  const [loadingForgotPassword, setLoadingForgotPassword] = useState(false);
  const [appointmentTime, setAppointmentTime] = useState<
    AppointmentTimeProps[]
  >([]);
  const [disabledDates, setDisabledDates] = useState<DisabledDateProps[]>([]);
  const [loadingActiveAccount, setLoadingActiveAccount] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [sections, setSections] = useState<SectionProps[]>([]);
  const [accountState, { open: openAccountState, close: closeAccountState }] =
    useDisclosure(false);
  const [
    appointmentState,
    { open: openAppointmentState, close: closeAppointmentState },
  ] = useDisclosure(false);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [reasons, setReasons] = useState<ReasonProps[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [account, setAccount] = useState<UserProps | undefined | null>(
    undefined
  );
  const [active, setActive] = useState(0);
  const [allAppointments, setAllAppointments] = useState<AppointmentProps[]>(
    []
  );
  const [
    forgotPasswordState,
    { open: openForgotPasswordState, close: closeForgotPasswordState },
  ] = useDisclosure(false);
  const [
    editAppointmentState,
    { open: openEditAppointmentState, close: closeEditAppointmentState },
  ] = useDisclosure(false);

  const [popOverState, setPopOverState] = useState(false);
  const ref = useClickOutside(() => setPopOverState(false));
  const nextStep = () =>
    setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () =>
    setActive((current) => (current > 0 ? current - 1 : current));

  const forgotPasswordForm = useForm<ForgotPasswordFormProps>({
    mode: "controlled",
    initialValues: {
      email: "",
    },
  });

  const activeAccountForm = useForm<ActiveAccountProps>({
    mode: "controlled",
    initialValues: {
      firstname: "",
      lastname: "",
      gender: "",
      email: "",
      student_id: "",
      address: "",
      password: "",
      id: 0,
      auth_id: "",
    },
  });

  const accountForm = useForm<AccountFormProps>({
    mode: "controlled",
    initialValues: {
      email: "",
      password: "",
    },
  });
  const [steps, setSteps] = useState<StepsProps>({
    step1: undefined,
    step2: undefined,
    step3: undefined,
    step4: undefined,
  });

  async function accountEventHandler(acc: AccountFormProps) {
    setLoadingLogin(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });

    if (error) {
      displayError("Account Not Found", error.message);
      setLoadingLogin(false);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();
    setLoadingLogin(true);
    if (!data.status) {
      await supabase.auth.signOut();
      displayError(
        "Account is Disabled, Please enter you user id and password first.",
        ""
      );
      setLoadingLogin(false);
      return;
    }

    const usr: UserProps = {
      ...data,
      email: authData.user.email,
    };

    if (authData.user.id === admin_uuid) {
      navigate("admin/appointment");
      return;
    }
    await fetch();
    displaySuccess("Success", "Login Account Successfully!");
    setAccount(usr);
    setLoadingLogin(false);
  }

  async function logoutEventHandler() {
    const conf = await displayConfirmation(
      "Confirmation",
      "Are you sure you want to logout?"
    );
    if (!conf) return;
    notifications.show({
      loading: true,
      position: "top-center",
      message: "Logging Out...",
      autoClose: false,
      withCloseButton: false,
    });
    await supabase.auth.signOut();
    accountForm.reset();
    reset();
    notifications.clean();
    notifications.cleanQueue();
    setAccount(null);
  }

  function reset() {
    setSteps({
      step1: undefined,
      step2: undefined,
      step3: undefined,
      step4: undefined,
    });
    setSelectedDate(null);
    setSelectedTime("");
    setSelectedSection(null);
    setNoteValue("");
    setActive(0);
  }

  async function downloadEvent() {
    if (!account || !selectedSection || !selectedDate || !selectedTime) return;

    const conf = await displayConfirmation(
      "Appointment Confirmation",
      "Are you sure you want to confirm your appointment?"
    );

    if (!conf) return;

    setLoadingAppointment(true);

    const qrcode: string = generateRandomString(6).toUpperCase();

    const { error } = await supabase.from("appointments").insert({
      student_id: account.id,
      section_id: selectedSection,
      reasons: steps.step2,
      note: noteValue,
      appointment_date: new Date(selectedDate).toDateString(),
      appointment_time: selectedTime,
      qrcode: qrcode,
      status: "Pending",
      updated_at: new Date(),
    });

    if (error) {
      displayError("Error", error.message);
      setLoadingAppointment(false);
      return;
    }

    displaySuccess("Success", "Appointment Saved Successfully!");

    try {
      const qrDataURL = await QRCode.toDataURL(qrcode, { width: 256 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas context not found");

      const qrImage = new Image();
      qrImage.src = qrDataURL;

      await new Promise((resolve) => {
        qrImage.onload = resolve;
      });

      canvas.width = qrImage.width;
      canvas.height = qrImage.height + 30;

      ctx.drawImage(qrImage, 0, 0);

      ctx.font = "16px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText(`QR Code: ${qrcode}`, canvas.width / 2, canvas.height - 10);

      const labeledQR = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = labeledQR;
      link.download = "qrcode.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      reset();
    } catch (qrError) {
      displayError("QR Code Error", "Failed to generate QR Code.");
    }

    fetch();

    setLoadingAppointment(false);
  }

  async function submitActiveAccountForm(rs: ActiveAccountProps) {
    setLoadingActiveAccount(true);

    if (rs.password) {
      const { error: passError } = await supabase.auth.admin.updateUserById(
        rs.auth_id,
        {
          password: rs.password,
        }
      );

      if (passError) {
        displayError("Invalid Password", passError.message);
        setLoadingActiveAccount(false);
        return;
      }
    }

    const { error } = await supabase
      .from("users")
      .update({
        firstname: rs.firstname,
        lastname: rs.lastname,
        gender: rs.gender,
        address: rs.address,
        birthday: rs.birthday,
      })
      .eq("id", rs.id);

    if (error) {
      displayError("Invalid", error.message);
      setLoadingActiveAccount(false);
      return;
    }

    setAccount((curr) => {
      if (typeof curr === "object" && curr !== null) {
        return {
          ...curr,
          ...rs,
        };
      }

      return curr;
    });

    displaySuccess("Success", "Account Updated Successfully!");
    setLoadingActiveAccount(false);
  }

  const fetch = async () => {
    setLoadingPage(true);
    const sections = (await supabase.from("sections").select("*")).data;
    const reasons = (await supabase.from("reasons").select("*")).data;
    const { data } = await supabase.auth.getSession();
    const all_appointments = (await supabase.from("appointments").select("*"))
      .data;
    const appointmentTime_ = (
      await supabase.from("appointment_time").select("*").order("id")
    ).data;
    const dd = (await supabase.from("disabled_dates").select("*")).data;

    let rs: any = null;

    if (data.session) {
      rs = (
        await supabase
          .from("users")
          .select("*")
          .eq("auth_id", data.session.user.id)
          .single()
      ).data;
    }

    if (!rs) {
      setAccount(null);
    } else {
      const app = (
        await supabase
          .from("appointments")
          .select("*")
          .eq("student_id", rs.id)
          .order("updated_at", {
            ascending: false,
          })
      ).data;
      setAppointments(app || []);
      setAccount({
        ...rs,
        email: data.session?.user.email,
      });
    }
    setDisabledDates(dd || []);
    setAllAppointments(all_appointments || []);
    setAppointmentTime(appointmentTime_ || []);
    setReasons(reasons || []);
    setSections(sections || []);
    setLoadingPage(false);
  };

  async function viewDetailsEventHandler(appointment: AppointmentProps) {
    const sec = sections.find(
      (v) => v.id.toString() === appointment.section_id.toString()
    );
    const s = sec && `${sec.course} ${sec.year_level[0]}${sec.section}`;
    closeAppointmentState();
    modals.open({
      onClose() {
        openAppointmentState();
      },
      size: "lg",
      title: (
        <Text fw="bold">
          Code: {appointment.qrcode} ({s})
        </Text>
      ),
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
          <Text size="sm">Your Note:</Text>
          <Text mb={8} ff="montserrat-bold">
            {appointment.note || "-"}
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
          <Divider mt={10} mb={7} />
          <Text size="sm">Date and Time:</Text>
          <Text mb={8} ff="montserrat-bold">{`${formatDate(
            new Date(appointment.appointment_date)
          )} | ${appointment.appointment_time}`}</Text>
        </div>
      ),
    });
  }

  async function forgotPasswordEventHandler({
    email,
  }: ForgotPasswordFormProps) {
    setLoadingForgotPassword(true);

    const { data: _, error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: "https://granbyappointment.netlify.app/forgot",
      }
    );
    if (error) {
      setLoadingForgotPassword(false);
      displayError("Something error", error.message);
      return;
    }
    closeForgotPasswordState();
    forgotPasswordForm.reset();
    displaySuccess("Email Sent", "Email Sent Successfully!");
    setLoadingForgotPassword(false);
  }

  const editAppointmentForm = useForm<EditAppointmentProps>({
    mode: "controlled",
    initialValues: {
      id: 0,
      section_id: null,
      reasons: [],
      note: "",
      appointment_date: null,
      appointment_time: "",
    },
  });

  async function submitEditAppointment(data: EditAppointmentProps) {
    setLoadingEditAppointment(true);
    const { error } = await supabase
      .from("appointments")
      .update(data)
      .eq("id", data.id);
    if (error) {
      displayError("Something Error", error.message);
      setLoadingEditAppointment(false);
      return;
    }
    displaySuccess("Success", "Update Appointment Successfully!");
    closeEditAppointmentState();
    openAppointmentState();
    editAppointmentForm.reset();
    setLoadingEditAppointment(false);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      autoCancelAppointment();
    }, 10000);

    fetch();

    // appointment
    const sectionSubscription = supabase
      .channel("realtime:appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAppointments((prev) => [
              payload.new as AppointmentProps,
              ...prev,
            ]);
          } else if (payload.eventType === "UPDATE") {
            setAppointments((prev) =>
              prev.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as AppointmentProps)
                  : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setAppointments((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // reasons
    const reasonsSubscription = supabase
      .channel("realtime:reasons")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reasons" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReasons((prev) => [...prev, payload.new as ReasonProps]);
          } else if (payload.eventType === "UPDATE") {
            setReasons((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as ReasonProps) : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setReasons((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // sections
    const sectionsSubscription = supabase
      .channel("realtime:sections")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sections" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSections((prev) => [...prev, payload.new as SectionProps]);
          } else if (payload.eventType === "UPDATE") {
            setSections((prev) =>
              prev.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as SectionProps)
                  : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setSections((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(sectionSubscription);
      supabase.removeChannel(reasonsSubscription);
      supabase.removeChannel(sectionsSubscription);
    };
  }, []);

  if (account === undefined) {
    return (
      <div className="flex items-center justify-center w-full h-screen font-montserrat-bold">
        Loading...
      </div>
    );
  }

  if (account && account.role !== "student") {
    return <Navigate to="admin/appointment" replace />;
  }

  const filteredAppointment = selectedDate
    ? allAppointments.filter(
        (ap) =>
          new Date(ap.appointment_date).toDateString() ===
          new Date(selectedDate).toDateString()
      )
    : [];

  const pendingAppointments = allAppointments.filter(
    (ap) =>
      ap.student_id === account?.id && ap.status.toLowerCase() === "pending"
  );

  return (
    <Container>
      <LoadingOverlay visible={loadingPage} />

      <CustomModal
        title="Account"
        opened={accountState}
        onClose={closeAccountState}
      >
        <form
          className="space-y-3"
          onSubmit={activeAccountForm.onSubmit(submitActiveAccountForm)}
        >
          <Group grow justify="start">
            <TextInput
              {...activeAccountForm.getInputProps("firstname")}
              required
              label="First Name"
              placeholder="Enter First Name"
            />
            <TextInput
              {...activeAccountForm.getInputProps("lastname")}
              required
              label="Last Name"
              placeholder="Enter Last Name"
            />
          </Group>
          <Group grow justify="end">
            <Select
              {...DefaultSelectProps}
              required={true}
              {...activeAccountForm.getInputProps("gender")}
              label="Gender"
              placeholder="Select gender"
              data={[
                {
                  label: "Male",
                  value: "male",
                },
                {
                  label: "Female",
                  value: "female",
                },
              ]}
            />
            <DateInput
              {...activeAccountForm.getInputProps("birthday")}
              required
              label="Date of Birth"
              placeholder="Enter Date of Birth"
            />
          </Group>
          <Group grow justify="end">
            <TextInput
              {...activeAccountForm.getInputProps("student_id")}
              readOnly
              label="Student ID"
              placeholder="Enter Student ID"
            />
            <TextInput
              {...activeAccountForm.getInputProps("address")}
              label="Address"
              placeholder="Enter Address"
            />
          </Group>
          <Group grow justify="end">
            <TextInput
              {...activeAccountForm.getInputProps("email")}
              readOnly
              label="Email"
              placeholder="Enter Email"
            />
            <PasswordInput
              {...activeAccountForm.getInputProps("password")}
              label="Password"
              placeholder="Enter Password"
            />
          </Group>

          <div className="text-right">
            <Button type="submit" loading={loadingActiveAccount}>
              Save Changes
            </Button>
          </div>
        </form>
      </CustomModal>

      <CustomModal
        title="Edit Appointment"
        opened={editAppointmentState}
        onClose={() => {
          closeEditAppointmentState();
          openAppointmentState();
        }}
      >
        <form
          className="space-y-2"
          onSubmit={editAppointmentForm.onSubmit(submitEditAppointment)}
        >
          <Select
            {...editAppointmentForm.getInputProps("section_id")}
            {...DefaultSelectProps}
            placeholder="Select section"
            label="Section"
            data={sections.map((v) => ({
              label: `${v.course} ${v.year_level[0]}${v.section}`,
              value: v.id.toString(),
            }))}
          />
          <CheckboxCard>
            <CheckboxGroup {...editAppointmentForm.getInputProps("reasons")}>
              <div className="space-y-2 px-4 py-3">
                <Text mb={10} ff="montserrat-bold">
                  Reason of Appointment
                </Text>
                {reasons.map((value, i) => {
                  return (
                    <Checkbox
                      key={i}
                      label={value.reason}
                      value={value.reason}
                    />
                  );
                })}
              </div>
            </CheckboxGroup>
          </CheckboxCard>
          <Textarea
            {...editAppointmentForm.getInputProps("note")}
            rows={3}
            label="Note or Message (Optional)"
            placeholder="Enter your message or note"
          />
          <div className="flex justify-center">
            <DatePicker
              getDayProps={(_) => ({
                renderDay(data) {
                  const dateString = data.toDateString();
                  const fn = disabledDates.find(
                    (dd) => new Date(dd.date).toDateString() === dateString
                  );
                  const pn = pendingAppointments.find(
                    (dd) =>
                      new Date(dd.appointment_date).toDateString() ===
                      dateString
                  );

                  if (fn) {
                    return (
                      <Tooltip
                        withArrow
                        label={fn.description || "No Description"}
                      >
                        <div>{data.getDate()}</div>
                      </Tooltip>
                    );
                  }

                  if (pn) {
                    return (
                      <Tooltip
                        withArrow
                        label="You already have an appointment here."
                      >
                        <div className="text-blue-500">{data.getDate()}</div>
                      </Tooltip>
                    );
                  }

                  return <div>{data.getDate()}</div>;
                },
              })}
              excludeDate={(date) => {
                const dateString = date.toDateString();
                const pn = pendingAppointments.find(
                  (dd) =>
                    new Date(dd.appointment_date).toDateString() === dateString
                );
                return (
                  disabledDates.some(
                    (v) => new Date(v.date).toDateString() == dateString
                  ) ||
                  date.getDay() === 0 ||
                  !!pn
                );
              }}
              {...editAppointmentForm.getInputProps("appointment_date")}
              size="md"
              minDate={new Date()}
              maxDate={new Date(new Date().setMonth(new Date().getMonth() + 3))}
            />
          </div>
          <Select
            {...DefaultSelectProps}
            disabled={!editAppointmentForm.values.appointment_date}
            {...editAppointmentForm.getInputProps("appointment_time")}
            placeholder="Select time here..."
            label="Time of Appointment"
            data={appointmentTime.map((tm) => {
              const ap = filteredAppointment.filter(
                (v) => v.appointment_time === tm.time
              );
              const count = tm.max - ap.length;
              return {
                label: `${tm.time} (${count})`,
                value: tm.time,
                disabled: count === 0,
              };
            })}
          />
          <Button
            fullWidth
            mt={10}
            type="submit"
            loading={loadingEditAppointment}
          >
            Save Changes
          </Button>
        </form>
      </CustomModal>

      <CustomModal
        size={1000}
        title="Appointment History"
        opened={appointmentState}
        onClose={closeAppointmentState}
      >
        <div className="w-full overflow-x-scroll">
          <Table withColumnBorders withRowBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th w={350}>Appointment</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Time</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {appointments?.map((row: AppointmentProps) => {
                return (
                  <Table.Tr>
                    <Table.Td>
                      <Text title={row.qrcode} truncate>
                        {row.qrcode}
                      </Text>
                    </Table.Td>
                    <Table.Td miw={300}>
                      <List listStyleType="disc">
                        {row.reasons.map((re, i) => (
                          <List.Item key={i}>{re}</List.Item>
                        ))}
                      </List>
                    </Table.Td>
                    <Table.Td miw={110}>
                      {row.appointment_date
                        ? formatDate(new Date(row.appointment_date))
                        : "-"}
                    </Table.Td>
                    <Table.Td miw={120}>{row.appointment_time || "-"}</Table.Td>
                    <Table.Td
                      c={
                        row.status.toLowerCase() === "completed"
                          ? "green"
                          : row.status.toLowerCase() === "cancelled"
                          ? "red"
                          : "blue"
                      }
                    >
                      {row.status.toUpperCase()}
                    </Table.Td>
                    <Table.Td>
                      <Menu withArrow shadow="md">
                        <Menu.Target>
                          <ActionIcon>
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown w={200}>
                          <Menu.Item
                            onClick={() => viewDetailsEventHandler(row)}
                          >
                            View Details
                          </Menu.Item>
                          <Menu.Item
                            disabled={row.status.toLowerCase() !== "pending"}
                            onClick={() => {
                              editAppointmentForm.setValues({
                                id: row.id,
                                section_id: row.section_id.toString(),
                                reasons: row.reasons,
                                note: row.note,
                                appointment_date: row.appointment_date,
                                appointment_time: row.appointment_time,
                              });

                              openEditAppointmentState();
                              closeAppointmentState();
                            }}
                          >
                            Edit Appointment
                          </Menu.Item>
                          <Menu.Item
                            disabled={row.status.toLowerCase() !== "pending"}
                            onClick={async () => {
                              const conf = await displayConfirmation(
                                "Confirmation",
                                "Are you sure you want to cancel this appointment?"
                              );
                              if (!conf) return;
                              const load = new LoadingClass();
                              load.show("Loading...");
                              await supabase
                                .from("appointments")
                                .update({
                                  status: "cancelled",
                                  staff_name: "You canceled this appointment.",
                                  message: "Cancelled",
                                  updated_at: new Date(),
                                })
                                .eq("id", row.id);
                              load.close();
                            }}
                          >
                            Cancel Appointment
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
            {appointments?.length === 0 && (
              <Table.Caption>No Record Found</Table.Caption>
            )}
          </Table>
        </div>
      </CustomModal>

      <CustomModal
        title="Forgot Password"
        opened={forgotPasswordState}
        onClose={closeForgotPasswordState}
      >
        <form
          onSubmit={forgotPasswordForm.onSubmit(forgotPasswordEventHandler)}
        >
          <TextInput
            {...forgotPasswordForm.getInputProps("email")}
            required
            type="email"
            label="Email Address"
            placeholder="Enter email address"
          />
          <div className="text-right">
            <Button loading={loadingForgotPassword} type="submit" mt={10}>
              Submit
            </Button>
          </div>
        </form>
      </CustomModal>

      <Header
        title="Appointment"
        rightSection={
          account ? (
            <Menu withArrow>
              <Menu.Target>
                <div className="flex items-center gap-x-2 px-3 py-2 select-none active:opacity-80 cursor-pointer border border-slate-100 rounded-sm hover:bg-slate-200 hover:border-slate-400">
                  <Text size="xs">
                    {toProper(`${account.firstname} ${account.lastname}`)}
                  </Text>
                  <IconUser size={16} />
                </div>
              </Menu.Target>
              <Menu.Dropdown
                style={{
                  boxShadow: "1px 2px 3px #0005",
                }}
                w={180}
              >
                <Menu.Item
                  onClick={() => {
                    activeAccountForm.setValues({
                      ...account,
                      birthday: new Date(account.birthday),
                      password: "",
                    });
                    openAccountState();
                  }}
                  fz="sm"
                  leftSection={<IconUser size={16} />}
                >
                  Account
                </Menu.Item>
                <Menu.Item
                  fz="sm"
                  leftSection={<IconCapProjecting size={16} />}
                  onClick={openAppointmentState}
                >
                  Appointment
                </Menu.Item>
                <Menu.Item
                  fz="sm"
                  leftSection={<IconLogout2 size={16} />}
                  onClick={logoutEventHandler}
                >
                  Log Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <div ref={ref}>
              <Popover withArrow opened={popOverState} withinPortal={false}>
                <Popover.Target>
                  <Button
                    onClick={() => setPopOverState(true)}
                    variant="outline"
                    rightSection={<IconUser size={15} />}
                  >
                    Sign In
                  </Button>
                </Popover.Target>
                <Popover.Dropdown
                  style={{
                    boxShadow: "1px 2px 5px #0005",
                    width: 300,
                  }}
                >
                  <Text ff="montserrat-bold">Log In Account</Text>
                  <Divider my={10} />
                  <form
                    onSubmit={accountForm.onSubmit(accountEventHandler)}
                    className="pb-1 space-y-2"
                  >
                    <TextInput
                      {...accountForm.getInputProps("email")}
                      type="email"
                      label="Email Address"
                      required
                      placeholder="Enter your email address"
                    />
                    <PasswordInput
                      {...accountForm.getInputProps("password")}
                      label="Password"
                      required
                      placeholder="Enter your password"
                    />
                    <div className="text-right">
                      <p
                        onClick={() => {
                          openForgotPasswordState();
                          setPopOverState(false);
                        }}
                        className="text-xs mb-2 hover:underline text-blue-500 cursor-pointer active:opacity-50 select-none"
                      >
                        Forgot Password
                      </p>
                    </div>
                    <Divider />
                    <div className="py-2">
                      <Text size="xs">
                        Don't have an account?{" "}
                        <NavLink
                          to="registration"
                          className="hover:underline text-blue-500"
                        >
                          Register
                        </NavLink>
                      </Text>
                    </div>
                    <Button
                      type="submit"
                      fullWidth
                      mt={6}
                      loading={loadingLogin}
                    >
                      Sign In
                    </Button>
                  </form>
                </Popover.Dropdown>
              </Popover>
            </div>
          )
        }
      />

      {/* body */}
      <div className="w-full h-[calc(100%-3.5rem)] p-5">
        <Stepper
          styles={{
            content: {
              paddingBottom: 60,
            },
            root: {
              height: "calc(100vh - 12rem)",
            },
          }}
          active={active}
          onStepClick={setActive}
          allowNextStepsSelect={false}
        >
          {/* STEP 1 : STUDENT INFORMATION */}
          <Stepper.Step label="First step" description="Account Verification">
            {steps.step1 ? (
              <div>
                <Text c="green" mt={10} ff="montserrat-bold" size="xl">
                  Account Found!
                </Text>
                <Text>You can now proceed.</Text>
              </div>
            ) : (
              <div>
                <Text mt={10} ff="montserrat-bold" size="xl">
                  Login Your Account First
                </Text>
                <Text>
                  You need to check and verify whether your account already
                  exists before proceeding.
                </Text>
              </div>
            )}
            <div className="flex gap-x-1 mt-5">
              <Button
                onClick={async () => {
                  if (!account) {
                    displayError(
                      "Error",
                      "Account Not Found. Please Login First."
                    );
                    return;
                  }
                  setSteps((curr) => ({ ...curr, step1: account }));
                }}
                rightSection={<IconArrowRight size={16} />}
              >
                Get My Account Information
              </Button>
              <Button
                onClick={() =>
                  setSteps((curr) => ({
                    ...curr,
                    step1: undefined,
                  }))
                }
                color="red"
                disabled={!steps.step1}
              >
                Reset
              </Button>
            </div>
            {steps.step1 && (
              <div className="py-3">
                <Table withRowBorders>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Th w={200}>Student Name</Table.Th>
                      <Table.Td>
                        {toProper(
                          `${steps.step1.firstname} ${steps.step1.lastname}`
                        )}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Student ID</Table.Th>
                      <Table.Td>{steps.step1.student_id}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Gender</Table.Th>
                      <Table.Td>{toProper(steps.step1.gender)}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Date of Birth</Table.Th>
                      <Table.Td>
                        {formatDate(new Date(steps.step1.birthday))}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Addrress</Table.Th>
                      <Table.Td>
                        {steps.step1.address || "No Address Provided"}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Email Address</Table.Th>
                      <Table.Td>{steps.step1.email}</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>

                <div className="flex items-center justify-center">
                  <Group justify="center" mt="xl">
                    <Button disabled variant="default" onClick={prevStep}>
                      Back
                    </Button>
                    <Button onClick={nextStep} disabled={!steps.step1}>
                      Next step
                    </Button>
                  </Group>
                </div>
              </div>
            )}
          </Stepper.Step>
          {/* STEP 2 : APPOINTMENT */}
          <Stepper.Step label="Second step" description="Appointment">
            <div>
              <Select
                className="md:w-[300px] w-full"
                {...DefaultSelectProps}
                label="Section"
                placeholder="Select your section"
                data={sections.map((sec) => ({
                  label:
                    `${sec.course} ${sec.year_level[0]}${sec.section}`.toUpperCase(),
                  value: sec.id.toString(),
                }))}
                value={selectedSection}
                onChange={setSelectedSection}
              />
              <CheckboxCard mt={20}>
                <CheckboxGroup
                  value={steps.step2}
                  onChange={(values) => {
                    setSteps((curr) => ({
                      ...curr,
                      step2: values,
                    }));
                  }}
                >
                  <div className="space-y-2 px-4 py-3">
                    <Text mb={10} ff="montserrat-bold">
                      Reason of Appointment
                    </Text>
                    {reasons.map((value, i) => {
                      return (
                        <Checkbox
                          key={i}
                          label={value.reason}
                          value={value.reason}
                        />
                      );
                    })}
                  </div>
                </CheckboxGroup>
              </CheckboxCard>
              <Textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                mt={10}
                rows={3}
                label="Note or Message (Optional)"
                placeholder="Enter your message or note"
              />
            </div>
            <Group justify="center" mt="xl">
              <Button variant="default" onClick={prevStep}>
                Back
              </Button>
              <Button
                disabled={
                  !(steps.step2 && steps.step2.length > 0 && selectedSection)
                }
                onClick={nextStep}
              >
                Next step
              </Button>
            </Group>
          </Stepper.Step>
          {/* STEP 3 : DATE AND TIME */}
          <Stepper.Step label="Third step" description="Appointment Date">
            <div className="flex items-center justify-center gap-x-5 flex-col md:flex-row">
              <DatePicker
                getDayProps={(_) => ({
                  renderDay(data) {
                    const dateString = data.toDateString();
                    const fn = disabledDates.find(
                      (dd) => new Date(dd.date).toDateString() === dateString
                    );
                    const pn = pendingAppointments.find(
                      (dd) =>
                        new Date(dd.appointment_date).toDateString() ===
                        dateString
                    );

                    if (fn) {
                      return (
                        <Tooltip
                          withArrow
                          label={fn.description || "No Description"}
                        >
                          <div>{data.getDate()}</div>
                        </Tooltip>
                      );
                    }

                    if (pn) {
                      return (
                        <Tooltip
                          withArrow
                          label="You already have an appointment here."
                        >
                          <div className="text-blue-500">{data.getDate()}</div>
                        </Tooltip>
                      );
                    }

                    return <div>{data.getDate()}</div>;
                  },
                })}
                excludeDate={(date) => {
                  const dateString = date.toDateString();
                  const pn = pendingAppointments.find(
                    (dd) =>
                      new Date(dd.appointment_date).toDateString() ===
                      dateString
                  );
                  return (
                    disabledDates.some(
                      (v) => new Date(v.date).toDateString() == dateString
                    ) ||
                    date.getDay() === 0 ||
                    !!pn
                  );
                }}
                onChange={(e) => setSelectedDate(e)}
                value={selectedDate}
                size="md"
                minDate={new Date()}
                maxDate={
                  new Date(new Date().setMonth(new Date().getMonth() + 3))
                }
              />
              <Select
                {...DefaultSelectProps}
                disabled={!selectedDate}
                value={selectedTime}
                className="w-[300px] md:w-[200px] mt-3"
                onChange={setSelectedTime}
                placeholder="Select time here..."
                label="Time of Appointment"
                data={appointmentTime.map((tm) => {
                  const ap = filteredAppointment.filter(
                    (v) => v.appointment_time === tm.time
                  );
                  const count = tm.max - ap.length;
                  return {
                    label: `${tm.time} (${count})`,
                    value: tm.time,
                    disabled: count === 0,
                  };
                })}
              />
            </div>
            <Group justify="center" mt="xl">
              <Button variant="default" onClick={prevStep}>
                Back
              </Button>
              <Button
                disabled={!(selectedDate && selectedTime)}
                onClick={nextStep}
              >
                Proceed
              </Button>
            </Group>
          </Stepper.Step>
          {/* STEP 4 : DOWNLOAD / END */}
          <Stepper.Step label="Final step" description="Download">
            <div>
              <Text ff="montserrat-bold" size="xl">
                Confirm Your Appointment
              </Text>
              {steps.step1 && (
                <div className="py-3">
                  <Table withRowBorders withColumnBorders>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Th w={150}>Name</Table.Th>
                        <Table.Td>
                          {toProper(
                            `${steps.step1.firstname} ${steps.step1.lastname}`
                          )}
                        </Table.Td>
                        <Table.Th w={150}>Date of Birth</Table.Th>
                        <Table.Td>
                          {formatDate(new Date(steps.step1.birthday))}
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Th>Student ID</Table.Th>
                        <Table.Td>{steps.step1.student_id}</Table.Td>
                        <Table.Th>Addrress</Table.Th>
                        <Table.Td>
                          {steps.step1.address || "No Address Provided"}
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Th>Gender</Table.Th>
                        <Table.Td>{toProper(steps.step1.gender)}</Table.Td>
                        <Table.Th>Email Address</Table.Th>
                        <Table.Td>{steps.step1.email}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Th>Section</Table.Th>
                        <Table.Td>
                          {(() => {
                            const s = sections.find(
                              (sec) => sec.id.toString() === selectedSection
                            );
                            if (!s) return "No Section Found";
                            return `${s.course} ${s.year_level[0]}${s.section}`;
                          })()}
                        </Table.Td>
                        <Table.Th>Date and Time</Table.Th>
                        <Table.Td>{`${formatDate(
                          selectedDate || new Date()
                        )} |   
                        ${selectedTime}`}</Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </div>
              )}
              <Divider mb={15} />
              <Text my={5} ff="montserrat-bold">
                Reason of Appointment
              </Text>
              <List listStyleType="disc">
                {steps.step2?.map((reason, i) => (
                  <List.Item key={i}>{reason}</List.Item>
                ))}
              </List>
              <Divider mt={10} />
              {noteValue && (
                <div className="pt-2">
                  <Text size="xs" c="dimmed">
                    Notes:
                  </Text>
                  <Text size="md">{noteValue}</Text>
                </div>
              )}
            </div>
            <Group justify="center" mt="xl">
              <Button variant="default" onClick={prevStep}>
                Back
              </Button>
              <Button
                loading={loadingAppointment}
                onClick={downloadEvent}
                rightSection={<IconDownload size={16} />}
              >
                Download & Save Appoinment
              </Button>
            </Group>
          </Stepper.Step>
        </Stepper>
      </div>
    </Container>
  );
}

export default Home;
