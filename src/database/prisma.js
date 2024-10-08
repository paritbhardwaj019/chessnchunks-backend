const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function testDatabaseConnection() {
    try {
      await db.$connect(); // Try to connect to the database
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Error connecting to the database:', error);
    }
  }
  
  testDatabaseConnection();

module.exports = db;
