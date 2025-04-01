import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress, Chip, InputAdornment, IconButton } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { getPayments, createPayment } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Payment, PaymentMethod, PaymentFormData } from '../types/payment';
import PageWrapper from '../components/PageWrapper';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptIcon from '@mui/icons-material/Receipt';

const validationSchema = Yup.object({
  ticketId: Yup.string().required('Ticket ID is required'),
  amount: Yup.number().required('Amount is required').positive('Amount must be positive'),
  paymentMethod: Yup.string().oneOf(['cash', 'card', 'e-wallet'] as const).required('Payment method is required'),
});

const PaymentsPageContent = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await getPayments();
      setPayments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment data. Please try again later.');
      
      // Set dummy data for testing when API fails
      setPayments([
        {
          id: 1,
          sessionId: 101,
          licensePlate: 'B1234CD',
          amount: 25000,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          ticketNumber: 'TIX-001-123'
        },
        {
          id: 2,
          sessionId: 102,
          licensePlate: 'D5678EF',
          amount: 15000,
          paymentMethod: 'CREDIT_CARD',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          ticketNumber: 'TIX-001-124'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredPayments = Array.isArray(payments) ? payments.filter(payment => 
    payment.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `Rp ${amount?.toLocaleString('id-ID')}`;
  };

  // This will intentionally throw an error for testing the error boundary
  const throwError = () => {
    throw new Error('This is a test error in PaymentsPage');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Payments
        </Typography>
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={fetchPayments}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            startIcon={<ReceiptIcon />}
            onClick={() => {}}
          >
            New Payment
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" paragraph>
        View and manage all parking payment transactions.
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff4f4' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by license plate or ticket number"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper sx={{ p: 3, mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredPayments.length === 0 ? (
          <Typography>No payments found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Ticket #</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.id}</TableCell>
                    <TableCell>{payment.ticketNumber}</TableCell>
                    <TableCell>{payment.licensePlate}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.paymentMethod?.replace('_', ' ')}</TableCell>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.status} 
                        color={getStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => {}}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* For testing error boundary - uncomment to test */}
      {/* <Button onClick={throwError} color="error" variant="outlined" sx={{ mt: 3 }}>
        Test Error Boundary
      </Button> */}
    </Box>
  );
};

const PaymentsPage = () => {
  return (
    <PageWrapper title="Payments">
      <PaymentsPageContent />
    </PageWrapper>
  );
};

export default PaymentsPage; 