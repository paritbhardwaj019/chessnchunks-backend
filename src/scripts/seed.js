const { PrismaClient, SYSTEM_CODE_MODULE } = require('@prisma/client');

const logger = require('../utils/logger');
const ROLE_CONSTANT = require('../constants');
const prisma = new PrismaClient();

/**
 * Define all routes and their respective actions.
 */
const routes = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    actions: ['view'],
  },
  {
    name: 'Academies',
    path: '/dashboard/academies',
    actions: ['view', 'add', 'update', 'delete'],
  },
  {
    name: 'Permissions',
    path: '/dashboard/permissions',
    actions: ['view', 'update'],
  },
  {
    name: 'Batches',
    path: '/dashboard/batches',
    actions: ['view', 'add', 'update', 'delete'],
  },
  {
    name: 'Platform Users',
    path: '/dashboard/platform-users',
    actions: ['view', 'add', 'update', 'delete'],
    subRoutes: [],
  },
  {
    name: 'Users',
    path: '/dashboard/users',
    actions: ['view'],
    subRoutes: [
      {
        name: 'List Students',
        path: '/dashboard/users/students',
        actions: ['view'],
      },
      {
        name: 'List Coaches',
        path: '/dashboard/users/coaches',
        actions: ['view'],
      },
      {
        name: 'Student Signups',
        path: '/dashboard/users/student-signups',
        actions: ['view', 'add', 'update', 'delete'],
      },
      {
        name: 'Coach Signups',
        path: '/dashboard/users/coach-signups',
        actions: ['view', 'add', 'update', 'delete'],
      },
    ],
  },
  {
    name: 'Invitations',
    path: '/dashboard/invitations',
    actions: ['view', 'add', 'update', 'delete'],
  },
  {
    name: 'Calendar',
    path: '/dashboard/calendar',
    actions: ['view', 'add', 'update', 'delete'],
  },
  {
    name: 'Communication',
    path: '/dashboard/communication',
    actions: ['view', 'add', 'update', 'delete'],
  },
  {
    name: 'Tasks',
    path: '/dashboard/tasks',
    actions: ['view'],
    subRoutes: [
      {
        name: 'Quizzes',
        path: '/dashboard/tasks/quizzes',
        actions: ['view', 'add', 'update', 'delete'],
      },
    ],
  },
  {
    name: 'Programs',
    path: '/dashboard/programs',
    actions: ['view', 'add', 'update', 'delete'],
    subRoutes: [],
  },
  {
    name: 'Students',
    path: '/dashboard/students',
    actions: ['view'],
    subRoutes: [
      {
        name: 'List Students',
        path: '/dashboard/students/list',
        actions: ['view'],
      },
      {
        name: 'Signups',
        path: '/dashboard/students/signups',
        actions: ['view', 'add', 'update', 'delete'],
      },
    ],
  },
  {
    name: 'Goals',
    path: '/dashboard/goals',
    actions: ['view'],
    subRoutes: [
      {
        name: 'Seasonal Goals',
        path: '/dashboard/goals/seasonal',
        actions: ['view', 'add'],
      },
      {
        name: 'Monthly Goals',
        path: '/dashboard/goals/monthly',
        actions: ['view', 'add'],
      },
      {
        name: 'Weekly Goals',
        path: '/dashboard/goals/weekly',
        actions: ['view', 'add'],
      },
      {
        name: 'Assign Weekly Goals',
        path: '/dashboard/goals/assign-weekly',
        actions: ['view', 'add'],
      },
    ],
  },
  {
    name: 'System Codes',
    path: '/dashboard/system-code',
    actions: ['view', 'add', 'update', 'delete'],
    subRoutes: [],
  },
  {
    name: 'Website',
    path: '/dashboard/website',
    actions: ['view', 'update'],
    subRoutes: [],
  },
  {
    name: 'Plans',
    path: '/dashboard/plans',
    actions: ['view', 'add', 'update', 'delete'],
    subRoutes: [],
  },
  {
    name: 'System Configurations',
    path: '/dashboard/system-config',
    actions: ['view', 'add', 'update', 'delete'],
    subRoutes: [],
  },
  {
    name: 'Reports',
    path: '/dashboard/reports',
    actions: ['view'],
    subRoutes: [
      {
        name: 'Batch Reports',
        path: '/dashboard/reports/batches',
        actions: ['view'],
      },
      {
        name: 'Enrollment Reports',
        path: '/dashboard/reports/enrollments',
        actions: ['view'],
      },
      {
        name: 'Student Reports',
        path: '/dashboard/reports/students',
        actions: ['view'],
      },
      {
        name: 'Target & Goals Report',
        path: '/dashboard/reports/target-goals',
        actions: ['view'],
      },
    ],
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    actions: ['view'],
    subRoutes: [
      {
        name: 'Profile Settings',
        path: '/dashboard/settings/profile',
        actions: ['view', 'update'],
      },
      {
        name: 'Admin Management',
        path: '/dashboard/settings/admins',
        actions: ['view', 'update'],
      },
      {
        name: 'Academy Settings',
        path: '/dashboard/settings/academy',
        actions: ['view', 'update'],
      },
    ],
  },
];

