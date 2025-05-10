// src/pages/ForgotPassword.tsx

import { useState } from 'react';
import { Button, Title, Text, Container, Paper, Group, Notification, PasswordInput } from '@mantine/core';
import supabase from '../supabase';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResetPassword = async () => {
    setLoading(true);
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    const { data: _, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccess(true);
      await supabase.auth.signOut()
      setTimeout(() => navigate('/'), 3000); // redirect after 3 seconds
    }

    setLoading(false);
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="md">
        Reset your password
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="xl">
        Enter your new password below
      </Text>

      {success && (
        <Notification withCloseButton={false} icon={<IconCheck size={18} />} color="teal" title="Success" mb="md">
          Password updated! Redirecting to login page...
        </Notification>
      )}

      {errorMessage && (
        <Notification withCloseButton={false} icon={<IconX size={18} />} color="red" title="Error" mb="md">
          {errorMessage}
        </Notification>
      )}

      <Paper withBorder shadow="md" p={30} radius="md">
        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          mb="md"
        />
        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          mb="md"
        />

        <Group grow mt="md">
          <Button fullWidth loading={loading || success} onClick={handleResetPassword}>
            Update Password
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default ForgotPassword;
