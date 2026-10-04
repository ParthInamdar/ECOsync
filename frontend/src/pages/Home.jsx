import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MapPin, Star, Sparkles } from 'lucide-react';
import api from '../utils/api';

const CATEGORIES = [
  'Books', 'Electronics', 'Sports', 'Tools', 'Household', 'Vehicles', 'Fashion', 'Other'
];

export default function Home() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    api.get('/resources/')
      .then(res => {
        setResources(res.data.resources);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load resources", err);
        setLoading(false);
      });
      
    if (user) {
      setRecLoading(true);
      
      const fetchRecommendations = (lat, lon) => {
        let url = '/recommendations/';
        if (lat && lon) {
          url += `?lat=${lat}&lon=${lon}`;
        }
        api.get(url)
          .then(res => {
            if (res.data.success && res.data.recommendations.length > 0) {
              setRecommendations(res.data.recommendations);
            }
            setRecLoading(false);
          })
          .catch(err => {
            console.error("AI Recommendations not available.");
            setRecLoading(false);
          });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchRecommendations(pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            console.warn("Location not granted, fetching generic recommendations.");
            fetchRecommendations(null, null);
          },
          { timeout: 5000 }
        );
      } else {
        fetchRecommendations(null, null);
      }
    }
  }, [user]);

  return (
  return (
    <div className="min-h-screen bg-white pb-12 font-sans">
      
      {/* Category Navigation (Sub-navbar) */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center overflow-x-auto py-2 hide-scrollbar">
            <button className="flex items-center gap-2 text-sm font-bold text-gray-900 mr-6 hover:text-blue-600 transition-colors uppercase whitespace-nowrap">
              <span className="font-bold text-lg">≡</span> ALL CATEGORIES
            </button>
            <div className="flex items-center gap-5">
              {['Cars', 'Motorcycles', 'Mobile Phones', 'For Sale: Houses & Apartments', 'For Rent: Houses & Apartments', 'Beds-Wardrobes', 'TVs, Video - Audio'].map(cat => (
                <Link key={cat} to={`/search?category=${encodeURIComponent(cat.split(' ')[0].toLowerCase())}`} className="text-[13px] text-gray-700 hover:text-gray-900 whitespace-nowrap">
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4 mb-10">
          {[
            { name: 'Cars', img: 'https://cdn-icons-png.flaticon.com/512/3204/3204905.png' },
            { name: 'Bikes', img: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png' },
            { name: 'Properties', img: 'https://cdn-icons-png.flaticon.com/512/2038/2038337.png' },
            { name: 'Electronics & Appliances', img: 'https://cdn-icons-png.flaticon.com/512/1261/1261073.png' },
            { name: 'Mobiles', img: 'https://cdn-icons-png.flaticon.com/512/3110/3110190.png' },
            { name: 'Commercial Vehicles & Spares', img: 'https://cdn-icons-png.flaticon.com/512/2932/2932223.png' },
            { name: 'Jobs', img: 'https://cdn-icons-png.flaticon.com/512/2942/2942821.png' },
            { name: 'Furniture', img: 'https://cdn-icons-png.flaticon.com/512/2627/2627191.png' },
            { name: 'Fashion', img: 'https://cdn-icons-png.flaticon.com/512/3050/3050239.png' },
          ].map((cat) => (
            <Link key={cat.name} to={`/search?category=${encodeURIComponent(cat.name.split(' ')[0].toLowerCase())}`} className="flex flex-col items-center gap-2 group">
              <div className="w-[100px] h-[100px] flex items-center justify-center p-3 rounded-full hover:shadow-md transition-shadow">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[13px] font-medium text-gray-900 text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>

        {/* Fresh Recommendations Header */}
        <div className="mb-4 flex justify-between items-end">
          <h2 className="text-2xl font-normal text-[#002f34]">Fresh recommendations</h2>
        </div>

        {/* Resource Grid */}
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-white rounded border border-gray-200 mb-8">
            <p className="mb-2">No resources available right now.</p>
            <Link to="/add" className="text-teal-600 hover:underline font-medium">Be the first to list an item!</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {resources.map(resource => (
              <Link key={resource.id} to={`/resource/${resource.id}`} className="bg-white rounded border border-gray-300 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full group relative">
                <div className="absolute top-2 right-2 z-10 bg-white rounded-full p-1.5 shadow-sm">
                  <svg className="w-5 h-5 text-gray-900 hover:fill-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </div>
                {resource.listing_type === 'FEATURED' && (
                  <div className="absolute top-0 left-0 bg-[#ffce32] text-[10px] font-bold px-2 py-0.5 rounded-br uppercase z-10">
                    Featured
                  </div>
                )}
                <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden border-b border-gray-200 flex items-center justify-center p-4">
                  <img src={resource.image_url} alt={resource.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200 mix-blend-multiply" />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-xl font-bold text-[#002f34] mb-1">
                    {resource.price > 0 ? `₹ ${resource.price.toLocaleString('en-IN')}` : 'Free'}
                  </p>
                  <h3 className="text-[15px] font-normal text-gray-600 line-clamp-1 leading-tight mb-2">
                    {resource.title}
                  </h3>
                  
                  <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-gray-500 uppercase font-medium">
                    <span className="truncate max-w-[120px]">{resource.location_name || 'India'}</span>
                    <span>{new Date(resource.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
