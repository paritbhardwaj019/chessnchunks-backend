const defaultPages = [
  {
    title: 'Home',
    slug: '/home',
    status: 'PUBLISHED',
    isHome: true,
    components: {
      create: [
        {
          type: 'HERO_SECTION',
          props: {
            title: 'Welcome to Excellence in Chess',
            subtitle: 'Develop your chess skills with expert guidance',
            image: '/hero-chess.jpg',
            className: {
              container: 'relative h-[600px] flex items-center justify-center',
              content: 'text-center space-y-6 z-10 relative',
              title: 'text-5xl font-bold text-white mb-4',
              subtitle: 'text-xl text-gray-200',
              overlay: 'absolute inset-0 bg-black bg-opacity-50',
            },
          },
          order: 1,
        },
        {
          type: 'PROGRAM_LIST',
          props: {
            title: 'Our Programs',
            programs: [
              {
                title: 'Beginner Classes',
                description: 'Perfect for those starting their chess journey',
                icon: '♟️',
              },
              {
                title: 'Advanced Training',
                description: 'For competitive players looking to excel',
                icon: '♔',
              },
              {
                title: 'Tournament Prep',
                description: 'Specialized training for tournament players',
                icon: '🏆',
              },
            ],
            className: {
              container: 'py-16 bg-gray-900',
              title: 'text-3xl font-bold text-center text-white mb-12',
              grid: 'grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4',
              card: 'bg-gray-800 p-6 rounded-lg shadow-lg text-center',
              icon: 'text-4xl mb-4',
              programTitle: 'text-xl font-bold text-white mb-2',
              description: 'text-gray-400',
            },
          },
          order: 2,
        },
        {
          type: 'COACH_PROFILE',
          props: {
            title: 'Meet Our Coaches',
            coaches: [
              {
                name: 'Master John Doe',
                title: 'FIDE Master',
                rating: '2300+',
                image: '/coach1.jpg',
              },
              {
                name: 'Sarah Smith',
                title: 'International Master',
                rating: '2400+',
                image: '/coach2.jpg',
              },
            ],
            className: {
              container: 'py-16 bg-gray-800',
              title: 'text-3xl font-bold text-center text-white mb-12',
              grid: 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4',
              card: 'bg-gray-900 p-6 rounded-lg shadow-lg',
              image: 'w-32 h-32 rounded-full mx-auto mb-4',
              name: 'text-xl font-bold text-white text-center',
              rating: 'text-red-500 font-bold text-center mt-2',
            },
          },
          order: 3,
        },
      ],
    },
  },
  {
    title: 'About Us',
    slug: '/about',
    status: 'PUBLISHED',
    components: {
      create: [
        {
          type: 'PAGE_HEADER',
          props: {
            title: 'About Our Academy',
            subtitle: 'Building Chess Champions Since 2020',
            className: 'text-center py-12 space-y-4',
          },
          order: 1,
        },
        {
          type: 'TEXT_BLOCK',
          props: {
            content: [
              {
                paragraph:
                  'We are dedicated to nurturing chess talent and promoting the royal game through structured, comprehensive training programs. Our academy combines traditional chess wisdom with modern teaching methods to create an engaging learning experience.',
              },
              {
                paragraph:
                  'With a team of experienced coaches and a proven curriculum, we help players of all levels achieve their chess goals.',
              },
            ],
            className: {
              container: 'max-w-3xl mx-auto px-4 py-6',
              paragraph: 'text-gray-300 mb-4 leading-relaxed',
            },
          },
          order: 2,
        },
        {
          type: 'ACHIEVEMENT_SHOWCASE',
          props: {
            title: 'Our Achievements',
            achievements: [
              { number: '500+', text: 'Students Trained' },
              { number: '50+', text: 'Tournament Winners' },
              { number: '15+', text: 'National Champions' },
              { number: '100%', text: 'Rating Improvement' },
            ],
            className: {
              container: 'py-16 bg-gray-800',
              title: 'text-3xl font-bold text-center text-white mb-12',
              grid: 'grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto px-4',
              item: 'text-center',
              number: 'text-4xl font-bold text-red-500 mb-2',
              text: 'text-gray-300',
            },
          },
          order: 3,
        },
        {
          type: 'TESTIMONIAL',
          props: {
            testimonials: [
              {
                text: 'The structured approach to learning chess here has completely transformed my game.',
                author: 'Alex Johnson',
                rating: 'Rating improved by 300 points',
              },
              {
                text: "Best chess coaching experience I've had. The coaches are incredibly knowledgeable and supportive.",
                author: 'Maria Garcia',
                rating: 'National Junior Champion',
              },
            ],
            className: {
              container: 'py-16 bg-gray-900',
              grid: 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4',
              card: 'bg-gray-800 p-6 rounded-lg shadow-lg',
              text: 'text-gray-300 italic mb-4',
              author: 'text-white font-bold',
              rating: 'text-red-500',
            },
          },
          order: 4,
        },
      ],
    },
  },
  {
    title: 'Chess Coaching',
    slug: '/chess-coaching',
    status: 'PUBLISHED',
    components: {
      create: [
        {
          type: 'PAGE_HEADER',
          props: {
            title: 'CHESS COACHING',
            subtitle: 'Expert chess instruction for all levels',
            className: 'text-center py-12 space-y-4',
          },
          order: 1,
        },
        {
          type: 'SEPARATOR',
          props: {
            color: 'red-800',
            width: 'full',
            marginY: 8,
            className:
              'border-b-2 border-red-800 w-full my-8 mx-auto max-w-4xl',
          },
          order: 2,
        },
        {
          type: 'TEXT_BLOCK',
          props: {
            title: 'Classes offered at 4 different levels:',
            content: [
              { level: 'Novice', description: 'New player to 800' },
              { level: 'Beginner', description: 'Ratings between 800 to 1200' },
              {
                level: 'Intermediate',
                description: 'Ratings between 1200 to 1600',
              },
              { level: 'Advanced', description: 'Ratings 1600+' },
            ],
            className: {
              container: 'max-w-3xl mx-auto px-4 py-6',
              title: 'text-2xl font-bold mb-6 text-gray-100',
              list: 'space-y-4',
              item: 'flex flex-col md:flex-row md:items-center md:justify-between bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700',
              level: 'font-semibold text-lg text-gray-100',
              description: 'text-gray-400',
            },
          },
          order: 3,
        },
        {
          type: 'SECTION_HEADER',
          props: {
            title: 'UPCOMING GROUP COACHING BATCHES',
            className: {
              container: 'text-center py-12',
              title: 'text-3xl font-bold text-gray-100 mb-8',
            },
          },
          order: 4,
        },
        {
          type: 'CHESS_BATCH',
          props: {
            title: 'NEW Novice Coaching Batch',
            details: {
              startDate: 'SAT, SEP 7th 2024',
              totalClasses: '16 classes',
              time: 'SAT 10:30 to 11:30 AM CST',
              fees: '$150 ($50 off if referred)',
            },
            className: {
              container:
                'bg-gray-800 border-gray-700 text-gray-100 rounded-lg shadow-lg overflow-hidden mb-8',
              header: 'text-center p-4',
              title: 'text-xl font-bold',
              content: 'p-4 space-y-4',
              detailRow:
                'flex justify-between items-center border-b border-gray-700 py-2 last:border-0',
              label: 'text-gray-400',
              value: 'text-gray-100',
              contact:
                'w-full py-2 px-4 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors text-center',
            },
          },
          order: 5,
        },
        {
          type: 'CHESS_BATCH',
          props: {
            title: 'NEW Novice Coaching Batch',
            details: {
              startDate: 'TBD (Early 2024)',
              totalClasses: '16 classes',
              time: 'TBD (Every SAT 11:30 to 12:30 AM CST)',
              fees: '$150 ($50 off if referred)',
            },
            className: {
              container:
                'bg-gray-800 border-gray-700 text-gray-100 rounded-lg shadow-lg overflow-hidden mb-8',
              header: 'text-center p-4',
              title: 'text-xl font-bold',
              content: 'p-4 space-y-4',
              detailRow:
                'flex justify-between items-center border-b border-gray-700 py-2 last:border-0',
              label: 'text-gray-400',
              value: 'text-gray-100',
              contact:
                'w-full py-2 px-4 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors text-center',
            },
          },
          order: 6,
        },
      ],
    },
  },
  {
    title: 'Upcoming Events',
    slug: '/events',
    status: 'PUBLISHED',
    components: {
      create: [
        {
          type: 'PAGE_HEADER',
          props: {
            title: 'Upcoming Chess Events',
            subtitle: 'Tournaments, Workshops, and Special Programs',
            className: 'text-center py-12 space-y-4',
          },
          order: 1,
        },
        {
          type: 'SEPARATOR',
          props: {
            color: 'red-800',
            width: 'full',
            marginY: 8,
            className:
              'border-b-2 border-red-800 w-full my-8 mx-auto max-w-4xl',
          },
          order: 2,
        },
        {
          type: 'TEXT_BLOCK',
          props: {
            title: 'Upcoming Chess Tournaments and Events',
            content: [
              {
                paragraph:
                  'Stay informed about our exciting lineup of chess tournaments, workshops, and special events designed to challenge and inspire players of all levels.',
              },
              {
                paragraph:
                  'From local competitions to national championships, we provide opportunities for growth and competition.',
              },
            ],
            className: {
              container: 'max-w-3xl mx-auto px-4 py-6',
              title: 'text-2xl font-bold mb-6 text-gray-100',
              paragraph: 'text-gray-300 mb-4 leading-relaxed',
            },
          },
          order: 3,
        },
        {
          type: 'CHESS_BATCH',
          props: {
            title: 'Regional Chess Tournament',
            details: {
              startDate: 'SAT, OCT 15th 2024',
              totalClasses: 'One-Day Tournament',
              time: '9:00 AM to 5:00 PM CST',
              fees: '$50 Entry Fee',
            },
            className: {
              container:
                'bg-gray-800 border-gray-700 text-gray-100 rounded-lg shadow-lg overflow-hidden mb-8',
              header: 'text-center p-4',
              title: 'text-xl font-bold',
              content: 'p-4 space-y-4',
              detailRow:
                'flex justify-between items-center border-b border-gray-700 py-2 last:border-0',
              label: 'text-gray-400',
              value: 'text-gray-100',
              contact:
                'w-full py-2 px-4 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors text-center',
            },
          },
          order: 4,
        },
        {
          type: 'CHESS_BATCH',
          props: {
            title: 'Winter Chess Workshop',
            details: {
              startDate: 'DEC 20-22, 2024',
              totalClasses: '3-Day Intensive Workshop',
              time: '10:00 AM to 4:00 PM CST',
              fees: '$200 (Limited Seats)',
            },
            className: {
              container:
                'bg-gray-800 border-gray-700 text-gray-100 rounded-lg shadow-lg overflow-hidden mb-8',
              header: 'text-center p-4',
              title: 'text-xl font-bold',
              content: 'p-4 space-y-4',
              detailRow:
                'flex justify-between items-center border-b border-gray-700 py-2 last:border-0',
              label: 'text-gray-400',
              value: 'text-gray-100',
              contact:
                'w-full py-2 px-4 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors text-center',
            },
          },
          order: 5,
        },
      ],
    },
  },
  {
    title: 'History of the academy',
    slug: '/about/history',
    status: 'PUBLISHED',
    components: {
      create: [
        {
          type: 'PAGE_HEADER',
          props: {
            title: 'History of the academy',
            subtitle: 'A journey through our legacy',
            className: 'text-center py-12 space-y-4',
          },
          order: 1,
        },
        {
          type: 'TEXT_BLOCK',
          props: {
            content: [
              {
                paragraph:
                  'Founded in 2020, our academy began with a vision to revolutionize chess education by combining traditional wisdom with modern teaching methods.',
              },
            ],
            className: {
              container: 'max-w-3xl mx-auto px-4 py-6',
              paragraph: 'text-gray-300 mb-4 leading-relaxed',
            },
          },
          order: 2,
        },
        {
          type: 'TIMELINE_SECTION',
          props: {
            events: [
              {
                year: '2020',
                title: 'Academy Foundation',
                description:
                  'Established with 3 experienced coaches and 50 students.',
              },
              {
                year: '2021',
                title: 'First Tournament Success',
                description:
                  'Our students won 5 national titles, putting us on the map.',
              },
              {
                year: '2022',
                title: 'International Recognition',
                description:
                  'Expanded to online coaching, reaching students globally.',
              },
              {
                year: '2023',
                title: 'Program Expansion',
                description:
                  'Launched advanced training programs and specialized workshops.',
              },
              {
                year: '2024',
                title: 'Major Milestone',
                description:
                  'Celebrating 500+ students and a 100% rating improvement record.',
              },
            ],
          },
          order: 3,
        },
      ],
    },
  },

  {
    title: 'Coaches directory',
    slug: '/about/coaches',
    status: 'PUBLISHED',
    components: {
      create: [
        {
          type: 'PAGE_HEADER',
          props: {
            title: 'Our Expert Coaches',
            subtitle: 'Meet the masters behind our success',
            className: 'text-center py-12 space-y-4',
          },
          order: 1,
        },
        {
          type: 'COACH_GRID',
          props: {
            coaches: [
              {
                name: 'Grandmaster John Smith',
                title: 'Head Coach',
                rating: '2500+',
                image: '/coaches/john-smith.jpg',
                specialties: [
                  'Advanced Strategy',
                  'Tournament Preparation',
                  'Endgame Mastery',
                ],
                achievements: [
                  'International Grandmaster Title',
                  '3-time National Champion',
                  'FIDE Certified Trainer',
                ],
                availability: 'Full-time',
              },
              {
                name: 'Sarah Chen',
                title: 'Senior Coach',
                rating: '2350+',
                image: '/coaches/sarah-chen.jpg',
                specialties: [
                  'Opening Preparation',
                  'Youth Training',
                  'Online Coaching',
                ],
                achievements: [
                  'International Master',
                  "Women's Grandmaster",
                  'Asian Chess Champion 2020',
                ],
                availability: 'Evenings & Weekends',
              },
              {
                name: 'Michael Rodriguez',
                title: 'Junior Coach',
                rating: '2200+',
                image: '/coaches/michael-rodriguez.jpg',
                specialties: [
                  'Beginner Development',
                  'Tactical Training',
                  'Chess Psychology',
                ],
                achievements: [
                  'FIDE Master',
                  'State Champion 2022',
                  'Best Coach Award 2023',
                ],
                availability: 'Weekends Only',
              },
            ],
          },
          order: 2,
        },
      ],
    },
  },
  {
    title: 'Students Achievements',
    slug: '/about/achievements',
    status: 'PUBLISHED',
    components: {
      create: [
        {
          type: 'PAGE_HEADER',
          props: {
            title: 'Student Achievements',
            subtitle: 'Celebrating excellence in chess',
            className: 'text-center py-12 space-y-4',
          },
          order: 1,
        },
        {
          type: 'TEXT_BLOCK',
          props: {
            content: [
              {
                paragraph:
                  'Our students consistently demonstrate exceptional growth and achievement in chess. Here are some of our recent success stories.',
              },
            ],
            className: {
              container: 'max-w-3xl mx-auto px-4 py-6',
              paragraph: 'text-gray-300 mb-4 leading-relaxed',
            },
          },
          order: 2,
        },
        {
          type: 'ACHIEVEMENTS_GRID',
          props: {
            achievements: [
              {
                studentName: 'Emma Watson',
                title: 'National Junior Champion',
                date: 'December 2023',
                description:
                  'Won the U16 National Championship with a perfect score.',
                tournament: 'National Junior Chess Championship',
                ratingGain: 150,
                image: '/achievements/national-junior.jpg',
              },
              {
                studentName: 'Alex Thompson',
                title: 'International Master Norm',
                date: 'October 2023',
                description:
                  'Achieved first IM norm at the International Open.',
                tournament: 'European Chess Open',
                ratingGain: 85,
                image: '/achievements/im-norm.jpg',
              },
              {
                studentName: 'David Park',
                title: 'State Champion',
                date: 'September 2023',
                description:
                  'Dominated the state championship with remarkable endgame performances.',
                tournament: 'State Chess Championship',
                ratingGain: 120,
                image: '/achievements/state-champ.jpg',
              },
              {
                studentName: 'Sarah Martinez',
                title: 'Rapid Chess Master',
                date: 'August 2023',
                description:
                  'Achieved master rating in rapid chess with consistent performances.',
                tournament: 'Online Rapid Series',
                ratingGain: 200,
                image: '/achievements/rapid-master.jpg',
              },
              {
                studentName: 'James Chen',
                title: 'Youth Olympic Medalist',
                date: 'July 2023',
                description: 'Won silver medal at the Youth Chess Olympics.',
                tournament: 'Youth Chess Olympics 2023',
                ratingGain: 175,
                image: '/achievements/youth-olympic.jpg',
              },
              {
                studentName: 'Lisa Wang',
                title: 'Prodigy Award',
                date: 'June 2023',
                description:
                  'Youngest player to reach 2000 rating at our academy.',
                ratingGain: 300,
                image: '/achievements/prodigy.jpg',
              },
            ],
          },
          order: 3,
        },
        {
          type: 'ACHIEVEMENT_SHOWCASE',
          props: {
            title: 'Academy Milestones',
            achievements: [
              { number: '500+', text: 'Active Students' },
              { number: '95%', text: 'Rating Improvement' },
              { number: '50+', text: 'Tournament Wins' },
              { number: '10', text: 'National Champions' },
            ],
            className: {
              container: 'py-16 bg-gray-800',
              title: 'text-3xl font-bold text-center text-white mb-12',
              grid: 'grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto px-4',
              item: 'text-center',
              number: 'text-4xl font-bold text-red-500 mb-2',
              text: 'text-gray-300',
            },
          },
          order: 4,
        },
      ],
    },
  },
];

module.exports = defaultPages;