/**
 * Seed Roles into the database.
 */
async function seedRoles() {
  const roles = [
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
    ROLE_CONSTANT.ROLE.SUBSCRIBER,
  ];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
      },
    });
  }
  logger.info('Roles seeded successfully');
}

/**
 * Seed System Codes into the database.
 */
async function seedSystemCodes() {
  const systemCodes = [
    {
      module: SYSTEM_CODE_MODULE.BATCH,
      prefix: 'BAT',
      description: 'Batch number prefix',
      lastNumber: 0,
      isActive: true,
    },
    {
      module: SYSTEM_CODE_MODULE.PLAN,
      prefix: 'PLN',
      description: 'Plan number prefix',
      lastNumber: 0,
      isActive: true,
    },
    {
      module: SYSTEM_CODE_MODULE.USER_SIGNUP,
      prefix: 'USP',
      description: 'User signup number prefix',
      lastNumber: 0,
      isActive: true,
    },
    {
      module: SYSTEM_CODE_MODULE.USER,
      prefix: 'USR',
      description: 'User number prefix',
      lastNumber: 0,
      isActive: true,
    },
    {
      module: SYSTEM_CODE_MODULE.ACADEMY_PROGRAM,
      prefix: 'ACP',
      description: 'Academy program number prefix',
      lastNumber: 0,
      isActive: true,
    },
    {
      module: SYSTEM_CODE_MODULE.QUIZ,
      prefix: 'QZ',
      description: 'Quiz number prefix',
      lastNumber: 0,
      isActive: true,
    },
    {
      module: SYSTEM_CODE_MODULE.QUIZ_QUESTION,
      prefix: 'QQ',
      description: 'Quiz question number prefix',
      lastNumber: 0,
      isActive: true,
    },
    {
      module: SYSTEM_CODE_MODULE.TASK,
      prefix: 'TSK',
      description: 'Task number prefix',
      lastNumber: 0,
      isActive: true,
    },
  ];

  for (const code of systemCodes) {
    await prisma.systemCode.upsert({
      where: {
        module_prefix: {
          module: code.module,
          prefix: code.prefix,
        },
      },
      update: {},
      create: code,
    });
  }
  logger.info('System codes seeded successfully');
}

/**
 * Seed Permissions based on the defined routes.
 */
