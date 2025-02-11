const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const dotenv = require('dotenv');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

dotenv.config({ path: '.env.test' });

exports.mochaHooks = {
  beforeAll: async function () {
    this.timeout(10000);

    try {
      await prisma.$executeRaw`DROP DATABASE IF EXISTS chess_chunks_test`;
      await prisma.$executeRaw`CREATE DATABASE chess_chunks_test`;

      await execAsync('npx prisma migrate deploy', {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
      });
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  },

  afterAll: async function () {
    await prisma.$disconnect();
  },
};
