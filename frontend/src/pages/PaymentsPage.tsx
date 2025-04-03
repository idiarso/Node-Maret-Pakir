import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, CircularProgress, Chip, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { getPayments } from '../services/api';
import PageWrapper from '../components/PageWrapper';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { ChangeEvent } from 'react';
import { useReactToPrint } from 'react-to-print';

const PaymentsPageContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const printComponentRef = useRef(null);

  // Gunakan React Query untuk fetching data
  const { 
    data: payments = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      try {
        console.log('Fetching payments data...');
        const result = await getPayments();
        console.log('Result from getPayments:', result);
        if (!result.data) {
          console.warn('No data property in result');
          return [];
        }
        return result.data || [];
      } catch (err) {
        console.error('Error in payment query:', err);
        throw err;
      }
    },
    retry: 2, // Coba ulang dua kali jika gagal
    refetchOnWindowFocus: false,
    // Menambahkan refetch interval untuk auto-refresh
    refetchInterval: 30000 // refresh setiap 30 detik
  });

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter payments berdasarkan search term
  const filteredPayments = Array.isArray(payments) ? payments.filter(payment => {
    if (!searchTerm.trim()) return true; // Jika tidak ada search term, tampilkan semua
    
    const searchLower = searchTerm.toLowerCase();
    
    // Helper function untuk memeriksa nilai dengan aman
    const safeIncludes = (value: any, search: string) => {
      if (value == null) return false;
      return String(value).toLowerCase().includes(search);
    };
    
    // Cek semua kemungkinan nama field untuk tiket dan plat nomor
    return (
      safeIncludes(payment.ticketNumber, searchLower) || 
      safeIncludes(payment.licensePlate, searchLower) || 
      safeIncludes(payment.transactionId, searchLower)
    );
  }) : [];

  console.log('Filtered payments:', filteredPayments);

  const getStatusColor = (status: string | undefined): "success" | "warning" | "error" | "default" => {
    if (!status) return 'default';
    
    const statusUpper = String(status).toUpperCase();
    switch (statusUpper) {
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

  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('id-ID');
    } catch (e) {
      return String(dateString);
    }
  };

  const formatCurrency = (amount: number | string | undefined): string => {
    if (amount === undefined || amount === null) return 'Rp 0';
    try {
      return `Rp ${Number(amount).toLocaleString('id-ID')}`;
    } catch (e) {
      return `Rp ${amount}`;
    }
  };

  const formatPaymentMethod = (method: string | undefined): string => {
    if (!method) return 'N/A';
    
    // Handle different formats: CREDIT_CARD, credit_card, creditCard
    const methodStr = String(method);
    
    if (methodStr.includes('_')) {
      // Format: CREDIT_CARD or credit_card
      return methodStr
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    } else {
      // Format: creditCard
      return methodStr
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/^./, str => str.toUpperCase());
    }
  };

  const handleNewPayment = () => {
    alert('Fitur tambah pembayaran sedang dalam pengembangan.');
  };

  // Rekaman percobaan terakhir untuk debugging
  const [lastRetryTimestamp, setLastRetryTimestamp] = useState<string | null>(null);
  
  const handleManualRefresh = () => {
    setLastRetryTimestamp(new Date().toLocaleString('id-ID'));
    refetch();
  };

  // Fungsi untuk mencetak detail pembayaran individu
  const handlePrintPayment = (payment: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Mohon izinkan popup untuk mencetak.');
      return;
    }

    // Membuat konten HTML untuk dicetak
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bukti Pembayaran</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 0;
            }
            .receipt {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .details {
              margin-bottom: 20px;
            }
            .details table {
              width: 100%;
              border-collapse: collapse;
            }
            .details table td {
              padding: 8px;
              border-bottom: 1px solid #eee;
            }
            .details table td:first-child {
              font-weight: bold;
              width: 40%;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body {
                margin: 0;
              }
              .receipt {
                box-shadow: none;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Bukti Pembayaran Parkir</h1>
              <p>${formatDate(new Date())}</p>
            </div>
            <div class="details">
              <table>
                <tr>
                  <td>ID Pembayaran</td>
                  <td>${payment.id}</td>
                </tr>
                <tr>
                  <td>Nomor Tiket</td>
                  <td>${payment.ticketNumber || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Plat Nomor</td>
                  <td>${payment.licensePlate || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Jumlah</td>
                  <td>${formatCurrency(payment.amount)}</td>
                </tr>
                <tr>
                  <td>Metode Pembayaran</td>
                  <td>${formatPaymentMethod(payment.paymentMethod)}</td>
                </tr>
                <tr>
                  <td>Tanggal Pembayaran</td>
                  <td>${formatDate(payment.createdAt)}</td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td>${payment.status || 'N/A'}</td>
                </tr>
                <tr>
                  <td>ID Transaksi</td>
                  <td>${payment.transactionId || 'N/A'}</td>
                </tr>
              </table>
            </div>
            <div class="footer">
              <p>Terima kasih telah menggunakan layanan kami.</p>
              <p>Dokumen ini adalah bukti pembayaran yang sah.</p>
            </div>
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Cetak Bukti Pembayaran
            </button>
            <button onclick="window.close()" style="margin-left: 10px; padding: 8px 16px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Tutup
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Fungsi untuk mencetak semua pembayaran
  const handlePrintAllPayments = useReactToPrint({
    documentTitle: 'Daftar Pembayaran Parkir',
    onAfterPrint: () => console.log('Print completed'),
    contentRef: printComponentRef,
    pageStyle: `
      @page {
        size: auto;
        margin: 20mm;
      }
      @media print {
        body {
          font-family: Arial, sans-serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      }
    `,
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Payments
        </Typography>
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleManualRefresh}
            disabled={isLoading}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          {filteredPayments.length > 0 && (
            <Button 
              startIcon={<PrintIcon />} 
              onClick={() => {
                handlePrintAllPayments();
              }}
              disabled={isLoading}
              sx={{ mr: 1 }}
            >
              Print All
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<ReceiptIcon />}
            onClick={handleNewPayment}
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
          <Typography color="error">
            Failed to load payment data. Please try again later. 
            {(error as Error).message ? ` Error: ${(error as Error).message}` : ''}
          </Typography>
          {lastRetryTimestamp && (
            <Typography variant="caption" color="textSecondary">
              Last retry: {lastRetryTimestamp}
            </Typography>
          )}
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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : !Array.isArray(payments) || filteredPayments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography>No payments found.</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {searchTerm ? 'Try using different search terms or' : 'There are no payment transactions yet or'} check your database connection.
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleManualRefresh} 
              sx={{ mt: 2 }}
              startIcon={<RefreshIcon />}
            >
              Try Again
            </Button>
          </Box>
        ) : (
          <div ref={printComponentRef}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }} className="print-header">
              <Typography variant="h6">Daftar Pembayaran Parkir</Typography>
              <Typography variant="body2">{new Date().toLocaleDateString('id-ID')}</Typography>
            </Box>
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
                    <TableCell className="no-print">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.id}</TableCell>
                      <TableCell>{payment.ticketNumber || '-'}</TableCell>
                      <TableCell>{payment.licensePlate || '-'}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{formatPaymentMethod(payment.paymentMethod)}</TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.status || 'UNKNOWN'} 
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell className="no-print">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => console.log('View payment:', payment)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Receipt">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handlePrintPayment(payment)}
                          >
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </Paper>
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