const db = require('../database/prisma');
const logger = require('./logger');

const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True/False' },
  { value: 'fill-blanks', label: 'Fill in the Blanks' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'long-answer', label: 'Long Answer' },
];

const PROGRAM_TYPES = [
  {
    code: 'P1',
    label: 'P1 - Coaching',
    description: 'Coaching Program',
  },
  {
    code: 'P2',
    label: 'P2 - In person Tournaments',
    description: 'In-person Tournaments Program',
  },
  {
    code: 'P3',
    label: 'P3 - Chess Camps',
    description: 'Chess Camps Program',
  },
  {
    code: 'P4',
    label: 'P4 - Online Tournaments',
    description: 'Online Tournaments Program',
  },
];

const getSystemConfigSeeds = (academyId) => {
  const configSeeds = [
    ...QUESTION_TYPES.map((type, index) => ({
      type: 'QUESTION_TYPE',
      code: type.value.toUpperCase(),
      label: type.label,
      description: `${type.label} Question Type`,
      order: index + 1,
      isActive: true,
      academyId,
    })),

    ...DAYS_OF_WEEK.map((day, index) => ({
      type: 'BATCH_DAY',
      code: day.value.substring(0, 3).toUpperCase(),
      label: day.label,
      description: `${day.label} Classes`,
      order: index + 1,
      isActive: true,
      academyId,
    })),

    ...PROGRAM_TYPES.map((program, index) => ({
      type: 'PROGRAM_TYPE',
      code: program.code,
      label: program.label,
      description: program.description,
      order: index + 1,
      isActive: true,
      academyId,
    })),
  ];

  return configSeeds;
};

const seedSystemConfigs = async (academyId, log = false) => {
  const configSeeds = getSystemConfigSeeds(academyId);

  for (const config of configSeeds) {
    await db.systemConfig.upsert({
      where: {
        academyId_type_code: {
          academyId: config.academyId,
          type: config.type,
          code: config.code,
        },
      },
      update: { ...config },
      create: config,
    });
  }

  if (log) {
    logger.info('System config initialized successfully!');
  }
};

module.exports = {
  DAYS_OF_WEEK,
  QUESTION_TYPES,
  PROGRAM_TYPES,
  getSystemConfigSeeds,
  seedSystemConfigs,
};
