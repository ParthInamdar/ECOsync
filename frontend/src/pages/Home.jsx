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
    <div className="min-h-screen bg-[#f2f4f5] pb-12">
      
      {/* Category Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center overflow-x-auto gap-6 py-3 hide-scrollbar">
            <span className="text-sm font-semibold text-gray-900 uppercase whitespace-nowrap">Categories</span>
            <div className="h-4 w-px bg-gray-300"></div>
            {CATEGORIES.map(cat => (
              <Link key={cat} to={`/search?category=${cat.toLowerCase()}`} className="text-sm text-gray-700 hover:text-teal-600 hover:underline underline-offset-4 whitespace-nowrap">
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Compact Banner */}
        <div className="mb-6 rounded bg-white p-6 border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Find what you need nearby.</h1>
            <p className="text-gray-600 text-sm">Borrow. Share. Reuse. Join the local community.</p>
          </div>
          <Link to="/search" className="rounded bg-gray-900 text-white px-6 py-2 text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap">
            Browse all resources
          </Link>
        </div>

        {/* AI Recommendations Section */}
        {user && recommendations.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4 border-b border-purple-100 pb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">AI Recommended for You</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map(resource => (
                <Link key={`rec-${resource.id}`} to={`/resource/${resource.id}`} className="bg-gradient-to-br from-purple-50 to-white rounded border border-purple-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full group">
                  <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden border-b border-gray-100 flex items-center justify-center">
                    <img src={resource.image_url} alt={resource.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute top-2 left-2 bg-purple-600/90 text-xs font-bold px-2 py-1 rounded shadow-sm text-white uppercase">
                      {resource.listing_type || resource.sharing_type}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-grow">
                    <h3 className="text-base font-medium text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-purple-700">
                      {resource.title}
                    </h3>
                    <p className="text-sm font-bold text-gray-900 mb-1">
                      {resource.price > 0 ? `₹${resource.price}` : 'Free'}
                      {resource.price_unit && <span className="text-xs font-normal text-gray-500 ml-1">{resource.price_unit}</span>}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">{resource.category}</p>
                    
                    <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{resource.location_name}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Resources */}
        <div className="mb-4 flex justify-between items-end">
          <h2 className="text-xl font-bold text-gray-900">Fresh recommendations</h2>
          <Link to="/search" className="text-teal-700 font-semibold text-sm hover:underline">View all</Link>
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
              <Link key={resource.id} to={`/resource/${resource.id}`} className="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full group">
                <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden border-b border-gray-100 flex items-center justify-center">
                  <img src={resource.image_url} alt={resource.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200" />
                  <div className="absolute top-2 left-2 bg-white/90 text-xs font-bold px-2 py-1 rounded border border-gray-200 shadow-sm text-gray-800 uppercase">
                    {resource.listing_type || resource.sharing_type}
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="text-base font-medium text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-teal-700">
                    {resource.title}
                  </h3>
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    {resource.price > 0 ? `₹${resource.price}` : 'Free'}
                    {resource.price_unit && <span className="text-sm font-normal text-gray-500 ml-1">{resource.price_unit}</span>}
                  </p>
                  
                  <div className="mt-auto pt-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{resource.location_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1 text-amber-500 font-medium">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>4.8</span>
                      </div>
                      <span className="uppercase">{new Date(resource.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="rounded bg-white p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">How EcoSync Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4 items-start">
              <div className="bg-teal-50 w-10 h-10 rounded-full flex items-center justify-center text-teal-600 flex-shrink-0 font-bold">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Find</h3>
                <p className="text-sm text-gray-600 mt-1">Search for items you need temporarily in your local community.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="bg-teal-50 w-10 h-10 rounded-full flex items-center justify-center text-teal-600 flex-shrink-0 font-bold">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Request</h3>
                <p className="text-sm text-gray-600 mt-1">Send a borrow request to the owner. Chat and arrange pickup.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="bg-teal-50 w-10 h-10 rounded-full flex items-center justify-center text-teal-600 flex-shrink-0 font-bold">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Return & Review</h3>
                <p className="text-sm text-gray-600 mt-1">Return the item when done. Leave a rating to build trust.</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
