// dbConnector.ts
import pg from 'pg';
import Config from './config.js';

// In ESM with some TS configurations, we destructure Pool from the default import
// or import it directly depending on esModuleInterop.
const { Pool } = pg;

let pool: pg.Pool;

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

/**
 * Execute a query and return all results
 */
export async function executeQuery(queryText: string, params: (string | number | null | boolean)[] = []): Promise<any[]> {
    try {
        const result = await pool.query(queryText, params);
        return result.rows;
    } catch (error) {
        console.error(`❌ Error executing query: ${queryText}`, error);
        throw error;
    }
}

/**
 * Execute a query and return a single row
 */
export async function executeSingle(queryText: string, params: (string | number | null | boolean)[] = []): Promise<any | null> {
    try {
        const result = await pool.query(queryText, params);
        return result.rows[0] || null;
    } catch (error) {
        console.error(`❌ Error executing single query: ${queryText}`, error);
        throw error;
    }
}

/**
 * Close all connections in the pool (for graceful shutdown)
 */
export async function closeAllConnections(): Promise<void> {
    if (pool) {
        await pool.end();
        console.log("✓ All database connections closed");
    }
}

// Default export to match how you import it in dbQueries.ts
export default {
    executeQuery,
    executeSingle,
    closeAllConnections
};