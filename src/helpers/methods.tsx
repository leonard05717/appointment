import { Text, ThemeIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";
import { ReactNode } from "react";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function displayError(title: string, message: string, position?: any) {
  notifications.clean();
  notifications.cleanQueue();
  notifications.show({
    title: title,
    message: message,
    color: "#f00",
    styles: {
      root: {
        border: "1px solid #0004",
      },
    },
    position: position,
    icon: (
      <ThemeIcon color="red">
        <IconX />
      </ThemeIcon>
    ),
  });
}

export function displaySuccess(title: string, message: string) {
  notifications.clean();
  notifications.cleanQueue();
  notifications.show({
    message: message,
    title: title,
    withBorder: true,
    color: "green",
    autoClose: 5000,
    icon: (
      <ThemeIcon color="green">
        <IconCheck />
      </ThemeIcon>
    ),
    styles: {
      root: {
        border: "1px solid #0004",
      },
    },
  });
}

export function displayWarning(title: string, message: string) {
  notifications.clean();
  notifications.cleanQueue();
  notifications.show({
    message: message,
    title: title,
    withBorder: true,
    color: "yellow",
    autoClose: 5000,
    icon: (
      <ThemeIcon color="yellow">
        <IconAlertTriangle />
      </ThemeIcon>
    ),
    styles: {
      root: {
        border: "1px solid #0004",
      },
    },
  });
}

export function displayNotification(
  title: string,
  message: string,
  color = "#222",
  icon = null
) {
  notifications.clean();
  notifications.cleanQueue();
  notifications.show({
    message: message,
    title: title,
    withBorder: true,
    color: color,
    autoClose: 5000,
    icon: icon,
    styles: {
      root: {
        border: "1px solid #0004",
      },
    },
  });
}

export async function displayLoading(message = "Loading...") {
  notifications.show({
    loading: true,
    position: "top-center",
    message: message,
    autoClose: false,
    withCloseButton: false,
  });
}

export async function displayConfirmation(
  title: string,
  message: string | ReactNode,
  color: string = "cyan",
  buttonLabels: { confirm: string; cancel: string } = {
    confirm: "Okay",
    cancel: "Cancel",
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmProps = {
      "data-autofocus": true,
    };

    modals.openConfirmModal({
      title: title,
      zIndex: 2000,
      children:
        typeof message === "string" ? (
          <Text size="sm">{message}</Text>
        ) : (
          message
        ),
      labels: buttonLabels,
      confirmProps: { color: color, autoFocus: true, ...confirmProps },
      onCancel: () => resolve(false),
      onConfirm: () => resolve(true),
    });
  });
}

export function chunk<T>(array: T[], size: number): T[][] {
  if (!array.length) {
    return [];
  }
  const head = array.slice(0, size);
  const tail = array.slice(size);
  return [head, ...chunk(tail, size)];
}

export function toProper(str: string): string {
  const excludeWords = ["of", "in", "and", "the", "on"];
  return str
    .split(" ")
    .map((word) => {
      const isExclude = excludeWords.includes(word.toLowerCase());
      return (
        (isExclude
          ? word.charAt(0).toLowerCase()
          : word.charAt(0).toUpperCase()) + word.slice(1).toLowerCase()
      );
    })
    .join(" ");
}

export async function sleep(seconds: number = 2) {
  return new Promise((resolve, _) => {
    window.setTimeout(() => {
      resolve(null);
    }, seconds * 1000);
  });
}

export function generateStudentID(): string {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `GC-${randomNumber}`;
}

export function generateAcronym(phrase: string) {
  const excludeWords = ["of", "in", "and", "the", "on"];
  return phrase
    .split(" ")
    .filter((word) => !excludeWords.includes(word.toLowerCase()))
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function formatDateString(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formattedDate = `${monthNames[month - 1]} ${day}, ${year}`;
  return formattedDate;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTimeV2(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Ensures AM/PM format
  });
}

export function formatDateToAppointmentDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

export function formatTime(timeString?: string): string {
  if (!timeString) return "";
  const [hour, minute] = timeString.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const formattedHour = (hour % 12 || 12).toString().padStart(2, "0");
  const formattedMinute = minute.toString().padStart(2, "0"); // Ensure two digits

  return `${formattedHour}:${formattedMinute} ${period}`;
}

export function generateRandomString(length = 10) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export const formatDateAndTime = (
  date: string | Date,
  separator: string = "at"
): string => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  let hour = d.getHours();
  const min = d.getMinutes().toString().padStart(2, "0");
  const sec = d.getSeconds().toString().padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const hourStr = hour.toString().padStart(2, "0");
  return `${MONTHS[month]} ${day}, ${year} ${separator} ${hourStr}:${min}:${sec} ${ampm}`;
};

export class LoadingClass {
  show(message?: string) {
    notifications.show({
      loading: true,
      position: "top-center",
      message: message || "Loading...",
      autoClose: false,
      withCloseButton: false,
      style: {
        border: "1px solid #0005",
        boxShadow: "1px 2px 5px #0005",
      },
    });
  }
  close() {
    notifications.clean();
    notifications.cleanQueue();
  }
}
