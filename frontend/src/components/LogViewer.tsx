import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Tooltip,
  Stack,
  Badge
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Send as SendIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';
import logger, { LogEntry, LogLevel } from '../utils/logger';

interface FilterOptions {
  level: LogLevel | 'ALL';
  context: string;
  searchTerm: string;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<FilterOptions>({
    level: 'ALL',
    context: '',
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [contexts, setContexts] = useState<string[]>([]);

  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = () => {
    const allLogs = logger.getLogs();
    setLogs(allLogs);
    
    // Extract unique contexts
    const uniqueContexts = Array.from(new Set(
      allLogs
        .map(log => log.context)
        .filter(context => !!context) as string[]
    ));
    setContexts(uniqueContexts);
  };

  const handleFilterChange = (name: keyof FilterOptions, value: any) => {
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    setClearDialogOpen(false);
  };

  const handleExportLogs = () => {
    const json = logger.exportLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendToServer = async () => {
    try {
      await logger.sendLogsToServer();
      alert('Logs sent to server successfully');
    } catch (error) {
      console.error('Failed to send logs to server:', error);
      alert('Failed to send logs to server');
    }
  };

  const handleRowClick = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const filteredLogs = logs.filter(log => {
    const levelMatch = filter.level === 'ALL' || log.level === filter.level;
    const contextMatch = !filter.context || log.context === filter.context;
    const searchMatch = !filter.searchTerm || 
      log.message.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      (log.context && log.context.toLowerCase().includes(filter.searchTerm.toLowerCase()));
    
    return levelMatch && contextMatch && searchMatch;
  });

  const getLevelChip = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return <Chip icon={<DebugIcon />} label="DEBUG" size="small" color="default" />;
      case LogLevel.INFO:
        return <Chip icon={<InfoIcon />} label="INFO" size="small" color="info" />;
      case LogLevel.WARN:
        return <Chip icon={<WarningIcon />} label="WARN" size="small" color="warning" />;
      case LogLevel.ERROR:
        return <Chip icon={<ErrorIcon />} label="ERROR" size="small" color="error" />;
      default:
        return <Chip label={level} size="small" />;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getLogCounts = () => {
    return {
      all: logs.length,
      debug: logs.filter(log => log.level === LogLevel.DEBUG).length,
      info: logs.filter(log => log.level === LogLevel.INFO).length,
      warn: logs.filter(log => log.level === LogLevel.WARN).length,
      error: logs.filter(log => log.level === LogLevel.ERROR).length
    };
  };

  const counts = getLogCounts();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Application Logs
        </Typography>
        <Stack direction="row" spacing={1}>
          <Badge badgeContent={counts.all} color="info" showZero>
            <Button
              startIcon={<RefreshIcon />}
              variant="outlined"
              onClick={refreshLogs}
            >
              Refresh
            </Button>
          </Badge>
          <Button
            startIcon={<FilterIcon />}
            variant={showFilters ? "contained" : "outlined"}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button
            startIcon={<SaveIcon />}
            variant="outlined"
            onClick={handleExportLogs}
          >
            Export
          </Button>
          <Button
            startIcon={<SendIcon />}
            variant="outlined"
            onClick={handleSendToServer}
          >
            Send
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            variant="outlined"
            color="error"
            onClick={() => setClearDialogOpen(true)}
          >
            Clear
          </Button>
        </Stack>
      </Box>

      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Level</InputLabel>
              <Select
                value={filter.level}
                label="Level"
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <MenuItem value="ALL">All Levels</MenuItem>
                <MenuItem value={LogLevel.DEBUG}>Debug</MenuItem>
                <MenuItem value={LogLevel.INFO}>Info</MenuItem>
                <MenuItem value={LogLevel.WARN}>Warning</MenuItem>
                <MenuItem value={LogLevel.ERROR}>Error</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Context</InputLabel>
              <Select
                value={filter.context}
                label="Context"
                onChange={(e) => handleFilterChange('context', e.target.value)}
              >
                <MenuItem value="">All Contexts</MenuItem>
                {contexts.map(context => (
                  <MenuItem key={context} value={context}>{context}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Search"
              size="small"
              value={filter.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              sx={{ flexGrow: 1 }}
            />
          </Stack>
        </Paper>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Tooltip title="All logs">
          <Badge badgeContent={counts.all} color="info" showZero>
            <Chip label="All" onClick={() => handleFilterChange('level', 'ALL')} variant={filter.level === 'ALL' ? 'filled' : 'outlined'} />
          </Badge>
        </Tooltip>
        <Tooltip title="Debug logs">
          <Badge badgeContent={counts.debug} color="default" showZero>
            <Chip icon={<DebugIcon />} label="Debug" onClick={() => handleFilterChange('level', LogLevel.DEBUG)} variant={filter.level === LogLevel.DEBUG ? 'filled' : 'outlined'} />
          </Badge>
        </Tooltip>
        <Tooltip title="Info logs">
          <Badge badgeContent={counts.info} color="info" showZero>
            <Chip icon={<InfoIcon />} label="Info" onClick={() => handleFilterChange('level', LogLevel.INFO)} variant={filter.level === LogLevel.INFO ? 'filled' : 'outlined'} />
          </Badge>
        </Tooltip>
        <Tooltip title="Warning logs">
          <Badge badgeContent={counts.warn} color="warning" showZero>
            <Chip icon={<WarningIcon />} label="Warning" onClick={() => handleFilterChange('level', LogLevel.WARN)} variant={filter.level === LogLevel.WARN ? 'filled' : 'outlined'} />
          </Badge>
        </Tooltip>
        <Tooltip title="Error logs">
          <Badge badgeContent={counts.error} color="error" showZero>
            <Chip icon={<ErrorIcon />} label="Error" onClick={() => handleFilterChange('level', LogLevel.ERROR)} variant={filter.level === LogLevel.ERROR ? 'filled' : 'outlined'} />
          </Badge>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Context</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No logs to display
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => (
                <TableRow 
                  key={index} 
                  hover 
                  onClick={() => handleRowClick(log)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>{getLevelChip(log.level)}</TableCell>
                  <TableCell>{log.context || '-'}</TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ maxWidth: 400 }}>
                      {log.message}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Showing {filteredLogs.length} of {logs.length} logs
      </Typography>

      {/* Log Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Log Details
          {selectedLog && getLevelChip(selectedLog.level)}
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Timestamp</Typography>
              <Typography variant="body2" gutterBottom>
                {formatDate(selectedLog.timestamp)}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>Context</Typography>
              <Typography variant="body2" gutterBottom>
                {selectedLog.context || '-'}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>Message</Typography>
              <Typography variant="body2" gutterBottom>
                {selectedLog.message}
              </Typography>

              {selectedLog.data && (
                <>
                  <Typography variant="subtitle2" gutterBottom>Data</Typography>
                  <Paper sx={{ p: 1, bgcolor: 'grey.100', maxHeight: 200, overflow: 'auto' }}>
                    <pre>{JSON.stringify(selectedLog.data, null, 2)}</pre>
                  </Paper>
                </>
              )}

              {selectedLog.error && (
                <>
                  <Typography variant="subtitle2" gutterBottom>Error</Typography>
                  <Paper sx={{ p: 1, bgcolor: 'error.50', maxHeight: 200, overflow: 'auto' }}>
                    <pre>{JSON.stringify(selectedLog.error, null, 2)}</pre>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
      >
        <DialogTitle>Clear Logs</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all logs? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearLogs} color="error">Clear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogViewer; 