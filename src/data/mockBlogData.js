// Generate random dates within a range
const getRandomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Current time for reference
const now = new Date();
const oneDay = 24 * 60 * 60 * 1000;
const oneWeek = 7 * oneDay;
const oneMonth = 30 * oneDay;

// Mock users data
export const mockUsers = [
  {
    id: 'user1',
    name: 'Abeba Tadesse',
    avatar: 'https://i.pravatar.cc/150?img=1',
    type: 'maid',
  },
  {
    id: 'user2',
    name: 'Ethio Maids Agency',
    avatar: 'https://i.pravatar.cc/150?img=2',
    type: 'agency',
  },
  {
    id: 'user3',
    name: 'Ahmed Al-Mansour',
    avatar: 'https://i.pravatar.cc/150?img=3',
    type: 'sponsor',
  },
  {
    id: 'user4',
    name: 'Makeda Solomon',
    avatar: 'https://i.pravatar.cc/150?img=4',
    type: 'maid',
  },
  {
    id: 'user5',
    name: 'Selam Staffing Agency',
    avatar: 'https://i.pravatar.cc/150?img=5',
    type: 'agency',
  },
  {
    id: 'user6',
    name: 'Fatima Al-Zahra',
    avatar: 'https://i.pravatar.cc/150?img=6',
    type: 'sponsor',
  },
];

