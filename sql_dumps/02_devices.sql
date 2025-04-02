-- Devices data
INSERT INTO public.devices (type, status, last_maintenance, next_maintenance, created_at, updated_at, name, location)
VALUES
    ('CAMERA', 'ACTIVE', '2025-03-15 10:00:00', '2025-06-15 10:00:00', '2024-12-01 09:00:00', '2025-04-01 09:00:00', 'Camera Entry Gate 1', 'Entrance A'),
    ('CAMERA', 'ACTIVE', '2025-03-15 10:00:00', '2025-06-15 10:00:00', '2024-12-01 09:00:00', '2025-04-01 09:00:00', 'Camera Exit Gate 1', 'Exit A'),
    ('PRINTER', 'ACTIVE', '2025-03-20 14:00:00', '2025-06-20 14:00:00', '2024-11-15 09:00:00', '2025-04-01 09:00:00', 'Ticket Printer 1', 'Entrance A'),
    ('PRINTER', 'MAINTENANCE', '2025-04-01 09:00:00', '2025-07-01 09:00:00', '2024-11-15 09:00:00', '2025-04-01 09:00:00', 'Ticket Printer 2', 'Entrance B'),
    ('SCANNER', 'ACTIVE', '2025-03-25 11:00:00', '2025-06-25 11:00:00', '2024-10-10 09:00:00', '2025-04-01 09:00:00', 'Barcode Scanner 1', 'Exit A'),
    ('SCANNER', 'ERROR', '2025-02-10 13:00:00', '2025-05-10 13:00:00', '2024-10-10 09:00:00', '2025-04-01 09:00:00', 'Barcode Scanner 2', 'Exit B'),
    ('GATE', 'ACTIVE', '2025-03-05 09:00:00', '2025-06-05 09:00:00', '2024-09-01 09:00:00', '2025-04-01 09:00:00', 'Entry Gate Barrier 1', 'Entrance A'),
    ('GATE', 'ACTIVE', '2025-03-05 09:00:00', '2025-06-05 09:00:00', '2024-09-01 09:00:00', '2025-04-01 09:00:00', 'Exit Gate Barrier 1', 'Exit A'),
    ('CAMERA', 'INACTIVE', '2025-01-20 15:00:00', '2025-04-20 15:00:00', '2024-12-01 09:00:00', '2025-04-01 09:00:00', 'Camera Entry Gate 2', 'Entrance B'),
    ('GATE', 'MAINTENANCE', '2025-04-01 09:00:00', '2025-07-01 09:00:00', '2024-09-01 09:00:00', '2025-04-01 09:00:00', 'Entry Gate Barrier 2', 'Entrance B'); 