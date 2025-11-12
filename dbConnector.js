// dbConnector.js
const { Pool } = require('pg');
const Config = require('./config');

let pool;

try {
    // Initialize the pool
    pool = new Pool(Config.getDbConfig());

    // Test the connection
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error("❌ Error connecting to database:", err);
        } else {
            console.log("✓ Database connection pool created successfully");
            Config.printConfig(); // Print config after we know DB is good
        }
    });

} catch (error) {
    console.error("❌ Error creating connection pool:", error);
    process.exit(1); // Exit if pool can't be created
}

// Export query methods that use the pool
module.exports = {
    /**
     * Execute a query and return all results
     * @param {string} query - SQL query string
     * @param {Array} params - Query parameters array
     * @returns {Promise<Array>} - List of rows
     */
    async executeQuery(query, params = []) {
        try {
            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error(`❌ Error executing query: ${query}`, error);
            throw error;
        }
    },

    /**
     * Execute a query and return a single row
     * @param {string} query - SQL query string
     * @param {Array} params - Query parameters array
     * @returns {Promise<Object|null>} - Single row or null
     */
    async executeSingle(query, params = []) {
        try {
            const result = await pool.query(query, params);
            return result.rows[0] || null;
        } catch (error) {
            console.error(`❌ Error executing single query: ${query}`, error);
            throw error;
        }
    },

    /**
     * Close all connections in the pool (for graceful shutdown)
     */
    async closeAllConnections() {
        if (pool) {
            await pool.end();
            console.log("✓ All database connections closed");
        }
    }
};
