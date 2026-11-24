export const colors = {
  navy: '#082D68',
  navyDeep: '#061F4E',
  blue: '#1264D5',
  blueBright: '#1686F5',
  bluePale: '#EAF2FF',
  blueTint: '#F3F7FF',
  ink: '#15294C',
  muted: '#7183A3',
  line: '#DEE7F5',
  canvas: '#F1F5FC',
  white: '#FFFFFF',
  yellow: '#FFB21A',
  green: '#16A064',
  greenPale: '#E4F7EE',
  amber: '#E99A00',
  amberPale: '#FFF3D9',
  red: '#E45151',
  redPale: '#FFF0EF',
};

export const categories = [
  { name: 'Roads', icon: 'roads' },
  { name: 'Bridges', icon: 'bridge' },
  { name: 'Flyovers', icon: 'construction' },
  { name: 'Government buildings', icon: 'building' },
  { name: 'Streetlights', icon: 'streetlight' },
  { name: 'Drainage', icon: 'drainage' },
  { name: 'Sanitation', icon: 'trash' },
  { name: 'Water supply', icon: 'waterSupply' },
  { name: 'Sewerage', icon: 'sewerage' },
  { name: 'Electric poles and wires', icon: 'utilityPole' },
];

// Citizen-facing options describe the reported problem. Department routing
// is handled separately using the issue type and report location.
export const issueCategories = categories;

export const initialIssues = [
  {
    id: 'NS-2048',
    title: 'Pothole on the main road',
    category: 'Roads',
    place: 'Sector 15, near City Park',
    status: 'In progress',
    date: 'Today, 9:42 AM',
    details: 'Pothole outside the school entrance.',
  },
  {
    id: 'NS-1982',
    title: 'Streetlight not working',
    category: 'Electricity',
    place: 'Green Avenue, Block B',
    status: 'Assigned',
    date: '12 Oct 2026',
  },
  {
    id: 'NS-1846',
    title: 'Garbage needs collection',
    category: 'Sanitation',
    place: 'Market Road, Ward 4',
    status: 'Resolved',
    date: '8 Oct 2026',
  },
];

export const statusColor = {
  Reported: colors.blue,
  Assigned: colors.blue,
  'In progress': colors.amber,
  'In Progress': colors.amber,
  Resolved: colors.green,
  Reopened: colors.amber,
  Closed: colors.muted,
};

export const statusBackground = {
  Reported: colors.bluePale,
  Assigned: colors.bluePale,
  'In progress': colors.amberPale,
  'In Progress': colors.amberPale,
  Resolved: colors.greenPale,
  Reopened: colors.amberPale,
  Closed: colors.bluePale,
};

export const isIssueResolved = status =>
  status === 'Resolved' || status === 'Closed';

export const qrPattern = [
  [1, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1],
  [0, 1, 0, 1, 0, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 1, 0, 0, 1, 1, 1, 0, 0],
  [1, 0, 1, 0, 0, 1, 0, 1, 1],
];
