const { PrismaClient, SYSTEM_CODE_MODULE } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

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
}

async function seedRoles() {
  const roles = ['SUPER_ADMIN', 'ADMIN', 'COACH', 'STUDENT', 'SUBSCRIBER'];

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

async function assignRolePermissions(roleName, permissions) {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });

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
        }
      }
    }
  }
}

async function setupRolePermissions() {
  const superAdminPermissions = [
    { path: '/dashboard', actions: ['view'] },
    {
      path: '/dashboard/academies',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/invitations', actions: ['view'] },
    { path: '/dashboard/users', actions: ['view'] },
    { path: '/dashboard/permissions', actions: ['view', 'update'] },
    { path: '/dashboard/system-code', actions: ['view', 'add'] },
    { path: '/dashboard/plans', actions: ['view', 'add', 'update', 'delete'] },
    { path: '/dashboard/settings', actions: ['view'] },
    { path: '/dashboard/settings/profile', actions: ['view', 'update'] },
  ];

  const adminPermissions = [
    { path: '/dashboard', actions: ['view'] },
    {
      path: '/dashboard/batches',
      actions: ['view', 'add', 'update', 'delete'],
    },
    { path: '/dashboard/users', actions: ['view', 'add', 'update', 'delete'] },
    {
      path: '/dashboard/invitations',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/calendar',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      path: '/dashboard/communication',
      actions: ['view', 'add', 'update', 'delete'],
    },
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
      path: '/dashboard/website',
      actions: ['view', 'add', 'update', 'delete'],
    },
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
  ];

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
    { path: '/dashboard/tasks', actions: ['view', 'add', 'update', 'delete'] },
    { path: '/dashboard/calendar', actions: ['view'] },
    { path: '/dashboard/users', actions: ['view', 'add'] },
  ];

  await assignRolePermissions('SUPER_ADMIN', superAdminPermissions);
  await assignRolePermissions('ADMIN', adminPermissions);
  await assignRolePermissions('COACH', coachPermissions);
}

async function main() {
  try {
    await seedRoles();

    await seedSystemCodes();
    logger.info('System codes seeded successfully');

    await setupRolePermissions();
    logger.info('Role permissions setup completed successfully');
  } catch (error) {
    console.error('Error in seeding process:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    logger.info('Seed done ✅');
    await prisma.$disconnect();
  });
