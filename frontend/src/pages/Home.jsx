import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MapPin, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

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
    <div className="min-h-screen bg-white pb-12 font-sans">
      
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Hero Categories Slider */}
        <div className="relative mb-10 group px-8">
          <button 
            onClick={scrollLeft} 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 transition-opacity focus:outline-none"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-8 hide-scrollbar scroll-smooth py-2 px-2"
          >
            {[
              { name: 'Cars', img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Bikes', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Properties', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Electronics & Appliances', img: 'https://images.unsplash.com/photo-1583573636246-18cb2246697f?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Mobiles', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Commercial Vehicles & Spares', img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Jobs', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Furniture', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Fashion', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Books, Sports & Hobbies', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Pets', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200&h=200' },
              { name: 'Services', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=200&h=200' },
            ].map((cat) => (
              <Link key={cat.name} to={`/search?category=${encodeURIComponent(cat.name.split(' ')[0].toLowerCase())}`} className="flex flex-col items-center gap-2 group flex-shrink-0 w-[110px]">
                <div className="w-[100px] h-[100px] flex items-center justify-center rounded-full hover:shadow-md transition-shadow overflow-hidden border-4 border-white shadow-sm">
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[13px] font-medium text-gray-900 text-center leading-tight mt-1">{cat.name}</span>
              </Link>
            ))}
          </div>

          <button 
            onClick={scrollRight} 
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 transition-opacity focus:outline-none"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>
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
