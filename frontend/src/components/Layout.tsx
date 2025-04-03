import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  EventNote as TicketsIcon,
  Receipt as PaymentsIcon,
  LocalParking as ParkingAreaIcon,
  AttachMoney as ParkingRatesIcon,
  CardMembership as MembershipIcon,
  People as UsersIcon,
  DevicesOther as DevicesIcon,
  ViewModule as GatesIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Language as LanguageIcon,
  Backup as BackupIcon,
  Business as BusinessIcon,
  ExpandLess,
  ExpandMore,
  WorkHistory as ShiftsIcon,
  Login as EntryIcon,
  Logout as ExitIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { ROUTES } from '../utils/constants';
import * as storage from '../utils/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';

const drawerWidth = 240;

interface MenuItem {
  label: string;
  translationKey: string;
  icon: JSX.Element;
  path: string;
  subItems?: MenuItem[];
}

interface MenuCategory {
  title: string;
  translationKey: string;
  items: MenuItem[];
}

interface LayoutProps {
  children?: React.ReactNode;
}

// Define menu categories based on role
const getMenuCategories = (role: string): MenuCategory[] => {
  const baseCategories: MenuCategory[] = [
    {
      title: 'Main',
      translationKey: 'main',
      items: [
        { label: 'Dashboard', translationKey: 'dashboard', icon: <DashboardIcon />, path: ROUTES.DASHBOARD },
      ]
    },
    {
      title: 'Gate Operations',
      translationKey: 'gateOperations',
      items: [
        { label: 'Entry Gate', translationKey: 'entryGate', icon: <EntryIcon />, path: ROUTES.ENTRY_GATE },
        { label: 'Exit Gate', translationKey: 'exitGate', icon: <ExitIcon />, path: ROUTES.EXIT_GATE },
      ]
    }
  ];

  // Menu items for operator role
  if (role === 'operator') {
    return [
      ...baseCategories,
      {
        title: 'Parking Management',
        translationKey: 'parkingManagement',
        items: [
          { label: 'Parking Sessions', translationKey: 'parkingSessions', icon: <CarIcon />, path: ROUTES.PARKING_SESSIONS },
          { label: 'Tickets', translationKey: 'tickets', icon: <TicketsIcon />, path: ROUTES.TICKETS },
        ]
      }
    ];
  }

  // Menu items for admin role
  return [
    ...baseCategories,
    {
      title: 'Parking Management',
      translationKey: 'parkingManagement',
      items: [
        { label: 'Parking Sessions', translationKey: 'parkingSessions', icon: <CarIcon />, path: ROUTES.PARKING_SESSIONS },
        { label: 'Tickets', translationKey: 'tickets', icon: <TicketsIcon />, path: ROUTES.TICKETS },
        { label: 'Parking Areas', translationKey: 'parkingAreas', icon: <ParkingAreaIcon />, path: ROUTES.PARKING_AREAS },
        { label: 'Parking Rates', translationKey: 'parkingRates', icon: <ParkingRatesIcon />, path: ROUTES.PARKING_RATES },
      ]
    },
    {
      title: 'Customer Management',
      translationKey: 'customerManagement',
      items: [
        { label: 'Vehicles', translationKey: 'vehicles', icon: <CarIcon />, path: ROUTES.VEHICLES },
        { label: 'Memberships', translationKey: 'memberships', icon: <MembershipIcon />, path: ROUTES.MEMBERSHIPS },
        { label: 'Payments', translationKey: 'payments', icon: <PaymentsIcon />, path: ROUTES.PAYMENTS },
      ]
    },
    {
      title: 'System',
      translationKey: 'system',
      items: [
        { label: 'Users', translationKey: 'users', icon: <UsersIcon />, path: ROUTES.USERS },
        { label: 'Devices', translationKey: 'devices', icon: <DevicesIcon />, path: ROUTES.DEVICES },
        { label: 'Gates', translationKey: 'gates', icon: <GatesIcon />, path: ROUTES.GATES },
        { label: 'Shifts', translationKey: 'shifts', icon: <ShiftsIcon />, path: ROUTES.SHIFTS },
        { label: 'Reports', translationKey: 'reports', icon: <ReportIcon />, path: ROUTES.REPORTS },
        { 
          label: 'Settings', 
          translationKey: 'settings',
          icon: <SettingsIcon />, 
          path: ROUTES.SETTINGS,
          subItems: [
            { label: 'Language', translationKey: 'language', icon: <LanguageIcon />, path: ROUTES.SETTINGS_LANGUAGE },
            { label: 'Backup', translationKey: 'backup', icon: <BackupIcon />, path: ROUTES.SETTINGS_BACKUP },
            { label: 'System', translationKey: 'systemSettings', icon: <BusinessIcon />, path: ROUTES.SETTINGS_SYSTEM },
          ]
        },
        { label: 'Manual Book', translationKey: 'manualBook', icon: <HelpIcon />, path: ROUTES.MANUAL_BOOK },
      ]
    }
  ];
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openSettings, setOpenSettings] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { translate } = useLanguage();
  const { user, logout } = useAuth();

  const menuCategories = React.useMemo(() => getMenuCategories(user?.role || ''), [user?.role]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSettingsClick = () => {
    setOpenSettings(!openSettings);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Parking System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuCategories.map((category) => (
          <React.Fragment key={category.title}>
            <Typography
              variant="subtitle2"
              sx={{ px: 3, py: 1, color: 'text.secondary' }}
            >
              {translate(category.translationKey)}
            </Typography>
            {category.items.map((item) => {
              const isSettingsItem = item.label === 'Settings';
              const isSelected = isSettingsItem 
                ? location.pathname.startsWith(item.path)
                : location.pathname === item.path;

              return (
                <React.Fragment key={item.label}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => {
                      if (isSettingsItem) {
                        handleSettingsClick();
                      } else {
                        navigate(item.path);
                        if (isMobile) {
                          handleDrawerToggle();
                        }
                      }
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={translate(item.translationKey)} />
                    {isSettingsItem && (
                      openSettings ? <ExpandLess /> : <ExpandMore />
                    )}
                  </ListItemButton>
                  {isSettingsItem && item.subItems && (
                    <Collapse in={openSettings} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.subItems.map((subItem) => (
                          <ListItemButton
                            key={subItem.label}
                            sx={{ pl: 4 }}
                            selected={location.pathname === subItem.path}
                            onClick={() => {
                              navigate(subItem.path);
                              if (isMobile) {
                                handleDrawerToggle();
                              }
                            }}
                          >
                            <ListItemIcon>{subItem.icon}</ListItemIcon>
                            <ListItemText primary={translate(subItem.translationKey)} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
        <Divider sx={{ my: 1 }} />
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={translate('logout')} />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {user?.username} - {user?.role}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 