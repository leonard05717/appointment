import {
  Button,
  ButtonGroup,
  Divider,
  List,
  Loader,
  LoadingOverlay,
  MantineSize,
  Select,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from "@mantine/core";
import PageContainer from "../../components/PageContainer";
import { IconQrcode } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import supabase from "../../supabase";
import { useEffect, useState } from "react";
import {
  AppointmentProps,
  AppointmentTimeProps,
  DisabledDateProps,
  SectionProps,
  UserProps,
} from "../../types";
import {
  displayError,
  formatDate,
  formatDateAndTime,
  formatDateToAppointmentDate,
  toProper,
} from "../../helpers/methods";
import CustomModal from "../../components/CustomModal";
import { useDisclosure } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import { DefaultSelectProps } from "../../assets/styles";
import { Link } from "react-router-dom";

interface QRCodeFormProps {
  qrcode: string;
}

interface ScanField {
  label: string;
  value: string;
  upper?: boolean;
  disableProper?: boolean;
  size?: MantineSize;
}

type DataProps = AppointmentProps & {
  section: SectionProps;
  user: UserProps;
};

function ScanField(props: ScanField) {
  return (
    <Text ff="montserrat-medium" size={props.size || "sm"}>
      {props.label}:{" "}
      <span className="underline">
        {props.value
          ? props.upper
            ? props.value.toUpperCase()
            : !props.disableProper
            ? toProper(props.value)
            : props.value
          : "No Data Provided"}
      </span>
    </Text>
  );
}

function Scan() {
  const [loadingPage, setLoadingPage] = useState(true);
  const [status, setStatus] = useState("");
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [messageState, { open: openMessageState, close: closeMessageState }] =
    useDisclosure(false);
  const [message, setMessage] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [data, setData] = useState<DataProps | undefined>();
  const [disabledDates, setDisabledDates] = useState<DisabledDateProps[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentTime, setAppointmentTime] = useState<
    AppointmentTimeProps[]
  >([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [allAppointments, setAllAppointments] = useState<AppointmentProps[]>(
    []
  );
  const qrcodeForm = useForm<QRCodeFormProps>({
    mode: "controlled",
    initialValues: {
      qrcode: "",
    },
  });

  async function resetEventHandler() {
    setData(undefined);
    qrcodeForm.reset();
    document.getElementById("qrcode-field")?.focus();
  }

  async function markEventHandler(status: string) {
    setStatus(status);
    setMessage(data?.message || "");
    openMessageState();
  }

  async function submitQrCodeEventHandler(rs: QRCodeFormProps) {
    setLoadingSearch(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*, user:users(*), section:sections(*)")
      .eq("qrcode", rs.qrcode.toUpperCase())
      .single();
    if (error) {
      displayError(
        "Not Found",
        `The appointment with QR code: ${rs.qrcode.toUpperCase()} was not found.`
      );
      setData(undefined);
      setLoadingSearch(false);
      return;
    }
    setData(data);
    setLoadingSearch(false);
  }

  async function submitMessageEventHandler() {
    if (!data) return;

    setLoadingConfirm(true);

    const auth_id = (await supabase.auth.getSession()).data.session?.user.id;

    if (!auth_id) return;

    const user = (
      await supabase.from("users").select("*").eq("auth_id", auth_id).single()
    ).data;

    if (status === "return") {
      if (!selectedDate || !selectedTime) {
        displayError(
          "No Selected Return Date and Time",
          "Please select return date and time first."
        );
        return;
      }

      const date = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        new Date(selectedDate).getDate() + 1
      );

      const { error } = await supabase
        .from("appointments")
        .update({
          status: status,
          updated_at: new Date(),
          staff_name: user
            ? toProper(`${user.firstname} ${user.lastname}`)
            : null,
          message: message,
          appointment_date: date,
          appointment_time: selectedTime,
        })
        .eq("id", data.id);

      if (error) {
        displayError("Something error", error.message);
        setLoadingConfirm(false);
        return;
      }

      setData((current) => {
        if (typeof current === "object") {
          return {
            ...current,
            status: status,
            message: message,
            updated_at: new Date(),
            appointment_date: formatDateToAppointmentDate(selectedDate),
            appointment_time: selectedTime,
          };
        }
        return current;
      });
    } else {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: status,
          updated_at: new Date(),
          staff_name: user
            ? toProper(`${user.firstname} ${user.lastname}`)
            : null,
          message: message,
          appointment_time: data.appointment_time,
        })
        .eq("id", data.id);

      if (error) {
        displayError("Something error", error.message);
        setLoadingConfirm(false);
        return;
      }

      setData((current) => {
        if (typeof current === "object") {
          return {
            ...current,
            status: status,
            message: message,
            updated_at: new Date(),
          };
        }
        return current;
      });
    }

    setLoadingConfirm(false);
    setMessage("");
    setSelectedDate(null);
    setSelectedTime(null);
    closeMessageState();
  }

  async function fetch() {
    setLoadingPage(true);
    const dd = (await supabase.from("disabled_dates").select("*")).data;
    const appointmentTime_ = (
      await supabase.from("appointment_time").select("*").order("id")
    ).data;
    const all_appointments = (await supabase.from("appointments").select("*"))
      .data;
    setAppointmentTime(appointmentTime_ || []);
    setDisabledDates(dd || []);
    setAllAppointments(all_appointments || []);
    setLoadingPage(false);
  }

  useEffect(() => {
    fetch();
  }, []);

  const filteredAppointment = selectedDate
    ? allAppointments.filter(
        (ap) =>
          new Date(ap.appointment_date).toDateString() ===
          new Date(selectedDate).toDateString()
      )
    : [];

  return (
    <PageContainer
      title="Scan QR Code"
      rightSection={
        <div className="flex items-center gap-x-4">
          <Link to="/queue" className="hover:underline">
            Appointment Queue
          </Link>
          <Button size="xs" onClick={resetEventHandler}>
            Reset
          </Button>
        </div>
      }
    >
      <LoadingOverlay visible={loadingPage} />

      <CustomModal
        opened={messageState}
        title="Confirmation"
        onClose={closeMessageState}
      >
        <div>
          <Text mb={5}>
            Are you sure you want to mark this as{" "}
            <span className="text-blue-500 ">"{status}"</span>?
          </Text>
          {status === "return" && (
            <div className="space-y-2">
              <DatePickerInput
                required
                minDate={new Date()}
                maxDate={
                  new Date(new Date().setMonth(new Date().getMonth() + 3))
                }
                label="Return Date"
                placeholder="Select Return Date"
                value={selectedDate}
                onChange={setSelectedDate}
                getDayProps={(_) => ({
                  renderDay(data) {
                    const dateString = data.toDateString();
                    const fn = disabledDates.find(
                      (dd) => new Date(dd.date).toDateString() === dateString
                    );
                    if (fn) {
                      return (
                        <Tooltip
                          withArrow
                          label={fn.description || "No Description"}
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
                  return (
                    disabledDates.some(
                      (v) => new Date(v.date).toDateString() == dateString
                    ) || date.getDay() === 0
                  );
                }}
              />
              <Select
                {...DefaultSelectProps}
                disabled={!selectedDate}
                value={selectedTime}
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
          )}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            label="Message (Optional)"
            placeholder="You can leave a message here."
          />
          <div className="flex justify-end">
            <ButtonGroup mt={10}>
              <Button
                color="red"
                onClick={() => {
                  setMessage("");
                  closeMessageState();
                }}
              >
                Cancel
              </Button>
              <Button
                loading={loadingConfirm}
                color="dark"
                onClick={submitMessageEventHandler}
              >
                Okay
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </CustomModal>

      <div className="fixed md:bottom-5 bottom-0 p-5 px-3 md:p-0 md:right-10 right-0 flex bg-white md:bg-inherit w-full md:w-fit z-10">
        <div className="flex items-center gap-x-1">
          <Text className="font-montserrat-medium text-sm" mr={5}>
            Mark as:
          </Text>
          <ButtonGroup>
            <Button
              onClick={() => markEventHandler("completed")}
              color="green"
              disabled={data?.status.toLowerCase() === "completed" || !data}
            >
              Completed
            </Button>
            <Button
              onClick={() => markEventHandler("cancelled")}
              color="red"
              disabled={data?.status.toLowerCase() === "cancelled" || !data}
            >
              Cancelled
            </Button>
            <Button
              onClick={() => markEventHandler("pending")}
              color="blue"
              disabled={data?.status.toLowerCase() === "pending" || !data}
            >
              Pending
            </Button>
            {data &&
              new Date(data.appointment_date).toDateString() ===
                new Date().toDateString() && (
                <Button
                  disabled={!data}
                  onClick={() => markEventHandler("return")}
                  color="orange"
                >
                  Return
                </Button>
              )}
          </ButtonGroup>
        </div>
      </div>
      <div className="grid md:grid-cols-2 grid-cols-1 grid-rows-1 w-full gap-x-5 pb-12 px-2">
        <div>
          <form onSubmit={qrcodeForm.onSubmit(submitQrCodeEventHandler)}>
            <TextInput
              id="qrcode-field"
              autoFocus
              data-autofocus
              disabled={loadingSearch}
              maxLength={6}
              {...qrcodeForm.getInputProps("qrcode")}
              minLength={6}
              leftSection={<IconQrcode size={17} />}
              placeholder="Scan or Enter QR Code here..."
              size="lg"
              rightSection={loadingSearch && <Loader size="sm" />}
            />
          </form>
          {data ? (
            <>
              <Text ff="montserrat-bold" mt={15}>
                Status
              </Text>
              <Text
                className="uppercase"
                size="xl"
                c={
                  data.status.toLowerCase() === "completed"
                    ? "green"
                    : data.status.toLowerCase() === "cancelled"
                    ? "red"
                    : "blue"
                }
              >
                {data.status}
              </Text>
              <Divider my={10} />
              <Text ff="montserrat-bold" mt={15}>
                Appointment Details
              </Text>
              <Divider my={10} />
              <div className="space-y-2 border-b border-b-slate-300 pb-3">
                <Text ff="montserrat-medium">Reason of Appointment:</Text>
                <List mt={10} size="sm" listStyleType="disc">
                  {data.reasons.map((reason, i) => (
                    <List.Item key={i}>{reason}</List.Item>
                  ))}
                </List>
                <Divider my={15} />
                <Text mt={10} ff="montserrat-medium">
                  Note:
                </Text>
                <Text size="sm">{data.note || "No Note Found"}</Text>
                <Divider my={15} />
                <Text mt={10} mb={4} ff="montserrat-medium">
                  Appointment Date and Time:
                </Text>
                <ScanField
                  label="Date"
                  value={
                    data.appointment_date
                      ? formatDate(new Date(data.appointment_date))
                      : "None"
                  }
                />
                <ScanField
                  upper
                  label="Time"
                  value={data.appointment_time || "None"}
                />
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-center pt-10">
              <Text>No Appointment Found</Text>
            </div>
          )}
        </div>
        <div>
          {data ? (
            <div>
              <div className="w-full border border-slate-300 px-4 py-3 rounded-md shadow-md">
                <Text ff="montserrat-bold">Personal Information</Text>
                <Divider my={10} />
                <div className="space-y-2 border-b border-b-slate-300 pb-3">
                  <ScanField
                    label="Student ID"
                    disableProper
                    value={data.user.student_id.toUpperCase()}
                  />
                  <ScanField label="First Name" value={data.user.firstname} />
                  <ScanField label="Last Name" value={data.user.lastname} />
                  <ScanField label="Gender" value={data.user.gender} />
                  <ScanField label="Address" value={data.user.address} />
                </div>
                <Text ff="montserrat-bold" mt={12}>
                  Section
                </Text>
                <Divider my={10} />
                <div className="space-y-2 border-b border-b-slate-300 pb-3">
                  <ScanField
                    label="Course"
                    disableProper
                    value={data.section.course.toUpperCase()}
                  />
                  <ScanField
                    label="Year Level"
                    disableProper
                    value={data.section.year_level}
                  />
                  <ScanField
                    label="Section"
                    disableProper
                    value={data.section.section}
                  />
                  <ScanField
                    label="Code"
                    disableProper
                    value={`${data.section.course} ${data.section.year_level[0]}${data.section.section}`}
                  />
                </div>
                <Text size="sm" c="dimmed" mt={13}>
                  {formatDateAndTime(new Date(data.updated_at)).toString()}
                </Text>
              </div>
              {data.message ? (
                <Tooltip label="Message" withArrow>
                  <div className="text-xs text-slate-500 mt-3 border-b border-slate-300 p-2 rounded-sm">
                    {data.message}
                  </div>
                </Tooltip>
              ) : (
                <Text size="xs" mt={10} c="dimmed">
                  No Message Found.
                </Text>
              )}
            </div>
          ) : (
            <div>No Data Found</div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default Scan;
