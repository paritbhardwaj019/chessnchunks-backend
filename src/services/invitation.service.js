const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const xlsx = require('xlsx');
const fs = require('fs');

const xlsxUploadHandler = async (file, loggedInUser) => {
  if (!file.path)
    throw new ApiError(httpStatus.BAD_REQUEST, 'File is missing!');

  const ROLE_MAPPING = {
    1: 'SUPER_ADMIN',
    2: 'MAIN_ADMIN',
    3: 'ADMIN',
    4: 'COACH',
    5: 'STUDENT',
    7: 'SUBSCRIBER',
  };

  const COACH_ROLE_MAPPING = {
    1: 'HEAD_COACH',
    2: 'SENIOR_COACH',
    3: 'JUNIOR_COACH',
    4: 'PUZZLE_MASTER',
    5: 'PUZZLE_MASTER_SCHOLAR',
  };

  const readedFile = xlsx.readFile(file.path);
  const sheetNames = readedFile.SheetNames;

  const allData = [];

  for (let i = 0; i < sheetNames.length; i++) {
    const parseSheetData = xlsx.utils.sheet_to_json(
      readedFile.Sheets[sheetNames[i]]
    );

    for (const {
      ['FIRST NAME']: firstName,
      ['LAST NAME']: lastName,
      ['EMAIL']: email,
      ['ROLE']: role,
      ['SUB_ROLE']: subRole,
    } of parseSheetData) {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        allData.push({
          type: 'USER_INVITATION',
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          createdBy: loggedInUser.id,
          data: {
            firstName,
            lastName,
            email,
            role: ROLE_MAPPING[role],
            subRole: COACH_ROLE_MAPPING[subRole],
          },
          email,
        });
      }
    }
  }

  const insertedInvitations = await db.invitation.createMany({
    data: allData,
    skipDuplicates: true,
  });

  fs.unlinkSync(file.path);

  return insertedInvitations;
};

const fetchAllInvitationsHandler = async (page, limit, type) => {
  const allInvitations = await db.invitation.findMany({
    where: {
      type,
    },
    select: {
      id: true,
      type: true,
      email: true,
      data: true,
      status: true,
    },
  });

  return allInvitations;
};

const invitationService = { xlsxUploadHandler, fetchAllInvitationsHandler };

module.exports = invitationService;
