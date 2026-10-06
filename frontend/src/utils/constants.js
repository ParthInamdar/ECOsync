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
  { name: 'Books', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=60&w=200&h=200', param: 'Books' },
  { name: 'Tools', img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&q=60&w=200&h=200', param: 'Tools' },
  { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=60&w=200&h=200', param: 'Electronics' },
  { name: 'Sports Equipment', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=60&w=200&h=200', param: 'Sports Equipment' },
  { name: 'Household', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=60&w=200&h=200', param: 'Household' },
  { name: 'Other', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=60&w=200&h=200', param: 'Other' },
];