async function seedPermissions(routes) {
  for (const route of routes) {
    // Seed permissions for the main route
    for (const action of route.actions) {
      const permissionExists = await prisma.permission.findUnique({
        where: {
          resource_action: {
            resource: route.path,
            action,
          },
        },
      });

      if (!permissionExists) {
        await prisma.permission.create({
          data: {
            resource: route.path,
            action,
            description: `${action.toUpperCase()} ${route.name}`,
          },
        });
      }
    }

    // If the route has subRoutes, seed their permissions
    if (route.subRoutes && route.subRoutes.length > 0) {
      for (const subRoute of route.subRoutes) {
        for (const action of subRoute.actions) {
          const permissionExists = await prisma.permission.findUnique({
            where: {
              resource_action: {
                resource: subRoute.path,
                action,
              },
            },
          });

          if (!permissionExists) {
            await prisma.permission.create({
              data: {
                resource: subRoute.path,
                action,
                description: `${action.toUpperCase()} ${subRoute.name}`,
              },
            });
          }
        }
      }
    }
  }
  logger.info('Permissions seeded successfully');
}

/**
 * Assign specific permissions to a role.
 * @param {string} roleName - The name of the role.
 * @param {Array} permissions - Array of permission objects with path and actions.
 */
async function assignRolePermissions(roleName, permissions) {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    logger.error(`Role "${roleName}" not found.`);
    return;
  }

  for (const route of permissions) {
    for (const action of route.actions) {
      const permission = await prisma.permission.findUnique({
        where: {
          resource_action: {
            resource: route.path,
            action,
          },
        },
      });

      if (permission) {
        const rolePermissionExists = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
        });

        if (!rolePermissionExists) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
          logger.info(
            `Assigned permission "${action.toUpperCase()} ${
              route.path
            }" to role "${roleName}".`
          );
        }
      } else {
        logger.warn(
          `Permission "${action.toUpperCase()} ${
            route.path
          }" not found. Skipping assignment to role "${roleName}".`
        );
      }
    }

    if (route.subRoutes && route.subRoutes.length > 0) {
      for (const subRoute of route.subRoutes) {
        for (const action of subRoute.actions) {
          const permission = await prisma.permission.findUnique({
            where: {
              resource_action: {
                resource: subRoute.path,
                action,
              },
            },
          });

          if (permission) {
            const rolePermissionExists = await prisma.rolePermission.findUnique(
              {
                where: {
                  roleId_permissionId: {
                    roleId: role.id,
                    permissionId: permission.id,
                  },
                },
              }
            );

            if (!rolePermissionExists) {
              await prisma.rolePermission.create({
                data: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              });
              logger.info(
                `Assigned permission "${action.toUpperCase()} ${
                  subRoute.path
                }" to role "${roleName}".`
              );
            }
          } else {
            logger.warn(
              `Permission "${action.toUpperCase()} ${
                subRoute.path
              }" not found. Skipping assignment to role "${roleName}".`
            );
          }
        }
      }
    }
  }
}

/**
 * Assign specific permissions to SUPER_ADMIN.
 */
