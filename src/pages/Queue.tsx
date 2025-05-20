import { useEffect, useState } from "react";
import supabase from "../supabase";
import { AppointmentProps, UserProps } from "../types";
import { tmpTimeSelection } from "../tmp_data";
import { LoadingOverlay, Text } from "@mantine/core";
import { formatDateToAppointmentDate, toProper } from "../helpers/methods";

type AppointmentDataProps = AppointmentProps & {
  student: UserProps;
};

function Queue() {
  const [appointments, setAppointments] = useState<AppointmentDataProps[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);

  async function fetch() {
    setLoadingPage(true);
    const appointments_ = (
      await supabase
        .from("appointments")
        .select("*, student:users(*)")
        .eq("appointment_date", formatDateToAppointmentDate(new Date()))
    ).data;
    setAppointments(appointments_ || []);
    setLoadingPage(false);
  }

  useEffect(() => {
    fetch();
    const appointmentChannel = supabase
      .channel("realtime:appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setAppointments((curr) =>
              curr.map((item) => {
                const newData =
                  item.id === payload.new.id
                    ? {
                        ...item,
                        appointment_time: payload.new.appointment_time,
                        status: payload.new.status,
                      }
                    : item;
                console.log(newData);
                return newData;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
    };
  }, []);

  // useEffect(() => {
  //   console.log(appointments);
  // }, [appointments]);

  return (
    <div className="relative w-full h-screen">
      <LoadingOverlay visible={loadingPage} />

      <div className="w-full h-16 px-8 border-b bg-[#222] text-white flex items-center justify-between">
        <Text ff="montserrat-bold" size="xl">
          Attendance Queue
        </Text>
      </div>

      <div
        className="w-full h-[calc(100vh-4rem)]"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tmpTimeSelection.length}, 1fr)`,
        }}
      >
        {tmpTimeSelection.map((time, i) => {
          return (
            <div key={i}>
              <div className="py-4 border-b border-x">
                <Text ta="center" size="xl" ff="montserrat-bold">
                  {time}
                </Text>
              </div>

              <div className="py-5">
                {appointments
                  .filter(
                    (v) => v.appointment_time === time
                    // v.status.toLowerCase() === 'pending'
                  )
                  .map((app) => {
                    const fullname = toProper(
                      `${app.student.firstname} ${app.student.lastname}`
                    );
                    return (
                      <div key={app.id}>
                        <Text size="lg" ff="montserrat-bold" ta="center">
                          {fullname}
                        </Text>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Queue;
