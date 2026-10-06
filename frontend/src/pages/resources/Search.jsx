import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Star, Filter } from 'lucide-react';
import api from '../../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default marker icons issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import { SEARCH_CATEGORIES as CATEGORIES } from '../../utils/constants';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State from URL (Single Source of Truth)
  const query = searchParams.get('q') || '';
  let category = searchParams.get('category') || 'All Categories';
  if (category && category !== 'All Categories') {
    category = category.charAt(0).toUpperCase() + category.slice(1);
  }
  const listingType = searchParams.get('listing_type') || searchParams.get('sharing_type') || '';
  const radius = searchParams.get('radius') || '';
  
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'All Categories') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocationError('Requesting...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
          setLocationError('');
        },
        (error) => {
          console.warn("Location not granted:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError('📍 Location permission required. Please enable it in your browser settings.');
          } else {
            setLocationError('Location unavailable.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Not supported by browser.');
    }
  };

  // Ask for location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch results whenever params change
  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();

    let url = `/resources/search?`;
    if (query) url += `q=${encodeURIComponent(query)}&`;
    if (category && category.toLowerCase() !== 'all categories') url += `category=${encodeURIComponent(category)}&`;
    if (listingType) url += `listing_type=${encodeURIComponent(listingType)}&`;
    if (radius && userLocation) {
      url += `radius=${encodeURIComponent(radius)}&`;
    }
    // Always attach user location if available so backend can sort/calculate distance
    if (userLocation) {
      url += `lat=${userLocation.lat}&lon=${userLocation.lon}&`;
    }

    api.get(url, { signal: controller.signal })
      .then(res => {
        setResources(res.data.resources);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return; // Request was cancelled
        }
        console.error("Failed to search resources", err);
        setLoading(false);
      });
      
    return () => controller.abort();
  }, [query, category, listingType, radius, userLocation]);

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header / Breadcrumbs */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {searchParams.get('q') ? `Search results for "${searchParams.get('q')}"` : 'Browse Resources'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{resources.length} results found</p>
          </div>
          <div className="flex gap-2 bg-gray-200 p-1 rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Grid</button>
            <button onClick={() => setViewMode('map')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewMode === 'map' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>Map</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden flex items-center justify-center gap-2 bg-white border border-gray-300 rounded p-3 font-semibold text-gray-700"
          >
            <Filter className="w-5 h-5" />
            {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Sidebar Filters */}
          <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0 bg-white rounded border border-gray-200 p-5 h-fit shadow-sm`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button 
                onClick={() => setSearchParams(new URLSearchParams())}
                className="text-xs font-semibold text-teal-600 hover:underline"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Category</h3>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="category"
                        checked={category === cat}
                        onChange={() => updateFilter('category', cat)}
                        className="text-teal-600 focus:ring-teal-500" 
                      />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Listing Type */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Listing Type</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="listing"
                      checked={listingType === ''}
                      onChange={() => updateFilter('listing_type', '')}
                      className="text-teal-600 focus:ring-teal-500" 
                    />
                    <span className="text-sm text-gray-700">Any</span>
                  </label>
                  {['SELL', 'RENT', 'BORROW', 'DONATE', 'FREE'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="listing"
                        checked={listingType === type}
                        onChange={() => updateFilter('listing_type', type)}
                        className="text-teal-600 focus:ring-teal-500" 
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Distance / Radius */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Distance (Radius)</h3>
                {!userLocation ? (
                  <div className="mb-3">
                    <p className="text-xs text-amber-600 mb-2">{locationError || 'Enable location to use radius search.'}</p>
                    <button onClick={requestLocation} className="w-full bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold py-1.5 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" /> Get My Location
                    </button>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="radius"
                      checked={radius === ''}
                      onChange={() => updateFilter('radius', '')}
                      disabled={!userLocation}
                      className="text-teal-600 focus:ring-teal-500 disabled:opacity-50" 
                    />
                    <span className={`text-sm ${!userLocation ? 'text-gray-400' : 'text-gray-700'}`}>Anywhere</span>
                  </label>
                  {[1, 5, 10, 25, 50].map(rad => (
                    <label key={rad} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="radius"
                        checked={radius === String(rad)}
                        onChange={() => updateFilter('radius', String(rad))}
                        disabled={!userLocation}
                        className="text-teal-600 focus:ring-teal-500 disabled:opacity-50" 
                      />
                      <span className={`text-sm ${!userLocation ? 'text-gray-400' : 'text-gray-700'}`}>Within {rad} km</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Apply button is no longer needed since filters apply automatically */}
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="py-12 text-center text-gray-500 bg-white rounded border border-gray-200">Loading results...</div>
            ) : resources.length === 0 ? (
              <div className="py-12 text-center text-gray-500 bg-white rounded border border-gray-200">
                <p className="mb-2">No resources found matching your criteria.</p>
                <button onClick={() => setSearchParams(new URLSearchParams())} className="text-teal-600 font-semibold hover:underline">Clear filters</button>
              </div>
            ) : viewMode === 'map' ? (
              <div className="h-[600px] w-full rounded border border-gray-200 overflow-hidden relative z-0">
                <MapContainer center={userLocation ? [userLocation.lat, userLocation.lon] : [23.0225, 72.5714]} zoom={12} scrollWheelZoom={true} className="h-full w-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lon]}>
                      <Popup>You are here</Popup>
                    </Marker>
                  )}
                  {resources.filter(r => r.location_lat && r.location_lon).map(r => (
                    <Marker key={r.id} position={[r.location_lat, r.location_lon]}>
                      <Popup>
                        <Link to={`/resource/${r.id}`} className="block w-48">
                          <img src={r.image_url} alt={r.title} className="w-full h-24 object-cover mb-2 rounded" />
                          <h4 className="font-bold text-sm leading-tight text-gray-900">{r.title}</h4>
                          <p className="text-teal-700 font-bold text-xs mt-1">{r.price > 0 ? `₹${r.price}` : 'Free'}</p>
                        </Link>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                          <div className="flex items-center gap-1 truncate w-full">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{resource.location_name}</span>
                            {resource.distance !== undefined && resource.distance !== null && (
                              <span className="ml-auto font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                {resource.distance} km
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end text-xs text-gray-500">
                          <span className="uppercase">{new Date(resource.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
