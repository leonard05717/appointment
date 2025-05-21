import { useEffect, useState } from "react";
import supabase from "../supabase";
import { AppointmentProps, UserProps } from "../types";
import { tmpTimeSelection } from "../tmp_data";
import { LoadingOverlay, Text } from "@mantine/core";
import {
  formatDateAndTime,
  formatDateToAppointmentDate,
  toProper,
} from "../helpers/methods";
import { useInterval } from "@mantine/hooks";
import { Link } from "react-router-dom";

type AppointmentDataProps = AppointmentProps & {
  student: UserProps;
};

function Queue() {
  const [appointments, setAppointments] = useState<AppointmentDataProps[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [dateAndTime, setDateAndTime] = useState("-");

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
                        status: payload.new.status,
                      }
                    : item;
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

  const interval = useInterval(() => {
    setDateAndTime(formatDateAndTime(new Date(), "|"));
  }, 1000);

  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  return (
    <div className="relative w-full h-screen">
      <LoadingOverlay visible={loadingPage} />

      <div className="w-full h-16 px-8 border-b bg-[#222] text-white flex items-center justify-between">
        <Link
          to="/admin/scan"
          className="hover:underline text-xl font-montserrat-bold cursor-pointer"
        >
          Appointment Queue
        </Link>
        <Text ff="montserrat-bold" size="lg">
          {dateAndTime}
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
                    (v) =>
                      v.appointment_time === time &&
                      v.status.toLowerCase() === "pending"
                  )
                  .map((app) => {
                    const fullname = toProper(
                      `${app.student.firstname} ${app.student.lastname}`
                    );
                    return (
                      <div key={app.id}>
                        <Text
                          size="xl"
                          style={{
                            textTransform: "uppercase",
                          }}
                          ff="montserrat-bold"
                          ta="center"
                        >
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
