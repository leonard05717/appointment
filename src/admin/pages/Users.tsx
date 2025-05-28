import { useEffect, useState } from "react";
import CustomTable, { ColumnProps } from "../../components/CustomTable";
import PageContainer from "../../components/PageContainer";
import { UserProps } from "../../types";
import supabase from "../../supabase";
import {
  displayError,
  displaySuccess,
  LoadingClass,
} from "../../helpers/methods";
import {
  Button,
  ButtonGroup,
  Group,
  LoadingOverlay,
  PasswordInput,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import CustomModal from "../../components/CustomModal";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { DefaultSelectProps } from "../../assets/styles";

interface UserFormProps {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  status: boolean;
  type: "add" | "edit";
}

function Users() {
  const [userState, { open: openUserState, close: closeUserState }] =
    useDisclosure(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProps[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const columns: ColumnProps<UserProps>[] = [
    { label: "First Name", field: "firstname" },
    { label: "Last Name", field: "lastname" },
    { label: "Email Address", field: "email" },
    { label: "Role", field: "role" },
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

  const userForm = useForm<UserFormProps>({
    mode: "controlled",
    initialValues: {
      id: 0,
      firstname: "",
      lastname: "",
      password: "",
      type: "add",
      role: "",
      email: "",
      status: false,
    },
  });

  async function submitUserEventHandler(data: UserFormProps) {
    setLoadingUser(true);

    if (data.type === "add") {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password || "12345678",
      });

      if (authError) {
        displayError("Registration Error", authError.message);
        setLoadingUser(false);
        return;
      }

      const { error: userError } = await supabase.from("users").insert([
        {
          firstname: data.firstname,
          lastname: data.lastname,
          role: data.role,
          auth_id: authData.user?.id,
        },
      ]);

      if (userError) {
        displayError("Database Error", userError.message);
        setLoadingUser(false);
        return;
      }

      displaySuccess("Success", "Student registered successfully!");
      closeUserState();
    } else {
      const { error: er } = await supabase
        .from("users")
        .update({
          firstname: data.firstname,
          lastname: data.lastname,
          role: data.role,
        })
        .eq("id", data.id);
      if (er) {
        displayError("Something Error", er.message);
        setLoadingUser(false);
        return;
      }
      displaySuccess("Success", "Student updated successfully!");
      closeUserState();
    }

    setLoadingUser(false);
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
    userForm.setFieldValue("status", status);
  }

  useEffect(() => {
    async function fetchStudents() {
      setLoadingPage(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("role", "student");

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

        setUsers(mainData || []);
      }
      setLoadingPage(false);
    }

    fetchStudents();

    const subscribe = supabase
      .channel("realtime:users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const payLoad = payload.new as UserProps;
            const newUser: UserProps = {
              ...payLoad,
              email:
                (await supabase.auth.admin.listUsers()).data.users.find(
                  (v) => v.id === payLoad.auth_id
                )?.email || "",
            };
            setUsers((prev) => [...prev, newUser]);
          } else if (payload.eventType === "UPDATE") {
            setUsers((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as UserProps) : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setUsers((prev) =>
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
      title="Users"
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
              userForm.reset();
              openUserState();
            }}
          >
            Add User
          </Button>
        </div>
      }
    >
      <LoadingOverlay visible={loadingPage} />

      <CustomModal
        title={userForm.values.type === "add" ? "Add User" : "Edit User"}
        opened={userState}
        onClose={closeUserState}
      >
        <form
          onSubmit={userForm.onSubmit(submitUserEventHandler)}
          className="space-y-3"
        >
          <Group grow gap={10}>
            <TextInput
              maxLength={10}
              onKeyPress={(event) => {
                if (!/^[a-zA-Z\s]*$/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              placeholder="Enter First Name"
              {...userForm.getInputProps("firstname")}
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
              {...userForm.getInputProps("lastname")}
              label="Last Name"
              required
            />
          </Group>
          <Group grow gap={10}>
            <TextInput
              readOnly={userForm.values.type === "edit"}
              placeholder="Enter Email Address"
              {...userForm.getInputProps("email")}
              label="Email Address"
              type="email"
              required
            />
            <Select
              {...userForm.getInputProps("role")}
              {...DefaultSelectProps}
              placeholder="Select User Role"
              label="User Role"
              data={[
                {
                  label: "Admin",
                  value: "admin",
                },
                {
                  label: "Super Admin",
                  value: "superadmin",
                },
              ]}
            />
          </Group>
          <PasswordInput
            {...userForm.getInputProps("password")}
            label="Password (Optional)"
            placeholder="Enter Password"
          />
          <div className="flex justify-between">
            <Text size="sm">
              Default Password: <span className="font-bold">12345678</span>
            </Text>
          </div>
          <div className="flex justify-end pt-1">
            <ButtonGroup>
              {userForm.values.status ? (
                <Button
                  onClick={() => setStatus(userForm.values.id || 0, false)}
                  color="red"
                >
                  Set to Inactive
                </Button>
              ) : (
                <Button
                  onClick={() => setStatus(userForm.values.id || 0, true)}
                  color="green"
                >
                  Set to Active
                </Button>
              )}
              <Button type="submit" loading={loadingUser}>
                {userForm.values.type === "add" ? "Add User" : "Update User"}
              </Button>
            </ButtonGroup>
          </div>
        </form>
      </CustomModal>

      <div className="md:w-full w-[calc(100vw-25px)]">
        <CustomTable
          withNumbering
          columns={columns}
          rows={users}
          search={search}
          onEdit={(data) => {
            userForm.setValues({
              ...data,
              type: "edit",
            });
            openUserState();
          }}
          // onDelete={handleDeleteUser}
        />
      </div>
    </PageContainer>
  );
}

export default Users;
