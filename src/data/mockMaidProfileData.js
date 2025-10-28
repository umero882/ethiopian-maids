// Mock data for maid profiles and related information

// Detailed profile for logged-in maid
export const mockMaidDetailedProfile = {
  id: 'm123456',
  name: 'Ayesha Mekonnen',
  age: 28,
  country: 'Ethiopia',
  religion: 'Orthodox Christian',
  languages: ['Amharic', 'English', 'Arabic'],
  education: 'High School Diploma',
  image: 'https://randomuser.me/api/portraits/women/44.jpg',
  experience: '5 years',
  experienceDetails:
    'I have worked for 3 years as a live-in maid for a family in Dubai, and 2 years for a family in Abu Dhabi. My responsibilities included cooking, cleaning, childcare, and eldercare.',
  visaStatus: 'Employment Visa',
  availability: 'Available immediately',
  salaryRange: '1,800 - 2,500 AED/month',
  description:
    'I am a hardworking and reliable domestic helper with 5 years of experience working in UAE. I am skilled in cooking international cuisines, housekeeping, childcare, and eldercare. I am known for my attention to detail, honesty, and positive attitude.',
  skills: [
    'Cooking',
    'Cleaning',
    'Childcare',
    'Eldercare',
    'Laundry',
    'Ironing',
  ],
  preferences: {
    fullTime: true,
    partTime: false,
    liveIn: true,
    liveOut: false,
    minSalary: 1800,
    maxSalary: 2500,
    preferredLocations: 'Dubai, Abu Dhabi',
  },
  profileVisible: false,
  verificationStatus: {
    email: true,
    phone: true,
    documents: false,
  },
  approvalStatus: 'pending_verification',
  submissionStatus: 'pending_verification',
  shareWithAgencies: false,
  profileVisibility: 'private',
  lastUpdated: '2025-05-15T10:30:00Z',
};

// Mock booking requests for the maid
export const mockBookingRequests = [
  {
    id: 'b1001',
    sponsorId: 's7001',
    sponsorName: 'Ahmed Al Mansouri',
    maidId: 'm123456',
    type: 'Full-time Live-in',
    description:
      'Looking for a full-time live-in maid for our family of 4 with 2 young children.',
    status: 'pending',
    proposedDate: '2025-07-01T00:00:00Z',
    proposedTime: '9:00 AM',
    location: 'Jumeirah, Dubai',
    contactEmail: 'ahmed.mansouri@example.com',
    contactPhone: '+9715012345678',
    notes:
      'We need someone who is good with children and can cook local cuisines.',
    createdAt: '2025-06-15T14:20:00Z',
    sponsorSubscription: 'free', // free subscription
  },
  {
    id: 'b1002',
    sponsorId: 's7002',
    sponsorName: 'Fatima Rahman',
    maidId: 'm123456',
    type: 'Full-time Live-in',
    description:
      'Seeking a maid for our elderly parents who need assistance with daily activities.',
    status: 'accepted',
    proposedDate: '2025-07-15T00:00:00Z',
    proposedTime: '10:00 AM',
    location: 'Al Barsha, Dubai',
    contactEmail: 'fatima.r@example.com',
    contactPhone: '+9715087654321',
    notes:
      'Experience with eldercare is essential. Must be patient and compassionate.',
    createdAt: '2025-06-10T09:45:00Z',
    sponsorSubscription: 'premium', // premium subscription
  },
  {
    id: 'b1003',
    sponsorId: 's7003',
    sponsorName: 'Mohammed Al Zaabi',
    maidId: 'm123456',
    type: 'Part-time',
    description: 'Need a part-time maid for household cleaning twice a week.',
    status: 'rejected',
    proposedDate: '2025-06-25T00:00:00Z',
    proposedTime: '2:00 PM',
    location: 'Al Reem Island, Abu Dhabi',
    contactEmail: 'm.zaabi@example.com',
    contactPhone: '+9715055544333',
    notes: 'Only cleaning services required, no cooking or childcare.',
    createdAt: '2025-06-05T17:30:00Z',
    sponsorSubscription: 'free', // free subscription
  },
  {
    id: 'b1004',
    sponsorId: 's7004',
    sponsorName: 'Sara Al Shamsi',
    maidId: 'm123456',
    type: 'Full-time Live-in',
    description:
      'Seeking an experienced maid for our family with newborn twins.',
    status: 'pending',
    proposedDate: '2025-07-10T00:00:00Z',
    proposedTime: '11:00 AM',
    location: 'Mirdif, Dubai',
    contactEmail: 'sara.alshamsi@example.com',
    contactPhone: '+9715099988777',
    notes:
      'Experience with infant care is a must. We need someone who can start as soon as possible.',
    createdAt: '2025-06-18T11:15:00Z',
    sponsorSubscription: 'premium', // premium subscription
  },
];

