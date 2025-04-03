const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'parking_system1',
    password: 'postgres',
    port: 5432,
});

async function addUser() {
    try {
        const result = await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *',
            ['operator1', 'operator1', 'operator']
        );
        console.log('User added successfully:', result.rows[0]);
    } catch (err) {
        console.error('Error adding user:', err);
    } finally {
        await pool.end();
    }
}

addUser(); 