async function assignSuperAdminPermissions() {
  const superAdminRole = await prisma.role.findUnique({
    where: { name: ROLE_CONSTANT.ROLE.SUPER_ADMIN },
  });

  if (!superAdminRole) {
    logger.error('SUPER_ADMIN role not found.');
    return;
  }

  const superAdminPermissions = [
    { path: '/dashboard', actions: ['view'] },
    {
      path: '/dashboard/academies',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/invitations', actions: ['view'] },
    { path: '/dashboard/permissions', actions: ['view', 'update'] },
    { path: '/dashboard/system-code', actions: ['view', 'add'] },
    { path: '/dashboard/plans', actions: ['view', 'add', 'update', 'delete'] },
    { path: '/dashboard/settings', actions: ['view'] },
    { path: '/dashboard/settings/profile', actions: ['view', 'update'] },
    {
      path: '/dashboard/platform-users',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/system-config',
      actions: ['view', 'add', 'update', 'delete'],
    },
  ];

  await assignRolePermissions(
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    superAdminPermissions
  );
  logger.info('SUPER_ADMIN permissions assigned successfully.');
}

/**
 * Assign specific permissions to ADMIN.
 */
async function assignAdminPermissions() {
  const adminPermissions = [
    { path: '/dashboard', actions: ['view'] },
    {
      path: '/dashboard/batches',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/users', actions: ['view', 'add', 'update', 'delete'] },
    {
      path: '/dashboard/calendar',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/communication',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/goals', actions: ['view'] },
    { path: '/dashboard/goals/seasonal', actions: ['view', 'add'] },
    { path: '/dashboard/goals/monthly', actions: ['view', 'add'] },
    { path: '/dashboard/goals/weekly', actions: ['view', 'add'] },
    { path: '/dashboard/goals/assign-weekly', actions: ['view', 'add'] },
    { path: '/dashboard/website', actions: ['view', 'update'] },
    {
      path: '/dashboard/programs',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/students/list', actions: ['view'] },
    {
      path: '/dashboard/students/signups',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/reports', actions: ['view'] },
    { path: '/dashboard/reports/batches', actions: ['view'] },
    { path: '/dashboard/reports/enrollments', actions: ['view'] },
    { path: '/dashboard/reports/students', actions: ['view'] },
    { path: '/dashboard/reports/target-goals', actions: ['view'] },
    { path: '/dashboard/settings', actions: ['view', 'update'] },
    { path: '/dashboard/settings/profile', actions: ['view', 'update'] },
    { path: '/dashboard/settings/admins', actions: ['view', 'update'] },
    { path: '/dashboard/settings/academy', actions: ['view', 'update'] },
    {
      path: '/dashboard/users',
      actions: ['view'],
    },
    {
      path: '/dashboard/users/coaches',
      actions: ['view'],
    },
    {
      path: '/dashboard/users/coach-signups',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/users/students',
      actions: ['view'],
    },
    {
      path: '/dashboard/users/student-signups',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/system-config',
      actions: ['view'],
    },
  ];

  await assignRolePermissions(ROLE_CONSTANT.ROLE.ADMIN, adminPermissions);
  logger.info('ADMIN permissions assigned successfully.');
}

/**
 * Assign specific permissions to COACH.
 */
async function assignCoachPermissions() {
  const coachPermissions = [
    { path: '/dashboard/goals', actions: ['view', 'add', 'update', 'delete'] },
    {
      path: '/dashboard/goals/seasonal',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/goals/monthly',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/goals/weekly',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/goals/assign-weekly',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/students',
      actions: ['view'],
    },
    { path: '/dashboard/students/list', actions: ['view'] },
    {
      path: '/dashboard/students/signups',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/reports', actions: ['view'] },
    { path: '/dashboard/reports/batches', actions: ['view'] },
    { path: '/dashboard/reports/enrollments', actions: ['view'] },
    { path: '/dashboard/reports/students', actions: ['view'] },
    { path: '/dashboard/reports/target-goals', actions: ['view'] },
    { path: '/dashboard/settings/profile', actions: ['view', 'update'] },
    { path: '/dashboard/tasks', actions: ['view'] },
    {
      path: '/dashboard/tasks/quizzes',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/calendar', actions: ['view'] },
    { path: '/dashboard/users', actions: ['view', 'add'] },
    {
      path: '/dashboard/users',
      actions: ['view'],
    },
    {
      path: '/dashboard/users/students',
      actions: ['view'],
    },
    {
      path: '/dashboard/users/student-signups',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/system-config',
      actions: ['view'],
    },
  ];

  await assignRolePermissions(ROLE_CONSTANT.ROLE.COACH, coachPermissions);
  logger.info('COACH permissions assigned successfully.');
}

async function assignStudentPermissions() {
  const studentPermissions = [
    { path: '/dashboard', actions: ['view'] },
    { path: '/dashboard/goals', actions: ['view'] },
    { path: '/dashboard/reports', actions: ['view'] },
    { path: '/dashboard/settings/profile', actions: ['view', 'update'] },
    {
      path: '/dashboard/system-config',
      actions: ['view'],
    },
  ];

  await assignRolePermissions(ROLE_CONSTANT.ROLE.STUDENT, studentPermissions);
  logger.info('STUDENT permissions assigned successfully.');
}

async function assignSubscriberPermissions() {
  const subscriberPermissions = [
    { path: '/dashboard', actions: ['view'] },
    { path: '/dashboard/settings/profile', actions: ['view', 'update'] },
    {
      path: '/dashboard/system-config',
      actions: ['view'],
    },
  ];

  await assignRolePermissions(
    ROLE_CONSTANT.ROLE.SUBSCRIBER,
    subscriberPermissions
  );
  logger.info('SUBSCRIBER permissions assigned successfully.');
}

/**
 * Setup Role Permissions by assigning permissions to each role.
 */
async function setupRolePermissions() {
  await assignSuperAdminPermissions();
  await assignAdminPermissions();
  await assignCoachPermissions();
  await assignStudentPermissions();
  await assignSubscriberPermissions();

  logger.info('All role permissions assigned successfully.');
}

/**
 * Seed Permissions and Assign to Roles.
 */
async function seedAndAssignPermissions() {
  // Seed permissions based on routes
  await seedPermissions(routes);

  // Assign permissions to roles
  await setupRolePermissions();
}

/**
 * Seed System Configurations into the database.
 */
async function seedSystemConfigs() {
  const systemConfigs = [
    {
      type: 'PROGRAM_TYPE',
      code: 'P1',
      label: 'P1 - Coaching',
      description: 'Coaching Program',
      order: 1,
      isActive: true,
    },
    {
      type: 'PROGRAM_TYPE',
      code: 'P2',
      label: 'P2 - In person Tournaments',
      description: 'In-person Tournaments Program',
      order: 2,
      isActive: true,
    },
    {
      type: 'PROGRAM_TYPE',
      code: 'P3',
      label: 'P3 - Chess Camps',
      description: 'Chess Camps Program',
      order: 3,
      isActive: true,
    },
    {
      type: 'PROGRAM_TYPE',
      code: 'P4',
      label: 'P4 - Online Tournaments',
      description: 'Online Tournaments Program',
      order: 4,
      isActive: true,
    },
    {
      type: 'QUESTION_TYPE',
      code: 'MCQ',
      label: 'Multiple Choice',
      description: 'Multiple Choice Question',
      order: 1,
      isActive: true,
    },
    {
      type: 'QUESTION_TYPE',
      code: 'TRUE_FALSE',
      label: 'True/False',
      description: 'True or False Question',
      order: 2,
      isActive: true,
    },
    {
      type: 'QUESTION_TYPE',
      code: 'FILL_BLANKS',
      label: 'Fill in the Blanks',
      description: 'Fill in the Blanks Question',
      order: 3,
      isActive: true,
    },
    {
      type: 'QUESTION_TYPE',
      code: 'SHORT_ANSWER',
      label: 'Short Answer',
      description: 'Short Answer Question',
      order: 4,
      isActive: true,
    },
    {
      type: 'QUESTION_TYPE',
      code: 'LONG_ANSWER',
      label: 'Long Answer',
      description: 'Long Answer Question',
      order: 5,
      isActive: true,
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: {
        type_code: {
          type: config.type,
          code: config.code,
        },
      },
      update: { ...config },
      create: config,
    });
  }
  logger.info('System configurations seeded successfully');
}

/**
 * Main function to run the seeding process.
 */
async function main() {
  try {
    await seedRoles();
    await seedAndAssignPermissions();
    await seedSystemCodes();
    await seedSystemConfigs();
    logger.info('Seeding process completed successfully.');
  } catch (error) {
    logger.error('Error during seeding process:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    logger.error(`Error in seeding: ${e.message || e}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    logger.info('Seed done ✅');
  });
