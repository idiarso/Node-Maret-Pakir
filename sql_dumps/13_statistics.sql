-- Parking statistics data
INSERT INTO public.parking_statistics (date, total_vehicles, total_revenue, average_duration, peak_hours, vehicle_types, created_at, updated_at)
VALUES
    ('2025-04-01', 10, 62500.00, 175, 
     '{"09:00-10:00": 3, "13:00-14:00": 2, "16:00-17:00": 3, "18:00-19:00": 2}', 
     '{"CAR": 6, "MOTORCYCLE": 2, "TRUCK": 1, "VAN": 1}', 
     '2025-04-02 00:30:00', '2025-04-02 00:30:00'),
    ('2025-04-02', 9, 53500.00, 190, 
     '{"08:00-09:00": 2, "11:00-12:00": 2, "14:00-15:00": 3, "16:00-17:00": 2}', 
     '{"CAR": 5, "MOTORCYCLE": 2, "TRUCK": 1, "BUS": 1}', 
     '2025-04-02 21:00:00', '2025-04-02 21:00:00');

-- Holiday data
INSERT INTO public.holidays (date, name, description, created_at, updated_at)
VALUES
    ('2025-04-05', 'Easter Weekend', 'Easter holiday weekend', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),
    ('2025-04-17', 'National Independence Day', 'Independence day celebration', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),
    ('2025-05-01', 'Labor Day', 'International labor day', '2025-01-15 10:00:00', '2025-01-15 10:00:00');

-- Notifications data
INSERT INTO public.notifications (type, title, message, status, created_at, updated_at)
VALUES
    ('SYSTEM', 'System Maintenance', 'System maintenance scheduled for 2025-04-05 from 02:00 to 04:00', 'UNREAD', '2025-04-02 10:00:00', '2025-04-02 10:00:00'),
    ('MAINTENANCE', 'Gate 2 Maintenance', 'Gate 2 will be under maintenance from 2025-04-03 09:00 to 12:00', 'UNREAD', '2025-04-02 14:30:00', '2025-04-02 14:30:00'),
    ('SECURITY', 'Security Alert', 'Please ensure all operators verify vehicle identification properly', 'UNREAD', '2025-04-02 16:15:00', '2025-04-02 16:15:00'),
    ('PAYMENT', 'New Payment Method', 'New e-wallet payment method available starting 2025-04-10', 'UNREAD', '2025-04-02 11:45:00', '2025-04-02 11:45:00');

-- User activity logs
INSERT INTO public.user_activity_logs (user_id, action, details, ip_address, created_at)
VALUES
    (1, 'LOGIN', '{"browser": "Chrome", "device": "Desktop"}', '192.168.1.10', '2025-04-01 09:00:00'),
    (1, 'UPDATE_SETTINGS', '{"setting": "system", "changes": {"company_name": "Smart Parking System"}}', '192.168.1.10', '2025-04-01 10:45:00'),
    (1, 'LOGOUT', '{"browser": "Chrome", "device": "Desktop"}', '192.168.1.10', '2025-04-01 17:30:00'),
    (2, 'LOGIN', '{"browser": "Firefox", "device": "Desktop"}', '192.168.1.11', '2025-04-01 08:30:00'),
    (2, 'CREATE_TICKET', '{"ticket_id": 1}', '192.168.1.11', '2025-04-01 09:15:00'),
    (2, 'PROCESS_PAYMENT', '{"payment_id": 1, "amount": 5000.00}', '192.168.1.11', '2025-04-01 11:30:00'),
    (2, 'LOGOUT', '{"browser": "Firefox", "device": "Desktop"}', '192.168.1.11', '2025-04-01 16:00:00'),
    (3, 'LOGIN', '{"browser": "Chrome", "device": "Desktop"}', '192.168.1.12', '2025-04-01 16:00:00'),
    (3, 'CREATE_TICKET', '{"ticket_id": 8}', '192.168.1.12', '2025-04-01 16:30:00'),
    (3, 'LOGOUT', '{"browser": "Chrome", "device": "Desktop"}', '192.168.1.12', '2025-04-02 00:00:00');

