-- Users data
INSERT INTO public.users (username, email, password_hash, full_name, role, active, last_login, created_at, updated_at)
VALUES 
    ('operator1', 'operator1@parking-system.com', '$2b$10$5QH.JRwwfHnwwmNDhUyK8.LQd4MrgBf/IQfV3mV8VyFYYvHJ5UzrO', 'John Operator', 'OPERATOR', true, '2025-04-01 09:30:00', '2025-04-01 08:00:00', '2025-04-01 08:00:00'),
    ('operator2', 'operator2@parking-system.com', '$2b$10$5QH.JRwwfHnwwmNDhUyK8.LQd4MrgBf/IQfV3mV8VyFYYvHJ5UzrO', 'Jane Operator', 'OPERATOR', true, '2025-04-02 08:45:00', '2025-04-01 08:00:00', '2025-04-01 08:00:00'),
    ('operator3', 'operator3@parking-system.com', '$2b$10$5QH.JRwwfHnwwmNDhUyK8.LQd4MrgBf/IQfV3mV8VyFYYvHJ5UzrO', 'Bob Operator', 'OPERATOR', true, '2025-04-02 07:30:00', '2025-04-01 08:00:00', '2025-04-01 08:00:00'),
    ('admin2', 'admin2@parking-system.com', '$2b$10$5QH.JRwwfHnwwmNDhUyK8.LQd4MrgBf/IQfV3mV8VyFYYvHJ5UzrO', 'Second Administrator', 'ADMIN', true, '2025-04-02 20:15:00', '2025-04-01 08:00:00', '2025-04-01 08:00:00'),
    ('operator4', 'operator4@parking-system.com', '$2b$10$5QH.JRwwfHnwwmNDhUyK8.LQd4MrgBf/IQfV3mV8VyFYYvHJ5UzrO', 'Alice Operator', 'OPERATOR', true, '2025-04-01 14:20:00', '2025-04-01 08:00:00', '2025-04-01 08:00:00'),
    ('operator5', 'operator5@parking-system.com', '$2b$10$5QH.JRwwfHnwwmNDhUyK8.LQd4MrgBf/IQfV3mV8VyFYYvHJ5UzrO', 'Charlie Operator', 'OPERATOR', false, NULL, '2025-04-01 08:00:00', '2025-04-01 15:30:00'); 