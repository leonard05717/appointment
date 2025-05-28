export type RoleProps = "student" | "admin" | "superadmin";

export interface SectionProps {
  id: number;
  course: string;
  year_level: string;
  section: string;
  created_at: Date;
}

export interface UserProps {
  id: number;
  firstname: string;
  lastname: string;
  gender: string;
  email: string;
  address: string;
  student_id: string;
  birthday: Date;
  role: RoleProps;
  auth_id: string;
  status: boolean;
  created_at: Date;
}

export interface AppointmentProps {
  id: number;
  student_id: number;
  section_id: number;
  reasons: string[];
  note: string;
  message: string;
  staff_name: string | null;
  qrcode: string;
  created_at: Date;
  status: string;
  appointment_date: string;
  appointment_time: string;
  updated_at: Date;
}

export interface ReasonProps {
  id: number;
  reason: string;
  created_at: Date;
}

export interface AppointmentTimeProps {
  id: number;
  time: string;
  max: number;
  created_at: Date;
}

export interface DisabledDateProps {
  id: number;
  date: Date;
  description: string;
  created_at: Date;
}
