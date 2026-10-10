// Match exactly with the backend seeded database categories
export const CATEGORIES = [
  'Books', 
  'Electronics', 
  'Sports Equipment', 
  'Tools', 
  'Household', 
  'Musical Instruments',
  'Outdoors & Camping',
  'Party Supplies',
  'Apparel',
  'Baby & Kids'
];

export const SEARCH_CATEGORIES = ['All Categories', ...CATEGORIES];

export const CATEGORY_DISPLAY = [
  { name: 'Books', img: '/categories/books.jpg', param: 'Books' },
  { name: 'Tools', img: '/categories/tools.jpg', param: 'Tools' },
  { name: 'Electronics', img: '/categories/electronics.jpg', param: 'Electronics' },
  { name: 'Sports Equipment', img: '/categories/sports.jpg', param: 'Sports Equipment' },
  { name: 'Household', img: '/categories/household.jpg', param: 'Household' },
  { name: 'Musical Instruments', img: '/categories/musical_instruments.jpg', param: 'Musical Instruments' },
  { name: 'Outdoors & Camping', img: '/categories/camping.jpg', param: 'Outdoors & Camping' },
  { name: 'Party Supplies', img: '/categories/party.jpg', param: 'Party Supplies' },
  { name: 'Apparel', img: '/categories/apparel.jpg', param: 'Apparel' },
  { name: 'Baby & Kids', img: '/categories/kids.jpg', param: 'Baby & Kids' }
];
