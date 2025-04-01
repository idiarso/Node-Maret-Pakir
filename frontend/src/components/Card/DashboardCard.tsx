import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Skeleton,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';

export interface DashboardCardAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface DashboardCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  actions?: DashboardCardAction[];
  showRefresh?: boolean;
  showFullscreen?: boolean;
  showDownload?: boolean;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onDownload?: () => void;
  headerAction?: React.ReactNode;
  footerContent?: React.ReactNode;
  children?: React.ReactNode;
  sx?: any;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  icon,
  loading = false,
  error = null,
  actions = [],
  showRefresh = false,
  showFullscreen = false,
  showDownload = false,
  onRefresh,
  onFullscreen,
  onDownload,
  headerAction,
  footerContent,
  children,
  sx = {},
}) => {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const defaultActions: DashboardCardAction[] = [
    ...(showRefresh ? [{
      icon: <RefreshIcon />,
      label: 'Refresh',
      onClick: () => {
        handleCloseMenu();
        onRefresh?.();
      },
    }] : []),
    ...(showFullscreen ? [{
      icon: <FullscreenIcon />,
      label: 'Fullscreen',
      onClick: () => {
        handleCloseMenu();
        onFullscreen?.();
      },
    }] : []),
    ...(showDownload ? [{
      icon: <DownloadIcon />,
      label: 'Download',
      onClick: () => {
        handleCloseMenu();
        onDownload?.();
      },
    }] : []),
    ...actions,
  ];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
      <CardHeader
        title={
          loading ? (
            <Skeleton width="60%" />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {icon}
              <Typography variant="h6" component="div">
                {title}
              </Typography>
            </Box>
          )
        }
        subheader={
          loading ? (
            <Skeleton width="40%" />
          ) : subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null
        }
        action={
          loading ? (
            <Skeleton width={32} height={32} variant="circular" />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {headerAction}
              {defaultActions.length > 0 && (
                <Tooltip title="Menu">
                  <IconButton
                    size="small"
                    onClick={handleOpenMenu}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
      />

      {(loading || error || children) && (
        <>
          <Divider />
          <CardContent sx={{ flexGrow: 1 }}>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant="rectangular" width="100%" height={118} />
                <Skeleton width="80%" />
                <Skeleton width="60%" />
              </Box>
            ) : error ? (
              <Typography color="error">
                {error}
              </Typography>
            ) : (
              children
            )}
          </CardContent>
        </>
      )}

      {footerContent && (
        <>
          <Divider />
          <CardActions>
            {footerContent}
          </CardActions>
        </>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        {defaultActions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={action.onClick}
          >
            <ListItemIcon>
              {action.icon}
            </ListItemIcon>
            <ListItemText>
              {action.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
}; 