-- User sessions
INSERT INTO public.user_sessions (user_id, token, ip_address, user_agent, last_activity, created_at)
VALUES
    (1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', '2025-04-02 20:30:00', '2025-04-02 08:30:00'),
    (2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.operator1', '192.168.1.11', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', '2025-04-02 16:00:00', '2025-04-02 08:15:00'),
    (3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.operator2', '192.168.1.12', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', '2025-04-02 21:00:00', '2025-04-02 16:00:00'),
    (5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.operator4', '192.168.1.13', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0.0.0', '2025-04-02 16:00:00', '2025-04-02 08:20:00'),
    (6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.operator5', '192.168.1.14', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/98.0', '2025-04-02 21:00:00', '2025-04-02 16:05:00');

-- Device health checks
INSERT INTO public.device_health_checks (status, checked_at, "deviceId", error_message)
VALUES
    ('ACTIVE', '2025-04-01 08:00:00', 1, NULL),
    ('ACTIVE', '2025-04-01 08:00:00', 2, NULL),
    ('ACTIVE', '2025-04-01 08:00:00', 3, NULL),
    ('MAINTENANCE', '2025-04-01 08:00:00', 4, 'Scheduled maintenance'),
    ('ACTIVE', '2025-04-01 08:00:00', 5, NULL),
    ('ERROR', '2025-04-01 11:30:00', 6, 'Connection failed'),
    ('ACTIVE', '2025-04-01 08:00:00', 7, NULL),
    ('ACTIVE', '2025-04-01 08:00:00', 8, NULL),
    ('INACTIVE', '2025-04-01 08:00:00', 9, NULL),
    ('MAINTENANCE', '2025-04-01 08:00:00', 10, 'Scheduled maintenance'),
    ('ACTIVE', '2025-04-02 08:00:00', 1, NULL),
    ('ACTIVE', '2025-04-02 08:00:00', 2, NULL),
    ('ACTIVE', '2025-04-02 08:00:00', 3, NULL),
    ('MAINTENANCE', '2025-04-02 08:00:00', 4, 'Scheduled maintenance'),
    ('ACTIVE', '2025-04-02 08:00:00', 5, NULL),
    ('ERROR', '2025-04-02 10:30:00', 6, 'Device temperature high'),
    ('ACTIVE', '2025-04-02 08:00:00', 7, NULL),
    ('ACTIVE', '2025-04-02 08:00:00', 8, NULL),
    ('ERROR', '2025-04-02 13:00:00', 9, 'Camera connection lost'),
    ('MAINTENANCE', '2025-04-02 08:00:00', 10, 'Scheduled maintenance');

-- Parking fees
INSERT INTO public.parking_fees (ticket_id, base_rate, duration, hourly_charges, additional_charges, total_amount, calculated_at, created_at, updated_at)
VALUES
    (1, 5000.00, 135, 0.00, 0.00, 5000.00, '2025-04-01 11:30:00+07', '2025-04-01 11:30:00+07', '2025-04-01 11:30:00+07'),
    (2, 2500.00, 75, 0.00, 0.00, 2500.00, '2025-04-01 10:45:00+07', '2025-04-01 10:45:00+07', '2025-04-01 10:45:00+07'),
    (3, 5000.00, 200, 2000.00, 0.00, 7000.00, '2025-04-01 13:20:00+07', '2025-04-01 13:20:00+07', '2025-04-01 13:20:00+07'),
    (4, 2500.00, 135, 500.00, 0.00, 3000.00, '2025-04-01 12:30:00+07', '2025-04-01 12:30:00+07', '2025-04-01 12:30:00+07'),
    (5, 10000.00, 225, 5000.00, 0.00, 15000.00, '2025-04-01 14:45:00+07', '2025-04-01 14:45:00+07', '2025-04-01 14:45:00+07'),
    (6, 5000.00, 105, 0.00, 0.00, 5000.00, '2025-04-01 15:15:00+07', '2025-04-01 15:15:00+07', '2025-04-01 15:15:00+07'),
    (7, 2500.00, 150, 1000.00, 0.00, 3500.00, '2025-04-01 16:30:00+07', '2025-04-01 16:30:00+07', '2025-04-01 16:30:00+07'),
    (8, 5000.00, 150, 1000.00, 0.00, 6000.00, '2025-04-01 18:00:00+07', '2025-04-01 18:00:00+07', '2025-04-01 18:00:00+07'),
    (9, 7000.00, 210, 2000.00, 0.00, 9000.00, '2025-04-01 19:45:00+07', '2025-04-01 19:45:00+07', '2025-04-01 19:45:00+07'),
    (10, 5000.00, 210, 2500.00, 0.00, 7500.00, '2025-04-01 20:30:00+07', '2025-04-01 20:30:00+07', '2025-04-01 20:30:00+07'),
    (11, 5000.00, 135, 0.00, 0.00, 5000.00, '2025-04-02 10:30:00+07', '2025-04-02 10:30:00+07', '2025-04-02 10:30:00+07'),
    (12, 2500.00, 150, 500.00, 0.00, 3000.00, '2025-04-02 11:15:00+07', '2025-04-02 11:15:00+07', '2025-04-02 11:15:00+07'),
    (13, 5000.00, 195, 2000.00, 0.00, 7000.00, '2025-04-02 12:45:00+07', '2025-04-02 12:45:00+07', '2025-04-02 12:45:00+07'),
    (14, 10000.00, 270, 0.00, 0.00, 10000.00, '2025-04-02 14:30:00+07', '2025-04-02 14:30:00+07', '2025-04-02 14:30:00+07'),
    (15, 5000.00, 105, 0.00, 0.00, 5000.00, '2025-04-02 13:00:00+07', '2025-04-02 13:00:00+07', '2025-04-02 13:00:00+07'),
    (16, 2500.00, 165, 1000.00, 0.00, 3500.00, '2025-04-02 15:15:00+07', '2025-04-02 15:15:00+07', '2025-04-02 15:15:00+07'),
    (17, 5000.00, 165, 1000.00, 0.00, 6000.00, '2025-04-02 16:30:00+07', '2025-04-02 16:30:00+07', '2025-04-02 16:30:00+07'),
    (18, 10000.00, 195, 0.00, 0.00, 10000.00, '2025-04-02 17:45:00+07', '2025-04-02 17:45:00+07', '2025-04-02 17:45:00+07'),
    (19, 5000.00, 195, 2000.00, 0.00, 7000.00, '2025-04-02 18:15:00+07', '2025-04-02 18:15:00+07', '2025-04-02 18:15:00+07'); 