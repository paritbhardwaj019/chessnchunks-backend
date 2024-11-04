const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

async function main() {
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
      name: 'Users',
      path: '/dashboard/users',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      name: 'Invitations',
      path: '/dashboard/invitations',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      name: 'Communication',
      path: '/dashboard/communication',
      actions: ['view', 'add', 'update', 'delete'],
    },
    {
      name: 'Goals',
      path: '/dashboard/goals',
      actions: ['view'],
      subRoutes: [
        {
          name: 'Seasonal Goals',
          path: '/dashboard/goals/seasonal',
          actions: ['view', 'add', 'update', 'delete'],
        },
        {
          name: 'Monthly Goals',
          path: '/dashboard/goals/monthly',
          actions: ['view', 'add', 'update', 'delete'],
        },
        {
          name: 'Weekly Goals',
          path: '/dashboard/goals/weekly',
          actions: ['view', 'add', 'update', 'delete'],
        },
        {
          name: 'Assign Weekly Goals',
          path: '/dashboard/goals/assign-weekly',
          actions: ['view', 'add', 'update', 'delete'],
        },
      ],
    },
    {
      name: 'Tasks',
      path: '/dashboard/tasks',
      actions: ['view', 'add', 'update', 'delete'],
      subRoutes: [
        {
          name: 'Puzzles',
          path: '/dashboard/tasks/puzzles',
          actions: ['view', 'add', 'update', 'delete'],
        },
      ],
    },
    {
      name: 'Settings',
      path: '/dashboard/settings',
      actions: ['view', 'update'],
    },
  ];

  for (const route of routes) {
    for (const action of route.actions) {
      await prisma.permission.upsert({
        where: { resource_action: { resource: route.path, action } },
        update: {},
        create: {
          resource: route.path,
          action,
          description: `${action} ${route.name}`,
        },
      });
    }

    if (route.subRoutes) {
      for (const subRoute of route.subRoutes) {
        for (const action of subRoute.actions) {
          await prisma.permission.upsert({
            where: { resource_action: { resource: subRoute.path, action } },
            update: {},
            create: {
              resource: subRoute.path,
              action,
              description: `${action} ${subRoute.name}`,
            },
          });
        }
      }
    }
  }

  const allPermissions = await prisma.permission.findMany();

  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
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
