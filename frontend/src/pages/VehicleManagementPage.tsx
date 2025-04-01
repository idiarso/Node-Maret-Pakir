import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  TablePagination,
  FormHelperText,
  Checkbox,
  TableSortLabel,
  Fade,
  Zoom,
  Menu,
  ListItemIcon,
  ListItemText,
  Popover,
  FormControlLabel,
  Switch,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  ViewColumn as ViewColumnIcon,
  Sort as SortIcon,
  DragIndicator as DragIndicatorIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { VehicleFormData, vehicleValidationSchema, Vehicle } from '../types/vehicle';
import { useFormik } from 'formik';
import { UseQueryOptions } from '@tanstack/react-query';
import { visuallyHidden } from '@mui/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

type Order = 'asc' | 'desc';

type SortConfig = {
  id: keyof Vehicle;
  direction: Order;
};

interface HeadCell {
  id: keyof Vehicle;
  label: string;
  numeric: boolean;
  sortable: boolean;
  defaultVisible: boolean;
}

const headCells: HeadCell[] = [
  { id: 'plateNumber', label: 'Plat Nomor', numeric: false, sortable: true, defaultVisible: true },
  { id: 'type', label: 'Jenis', numeric: false, sortable: true, defaultVisible: true },
  { id: 'owner', label: 'Pemilik', numeric: false, sortable: true, defaultVisible: true },
  { id: 'contact', label: 'Kontak', numeric: false, sortable: true, defaultVisible: true },
  { id: 'registrationDate', label: 'Tanggal Registrasi', numeric: false, sortable: true, defaultVisible: true },
  { id: 'status', label: 'Status', numeric: false, sortable: true, defaultVisible: true },
];

const VehicleManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Vehicle>('plateNumber');
  const [selected, setSelected] = useState<number[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Vehicle>>(
    new Set(headCells.filter(cell => cell.defaultVisible).map(cell => cell.id))
  );
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [batchMenuAnchor, setBatchMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ id: 'plateNumber', direction: 'asc' }]);

  const formik = useFormik<VehicleFormData>({
    initialValues: {
      plateNumber: '',
      type: '',
      owner: '',
      contact: '',
      status: 'active',
    },
    validationSchema: vehicleValidationSchema,
    onSubmit: (values) => {
      if (selectedVehicle) {
        updateMutation.mutate({ id: selectedVehicle.id, ...values });
      } else {
        const now = new Date().toISOString();
        createMutation.mutate({ ...values, registrationDate: now });
      }
    },
    validateOnMount: true,
  });

  const { data: vehicles = [], isLoading, isError, error: queryError } = useQuery<Vehicle[], Error>({
    queryKey: ['vehicles'],
    queryFn: vehicleService.getVehicles,
  });

  // Handle query error
  React.useEffect(() => {
    if (queryError) {
      setError(`Gagal memuat data kendaraan: ${queryError.message}`);
    }
  }, [queryError]);

  const createMutation = useMutation({
    mutationFn: vehicleService.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      handleCloseDialog();
      setSuccess('Kendaraan berhasil ditambahkan');
      setError(null);
    },
    onError: (err: Error) => {
      setError(`Gagal menambahkan kendaraan: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: vehicleService.updateVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      handleCloseDialog();
      setSuccess('Kendaraan berhasil diperbarui');
      setError(null);
    },
    onError: (err: Error) => {
      setError(`Gagal memperbarui kendaraan: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: vehicleService.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setConfirmDelete(null);
      setSuccess('Kendaraan berhasil dihapus');
      setError(null);
    },
    onError: (err: Error) => {
      setError(`Gagal menghapus kendaraan: ${err.message}`);
    },
  });

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      formik.setValues({
        plateNumber: vehicle.plateNumber,
        type: vehicle.type,
        owner: vehicle.owner,
        contact: vehicle.contact,
        status: vehicle.status,
      });
    } else {
      setSelectedVehicle(null);
      formik.resetForm({
        values: {
          plateNumber: '',
          type: '',
          owner: '',
          contact: '',
          status: 'active',
        }
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setOpenDialog(false);
      setSelectedVehicle(null);
      formik.resetForm();
    }
  };

  const handleDelete = (id: number) => {
    const vehicleToDelete = vehicles.find(v => v.id === id);
    if (vehicleToDelete) {
      setConfirmDelete(id);
    }
  };

  const handleBatchDelete = () => {
    setConfirmDelete(-1); // Use -1 to indicate batch delete
  };

  const confirmDeleteVehicle = () => {
    if (confirmDelete === -1) {
      // Batch delete
      Promise.all(selected.map(id => deleteMutation.mutateAsync(id)))
        .then(() => {
          setSuccess('Kendaraan berhasil dihapus');
          setSelected([]);
          setConfirmDelete(null);
        })
        .catch((error) => {
          setError(`Gagal menghapus kendaraan: ${error.message}`);
        });
    } else if (confirmDelete) {
      // Single delete
      deleteMutation.mutate(confirmDelete);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: keyof Vehicle, event: React.MouseEvent) => {
    setSortConfigs(prevConfigs => {
      const configIndex = prevConfigs.findIndex(config => config.id === property);
      
      if (configIndex === -1) {
        // Add new sort config if Shift key is pressed, otherwise replace all
        return event.shiftKey 
          ? [...prevConfigs, { id: property, direction: 'asc' }]
          : [{ id: property, direction: 'asc' }];
      }

      const newConfigs = [...prevConfigs];
      if (newConfigs[configIndex].direction === 'asc') {
        newConfigs[configIndex].direction = 'desc';
      } else {
        newConfigs.splice(configIndex, 1);
      }
      return newConfigs;
    });
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedVehicles.map((v) => v.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  // Reset error/success messages when component unmounts
  React.useEffect(() => {
    return () => {
      setError(null);
      setSuccess(null);
    };
  }, []);

  // Reset page when filter changes
  React.useEffect(() => {
    setPage(0);
  }, [vehicles.length]);

  // Sort function
  const descendingComparator = <T extends Vehicle>(a: T, b: T, orderBy: keyof T) => {
    if (orderBy === 'registrationDate') {
      return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
    }
    if (orderBy === 'status') {
      const statusOrder = { active: 1, blocked: 0 };
      return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
    }
    const aValue = String(a[orderBy]).toLowerCase();
    const bValue = String(b[orderBy]).toLowerCase();
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  };

  const getComparator = (order: Order, orderBy: keyof Vehicle) => {
    return order === 'desc'
      ? (a: Vehicle, b: Vehicle) => descendingComparator(a, b, orderBy)
      : (a: Vehicle, b: Vehicle) => -descendingComparator(a, b, orderBy);
  };

  // Apply sorting and pagination
  const sortedVehicles = React.useMemo(() => {
    return [...vehicles].sort(getComparator(order, orderBy));
  }, [vehicles, order, orderBy]);

  const paginatedVehicles = React.useMemo(() => {
    const sorted = [...vehicles].sort(multiSortComparator);
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [vehicles, sortConfigs, page, rowsPerPage]);

  // Reset selection when page changes
  React.useEffect(() => {
    setSelected([]);
  }, [page, rowsPerPage]);

  const activeVehicles = vehicles.filter((v: Vehicle) => v.status === 'active');
  const blockedVehicles = vehicles.filter((v: Vehicle) => v.status === 'blocked');

  // Add isSelected function
  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  // Batch operations
  const handleBatchStatusChange = (newStatus: 'active' | 'blocked') => {
    Promise.all(
      selected.map(selectedId => {
        const vehicle = vehicles.find(v => v.id === selectedId);
        if (!vehicle) return Promise.reject(new Error('Vehicle not found'));
        
        return updateMutation.mutateAsync({
          ...vehicle,
          status: newStatus
        });
      })
    )
    .then(() => {
      setSuccess(`Status kendaraan berhasil diubah menjadi ${newStatus === 'active' ? 'aktif' : 'diblokir'}`);
      setSelected([]);
      setBatchMenuAnchor(null);
    })
    .catch((error) => {
      setError(`Gagal mengubah status kendaraan: ${error.message}`);
    });
  };

  const handleColumnVisibilityChange = (columnId: keyof Vehicle) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  // Enhanced comparator for multi-column sort
  const multiSortComparator = (a: Vehicle, b: Vehicle): number => {
    for (const config of sortConfigs) {
      const result = (() => {
        if (config.id === 'registrationDate') {
          return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
        }
        if (config.id === 'status') {
          const statusOrder = { active: 1, blocked: 0 };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        }
        const aValue = String(a[config.id]).toLowerCase();
        const bValue = String(b[config.id]).toLowerCase();
        return aValue.localeCompare(bValue);
      })();
      
      if (result !== 0) {
        return config.direction === 'asc' ? result : -result;
      }
    }
    return 0;
  };

  // Export to Excel
  const handleExportExcel = () => {
    const selectedVehicles = vehicles.filter(v => selected.includes(v.id));
    const data = selectedVehicles.map(vehicle => ({
      'Plat Nomor': vehicle.plateNumber,
      'Jenis': vehicle.type,
      'Pemilik': vehicle.owner,
      'Kontak': vehicle.contact,
      'Tanggal Registrasi': format(new Date(vehicle.registrationDate), 'dd/MM/yyyy', { locale: id }),
      'Status': vehicle.status === 'active' ? 'Aktif' : 'Diblokir'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicles');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `vehicles_export_${format(new Date(), 'dd_MM_yyyy', { locale: id })}.xlsx`;
    saveAs(dataBlob, fileName);
    setBatchMenuAnchor(null);
  };

  if (isError) {
    return (
      <Box p={3}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => queryClient.invalidateQueries({ queryKey: ['vehicles'] })}>
              Coba Lagi
            </Button>
          }
        >
          Gagal memuat data kendaraan. Silakan coba lagi.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccess(null)} 
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => !deleteMutation.isPending && setConfirmDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>
              Apakah Anda yakin ingin menghapus kendaraan ini? Tindakan ini tidak dapat dibatalkan.
            </Typography>
            {deleteMutation.isError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                Gagal menghapus kendaraan: {deleteMutation.error?.message}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setConfirmDelete(null)}
            disabled={deleteMutation.isPending}
          >
            Batal
          </Button>
          <Button
            onClick={confirmDeleteVehicle}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Manajemen Kendaraan</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Zoom in={selected.length > 0}>
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => setBatchMenuAnchor(e.currentTarget)}
              startIcon={<SortIcon />}
            >
              Aksi Batch ({selected.length})
            </Button>
          </Zoom>
          <Button
            variant="outlined"
            startIcon={<ViewColumnIcon />}
            onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
          >
            Kolom
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={isLoading}
          >
            Tambah Kendaraan
          </Button>
        </Box>
      </Box>

      {/* Enhanced Batch Actions Menu */}
      <Menu
        anchorEl={batchMenuAnchor}
        open={Boolean(batchMenuAnchor)}
        onClose={() => setBatchMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleBatchStatusChange('active')}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Aktifkan Semua</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBatchStatusChange('blocked')}>
          <ListItemIcon>
            <BlockIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Blokir Semua</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportExcel}>
          <ListItemIcon>
            <FileDownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export ke Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleBatchDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Hapus Semua</ListItemText>
        </MenuItem>
      </Menu>

      {/* Column Visibility Menu */}
      <Popover
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>Tampilkan Kolom</Typography>
          {headCells.map((headCell) => (
            <FormControlLabel
              key={headCell.id}
              control={
                <Switch
                  size="small"
                  checked={visibleColumns.has(headCell.id)}
                  onChange={() => handleColumnVisibilityChange(headCell.id)}
                  disabled={headCell.id === 'plateNumber'}
                />
              }
              label={headCell.label}
            />
          ))}
        </Box>
      </Popover>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Summary Cards */}
        <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: 280 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Kendaraan
              </Typography>
              <Typography variant="h4">
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  vehicles.length
                )}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: 280 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kendaraan Aktif
              </Typography>
              <Typography variant="h4" color="success.main">
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  activeVehicles.length
                )}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: 280 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kendaraan Diblokir
              </Typography>
              <Typography variant="h4" color="error.main">
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  blockedVehicles.length
                )}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Vehicle Table */}
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          indeterminate={selected.length > 0 && selected.length < paginatedVehicles.length}
                          checked={paginatedVehicles.length > 0 && selected.length === paginatedVehicles.length}
                          onChange={handleSelectAllClick}
                        />
                      </TableCell>
                      {headCells.map((headCell) => (
                        visibleColumns.has(headCell.id) && (
                          <TableCell
                            key={headCell.id}
                            sortDirection={sortConfigs.find(c => c.id === headCell.id)?.direction || false}
                            sx={{ fontWeight: 'bold', backgroundColor: (theme) => theme.palette.grey[50] }}
                          >
                            {headCell.sortable ? (
                              <TableSortLabel
                                active={sortConfigs.some(c => c.id === headCell.id)}
                                direction={sortConfigs.find(c => c.id === headCell.id)?.direction || 'asc'}
                                onClick={(event) => handleRequestSort(headCell.id, event)}
                              >
                                {headCell.label}
                                {sortConfigs.some(c => c.id === headCell.id) && (
                                  <Box component="span" sx={visuallyHidden}>
                                    {sortConfigs.find(c => c.id === headCell.id)?.direction === 'desc' 
                                      ? 'sorted descending' 
                                      : 'sorted ascending'
                                    }
                                  </Box>
                                )}
                              </TableSortLabel>
                            ) : (
                              headCell.label
                            )}
                          </TableCell>
                        )
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: (theme) => theme.palette.grey[50] }}>
                        Aksi
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress />
                            <Typography color="text.secondary">Memuat data kendaraan...</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : paginatedVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Typography color="text.secondary">Tidak ada data kendaraan</Typography>
                            <Button
                              variant="outlined"
                              startIcon={<AddIcon />}
                              onClick={() => handleOpenDialog()}
                            >
                              Tambah Kendaraan
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedVehicles.map((vehicle) => {
                        const isItemSelected = isSelected(vehicle.id);
                        return (
                          <Fade in key={vehicle.id}>
                            <TableRow 
                              hover
                              onClick={() => handleClick(vehicle.id)}
                              role="checkbox"
                              aria-checked={isItemSelected}
                              tabIndex={-1}
                              selected={isItemSelected}
                              sx={{
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: (theme) => theme.palette.action.hover,
                                },
                                '&.Mui-selected': {
                                  backgroundColor: (theme) => theme.palette.action.selected,
                                  '&:hover': {
                                    backgroundColor: (theme) => theme.palette.action.selected,
                                  },
                                },
                                '& td': {
                                  borderBottom: '1px solid',
                                  borderColor: (theme) => theme.palette.divider,
                                }
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  color="primary"
                                  checked={isItemSelected}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => handleClick(vehicle.id)}
                                />
                              </TableCell>
                              {headCells.map((headCell) => (
                                visibleColumns.has(headCell.id) && (
                                  <TableCell key={headCell.id}>
                                    {headCell.id === 'status' ? (
                                      <Chip
                                        icon={vehicle.status === 'active' ? <CheckCircleIcon /> : <BlockIcon />}
                                        label={vehicle.status === 'active' ? 'Aktif' : 'Diblokir'}
                                        color={vehicle.status === 'active' ? 'success' : 'error'}
                                        size="small"
                                        sx={{
                                          '& .MuiChip-icon': {
                                            fontSize: 16,
                                          }
                                        }}
                                      />
                                    ) : headCell.id === 'registrationDate' ? (
                                      format(new Date(vehicle.registrationDate), 'dd/MM/yyyy', {
                                        locale: id,
                                      })
                                    ) : (
                                      vehicle[headCell.id]
                                    )}
                                  </TableCell>
                                )
                              ))}
                              <TableCell>
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 1, 
                                  justifyContent: 'center',
                                  opacity: 0.8,
                                  transition: 'opacity 0.2s',
                                  '&:hover': {
                                    opacity: 1
                                  }
                                }}>
                                  <Tooltip title="Edit" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDialog(vehicle);
                                      }}
                                      sx={{
                                        backgroundColor: (theme) => theme.palette.grey[100],
                                        '&:hover': {
                                          backgroundColor: (theme) => theme.palette.grey[200],
                                        }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Hapus" arrow>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(vehicle.id);
                                      }}
                                      sx={{
                                        backgroundColor: (theme) => theme.palette.error.light,
                                        color: (theme) => theme.palette.error.contrastText,
                                        '&:hover': {
                                          backgroundColor: (theme) => theme.palette.error.main,
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={vehicles.length}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Data per halaman"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
                }
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              />
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {selectedVehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="Plat Nomor"
                name="plateNumber"
                value={formik.values.plateNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.plateNumber && Boolean(formik.errors.plateNumber)}
                helperText={formik.touched.plateNumber && formik.errors.plateNumber}
                disabled={createMutation.isPending || updateMutation.isPending}
                required
              />
              <TextField
                fullWidth
                label="Jenis Kendaraan"
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.type && Boolean(formik.errors.type)}
                helperText={formik.touched.type && formik.errors.type}
                disabled={createMutation.isPending || updateMutation.isPending}
                required
              />
              <TextField
                fullWidth
                label="Nama Pemilik"
                name="owner"
                value={formik.values.owner}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.owner && Boolean(formik.errors.owner)}
                helperText={formik.touched.owner && formik.errors.owner}
                disabled={createMutation.isPending || updateMutation.isPending}
                required
              />
              <TextField
                fullWidth
                label="Kontak"
                name="contact"
                value={formik.values.contact}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.contact && Boolean(formik.errors.contact)}
                helperText={formik.touched.contact && formik.errors.contact}
                disabled={createMutation.isPending || updateMutation.isPending}
                required
              />
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formik.values.status}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.status && Boolean(formik.errors.status)}
                helperText={formik.touched.status && formik.errors.status}
                disabled={createMutation.isPending || updateMutation.isPending}
                required
              >
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="blocked">Diblokir</MenuItem>
              </TextField>
              {(createMutation.isError || updateMutation.isError) && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {createMutation.error?.message || updateMutation.error?.message}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDialog}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending || !formik.isValid || !formik.dirty}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <CircularProgress size={24} />
              ) : (
                selectedVehicle ? 'Simpan' : 'Tambah'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default VehicleManagementPage; 