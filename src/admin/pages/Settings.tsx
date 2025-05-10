import { ActionIcon, ActionIconGroup, Button, Divider, LoadingOverlay, NumberInput, Select, Table, Text, Textarea } from "@mantine/core";
import PageContainer from "../../components/PageContainer";
import { useEffect, useState } from "react";
import supabase from "../../supabase";
import { AppointmentTimeProps, DisabledDateProps } from "../../types";
import { DefaultSelectProps } from "../../assets/styles";
import { useDidUpdate, useDisclosure } from "@mantine/hooks";
import { displayConfirmation, displayError, displaySuccess, formatDate, LoadingClass } from "../../helpers/methods";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import CustomModal from "../../components/CustomModal";
import { useForm } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";

interface DisabledDateFormProps {
  id: number;
  date: Date | null;
  description: string;
  type: 'add' | 'edit';
}

function Settings() {
  const [disabledDates, setDisabledDates] = useState<DisabledDateProps[]>([]);
  const [loadingPage, setLoadingPage] = useState(true)
  const [loadingDisabledDate, setLoadingDisabledDate] = useState(false)
  const [loadingAppointmentTime, setLoadingAppointmentTime] = useState(false)
  const [appointmentTime, setAppointmentTime] = useState<AppointmentTimeProps[]>([]);
  const [selectedAppointmentTime, setSelectedAppointmentTime] = useState<string | null>(null);
  const [maxAppointmentTime, setMaxAppointmentTime] = useState<string | number>('');
  const [maxTmpAppointmentTime, setMaxTmpAppointmentTime] = useState<string | number>('');
  const [disabledDateState, { open: openDisabledDateState, close: closeDisabledDateState }] = useDisclosure(false)

  async function fetch() {
    setLoadingPage(true)
    const appTimes = (await supabase.from("appointment_time").select("*").order("id")).data;
    const dd = (await supabase.from("disabled_dates").select("*")).data
    setDisabledDates(dd || [])
    setAppointmentTime(appTimes || [])
    setLoadingPage(false)
  }

  async function saveAppointmentEventHandler() {
    if (!selectedAppointmentTime || !maxAppointmentTime) return;
    setLoadingAppointmentTime(true)
    const { error } = await supabase.from("appointment_time").update({
      max: maxAppointmentTime
    }).eq("id", selectedAppointmentTime);
    if (error) {
      displayError('Something error', error.message)
      setLoadingAppointmentTime(false)
      return;
    }
    // here
    setAppointmentTime((curr) => curr.map((v) => {
      if (v.id.toString() === selectedAppointmentTime) return {
        ...v,
        max: Number(maxAppointmentTime)
      }
      return v;
    }))
    setMaxTmpAppointmentTime(maxAppointmentTime);
    displaySuccess('Update Success', 'Appointment Time Updated Successfully!');
    setLoadingAppointmentTime(false);
  }

  const disabledDateForm = useForm<DisabledDateFormProps>({
    mode: 'controlled',
    initialValues: {
      id: 0,
      date: null,
      description: "",
      type: "add"
    },
    validate: {
      date: (v, values) => {
        if (!v) return 'This date is required.';
        const df = disabledDates.find((rs) => new Date(rs.date).toDateString() === new Date(v).toDateString());
        if (df && values.type === 'add') return 'The selected date already exists.'
        return null;
      }
    }
  })

  async function submitDisabledDateEventHandler(rs: DisabledDateFormProps) {
    setLoadingDisabledDate(true)
    if (rs.type === 'add') {
      const { error } = await supabase.from("disabled_dates").insert({
        date: rs.date,
        description: rs.description
      });
      if (error) {
        displayError('Something error', error.message);
        setLoadingDisabledDate(false)
        return;
      }
      displaySuccess('Add Success', 'Add New Disabled Date Successfully!');
      disabledDateForm.reset()
    } else {
      const { error } = await supabase.from("disabled_dates").update({
        date: rs.date,
        description: rs.description
      }).eq("id", rs.id);
      if (error) {
        displayError('Something error', error.message);
        setLoadingDisabledDate(false)
        return;
      }
      displaySuccess('Edit Success', 'Edit Disabled Date Successfully!');
      closeDisabledDateState();
      disabledDateForm.reset()
    }
    setLoadingDisabledDate(false);
  }

  async function deleteDisableDateEventHandler(data: DisabledDateProps) {
    const conf = await displayConfirmation('Confirmation', 'Are you sure you want to delete this date?');
    if (!conf) return;
    const load = new LoadingClass();
    load.show("Deleting...")
    const { error } = await supabase.from("disabled_dates").delete().eq("id", data.id);
    if (error) {
      displayError('Something error', error.message)
      load.close();
      return;
    }
    load.close();
  }

  useEffect(() => {
    fetch();

    const disabledDateChannel = supabase
      .channel("realtime:disabled_dates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disabled_dates" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDisabledDates((prev) => [...prev, payload.new as DisabledDateProps]);
          } else if (payload.eventType === "UPDATE") {
            setDisabledDates((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new as DisabledDateProps : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setDisabledDates((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(disabledDateChannel)
    }

  }, [])

  useDidUpdate(() => {
    const fn = appointmentTime.find((v) => v.id.toString() === selectedAppointmentTime)
    const max = fn?.max || ''
    setMaxAppointmentTime(max)
    setMaxTmpAppointmentTime(max)
  }, [selectedAppointmentTime])

  return (
    <PageContainer title="Settings">

      <LoadingOverlay visible={loadingPage} />

      <CustomModal title="Add Disabled Date" opened={disabledDateState} onClose={closeDisabledDateState}>
        <form onSubmit={disabledDateForm.onSubmit(submitDisabledDateEventHandler)} className="space-y-2">
          <DatePickerInput minDate={new Date()} {...disabledDateForm.getInputProps('date')} required label="Date" placeholder="Select date here" />
          <Textarea {...disabledDateForm.getInputProps('description')} label="Description (Optional)" placeholder="Enter disabled date description here" rows={4} />
          <div className="text-right pt-1">
            <Button loading={loadingDisabledDate} type="submit">Add Disabled Date</Button>
          </div>
        </form>
      </CustomModal>

      <div className="w-full space-y-2">
        <div className="flex items-end gap-x-2" >
          <Select w='calc(100% - 150px)' value={selectedAppointmentTime} onChange={setSelectedAppointmentTime} {...DefaultSelectProps} data={appointmentTime.map((tm) => ({ label: tm.time, value: tm.id.toString(), }))} placeholder="Select appointment time" label="Appointment Time" />
          <NumberInput allowDecimal={false} allowNegative={false} w={150} disabled={!selectedAppointmentTime} value={maxAppointmentTime} onChange={(val) => setMaxAppointmentTime(val)} label="Maximum Student" placeholder="Max Student" />
        </div>
        <Button loading={loadingAppointmentTime} onClick={saveAppointmentEventHandler} disabled={!selectedAppointmentTime || maxAppointmentTime === maxTmpAppointmentTime}>Save Appointment Time</Button>
      </div>
      <Divider my={15} />
      <div>
        <div className="flex items-center w-full justify-between border-b pb-2 border-slate-200">
          <Text ff="montserrat-bold" size="lg">Disabled Date:</Text>
          <Button onClick={() => {
            disabledDateForm.reset()
            openDisabledDateState()
          }} size="xs" rightSection={<IconPlus size={16} />}>Add Date</Button>
        </div>
        <Table withColumnBorders highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={60}>No.</Table.Th>
              <Table.Th w={150}>Date</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th w={10} ta="center">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {disabledDates.map((value, i) => {
              return (
                <Table.Tr>
                  <Table.Td>{i + 1}</Table.Td>
                  <Table.Td>{formatDate(new Date(value.date))}</Table.Td>
                  <Table.Td>{value.description || 'No Description'}</Table.Td>
                  <Table.Td>
                    <ActionIconGroup>
                      <ActionIcon onClick={() => {
                        disabledDateForm.setValues({
                          ...value,
                          date: new Date(value.date),
                          type: 'edit'
                        })
                        openDisabledDateState();
                      }} color="blue">
                        <IconEdit size={15} />
                      </ActionIcon>
                      <ActionIcon onClick={() => deleteDisableDateEventHandler(value)} color="red">
                        <IconTrash size={15} />
                      </ActionIcon>
                    </ActionIconGroup>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
        {disabledDates.length === 0 && (
          <Text pt={10} ta="center">No Record Found</Text>
        )}
      </div>
    </PageContainer>
  );
}

export default Settings;