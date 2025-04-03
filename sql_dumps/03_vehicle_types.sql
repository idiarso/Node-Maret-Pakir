-- Vehicle types data
INSERT INTO public.vehicle_types (description, price, created_at, updated_at, "isActive", name)
VALUES
    ('Standard motorcycle', 2500.00, '2024-12-01 09:00:00', '2024-12-01 09:00:00', true, 'MOTORCYCLE'),
    ('Standard car, sedan or hatchback', 5000.00, '2024-12-01 09:00:00', '2024-12-01 09:00:00', true, 'CAR'),
    ('Large trucks and commercial vehicles', 10000.00, '2024-12-01 09:00:00', '2024-12-01 09:00:00', true, 'TRUCK'),
    ('Standard passenger van', 7000.00, '2024-12-01 09:00:00', '2024-12-01 09:00:00', true, 'VAN'),
    ('Small to medium-sized buses', 10000.00, '2024-12-01 09:00:00', '2024-12-01 09:00:00', true, 'BUS'); 