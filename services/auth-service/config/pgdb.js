const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URI
});

const connectPostgres = async () => {
    try {
        await pool.connect();
        console.log('PostgreSQL Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = { connectPostgres, pool };
