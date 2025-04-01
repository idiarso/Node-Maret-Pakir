import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Chip,
  Fade,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

export type Order = 'asc' | 'desc';

export interface Column<T> {
  id: keyof T;
  label: string;
  numeric?: boolean;
  sortable?: boolean;
  width?: string | number;
  format?: (value: any) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  error?: string;
  selectable?: boolean;
  selected?: any[];
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  orderBy?: string;
  order?: Order;
  actions?: {
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onMoreActions?: (row: T, event: React.MouseEvent<HTMLButtonElement>) => void;
  };
  onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne?: (id: any) => void;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSort?: (property: keyof T) => void;
  emptyContent?: React.ReactNode;
  rowsPerPageOptions?: number[];
}

export function DataTable<T extends { [key: string]: any }>({
  columns,
  data,
  keyField,
  loading = false,
  error,
  selectable = false,
  selected = [],
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  orderBy,
  order,
  actions,
  onSelectAll,
  onSelectOne,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  emptyContent,
  rowsPerPageOptions = [5, 10, 25],
}: DataTableProps<T>) {
  const handleRequestSort = (property: keyof T) => {
    if (onSort) {
      onSort(property);
    }
  };

  const isSelected = (id: any) => selected.indexOf(id) !== -1;

  const defaultEmptyContent = (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Typography color="text.secondary">
        Tidak ada data
      </Typography>
    </Box>
  );

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={onSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || (column.numeric ? 'right' : 'left')}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{ 
                    width: column.width,
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                      {orderBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {(actions?.onEdit || actions?.onDelete || actions?.onMoreActions) && (
                <TableCell align="center">Aksi</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  sx={{ border: 0 }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  sx={{ border: 0 }}
                >
                  {emptyContent || defaultEmptyContent}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const isItemSelected = isSelected(row[keyField]);
                return (
                  <Fade in key={row[keyField]}>
                    <TableRow
                      hover
                      onClick={() => onSelectOne && onSelectOne(row[keyField])}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      selected={isItemSelected}
                      sx={{ cursor: onSelectOne ? 'pointer' : 'default' }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={String(column.id)}
                          align={column.align || (column.numeric ? 'right' : 'left')}
                        >
                          {column.format
                            ? column.format(row[column.id])
                            : row[column.id]}
                        </TableCell>
                      ))}
                      {(actions?.onEdit || actions?.onDelete || actions?.onMoreActions) && (
                        <TableCell align="center">
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            justifyContent: 'center',
                            opacity: 0.8,
                            '&:hover': { opacity: 1 }
                          }}>
                            {actions.onEdit && (
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.onEdit!(row);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {actions.onDelete && (
                              <Tooltip title="Hapus">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.onDelete!(row);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {actions.onMoreActions && (
                              <Tooltip title="Lainnya">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actions.onMoreActions!(row, e);
                                  }}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  </Fade>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange!}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Data per halaman"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
        }
      />
    </Paper>
  );
} 