// Mock posts data
export const mockPosts = [
  {
    id: 'post1',
    authorId: 'user1',
    authorName: 'Abeba Tadesse',
    authorAvatar: 'https://i.pravatar.cc/150?img=1',
    authorType: 'maid',
    content:
      "Just completed my first month working in Dubai! The experience has been amazing so far. The family I'm working with is very kind and respectful. Looking forward to exploring more of this beautiful city on my day off! #FirstMonth #Dubai #NewExperience",
    mediaUrls: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    ],
    createdAt: getRandomDate(new Date(now - oneWeek), now).toISOString(),
    isEdited: false,
    likeCount: 24,
    commentCount: 5,
    shareCount: 2,
    likes: ['user3', 'user5', 'user6'],
    isSharedPost: false,
  },
  {
    id: 'post2',
    authorId: 'user2',
    authorName: 'Ethio Maids Agency',
    authorAvatar: 'https://i.pravatar.cc/150?img=2',
    authorType: 'agency',
    content:
      "We're excited to announce that we now offer specialized training for housekeepers in elderly care! This comprehensive program covers essential skills like mobility assistance, medication reminders, and recognizing health changes. Contact us to learn more about how this training can benefit your career or your family's needs! #ElderCare #Training #HousekeepingSkills",
    mediaUrls: [],
    createdAt: getRandomDate(
      new Date(now - oneMonth),
      new Date(now - oneWeek)
    ).toISOString(),
    isEdited: true,
    likeCount: 18,
    commentCount: 3,
    shareCount: 7,
    likes: ['user1', 'user4', 'user6'],
    isSharedPost: false,
  },
  {
    id: 'post3',
    authorId: 'user3',
    authorName: 'Ahmed Al-Mansour',
    authorAvatar: 'https://i.pravatar.cc/150?img=3',
    authorType: 'sponsor',
    content:
      "Just wanted to share my wonderful experience with Makeda who has been working with our family for the past year. Her dedication and care for our children is incredible. We're grateful to have found such a reliable and kind person to help us. #Grateful #FamilyCare",
    mediaUrls: [
      'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    ],
    createdAt: getRandomDate(new Date(now - oneDay * 3), now).toISOString(),
    isEdited: false,
    likeCount: 42,
    commentCount: 8,
    shareCount: 1,
    likes: ['user1', 'user2', 'user4', 'user5'],
    isSharedPost: false,
  },
  {
    id: 'post4',
    authorId: 'user4',
    authorName: 'Makeda Solomon',
    authorAvatar: 'https://i.pravatar.cc/150?img=4',
    authorType: 'maid',
    content:
      "I'm so happy to have received my work visa extension today! Thank you to my sponsor family for their support through the process. Looking forward to another two years in UAE! 🎉 #WorkVisa #Celebration",
    mediaUrls: [
      'https://images.unsplash.com/photo-1530811761207-8d9d22f0a141?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    ],
    createdAt: getRandomDate(new Date(now - oneDay * 2), now).toISOString(),
    isEdited: false,
    likeCount: 35,
    commentCount: 12,
    shareCount: 0,
    likes: ['user1', 'user2', 'user3', 'user5', 'user6'],
    isSharedPost: false,
  },
  {
    id: 'post5',
    authorId: 'user5',
    authorName: 'Selam Staffing Agency',
    authorAvatar: 'https://i.pravatar.cc/150?img=5',
    authorType: 'agency',
    content:
      "We're hosting a community meetup this weekend for all Ethiopian professionals working in Dubai! Come join us for traditional food, music, and an opportunity to connect with your community. Location: Al Mamzar Park, Time: Saturday 4-8 PM. #CommunityEvent #EthiopianCommunity #Dubai",
    mediaUrls: [
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1565035010268-a3816f98589a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    ],
    createdAt: getRandomDate(
      new Date(now - oneDay * 5),
      new Date(now - oneDay)
    ).toISOString(),
    isEdited: true,
    likeCount: 27,
    commentCount: 14,
    shareCount: 8,
    likes: ['user1', 'user3', 'user4', 'user6'],
    isSharedPost: false,
  },
  {
    id: 'post6',
    authorId: 'user6',
    authorName: 'Fatima Al-Zahra',
    authorAvatar: 'https://i.pravatar.cc/150?img=6',
    authorType: 'sponsor',
    content:
      'Question for the community: What are some ways you help domestic workers feel like part of the family? We want to ensure our new housekeeper feels comfortable and appreciated in our home.',
    mediaUrls: [],
    createdAt: getRandomDate(new Date(now - oneDay), now).toISOString(),
    isEdited: false,
    likeCount: 15,
    commentCount: 22,
    shareCount: 3,
    likes: ['user2', 'user5'],
    isSharedPost: false,
  },
  {
    id: 'post7',
    authorId: 'user1',
    authorName: 'Abeba Tadesse',
    authorAvatar: 'https://i.pravatar.cc/150?img=1',
    authorType: 'maid',
    content:
      "I'm sharing this useful post about community events this weekend!",
    mediaUrls: [],
    createdAt: getRandomDate(new Date(now - oneDay), now).toISOString(),
    isEdited: false,
    likeCount: 8,
    commentCount: 2,
    shareCount: 0,
    likes: ['user3', 'user4'],
    isSharedPost: true,
    originalPostId: 'post5',
  },
];

// Mock comments data
export const mockComments = [
  {
    id: 'comment1',
    postId: 'post1',
    authorId: 'user3',
    authorName: 'Ahmed Al-Mansour',
    authorAvatar: 'https://i.pravatar.cc/150?img=3',
    content:
      "Welcome to Dubai! Hope you're enjoying the experience so far. The weather is lovely this time of year.",
    createdAt: getRandomDate(new Date(now - oneDay), now).toISOString(),
    isEdited: false,
    likeCount: 3,
    likes: ['user1', 'user5'],
  },
  {
    id: 'comment2',
    postId: 'post1',
    authorId: 'user5',
    authorName: 'Selam Staffing Agency',
    authorAvatar: 'https://i.pravatar.cc/150?img=5',
    content:
      "Great to hear you're having a positive experience! If you need any support or have questions, our agency is always here to help.",
    createdAt: getRandomDate(new Date(now - oneDay), now).toISOString(),
    isEdited: false,
    likeCount: 1,
    likes: ['user1'],
  },
  {
    id: 'comment3',
    postId: 'post3',
    authorId: 'user4',
    authorName: 'Makeda Solomon',
    authorAvatar: 'https://i.pravatar.cc/150?img=4',
    content:
      'Thank you for your kind words, Ahmed! It means a lot to be appreciated. Your family has been wonderful to work with.',
    createdAt: getRandomDate(new Date(now - oneDay), now).toISOString(),
    isEdited: true,
    likeCount: 2,
    likes: ['user3', 'user6'],
  },
  {
    id: 'comment4',
    postId: 'post4',
    authorId: 'user3',
    authorName: 'Ahmed Al-Mansour',
    authorAvatar: 'https://i.pravatar.cc/150?img=3',
    content: 'Congratulations Makeda! 🎉',
    createdAt: getRandomDate(new Date(now - oneDay), now).toISOString(),
    isEdited: false,
    likeCount: 1,
    likes: ['user4'],
  },
  {
    id: 'comment5',
    postId: 'post6',
    authorId: 'user2',
    authorName: 'Ethio Maids Agency',
    authorAvatar: 'https://i.pravatar.cc/150?img=2',
    content:
      'This is a great question! We recommend including your domestic worker in family meals when appropriate, celebrating their birthday, respecting their cultural practices, and making sure they have comfortable private spaces. Also, showing interest in their family back home can go a long way in building a meaningful relationship.',
    createdAt: getRandomDate(new Date(now - oneDay), now).toISOString(),
    isEdited: false,
    likeCount: 5,
    likes: ['user3', 'user5', 'user6'],
  },
  {
    id: 'comment6',
    postId: 'post6',
    authorId: 'user1',
    authorName: 'Abeba Tadesse',
    authorAvatar: 'https://i.pravatar.cc/150?img=1',
    content:
      "Speaking as a domestic worker, what makes me feel most appreciated is when my employer respects my time off, checks in about how I'm doing, and treats me with the same respect as other professionals. Small gestures like asking about my family or remembering important dates in my life make a big difference.",
    createdAt: getRandomDate(new Date(now - oneDay), now).toISOString(),
    isEdited: false,
    likeCount: 7,
    likes: ['user3', 'user4', 'user5', 'user6'],
  },
];
