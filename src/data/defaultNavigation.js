const defaultNavigation = [
  {
    title: 'Home',
    slug: '/home',
    order: 1,
    subItems: [
      {
        title: 'Dashboard',
        slug: '/dashboard',
        order: 1,
      },
    ],
  },
  {
    title: 'Chess coaching',
    slug: '/chess-coaching',
    order: 2,
  },
  {
    title: 'Upcoming events',
    slug: '/events',
    order: 3,
  },
  {
    title: 'About Us',
    slug: '/about',
    order: 4,
    subItems: [
      {
        title: 'History of the academy',
        slug: '/about/history',
        order: 1,
      },
      {
        title: 'Coaches directory',
        slug: '/about/coaches',
        order: 2,
      },
      {
        title: 'Students Achievements',
        slug: '/about/achievements',
        order: 3,
      },
    ],
  },
];

module.exports = { defaultNavigation };
