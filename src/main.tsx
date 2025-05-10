import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import routers from './routers.tsx'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'

createRoot(document.getElementById('root')!).render(
  <MantineProvider>
    <ModalsProvider>
      <Notifications />
      <RouterProvider router={routers} />
    </ModalsProvider>
  </MantineProvider>,
)
