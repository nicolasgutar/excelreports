const Config = {
    // Database Configuration
    DB_URL: process.env.DB_URL || '',

    // Application Settings
    DEFAULT_TRANSACTION_LIMIT: parseInt(process.env.DEFAULT_TRANSACTION_LIMIT || '1000', 10),

    // Date Range Settings
    REPORT_START_DATE: process.env.REPORT_START_DATE || null,
    REPORT_END_DATE: process.env.REPORT_END_DATE || null,

    getDbConfig() {
        return {
            connectionString: this.DB_URL
        };
    },

    validate() {
        if (!this.DB_URL) {
            console.warn("⚠ WARNING: DB_URL is not set!");
            console.warn("   Set DB_URL environment variable in .env file");
            return false;
        }
        return true;
    },

    printConfig() {
        console.log("\n=== Configuration ===");
        if (this.DB_URL) {
            try {
                const url = new URL(this.DB_URL);
                console.log(`Database URL: postgresql://${url.username}:***@${url.host}${url.pathname}`);
            } catch (e) {
                console.log("Database URL: [configured, but invalid format]");
            }
        } else {
            console.log("Database URL: (not set)");
        }
        console.log(`Transaction Limit: ${this.DEFAULT_TRANSACTION_LIMIT}`);
        if (this.REPORT_START_DATE) {
            console.log(`Report Start Date: ${this.REPORT_START_DATE}`);
        }
        if (this.REPORT_END_DATE) {
            console.log(`Report End Date: ${this.REPORT_END_DATE}`);
        }
        console.log("====================\n");
    }
};

export default Config;