// Mock availability data
export const mockMaidAvailability = {
  unavailableDates: [
    '2025-06-25T00:00:00Z',
    '2025-06-26T00:00:00Z',
    '2025-06-27T00:00:00Z',
    '2025-07-05T00:00:00Z',
    '2025-07-06T00:00:00Z',
  ],
  bookedDates: [
    '2025-07-15T00:00:00Z',
    '2025-07-16T00:00:00Z',
    '2025-07-17T00:00:00Z',
    '2025-07-18T00:00:00Z',
    '2025-07-19T00:00:00Z',
  ],
  workingHours: {
    monday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
    tuesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
    wednesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
    thursday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
    friday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
    saturday: { isWorking: false, startTime: '09:00', endTime: '14:00' },
    sunday: { isWorking: false, startTime: '09:00', endTime: '14:00' },
  },
  noticeRequired: 2, // days
  specialNotes:
    'I prefer to have weekends off. For part-time work, I am available on weekdays only.',
};

// Mock subscription data
export const mockMaidSubscription = {
  status: 'active',
  plan: 'premium',
  startDate: '2025-01-15T00:00:00Z',
  endDate: '2025-07-15T00:00:00Z',
  autoRenew: true,
  features: [
    'Featured Profile Listing',
    'Priority in Search Results',
    'Direct Contact with Employers',
    'Verified Badge',
    'Unlimited Job Applications',
  ],
  paymentMethod: {
    type: 'card',
    last4: '4242',
    expiryDate: '06/28',
  },
  invoices: [
    {
      id: 'inv_1001',
      date: '2025-01-15T00:00:00Z',
      amount: 299,
      status: 'paid',
    },
    {
      id: 'inv_1002',
      date: '2025-02-15T00:00:00Z',
      amount: 299,
      status: 'paid',
    },
    {
      id: 'inv_1003',
      date: '2025-03-15T00:00:00Z',
      amount: 299,
      status: 'paid',
    },
    {
      id: 'inv_1004',
      date: '2025-04-15T00:00:00Z',
      amount: 299,
      status: 'paid',
    },
    {
      id: 'inv_1005',
      date: '2025-05-15T00:00:00Z',
      amount: 299,
      status: 'paid',
    },
    {
      id: 'inv_1006',
      date: '2025-06-15T00:00:00Z',
      amount: 299,
      status: 'paid',
    },
  ],
};

// Mock notifications
export const mockMaidNotifications = [
  {
    id: 'n1001',
    type: 'booking_request',
    title: 'New Booking Request',
    message: 'You have a new booking request from Ahmed Al Mansouri.',
    relatedId: 'b1001',
    read: false,
    createdAt: '2025-06-15T14:20:00Z',
  },
  {
    id: 'n1002',
    type: 'subscription',
    title: 'Subscription Renewal',
    message:
      'Your premium subscription will renew in 3 days. Please ensure your payment method is up to date.',
    relatedId: null,
    read: true,
    createdAt: '2025-06-12T09:00:00Z',
  },
  {
    id: 'n1003',
    type: 'document_verification',
    title: 'Document Verified',
    message: 'Your medical certificate has been verified successfully.',
    relatedId: null,
    read: true,
    createdAt: '2025-06-10T11:45:00Z',
  },
  {
    id: 'n1004',
    type: 'booking_accepted',
    title: 'Booking Accepted',
    message: 'Your booking with Fatima Rahman has been confirmed.',
    relatedId: 'b1002',
    read: false,
    createdAt: '2025-06-16T10:30:00Z',
  },
  {
    id: 'n1005',
    type: 'profile_view',
    title: 'Profile Views',
    message: 'Your profile has been viewed 15 times in the last week.',
    relatedId: null,
    read: false,
    createdAt: '2025-06-14T16:20:00Z',
  },
];

// Export a list of sample maids for display in the main application
export const mockMaids = [
  {
    id: 'm123456',
    name: 'Ayesha Mekonnen',
    age: 28,
    country: 'Ethiopia',
    experience: '5 years',
    skills: ['Cooking', 'Cleaning', 'Childcare', 'Eldercare'],
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.8,
    availability: 'Available immediately',
    salary: '1800-2500 AED',
  },
  {
    id: 'm123457',
    name: 'Faith Muthoni',
    age: 32,
    country: 'Kenya',
    experience: '7 years',
    skills: ['Cooking', 'Cleaning', 'Eldercare', 'Nursing'],
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 4.9,
    availability: 'Available from July 15',
    salary: '2000-2800 AED',
  },
  {
    id: 'm123458',
    name: 'Sarah Negatu',
    age: 25,
    country: 'Ethiopia',
    experience: '3 years',
    skills: ['Cleaning', 'Childcare', 'Cooking'],
    image: 'https://randomuser.me/api/portraits/women/72.jpg',
    rating: 4.6,
    availability: 'Available immediately',
    salary: '1700-2300 AED',
  },
  {
    id: 'm123459',
    name: 'Grace Achieng',
    age: 30,
    country: 'Kenya',
    experience: '6 years',
    skills: ['Cooking', 'Cleaning', 'Childcare', 'Pet Care'],
    image: 'https://randomuser.me/api/portraits/women/79.jpg',
    rating: 4.7,
    availability: 'Available from June 30',
    salary: '1900-2600 AED',
  },
];
