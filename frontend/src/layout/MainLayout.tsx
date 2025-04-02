import LogsIcon from '@mui/icons-material/InsertDriveFile';
import LogViewer from '../components/LogViewer';

const menuItems = [
  //... menu items lainnya
  {
    icon: <LogsIcon />,
    label: 'Log Monitor',
    path: '/logs',
    component: <LogViewer />
  },
]; 