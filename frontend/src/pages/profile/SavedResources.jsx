import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { MapPin } from 'lucide-react';

export default function SavedResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const getFallbackImage = (title) => {
    return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=60&w=400';
  };

  useEffect(() => {
    api.get('/users/saved')
      .then(res => {
        setResources(res.data.saved_resources);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load saved resources", err);
        setLoading(false);
      });
  }, []);

  const unsaveResource = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    api.post(`/users/saved/${id}`)
      .then(res => {
        if (res.data.success) {
          setResources(resources.filter(r => r.id !== id));
        }
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Saved Resources</h1>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading saved items...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded border border-gray-200">
          <p className="text-gray-500 mb-2">You haven't saved any resources yet.</p>
          <Link to="/" className="text-teal-600 font-medium hover:underline">Browse Resources</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {resources.map(resource => (
            <Link key={resource.id} to={`/resource/${resource.id}`} className="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full group relative">
              
              <button 
                onClick={(e) => unsaveResource(e, resource.id)}
                className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white text-red-500 transition-colors"
                title="Remove from saved"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </button>
              
              <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden border-b border-gray-100 flex items-center justify-center">
                <img 
                  src={resource.image_url || getFallbackImage(resource.title)} 
                  alt={resource.title} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = getFallbackImage(resource.title); e.target.onerror = null; }}
                />
              </div>
              
              <div className="p-4 flex flex-col flex-grow">
                <div className="mb-2">
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold tracking-wider uppercase rounded-sm">
                    {resource.listing_type || 'SHARE'}
                  </span>
                </div>
                
                <h3 className="text-[15px] font-medium text-gray-900 line-clamp-1 leading-tight mb-1">
                  {resource.title}
                </h3>
                
                <p className="text-[16px] font-bold text-[#006400] mb-2">
                  {resource.listing_type === 'FREE' || resource.listing_type === 'DONATE' ? 'Free' :
                   resource.listing_type === 'BORROW' ? 'Borrow' :
                   resource.price > 0 ? `₹${resource.price}${resource.price_unit ? resource.price_unit : ''}` : 'Free'}
                </p>
                
                <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-gray-500 font-medium border-t border-gray-50">
                  <div className="flex items-center gap-1 truncate max-w-[120px]">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{resource.location_name || 'India'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
