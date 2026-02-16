export interface StockSeed {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
  icon: string;
  description: string;
  sector: string;
}

export const stockSeeds: StockSeed[] = [
  {
    symbol: 'PNCL',
    name: 'PencilCorp',
    price: 45.5,
    change: 1.2,
    changePercent: 2.71,
    history: [44, 44.5, 45, 45.5],
    icon: '📝',
    description: 'Leading manufacturer of eco-friendly writing instruments',
    sector: 'Stationery & Supplies'
  },
  {
    symbol: 'SNCK',
    name: 'SnackHub',
    price: 118.3,
    change: -1.4,
    changePercent: -1.17,
    history: [120, 119, 118.5, 118.3],
    icon: '🍿',
    description: 'Premium snacks and refreshments for students',
    sector: 'Food & Beverage'
  },
  {
    symbol: 'STDY',
    name: 'StudyTech',
    price: 92.0,
    change: 5.0,
    changePercent: 5.75,
    history: [87, 89, 90, 92],
    icon: '💻',
    description: 'Educational technology and learning platforms',
    sector: 'EdTech'
  },
  {
    symbol: 'BOOK',
    name: 'BookNest',
    price: 67.8,
    change: 0.5,
    changePercent: 0.74,
    history: [67, 67.3, 67.5, 67.8],
    icon: '📚',
    description: 'Online bookstore and learning materials',
    sector: 'Retail'
  },
  {
    symbol: 'CAMP',
    name: 'CampusConnect',
    price: 155.2,
    change: -3.1,
    changePercent: -1.96,
    history: [158, 156.5, 155.5, 155.2],
    icon: '🎓',
    description: 'Student networking and collaboration platform',
    sector: 'Social Tech'
  }
];

