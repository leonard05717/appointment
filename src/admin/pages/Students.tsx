import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import CustomTable, { ColumnProps } from "../../components/CustomTable";
import PageContainer from "../../components/PageContainer";
import { UserProps } from "../../types";
import {
  ActionIcon,
  Button,
  ButtonGroup,
  Group,
  LoadingOverlay,
  PasswordInput,
  Select,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconDice, IconPlus, IconSearch } from "@tabler/icons-react";
import CustomModal from "../../components/CustomModal";
import { useDisclosure } from "@mantine/hooks";
import { DefaultSelectProps } from "../../assets/styles";
import { DateInput } from "@mantine/dates";
import {
  formatDate,
  generateStudentID,
  LoadingClass,
} from "../../helpers/methods";
import supabase from "../../supabase";
import { displayError, displaySuccess } from "../../helpers/methods";

interface StudentFormProps {
  id?: number;
  firstname: string;
  lastname: string;
  gender?: string;
  email: string;
  password: string;
  address: string;
  student_id: string;
  birthday?: Date;
  status: boolean;
  type: "add" | "edit";
}

function Students() {
  const [students, setStudents] = useState<UserProps[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [search, setSearch] = useState("");
  const [studentState, { open: openStudentState, close: closeStudentState }] =
    useDisclosure(false);

  const columns: ColumnProps<UserProps>[] = [
    { label: "Student ID", field: "student_id", searchExact: true },
    { label: "First Name", field: "firstname" },
    { label: "Last Name", field: "lastname" },
    {
      label: "Birth Day",
      field: "birthday",
      format(result) {
        return formatDate(new Date(result.birthday));
      },
    },
    { label: "Gender", field: "gender" },
    { label: "Email", field: "email" },
    { label: "Address", field: "address" },
    {
      label: "Status",
      field: "status",
      format(result) {
        return result.status ? (
          <Text c="green">Active</Text>
        ) : (
          <Text c="red">Inactive</Text>
        );
      },
      emptyText: <Text c="red">Inactive</Text>,
    },
  ];

  const studentForm = useForm<StudentFormProps>({
    mode: "controlled",
    initialValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
      address: "",
      student_id: "",
      type: "add",
      status: false,
    },
  });

  async function submitStudentEventHandler(data: StudentFormProps) {
    setLoadingStudent(true);
    if (data.type === "add") {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password || "12345678",
      });

      if (authError) {
        displayError("Registration Error", authError.message);
        setLoadingStudent(false);
        return;
      }

      const { error: studentError } = await supabase.from("users").insert([
        {
          student_id: data.student_id,
          firstname: data.firstname,
          lastname: data.lastname,
          gender: data.gender,
          birthday: data.birthday,
          address: data.address,
          role: "student",
          auth_id: authData.user?.id,
        },
      ]);

      if (studentError) {
        displayError("Database Error", studentError.message);
        setLoadingStudent(false);
        return;
      }

      displaySuccess("Success", "Student registered successfully!");
      closeStudentState();
    } else {
      const { error: er } = await supabase
        .from("users")
        .update({
          student_id: data.student_id,
          firstname: data.firstname,
          lastname: data.lastname,
          gender: data.gender,
          birthday: data.birthday,
          address: data.address,
        })
        .eq("id", data.id);
      if (er) {
        displayError("Something Error", er.message);
        setLoadingStudent(false);
        return;
      }
      displaySuccess("Success", "Student Update Successfully!");
      closeStudentState();
    }

    setLoadingStudent(false);
  }

  async function setStatus(user_id: number, status: boolean) {
    const load = new LoadingClass();
    load.show("Updating Status...");
    await supabase
      .from("users")
      .update({
        status: status,
      })
      .eq("id", user_id);
    load.close();
    studentForm.setFieldValue("status", status);
  }

  useEffect(() => {
    async function fetchStudents() {
      setLoadingPage(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student");
      const listOfUsers = (await supabase.auth.admin.listUsers()).data.users;
      if (error) {
        displayError("Error", error.message);
      } else {
        const mainData = data
          .map((v) => {
            const f = listOfUsers.find((li) => li.id === v.auth_id);
            return {
              ...v,
              email: f?.email || "",
            };
          })
          .filter((v) => v.email);

        setStudents(mainData || []);
      }
      setLoadingPage(false);
    }

    fetchStudents();

    const subscribe = supabase
      .channel("realtime:users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setStudents((prev) => [...prev, payload.new as UserProps]);
          } else if (payload.eventType === "UPDATE") {
            setStudents((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as UserProps) : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setStudents((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscribe);
    };
  }, []);

  return (
    <PageContainer
      title="Students"
      rightSection={
        <div className="flex items-center gap-x-2">
          <TextInput
            value={search}
            size="xs"
            leftSection={<IconSearch size={14} />}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any here..."
          />
          <Button
            rightSection={<IconPlus size={16} />}
            size="xs"
            onClick={() => {
              studentForm.reset();
              studentForm.setValues({
                type: "add",
                student_id: generateStudentID(),
              });
              openStudentState();
            }}
          >
            Add Student
          </Button>
        </div>
      }
    >
      <LoadingOverlay visible={loadingPage} />

      <CustomModal
        opened={studentState}
        onClose={closeStudentState}
        title="Manage Student"
      >
        <form
          onSubmit={studentForm.onSubmit(submitStudentEventHandler)}
          className="space-y-3"
        >
          <Group grow>
            <TextInput
              maxLength={10}
              onKeyPress={(event) => {
                if (!/^[a-zA-Z\s]*$/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              placeholder="Enter First Name"
              {...studentForm.getInputProps("firstname")}
              label="First Name"
              required
            />
            <TextInput
              maxLength={10}
              onKeyPress={(event) => {
                if (!/^[a-zA-Z\s]*$/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              placeholder="Enter Last Name"
              {...studentForm.getInputProps("lastname")}
              label="Last Name"
              required
            />
          </Group>
          <Group grow>
            <Select
              placeholder="Select Gender"
              {...DefaultSelectProps}
              {...studentForm.getInputProps("gender")}
              label="Gender"
              data={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
              ]}
            />
            <DateInput
              maxDate={new Date(new Date().getFullYear() - 5, 0, 0)}
              minDate={new Date(1900, 1, 1)}
              placeholder="Select Date of Birth"
              {...studentForm.getInputProps("birthday")}
              label="Date of Birth"
              required
            />
          </Group>
          <TextInput
            placeholder="Enter Address"
            {...studentForm.getInputProps("address")}
            label="Address (Optional)"
          />
          <TextInput
            maxLength={9}
            placeholder="Enter Student ID"
            {...studentForm.getInputProps("student_id")}
            label="Student ID"
            required
            rightSection={
              <Tooltip label="Generate Student ID">
                <ActionIcon
                  onClick={() =>
                    studentForm.setFieldValue("student_id", generateStudentID())
                  }
                >
                  <IconDice size={16} />
                </ActionIcon>
              </Tooltip>
            }
          />
          <Group grow>
            <TextInput
              placeholder="Enter Email Address"
              {...studentForm.getInputProps("email")}
              label="Email Address"
              type="email"
              required
            />
            <PasswordInput
              {...studentForm.getInputProps("password")}
              label="Password (Optional)"
              placeholder="Enter Password"
            />
          </Group>
          <div className="flex justify-between">
            <Text size="sm">
              Default Password: <span className="font-bold">12345678</span>
            </Text>
          </div>
          <div className="flex justify-end pt-1">
            <ButtonGroup>
              {studentForm.values.status ? (
                <Button
                  onClick={() => setStatus(studentForm.values.id || 0, false)}
                  color="red"
                >
                  Set to Inactive
                </Button>
              ) : (
                <Button
                  onClick={() => setStatus(studentForm.values.id || 0, true)}
                  color="green"
                >
                  Set to Active
                </Button>
              )}
              <Button type="submit" loading={loadingStudent}>
                {studentForm.values.type === "add"
                  ? "Add Student"
                  : "Update Student"}
              </Button>
            </ButtonGroup>
          </div>
        </form>
      </CustomModal>
      <div className="md:w-full w-[calc(100vw-25px)]">
        <CustomTable
          withNumbering
          columns={columns}
          rows={students}
          search={search}
          onEdit={(student) => {
            studentForm.setValues({
              ...student,
              birthday: new Date(student.birthday),
              type: "edit",
            });
            openStudentState();
          }}
          // onDelete={handleDeleteStudent}
        />
      </div>
    </PageContainer>
  );
}

export default Students;
