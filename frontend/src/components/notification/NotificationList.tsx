import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Dummy notifications for now
const notifications = [
  {
    id: 1,
    type: 'error',
    message: 'Gate 1 is not responding',
    time: '5 minutes ago'
  },
  {
    id: 2,
    type: 'warning',
    message: 'Parking area A is almost full',
    time: '10 minutes ago'
  },
  {
    id: 3,
    type: 'info',
    message: 'New member registration',
    time: '30 minutes ago'
  },
  {
    id: 4,
    type: 'info',
    message: 'System backup completed',
    time: '1 hour ago'
  }
];

const getIcon = (type: string) => {
  switch (type) {
    case 'error':
      return <ErrorIcon color="error" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'info':
      return <InfoIcon color="info" />;
    default:
      return <NotificationsIcon />;
  }
};

export const NotificationList: React.FC = () => {
  return (
    <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <ListItem>
        <ListItemText
          primary={
            <Typography variant="h6">
              Notifications
            </Typography>
          }
        />
      </ListItem>
      <Divider />
      {notifications.length === 0 ? (
        <ListItem>
          <ListItemText
            primary="No notifications"
            secondary="You're all caught up!"
          />
        </ListItem>
      ) : (
        notifications.map((notification) => (
          <React.Fragment key={notification.id}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                {getIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={notification.message}
                secondary={
                  <Typography
                    sx={{ display: 'inline' }}
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {notification.time}
                  </Typography>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))
      )}
      {notifications.length > 0 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography
            component="a"
            variant="body2"
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            View all notifications
          </Typography>
        </Box>
      )}
    </List>
  );
}; 