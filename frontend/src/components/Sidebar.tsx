import { MeetingRoom as GateIcon, Login as EntryIcon, Logout as ExitIcon } from '@mui/icons-material';

export const menuItems = [
  {
    title: 'Gate Management',
    path: '/gates',
    icon: <GateIcon />,
    group: 'Manajemen Perangkat'
  },
  {
    title: 'Entry Gate',
    path: '/entry-gate',
    icon: <EntryIcon />,
    group: 'Operasi Gerbang'
  },
  {
    title: 'Exit Gate',
    path: '/exit-gate',
    icon: <ExitIcon />,
    group: 'Operasi Gerbang'
  },
]; 