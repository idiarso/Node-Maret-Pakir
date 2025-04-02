import React, { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Container,
  Box,
  Divider
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { parkingSessionService, gateService } from '../services/api';
import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../contexts/AuthContext';
import BarcodeScanner from '../components/BarcodeScanner';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../utils/format';

interface ActiveSession {
  id: number;
  vehicle: {
  id: number;
  plate_number: string;
  type: string;
  };
  entry_time: string;
  exit_time?: string;
  status: string;
  parkingArea?: {
    id: number;
    name: string;
  };
}

interface ExitFormData {
  session_id: number;
}

interface Gate {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

const ExitGatePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<number | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper functions for parking calculations
  const calculateParkingDuration = (entryTime: Date, exitTime: Date): number => {
    const durationMs = exitTime.getTime() - entryTime.getTime();
    return durationMs / (1000 * 60 * 60); // Duration in hours
  };
  
  const calculateParkingFee = (vehicleType: string, durationHours: number): number => {
    let baseFee = 0;
    let hourlyRate = 0;
    
    switch (vehicleType) {
      case 'CAR':
        baseFee = 5;
        hourlyRate = 2;
        break;
      case 'MOTORCYCLE':
        baseFee = 3;
        hourlyRate = 1;
        break;
      case 'TRUCK':
        baseFee = 10;
        hourlyRate = 4;
        break;
      default:
        baseFee = 5;
        hourlyRate = 2;
    }
    
    return baseFee + (hourlyRate * Math.ceil(durationHours));
  };

  // Calculate derived values
  const duration = activeSession ? calculateParkingDuration(new Date(activeSession.entry_time), new Date()) : 0;
  const parkingFee = activeSession ? calculateParkingFee(activeSession.vehicle.type, duration) : 0;
  const taxAmount = parkingFee * 0.1;
  const totalAmount = parkingFee + taxAmount;

  // Get all gates
  const { data: gatesData } = useQuery({
    queryKey: ['exit-gates'],
    queryFn: async () => {
      const allGates = await gateService.getAll();
      return allGates.filter(gate => gate.type === 'EXIT' && gate.status === 'ACTIVE');
    }
  });

  // Fetch gates on component mount
  useEffect(() => {
    if (gatesData) {
      setGates(gatesData);
    }
  }, [gatesData]);

  // Process barcode to find session
  const getSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      return parkingSessionService.getSession(code);
    },
    onSuccess: (data) => {
      setActiveSession(data as ActiveSession);
      setSnackbar({
        open: true,
        message: 'Vehicle found successfully',
        severity: 'success'
      });
    },
    onError: (error: any) => {
      setActiveSession(null);
      setError(`Error: ${error.message || 'Failed to find vehicle'}`);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to find vehicle',
        severity: 'error'
      });
    }
  });

  // Process exit mutation
  const processExitMutation = useMutation({
    mutationFn: async (data: ExitFormData) => {
      return parkingSessionService.processExit(data);
    },
    onSuccess: () => {
      setExitDialogOpen(false);
      setReceiptDialogOpen(true);
      setSnackbar({
        open: true,
        message: 'Exit processed successfully',
        severity: 'success'
      });
    },
    onError: (error: any) => {
      setError(`Error: ${error.message || 'Failed to process exit'}`);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to process exit',
        severity: 'error'
      });
    }
  });

  const handleBarcodeScanned = (code: string) => {
    processBarcode(code);
  };

  const processBarcode = async (barcodeData: string) => {
    if (!barcodeData) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getSessionMutation.mutateAsync(barcodeData);
      
      if (!data || data.status !== 'ACTIVE') {
        setError('Invalid or already processed parking session');
        setActiveSession(null);
    } else {
        setActiveSession(data as ActiveSession);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      setError('Failed to process barcode. Please try again.');
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessExit = () => {
    if (!activeSession) {
      setError('No vehicle details available');
      return;
    }
    
    processExitMutation.mutate({
      session_id: activeSession.id,
    });
  };

  const handleOpenExitDialog = () => {
    setExitDialogOpen(true);
  };

  const handleCloseExitDialog = () => {
    setExitDialogOpen(false);
  };

  const handleCloseReceiptDialog = () => {
    setReceiptDialogOpen(false);
    // Reset state
    setActiveSession(null);
    setSelectedGate(null);
  };

  const handleOpenGate = async () => {
    if (!selectedGate) {
      setError('Please select a gate');
      return;
    }
    
    try {
      // This would be a call to open the physical gate
      console.log(`Opening gate ${selectedGate}...`);
      setError(null);
      
      // Use changeStatus instead of openGate
      await gateService.changeStatus(selectedGate, 'OPEN');
      
      handleCloseReceiptDialog();
    } catch (error: any) {
      console.error('Error opening gate:', error);
      setError('Failed to open gate. Please try again.');
      setSnackbar({
        open: true,
        message: error.message || 'Unknown error',
        severity: 'error'
      });
    }
  };

  return (
    <PageWrapper title={t('Exit Gate')}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('Exit Gate')}
        </Typography>

          <BarcodeScanner onScan={handleBarcodeScanned} />
          
                {error && (
            <Typography color="error" sx={{ mt: 2 }}>
                    {error}
            </Typography>
          )}
          
          {loading && <CircularProgress sx={{ mt: 2 }} />}
          
          {activeSession && (
            <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h5" gutterBottom>
                {t('Vehicle Details')}
                </Typography>
              
                    <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>{t('Plate Number')}:</strong>
                        </Typography>
                  <Typography variant="body1" gutterBottom>
                    {activeSession.vehicle.plate_number}
                        </Typography>
                      </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>{t('Vehicle Type')}:</strong>
                        </Typography>
                  <Typography variant="body1" gutterBottom>
                    {activeSession.vehicle.type}
                        </Typography>
                      </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>{t('Entry Time')}:</strong>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                    {formatDateTime(new Date(activeSession.entry_time))}
                        </Typography>
                      </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>{t('Duration')}:</strong>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                    {duration.toFixed(2)} hour(s)
                        </Typography>
                      </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>{t('Parking Fee')}:</strong>
                        </Typography>
                        <Typography variant="h5" gutterBottom color="primary">
                    ${parkingFee.toFixed(2)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" gutterBottom>
                    <strong>{t('Parking Area')}:</strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {activeSession.parkingArea?.name || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
              
                <Button
                  variant="contained"
                  color="primary"
                fullWidth
                onClick={handleOpenExitDialog}
                sx={{ mt: 2 }}
              >
                {t('Process Exit')}
              </Button>
            </Paper>
          )}

        {/* Exit Confirmation Dialog */}
          <Dialog open={exitDialogOpen} onClose={handleCloseExitDialog}>
            <DialogTitle>{t('Confirm Exit')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
                {t('Are you sure you want to process the exit for this vehicle?')}
            </DialogContentText>
            <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                {t('Payment Amount')}: ${parkingFee.toFixed(2)}
            </Typography>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseExitDialog}>
                {t('Cancel')}
            </Button>
            <Button
              onClick={handleProcessExit}
                variant="contained"
              color="primary"
                disabled={processExitMutation.isPending}
              >
                {processExitMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  t('Confirm')
                )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Receipt Dialog */}
          <Dialog open={receiptDialogOpen} onClose={handleCloseReceiptDialog} maxWidth="sm" fullWidth>
            <DialogTitle>{t('Payment Receipt')}</DialogTitle>
          <DialogContent>
              <Paper elevation={0} sx={{ p: 2, border: '1px dashed #ccc', fontFamily: 'monospace' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                    PARKING RECEIPT
                  </Typography>
                  
                  <Typography variant="body2" align="center" gutterBottom>
                    {new Date().toLocaleString()}
                  </Typography>
                  
                  {/* Thermal printer compatible barcode */}
                  <Box sx={{ my: 2, py: 1, bgcolor: '#f5f5f5' }}>
                    <img 
                      src={`https://barcodeapi.org/api/code128/${activeSession?.id || '0000'}`}
                      alt="Barcode"
                      style={{ 
                        width: '90%', 
                        height: '60px',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                    <Typography variant="body2" align="center" sx={{ fontFamily: 'monospace', mt: 1 }}>
                      {activeSession?.id.toString().padStart(8, '0')}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>{t('Vehicle')}:</strong> {activeSession?.vehicle.plate_number} ({activeSession?.vehicle.type})
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Entry Time')}:</strong> {activeSession ? formatDateTime(new Date(activeSession.entry_time)) : ''}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Exit Time')}:</strong> {formatDateTime(new Date())}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Duration')}:</strong> {duration.toFixed(2)} hour(s)
                    </Typography>
                  </Grid>
                </Grid>
                
                    <Divider sx={{ my: 1 }} />
                
                <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
                  {t('Payment Details')}
                </Typography>
                
                <Grid container spacing={1}>
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {t('Parking Fee')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" align="right">
                      ${parkingFee.toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={8}>
                    <Typography variant="body2">
                      {t('Tax (10%)')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" align="right">
                      ${taxAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
                
                    <Divider sx={{ my: 1 }} />
                
                <Grid container spacing={1}>
                  <Grid item xs={8}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {t('Total')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" align="right" sx={{ fontWeight: 'bold' }}>
                      ${totalAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ textAlign: 'center', mt: 3, pt: 1, borderTop: '1px dashed #ccc' }}>
                  <Typography variant="body2" align="center">
                    {t('Thank you for using our parking service!')}
                  </Typography>
                </Box>
              </Paper>
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    // Create a printable version of the receipt with optimized barcode for thermal printer
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Parking Receipt #${activeSession?.id || '0'}</title>
                          <style>
                            body { 
                              font-family: monospace; 
                              margin: 0; 
                              padding: 10px; 
                              width: 80mm; /* Standard thermal paper width */
                              max-width: 80mm;
                              font-size: 12px;
                            }
                            .receipt { text-align: center; }
                            .receipt-header { margin-bottom: 10px; }
                            .receipt-title { font-size: 16px; font-weight: bold; margin: 0; }
                            .receipt-subtitle { font-size: 12px; margin: 5px 0; }
                            .receipt-barcode { margin: 10px 0; }
                            .receipt-barcode img { width: 100%; height: 50px; }
                            .receipt-id { margin: 5px 0; font-size: 14px; }
                            .divider { border-top: 1px dashed #000; margin: 10px 0; }
                            .details { margin: 10px 0; text-align: left; }
                            .details p { margin: 3px 0; }
                            .payment { margin: 10px 0; }
                            .payment-row { display: flex; justify-content: space-between; margin: 3px 0; }
                            .total { font-weight: bold; font-size: 14px; }
                            .footer { margin-top: 15px; font-size: 12px; text-align: center; }
                          </style>
                        </head>
                        <body>
                          <div class="receipt">
                            <div class="receipt-header">
                              <p class="receipt-title">PARKING RECEIPT</p>
                              <p class="receipt-subtitle">${new Date().toLocaleString()}</p>
                            </div>
                            
                            <div class="receipt-barcode">
                              <img src="https://barcodeapi.org/api/code128/${activeSession?.id || '0000'}" alt="Barcode">
                              <p class="receipt-id">${activeSession?.id.toString().padStart(8, '0') || '00000000'}</p>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="details">
                              <p><strong>Vehicle:</strong> ${activeSession?.vehicle.plate_number || ''} (${activeSession?.vehicle.type || ''})</p>
                              <p><strong>Entry Time:</strong> ${activeSession ? formatDateTime(new Date(activeSession.entry_time)) : ''}</p>
                              <p><strong>Exit Time:</strong> ${formatDateTime(new Date())}</p>
                              <p><strong>Duration:</strong> ${duration.toFixed(2)} hour(s)</p>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="payment">
                              <p><strong>Payment Details</strong></p>
                              
                              <div class="payment-row">
                                <span>Parking Fee:</span>
                                <span>$${parkingFee.toFixed(2)}</span>
                              </div>
                              
                              <div class="payment-row">
                                <span>Tax (10%):</span>
                                <span>$${taxAmount.toFixed(2)}</span>
                              </div>
                              
                              <div class="divider"></div>
                              
                              <div class="payment-row total">
                                <span>Total:</span>
                                <span>$${totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="footer">
                              <p>Thank you for using our parking service!</p>
                            </div>
                          </div>
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                >
                  {t('Print Receipt')}
                </Button>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    select
                    label={t('Select Gate')}
                    fullWidth
                    value={selectedGate || ''}
                    onChange={(e) => setSelectedGate(Number(e.target.value))}
                  >
                    {gates.map((gate) => (
                      <MenuItem key={gate.id} value={gate.id}>
                        {gate.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleCloseReceiptDialog}>
                {t('Cancel')}
              </Button>
            <Button
                onClick={handleOpenGate}
              variant="contained"
              color="primary"
                disabled={!selectedGate}
            >
                {t('Open Gate')}
            </Button>
          </DialogActions>
        </Dialog>
        </Paper>
      </Container>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <Alert
          onClose={() => setSnackbar({...snackbar, open: false})} 
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
    </PageWrapper>
  );
};

export default ExitGatePage; 