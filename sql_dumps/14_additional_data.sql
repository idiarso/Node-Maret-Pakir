-- Audit logs data
INSERT INTO public.audit_logs (action, "entityType", "entityId", "oldData", "newData", description, "ipAddress", "userAgent", user_id, created_at)
VALUES
    ('USER_LOGIN', 'USER', '1', NULL, '{"username": "admin", "time": "2025-04-01 09:00:00"}', 'User admin logged in', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', 1, '2025-04-01 09:00:00'),
    ('USER_LOGIN', 'USER', '2', NULL, '{"username": "operator1", "time": "2025-04-01 08:30:00"}', 'User operator1 logged in', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', 2, '2025-04-01 08:30:00'),
    ('SYSTEM_CONFIG_UPDATE', 'SYSTEM', NULL, '{"company_name": "Parking System"}', '{"company_name": "Smart Parking System"}', 'System configuration updated', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', 1, '2025-04-01 10:45:00'),
    ('TICKET_CREATE', 'TICKET', '1', NULL, '{"ticketNumber": "TKT-20250401-0001", "plateNumber": "B2468AC"}', 'Ticket created', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', 2, '2025-04-01 09:15:00'),
    ('PAYMENT_CREATE', 'PAYMENT', '1', NULL, '{"amount": 5000.00, "method": "CASH"}', 'Payment created', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', 2, '2025-04-01 11:30:00'),
    ('PAYMENT_COMPLETE', 'PAYMENT', '1', '{"status": "PENDING"}', '{"status": "COMPLETED"}', 'Payment completed', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', 2, '2025-04-01 11:30:00'),
    ('GATE_OPEN', 'GATE', '6', '{"status": "CLOSED"}', '{"status": "OPEN"}', 'Gate opened', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', 2, '2025-04-01 11:30:00'),
    ('GATE_CLOSE', 'GATE', '6', '{"status": "OPEN"}', '{"status": "CLOSED"}', 'Gate closed', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', 2, '2025-04-01 11:30:30'),
    ('USER_LOGOUT', 'USER', '2', NULL, '{"username": "operator1", "time": "2025-04-01 16:00:00"}', 'User operator1 logged out', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', 2, '2025-04-01 16:00:00'),
    ('USER_LOGIN', 'USER', '3', NULL, '{"username": "operator2", "time": "2025-04-01 16:00:00"}', 'User operator2 logged in', '192.168.1.12', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', 3, '2025-04-01 16:00:00'),
    ('TICKET_CREATE', 'TICKET', '8', NULL, '{"ticketNumber": "TKT-20250401-0008", "plateNumber": "B3456KL"}', 'Ticket created', '192.168.1.12', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', 3, '2025-04-01 15:30:00'),
    ('USER_LOGOUT', 'USER', '1', NULL, '{"username": "admin", "time": "2025-04-01 17:30:00"}', 'User admin logged out', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', 1, '2025-04-01 17:30:00'),
    ('SYSTEM_ERROR', 'SYSTEM', NULL, NULL, '{"error": "Database connection error"}', 'System error occurred', NULL, NULL, NULL, '2025-04-01 18:20:00'),
    ('USER_LOGIN', 'USER', '1', NULL, '{"username": "admin", "time": "2025-04-02 08:30:00"}', 'User admin logged in', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', 1, '2025-04-02 08:30:00'),
    ('USER_LOGIN', 'USER', '2', NULL, '{"username": "operator1", "time": "2025-04-02 08:15:00"}', 'User operator1 logged in', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', 2, '2025-04-02 08:15:00');

-- Payment transaction data
INSERT INTO public.payment_transaction (amount, "paymentMethod", "paymentStatus", "receiptNumber", notes, "transactionTime", "operatorId", "vehicleId")
VALUES
    (5000.00, 'CASH', 'COMPLETED', 'REC-20250401-0001', 'Parking payment', '2025-04-01 11:30:00', 2, NULL),
    (2500.00, 'CASH', 'COMPLETED', 'REC-20250401-0002', 'Parking payment', '2025-04-01 10:45:00', 2, NULL),
    (7000.00, 'CARD', 'COMPLETED', 'REC-20250401-0003', 'Parking payment', '2025-04-01 13:20:00', 2, NULL),
    (3000.00, 'CASH', 'COMPLETED', 'REC-20250401-0004', 'Parking payment', '2025-04-01 12:30:00', 2, NULL),
    (15000.00, 'CARD', 'COMPLETED', 'REC-20250401-0005', 'Parking payment', '2025-04-01 14:45:00', 2, NULL),
    (4000.00, 'CASH', 'COMPLETED', 'REC-20250401-0006', 'Parking payment', '2025-04-01 15:15:00', 2, NULL),
    (3500.00, 'EWALLET', 'COMPLETED', 'REC-20250401-0007', 'Parking payment', '2025-04-01 16:30:00', 5, NULL),
    (6000.00, 'CASH', 'COMPLETED', 'REC-20250401-0008', 'Parking payment', '2025-04-01 18:00:00', 3, NULL),
    (9000.00, 'CARD', 'COMPLETED', 'REC-20250401-0009', 'Parking payment', '2025-04-01 19:45:00', 3, NULL),
    (7500.00, 'EWALLET', 'COMPLETED', 'REC-20250401-0010', 'Parking payment', '2025-04-01 20:30:00', 3, NULL),
    (5000.00, 'CASH', 'COMPLETED', 'REC-20250402-0001', 'Parking payment', '2025-04-02 10:30:00', 2, NULL),
    (3000.00, 'CASH', 'COMPLETED', 'REC-20250402-0002', 'Parking payment', '2025-04-02 11:15:00', 2, NULL),
    (7000.00, 'CARD', 'COMPLETED', 'REC-20250402-0003', 'Parking payment', '2025-04-02 12:45:00', 2, NULL),
    (10000.00, 'CARD', 'COMPLETED', 'REC-20250402-0004', 'Parking payment', '2025-04-02 14:30:00', 2, NULL),
    (4000.00, 'CASH', 'COMPLETED', 'REC-20250402-0005', 'Parking payment', '2025-04-02 13:00:00', 2, NULL),
    (3500.00, 'EWALLET', 'COMPLETED', 'REC-20250402-0006', 'Parking payment', '2025-04-02 15:15:00', 2, NULL),
    (6000.00, 'CASH', 'COMPLETED', 'REC-20250402-0007', 'Parking payment', '2025-04-02 16:30:00', 3, NULL),
    (8000.00, 'CARD', 'COMPLETED', 'REC-20250402-0008', 'Parking payment', '2025-04-02 17:45:00', 3, NULL),
    (7000.00, 'EWALLET', 'COMPLETED', 'REC-20250402-0009', 'Parking payment', '2025-04-02 18:15:00', 3, NULL),
    (1000.00, 'CASH', 'PENDING', 'REC-20250402-0010', 'Membership renewal', '2025-04-02 19:00:00', 1, 1);

-- Backup logs data
INSERT INTO public.backup_logs (type, status, file_path, size, created_at)
VALUES
    ('FULL', 'SUCCESS', '/backups/parking_system_20250401_0000.sql', 1567890, '2025-04-01 00:00:00'),
    ('INCREMENTAL', 'SUCCESS', '/backups/parking_system_20250401_1200.sql', 352460, '2025-04-01 12:00:00'),
    ('FULL', 'SUCCESS', '/backups/parking_system_20250402_0000.sql', 1689540, '2025-04-02 00:00:00'),
    ('INCREMENTAL', 'SUCCESS', '/backups/parking_system_20250402_1200.sql', 423870, '2025-04-02 12:00:00'); 