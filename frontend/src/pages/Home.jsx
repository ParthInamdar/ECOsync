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

  const getFallbackImage = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('book') || t.includes('python')) return '/images/python_book.jpg';
    if (t.includes('drill') || t.includes('tool')) return '/images/power_drill.jpg';
    if (t.includes('tent') || t.includes('camp')) return '/images/camping_tent.jpg';
    
    // Generic fallback for anything else that might have been added
    return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=60&w=400';
  };

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
              { name: 'Books & Study', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=60&w=200&h=200', param: 'Books' },
              { name: 'Tools & Equipment', img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&q=60&w=200&h=200', param: 'Tools' },
              { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=60&w=200&h=200', param: 'Electronics' },
              { name: 'Sports & Fitness', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=60&w=200&h=200', param: 'Sports' },
              { name: 'Outdoor & Travel', img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=60&w=200&h=200', param: 'Outdoor' },
              { name: 'Household', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=60&w=200&h=200', param: 'Household' },
              { name: 'Hobbies & Creative', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=60&w=200&h=200', param: 'Hobbies' },
              { name: 'Games & Entertainment', img: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=60&w=200&h=200', param: 'Games' },
              { name: 'Mobility', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=60&w=200&h=200', param: 'Mobility' },
              { name: 'Other', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=60&w=200&h=200', param: 'Other' },
            ].map((cat) => (
              <Link key={cat.name} to={`/search?category=${encodeURIComponent(cat.param)}`} className="flex flex-col items-center gap-2 group flex-shrink-0 w-[110px]">
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
          <h2 className="text-2xl font-normal text-[#002f34]">Resources near you</h2>
        </div>

        {/* Resource Grid */}
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-white rounded border border-gray-200 mb-8">
            <p className="mb-2">No resources available right now.</p>
            <Link to="/add" className="text-teal-600 hover:underline font-medium">Be the first to share a resource!</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {resources.map(resource => (
              <Link key={resource.id} to={`/resource/${resource.id}`} className="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full group relative">
                {/* Save Icon */}
                <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </div>
                
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden border-b border-gray-100 flex items-center justify-center">
                  <img 
                    src={resource.image_url || getFallbackImage(resource.title)} 
                    alt={resource.title} 
                    loading="lazy"
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = getFallbackImage(''); }}
                  />
                </div>
                
                {/* Content Section */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Listing Type Badge */}
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold tracking-wider uppercase rounded-sm">
                      {resource.listing_type || 'SHARE'}
                    </span>
                  </div>
                  
                  {/* Title & Condition */}
                  <h3 className="text-[15px] font-medium text-gray-900 line-clamp-1 leading-tight mb-1">
                    {resource.title}
                  </h3>
                  
                  {/* Price / Contextual Value */}
                  <p className="text-[16px] font-bold text-[#006400] mb-2">
                    {resource.listing_type === 'FREE' || resource.listing_type === 'DONATE' ? 'Free' :
                     resource.listing_type === 'BORROW' ? 'Borrow' :
                     resource.price > 0 ? `₹${resource.price}${resource.price_unit ? resource.price_unit : ''}` : 'Free'}
                  </p>
                  
                  {/* Location & Metadata */}
                  <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-gray-500 font-medium border-t border-gray-50">
                    <div className="flex items-center gap-1 truncate max-w-[120px]">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{resource.location_name || 'India'}</span>
                    </div>
                    {resource.condition && (
                      <span className="px-1.5 py-0.5 bg-gray-50 rounded text-[10px]">{resource.condition}</span>
                    )}
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
