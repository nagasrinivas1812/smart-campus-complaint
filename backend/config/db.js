const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (mongoUri) {
        try {
            const maskedUri = mongoUri.replace(/:([^:@]{1,})@/, ':****@');
            console.log(`⏳ Attempting to connect to MongoDB at: ${maskedUri}`);
            const conn = await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 8000,
            });
            console.log(`\n======================================================`);
            console.log(`📡 MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
            console.log(`🧭 Open MongoDB Compass and connect using:`);
            console.log(`   👉 ${maskedUri}`);
            console.log(`======================================================\n`);
            return;
        } catch (error) {
            console.warn(`⚠️ Could not connect to configured MONGO_URI (${error.message}).`);
            console.log(`🔄 Launching In-Memory MongoDB Server for local use & Compass...`);
        }
    }

    try {
        try {
            mongoServer = await MongoMemoryServer.create({
                instance: { port: 27017, dbName: 'campus_db' }
            });
        } catch (e) {
            mongoServer = await MongoMemoryServer.create({
                instance: { dbName: 'campus_db' }
            });
        }

        const baseUri = mongoServer.getUri();
        const uri = baseUri.endsWith('/') ? `${baseUri}campus_db` : `${baseUri}/campus_db`;
        const conn = await mongoose.connect(uri);

        console.log(`\n======================================================`);
        console.log(`📡 MongoDB Connected (In-Memory Server Running)`);
        console.log(`🧭 Open MongoDB Compass and connect with this URI:`);
        console.log(`   👉 ${uri}`);
        console.log(`   (Or default: mongodb://localhost:27017)`);
        console.log(`📁 Database Name: campus_db`);
        console.log(`======================================================\n`);
    } catch (err) {
        console.error(`❌ Database Connection Error: ${err.message}`);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    if (mongoServer) await mongoServer.stop();
    process.exit(0);
});

module.exports = connectDB;

