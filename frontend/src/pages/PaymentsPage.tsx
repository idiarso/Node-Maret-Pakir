import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { getPayments, createPayment } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Payment, PaymentMethod, PaymentFormData } from '../types/payment';

const validationSchema = Yup.object({
  ticketId: Yup.string().required('Ticket ID is required'),
  amount: Yup.number().required('Amount is required').positive('Amount must be positive'),
  paymentMethod: Yup.string().oneOf(['cash', 'card', 'e-wallet'] as const).required('Payment method is required'),
});

const PaymentsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: getPayments
  });

  const createPaymentMutation = useMutation({
    mutationFn: (values: PaymentFormData) => createPayment(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setOpenDialog(false);
      toast.success('Payment created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create payment');
      console.error('Error creating payment:', error);
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Payments</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
          Create Payment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ticket ID</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments?.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.id}</TableCell>
                <TableCell>{payment.ticketId}</TableCell>
                <TableCell>{payment.amount}</TableCell>
                <TableCell>{payment.paymentMethod}</TableCell>
                <TableCell>{payment.status}</TableCell>
                <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create Payment</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{ ticketId: '', amount: 0, paymentMethod: 'cash' as PaymentMethod }}
            validationSchema={validationSchema}
            onSubmit={(values) => createPaymentMutation.mutate(values)}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Box mt={2}>
                  <Field
                    name="ticketId"
                    as={TextField}
                    label="Ticket ID"
                    fullWidth
                    error={touched.ticketId && Boolean(errors.ticketId)}
                    helperText={touched.ticketId && errors.ticketId}
                    margin="normal"
                  />
                  <Field
                    name="amount"
                    as={TextField}
                    label="Amount"
                    type="number"
                    fullWidth
                    error={touched.amount && Boolean(errors.amount)}
                    helperText={touched.amount && errors.amount}
                    margin="normal"
                  />
                  <Field
                    name="paymentMethod"
                    as={TextField}
                    select
                    label="Payment Method"
                    fullWidth
                    error={touched.paymentMethod && Boolean(errors.paymentMethod)}
                    helperText={touched.paymentMethod && errors.paymentMethod}
                    margin="normal"
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="e-wallet">E-Wallet</MenuItem>
                  </Field>
                </Box>
                <DialogActions>
                  <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                  <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Payment'}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentsPage; 