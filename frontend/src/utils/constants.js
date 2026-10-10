// Match exactly with the backend seeded database categories
export const CATEGORIES = [
  'Books', 
  'Electronics', 
  'Sports Equipment', 
  'Tools', 
  'Household', 
  'Other'
];

export const SEARCH_CATEGORIES = ['All Categories', ...CATEGORIES];

export const CATEGORY_DISPLAY = [
  { name: 'Books', img: '/categories/books.jpg', param: 'Books' },
  { name: 'Tools', img: '/categories/tools.jpg', param: 'Tools' },
  { name: 'Electronics', img: '/categories/electronics.jpg', param: 'Electronics' },
  { name: 'Sports Equipment', img: '/categories/sports.jpg', param: 'Sports Equipment' },
  { name: 'Household', img: '/categories/household.jpg', param: 'Household' },
  { name: 'Other', img: '/categories/other.jpg', param: 'Other' },
];
