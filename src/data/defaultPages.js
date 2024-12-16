const defaultPages = [
  {
    title: 'Chess Coaching',
    slug: 'chess-coaching',
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
        {
          type: 'CONTACT_SECTION',
          props: {
            text: '1:1 Chess Lessons are also available (for Intermediate or Advanced sessions)!',
            buttonText: 'Contact Us',
            className: {
              container: 'text-center py-12 px-4',
              text: 'text-gray-400 mb-4',
              button:
                'py-2 px-6 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors',
            },
          },
          order: 7,
        },
      ],
    },
  },
];

module.exports = defaultPages;
