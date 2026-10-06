import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import { MapPin, Image as ImageIcon, IndianRupee, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix leaflet default marker icons issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPickerMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function AddResource() {
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: { listing_type: 'FREE', condition: 'Good' }
  });
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [suggestingPrice, setSuggestingPrice] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);

  const listingType = watch('listing_type');

  useEffect(() => {
    const controller = new AbortController();
    
    // Fetch categories
    api.get('/resources/categories', { signal: controller.signal })
      .then(res => setCategories(res.data.categories))
      .catch(err => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error('Failed to load categories', err);
      });
      
    return () => controller.abort();
  }, []);

  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (images.length >= 5) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        setImages(prev => [...prev, res.data.url]);
      }
    } catch (err) {
      toast.error("Failed to upload image. " + (err.response?.data?.message || ''));
      console.error(err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateDescription = async () => {
    const { title, category_id, condition } = getValues();
    if (!title || !category_id) {
      toast.error("Please enter a title and select a category first!");
      return;
    }
    
    const category = categories.find(c => c.id == category_id)?.name || 'Other';
    
    setGeneratingDesc(true);
    try {
      const res = await api.post('/ai-helpers/generate-description', { title, category, condition });
      if (res.data.success) {
        setValue('description', res.data.description);
      }
    } catch (err) {
      toast.error("Failed to generate description");
      console.error(err);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSuggestPrice = async () => {
    const { title, category_id, condition, listing_type } = getValues();
    if (!title || !category_id) {
      toast.error("Please enter a title and select a category first!");
      return;
    }
    
    const category = categories.find(c => c.id == category_id)?.name || 'Other';
    
    setSuggestingPrice(true);
    try {
      const res = await api.post('/ai-helpers/suggest-price', { title, category, condition, listing_type });
      if (res.data.success) {
        setValue('price', res.data.suggested_price);
      }
    } catch (err) {
      toast.error("Failed to suggest price");
      console.error(err);
    } finally {
      setSuggestingPrice(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setShowMap(true);
        },
        (err) => toast.error("Could not get location")
      );
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/resources/', {
        ...data,
        category_id: parseInt(data.category_id),
        images: images,
        image_url: images.length > 0 ? images[0] : null,
        location_lat: mapPosition?.lat || null,
        location_lon: mapPosition?.lng || null
      });
      
      if (res.data.success) {
        navigate(`/resource/${res.data.resource_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-white">
            <h1 className="text-2xl font-bold text-gray-900">Post an Ad</h1>
            <p className="text-sm text-gray-500 mt-1">Share, rent, or sell your items in the community.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
                {error}
              </div>
            )}
            
            {/* Listing Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">What do you want to do? *</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {['SELL', 'RENT', 'BORROW', 'DONATE', 'FREE'].map(type => (
                  <label key={type} className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${listingType === type ? 'border-teal-600 bg-teal-50 text-teal-700 font-bold' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                    <input type="radio" value={type} {...register('listing_type')} className="hidden" />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Pricing Fields */}
            {(listingType === 'SELL' || listingType === 'RENT' || listingType === 'BORROW') && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(listingType === 'SELL' || listingType === 'RENT') && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-semibold text-gray-800">Price *</label>
                      <button type="button" onClick={handleSuggestPrice} disabled={suggestingPrice} className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-1 rounded">
                        {suggestingPrice ? '⏳ Thinking...' : '✨ AI Suggest'}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        {...register('price', { required: listingType === 'SELL' || listingType === 'RENT' })}
                        className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}
                
                {listingType === 'RENT' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Rate Unit</label>
                    <select
                      {...register('price_unit')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="/day">Per Day</option>
                      <option value="/week">Per Week</option>
                      <option value="/month">Per Month</option>
                    </select>
                  </div>
                )}

                {(listingType === 'RENT' || listingType === 'BORROW') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Security Deposit (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        {...register('security_deposit')}
                        className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Ad title *</label>
              <input
                type="text"
                placeholder="E.g. Scientific Calculator TI-84"
                {...register('title', { required: 'Title is required', minLength: 5 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Category & Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Category *</label>
                <select
                  {...register('category_id', { required: 'Please select a category' })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Condition</label>
                <select
                  {...register('condition')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-800">Description</label>
                <button type="button" onClick={handleGenerateDescription} disabled={generatingDesc} className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-1 rounded">
                  {generatingDesc ? '⏳ Generating...' : '✨ Auto-generate with AI'}
                </button>
              </div>
              <textarea
                rows={5}
                placeholder="Describe your item, include features, flaws, and rules..."
                {...register('description')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Multi-Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Upload Photos (Max 5)</label>
              <div className="flex flex-wrap gap-4 mt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img src={img} alt="Upload preview" className="w-full h-full object-cover" />
                  </div>
                ))}
                {images.length < 5 && (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploadingImage}
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-50"
                  >
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">{uploadingImage ? 'Uploading...' : 'Add Photo'}</span>
                  </button>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageSelect}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-800">Location *</label>
                <div className="flex gap-2">
                  <button type="button" onClick={handleGetCurrentLocation} className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-1 rounded flex items-center gap-1">
                    <Crosshair className="w-3 h-3" /> Current Location
                  </button>
                  <button type="button" onClick={() => setShowMap(!showMap)} className="text-xs font-bold text-gray-600 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {showMap ? 'Hide Map' : 'Pick on Map'}
                  </button>
                </div>
              </div>
              
              {showMap && (
                <div className="h-64 w-full rounded border border-gray-300 overflow-hidden relative z-0 mb-3">
                  <MapContainer 
                    center={mapPosition || [23.0225, 72.5714]} 
                    zoom={13} 
                    scrollWheelZoom={true} 
                    className="h-full w-full"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPickerMarker position={mapPosition} setPosition={setMapPosition} />
                  </MapContainer>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[400] bg-white/90 px-3 py-1 rounded-full shadow text-xs font-bold text-gray-700 pointer-events-none">
                    Click map to drop pin
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="E.g. Navrangpura, Ahmedabad"
                  {...register('location_name', { required: true })}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-teal-600 text-white px-8 py-3 rounded-md font-bold shadow-sm hover:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-colors disabled:opacity-70"
              >
                {loading ? 'Posting...' : 'Post now'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
