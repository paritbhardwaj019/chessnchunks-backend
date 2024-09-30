const fs = require("fs");
const path = require("path");
const db = require("../database/prisma");
const logger = require("./logger");

async function deleteAllData(orderedFileNames) {
  for (let i = 0; i < orderedFileNames.length; i++) {
    const fileName = orderedFileNames[i];
    const schemaName = path.basename(fileName, path.extname(fileName));

    try {
      await db[schemaName].deleteMany({});

      logger.info(`Cleared data from ${schemaName}`);
    } catch (error) {
      console.error(`Error clearing data from ${schemaName}:`, error);
    }
  }
}

async function main() {
  const mainDirectory = path.join(__dirname, "../data");

  const orderedFileNames = ["role.json"];

  await deleteAllData(orderedFileNames);

  for (let i = 0; i < orderedFileNames.length; i++) {
    const fileName = orderedFileNames[i];
    const filePath = path.join(mainDirectory, fileName);
    const fileData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const schemaName = path.basename(fileName, path.extname(fileName));

    try {
      for (let j = 0; j < fileData.length; j++) {
        await db[schemaName].create({ data: fileData[j] });
      }
      logger.info(`Seeded ${schemaName} from ${fileName}`);
    } catch (error) {
      logger.error(`Error seeding data for ${schemaName}`, error);
    }
  }
}

main()
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
