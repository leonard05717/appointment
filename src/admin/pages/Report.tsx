import { DatePickerInput } from "@mantine/dates";
import PageContainer from "../../components/PageContainer";
import { useEffect, useState } from "react";
import { Button, List, Select, Table, Text } from "@mantine/core";
import { formatDate, toProper } from "../../helpers/methods";
import { AppointmentProps, UserProps } from "../../types";
import supabase from "../../supabase";
import { tmpStatusList } from "../../tmp_data";
import { DefaultSelectProps } from "../../assets/styles";

type AppointmentDataProps = AppointmentProps & {
  student: UserProps;
};

function Report() {
  const [status, setStatus] = useState<string | null>(null);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDataProps[]>([]);

  useEffect(() => {
    async function fetch() {
      const data = (await supabase.from("appointments").select("*, student:users(student_id,firstname,lastname)")).data;
      setAppointments(data || []);
    }
    fetch();
  }, []);

  const filteredByDate =
    from && to
      ? appointments.filter((ap) => {
        const d = new Date(ap.appointment_date);
        return d >= new Date(from) && d <= new Date(to);
      })
      : [];

  const handlePrint = () => {
    const content = document.getElementById("printable");
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (printWindow) {
      printWindow.document.write(`
            <html>
              <head>
                <title>Appointments Report</title>
                <style>
                  body {
                    font-family: sans-serif;
                    padding: 20px;
                  }
      
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                  }
      
                  th, td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                    font-size: 12px;
                  }
      
                  .page-break {
                    page-break-before: always;
                  }
      
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #printable, #printable * {
                      visibility: visible;
                    }
                    .page-break {
                      page-break-before: always;
                    }
                  }
                </style>
              </head>
              <body>
                <div id="printable">
                  ${content.innerHTML}
                </div>
              </body>
            </html>
          `);
      printWindow.document.close();

      // Delay to ensure content is rendered before printing
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    }
  };


  return (
    <PageContainer title="Report">
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-5 md:grid-rows-1 md:h-[calc(100vh-10rem)] h-fit">
        <div className="space-y-2 h-full md:mb-0 mb-5">
          <Text mb={10}>Select the date range of the report you want to generate.</Text>
          <DatePickerInput
            minDate={new Date(2000, 0, 1)}
            maxDate={to ? new Date(new Date(to)) : new Date()}
            clearable
            value={from}
            onChange={setFrom}
            label="From Date"
            placeholder="Select From date"
          />
          <DatePickerInput
            minDate={from ? new Date(from) : new Date()}
            maxDate={new Date(new Date().setMonth(new Date().getMonth() + 5))}
            clearable
            value={to}
            onChange={setTo}
            label="To Date"
            placeholder="Select To date"
          />
          <div className="pt-2 text-right">
            <Button disabled={!from || !to} onClick={handlePrint}>Print Report</Button>
          </div>
        </div>

        <div className="border col-span-1 md:col-span-2 bg-white rounded-md shadow-md p-5 border-slate-200 h-full overflow-y-scroll">
          <div className="flex items-center justify-between pb-2">
            <Text ff="montserrat-bold" mb={5}>Appointments Data</Text>
            <Select {...DefaultSelectProps} id="print-hide" value={status} onChange={setStatus} placeholder="Filter by" size="xs" data={tmpStatusList} />
          </div>
          <div id="printable">
            {/* Table for Date Range and Status Count */}
            <Table withColumnBorders withRowBorders withTableBorder className="page-break">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td colSpan={2}>Date:</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th w={200}>From Date:</Table.Th>
                  <Table.Td>{from ? formatDate(new Date(from)) : '-'}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th>To Date:</Table.Th>
                  <Table.Td>{to ? formatDate(new Date(to)) : '-'}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td colSpan={2}>Data:</Table.Td>
                </Table.Tr>
                {tmpStatusList
                  .filter((v) => {
                    if (!status) return true;
                    return v.value.toLowerCase() === status.toLowerCase();
                  })
                  .map((stats, i) => (
                    <Table.Tr key={i}>
                      <Table.Th>{stats.label} Appointment</Table.Th>
                      <Table.Td>{filteredByDate.filter((v) => v.status.toLowerCase() === stats.value.toLowerCase()).length}</Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>

            {/* Page Break */}
            {/* <Divider className="page-break" /> */}

            {/* Table for Appointments Data */}
            <Table mt={10} withColumnBorders withRowBorders withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>SID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Reasons</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Date & Time</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredByDate
                  .filter((v) => {
                    if (!status) return true;
                    return v.status.toLowerCase() === status.toLowerCase();
                  })
                  .map((v) => (
                    <Table.Tr key={v.id}>
                      <Table.Td>{v.qrcode}</Table.Td>
                      <Table.Td>{v.student.student_id}</Table.Td>
                      <Table.Td>{toProper(`${v.student.firstname} ${v.student.lastname}`)}</Table.Td>
                      <Table.Td>
                        <List listStyleType="disc">
                          {v.reasons.map((reason) => (
                            <List.Item key={reason} fz="xs">{reason}</List.Item>
                          ))}
                        </List>
                      </Table.Td>
                      <Table.Td>{toProper(v.status)}</Table.Td>
                      <Table.Td>{`${formatDate(new Date(v.appointment_date))} | ${v.appointment_time}`}</Table.Td>
                    </Table.Tr>
                  ))}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default Report;
