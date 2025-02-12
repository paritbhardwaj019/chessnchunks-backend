const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const dotenv = require('dotenv');
const path = require('path');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

dotenv.config({ path: path.join(__dirname, '../.env.test') });

exports.mochaHooks = {
  beforeAll: async function () {
    this.timeout(30000);

    try {
      await prisma.$executeRaw`DROP DATABASE IF EXISTS chess_chunks_test`;
      await prisma.$executeRaw`CREATE DATABASE chess_chunks_test`;

      await execAsync('npx prisma migrate deploy', {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
      });

      console.log('DATABASE setup successfully!');
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  },

  afterAll: async function () {
    await prisma.$disconnect();
  },
};
