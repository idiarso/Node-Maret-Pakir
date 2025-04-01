import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Avatar,
  Box,
  IconButton,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Settings as SystemIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { NotificationType } from '../../types';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'ERROR':
      return <ErrorIcon color="error" />;
    case 'SYSTEM':
      return <SystemIcon color="primary" />;
    case 'WARNING':
      return <WarningIcon color="warning" />;
    case 'INFO':
    default:
      return <InfoIcon color="info" />;
  }
};

export const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: '1',
      type: 'WARNING',
      title: 'Kapasitas Parkir',
      message: 'Area parkir A hampir penuh (90% terisi)',
      createdAt: new Date(),
      read: false,
    },
    {
      id: '2',
      type: 'ERROR',
      title: 'Kegagalan Perangkat',
      message: 'Gate B1 tidak merespon',
      createdAt: new Date(Date.now() - 3600000),
      read: false,
    },
    {
      id: '3',
      type: 'SYSTEM',
      title: 'Backup Berhasil',
      message: 'Backup data harian telah selesai',
      createdAt: new Date(Date.now() - 7200000),
      read: true,
    },
    {
      id: '4',
      type: 'INFO',
      title: 'Pembaruan Sistem',
      message: 'Pembaruan sistem akan dilakukan malam ini',
      createdAt: new Date(Date.now() - 86400000),
      read: true,
    },
  ]);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    ));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          Notifikasi
        </Typography>
        <Button
          size="small"
          onClick={handleClearAll}
          disabled={notifications.length === 0}
        >
          Hapus Semua
        </Button>
      </Box>
      <Divider />
      {notifications.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            Tidak ada notifikasi
          </Typography>
        </Box>
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  !notification.read && (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <ClearIcon />
                    </IconButton>
                  )
                }
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'background.paper' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                          locale: id,
                        })}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
}; 