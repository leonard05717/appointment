import { Button, Checkbox, Container, Divider, Group, PasswordInput, Select, Text, TextInput } from "@mantine/core";
import { NavLink, useNavigate } from "react-router-dom";
import { DefaultSelectProps } from "../assets/styles";
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import supabase from "../supabase";
import { displayError, displaySuccess, generateStudentID } from "../helpers/methods";
import { useState } from "react";

interface RegistrationProps {
  firstname: string;
  lastname: string;
  gender: string;
  birthday: Date | null;
  email: string;
  student_id: string;
  address: string;
  password: string;
}

function Registration() {

  const navigate = useNavigate()
  const [isNewStudent, setIsNewStudent] = useState(false)
  const [loading, setLoading] = useState(false)

  const userForm = useForm<RegistrationProps>({
    mode: 'controlled',
    initialValues: {
      firstname: "",
      lastname: "",
      gender: "",
      birthday: null,
      email: "",
      student_id: "",
      address: "",
      password: ""
    },
    validate: {
      password(value) {
        if (value.length < 8) {
          return 'The password should be at least 8 characters long.'
        }
        return null;
      },
    }
  })

  async function submitUser(user: RegistrationProps) {

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password
    })

    if (error) {
      displayError('Something Error', error.message)
      setLoading(false)
      return;
    }

    await supabase.from('users').insert({
      firstname: user.firstname,
      lastname: user.lastname,
      gender: user.gender,
      address: user.address,
      birthday: user.birthday,
      student_id: isNewStudent ? generateStudentID() : user.student_id,
      auth_id: data.user?.id,
      role: 'student'
    })
    userForm.reset()
    displaySuccess('Success', 'Account Created Successfully!')
    navigate('/')
    setLoading(false)
  }

  return (
    <Container className="py-7" size='xs'>
      <div className="flex items-center justify-between">
        <Text ff="montserrat-bold" size="xl">Registration Form</Text>
        <NavLink className="text-sm hover:underline" to="/">Back to Home Page</NavLink>
      </div>
      <Divider my={20} />
      <form onSubmit={userForm.onSubmit(submitUser)} className="space-y-4">
        <Group grow justify="end">
          <TextInput maxLength={10} onKeyPress={(event) => {
            if (!/^[a-zA-Z\s]*$/.test(event.key)) {
              event.preventDefault();
            }
          }} required {...userForm.getInputProps('firstname')} label="First Name" placeholder="Enter First Name" />
          <TextInput maxLength={10} onKeyPress={(event) => {
            if (!/^[a-zA-Z\s]*$/.test(event.key)) {
              event.preventDefault();
            }
          }} required {...userForm.getInputProps('lastname')} label="Last Name" placeholder="Enter Last Name" />
        </Group>
        <Group grow justify="end">
          <Select
            {...DefaultSelectProps}
            {...userForm.getInputProps('gender')}
            label="Gender"
            placeholder="Select gender"
            data={[
              {
                label: 'Male',
                value: 'male'
              },
              {
                label: 'Female',
                value: 'female'
              }
            ]} />
          <DateInput defaultDate={new Date(2000, 1, 1)} maxDate={new Date(new Date().getFullYear() - 5, 0, 0)} minDate={new Date(1900, 1, 1)} required {...userForm.getInputProps('birthday')} label="Date of Birth" placeholder="Enter Date of Birth" />
        </Group>
        <Group grow justify="end">
          {!isNewStudent && (
            <TextInput maxLength={9} required {...userForm.getInputProps('student_id')} label="Student ID" placeholder="Enter Student ID" />
          )}
          <TextInput  {...userForm.getInputProps('address')} label="Address (Optional)" placeholder="Enter Address" />
        </Group>
        <Group grow align="start">
          <TextInput required {...userForm.getInputProps('email')} label="Email" placeholder="Enter Email" type="email" />
          <PasswordInput required {...userForm.getInputProps('password')} label="Password" placeholder="Enter Password" />
        </Group>
        <div className="flex items-start justify-between">
          <Checkbox checked={isNewStudent} onChange={(e) => setIsNewStudent(e.target.checked)} label="New Student" />
          <Button loading={loading} type="submit" mt={7}>Submit Registration</Button>
        </div>
      </form>
    </Container>
  );
}

export default Registration;