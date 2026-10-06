import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Star, UserCircle, AlertCircle, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import ConfirmModal from '../../components/ConfirmModal';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix leaflet default marker icons issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ResourceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  
  // Request Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState(''); // 'sending', 'success', 'error'
  const [requestError, setRequestError] = useState('');
  
  // Calendar State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  
  // Confirm Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    api.get(`/resources/${id}`, { signal: controller.signal })
      .then(res => {
        setResource(res.data.resource);
        setSelectedImage(res.data.resource.image_url);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        setError('Failed to load resource details.');
        setLoading(false);
      });
      
    api.get(`/resources/${id}/availability`, { signal: controller.signal })
      .then(res => {
        if(res.data.success) {
          setBookedDates(res.data.booked_dates);
        }
      })
      .catch(err => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error("Failed to load availability", err);
      });
      
    if (user && id) {
      api.get(`/users/saved/${id}/check`, { signal: controller.signal })
        .then(res => {
          if(res.data.success) {
            setIsSaved(res.data.is_saved);
          }
        })
        .catch(err => {
          if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
          console.error("Failed to check saved status", err);
        });
    }

    return () => controller.abort();
  }, [id, user]);

  const handleChatStart = async () => {
    if (!user) {
      toast.error("Please login first!");
      return;
    }
    if (chatLoading) return;
    setChatLoading(true);
    try {
      const res = await api.post('/chat/', { listing_id: resource.id });
      if (res.data.success) {
        navigate(`/messages/${res.data.conversation_id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to open chat.");
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleStatusClick = () => {
    const action = resource.is_available ? "make it unavailable (e.g. rented/sold)" : "make it available";
    setConfirmConfig({
      title: "Confirm Status Change",
      message: `Are you sure you want to ${action}?`,
      isDestructive: false,
      onConfirm: async () => {
        try {
          const res = await api.put(`/resources/${resource.id}/status`, {
            is_available: !resource.is_available
          });
          if (res.data.success) {
            setResource({ ...resource, is_available: res.data.is_available });
          }
        } catch (err) {
          alert("Failed to update status.");
        }
      }
    });
    setShowConfirm(true);
  };

  const handleSendRequest = async () => {
    if (!user) {
      // should ideally redirect to login, but just showing error for now
      setRequestError("Please login to request items.");
      return;
    }
    
    const needsDates = (resource.listing_type === 'RENT' || resource.listing_type === 'BORROW' || resource.sharing_type === 'Borrow');
    if (needsDates && (!startDate || !endDate)) {
      setRequestError("Please select both start and end dates.");
      return;
    }
    
    setRequestStatus('sending');
    setRequestError('');
    
    try {
      const res = await api.post('/requests/', {
        resource_id: resource.id,
        message: requestMessage,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null
      });
      if(res.data.success) {
        setRequestStatus('success');
        setResource(prev => ({ ...prev, has_requested: true }));
        setTimeout(() => {
          setShowRequestModal(false);
          setRequestStatus('');
        }, 2000);
      }
    } catch (err) {
      setRequestStatus('error');
      setRequestError(err.response?.data?.message || "Failed to send request.");
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login first to save items!");
      return;
    }
    setSaveLoading(true);
    try {
      const res = await api.post(`/users/saved/${resource.id}`);
      if (res.data.success) {
        setIsSaved(res.data.is_saved);
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to save resource");
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !resource) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Resource not found'}</div>;

  const getActionWord = (type) => {
    const t = (type || '').toUpperCase();
    if (t === 'SELL') return 'BUY';
    if (t === 'DONATE' || t === 'FREE') return 'BORROW';
    if (t === 'BORROW') return 'LEND';
    if (t === 'RENT') return 'RENT';
    return t || 'REQUEST';
  };
  const actionWord = getActionWord(resource.listing_type || resource.sharing_type);

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-500 mb-4 flex gap-2">
          <Link to="/" className="hover:underline">Home</Link>
          <span>›</span>
          <Link to={`/search?category=${resource.category}`} className="hover:underline">{resource.category}</Link>
          <span>›</span>
          <span className="text-gray-900 truncate">{resource.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content (Images + Details) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Gallery */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
              <div className="aspect-[4/3] sm:aspect-video bg-black flex items-center justify-center relative">
                <img 
                  src={selectedImage || "https://placehold.co/800x600/e2e8f0/64748b?text=No+Image"} 
                  alt={resource.title} 
                  className="max-h-full max-w-full object-contain" 
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x600/e2e8f0/64748b?text=Error+Loading+Image"; }}
                />
                <div className="absolute top-4 left-4 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                  {resource.listing_type || resource.sharing_type.toUpperCase()}
                </div>
              </div>
              {resource.images && resource.images.length > 0 && (
                <div className="flex gap-2 p-2 overflow-x-auto bg-gray-50 border-t border-gray-200">
                  <img 
                    src={resource.image_url} 
                    alt="Gallery Main" 
                    onClick={() => setSelectedImage(resource.image_url)}
                    className={`w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 border-2 ${selectedImage === resource.image_url ? 'border-teal-500' : 'border-transparent'}`}
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/e2e8f0/64748b?text=Error"; }}
                  />
                  {resource.images.map((img, idx) => (
                    img !== resource.image_url && (
                      <img 
                        key={idx} 
                        src={img} 
                        alt="Gallery" 
                        onClick={() => setSelectedImage(img)}
                        className={`w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 border-2 ${selectedImage === img ? 'border-teal-500' : 'border-transparent'}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/e2e8f0/64748b?text=Error"; }}
                      />
                    )
                  ))}
                </div>
              )}
            </div>

            {/* Description & Details */}
            <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-line mb-6">
                {resource.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Category</span>
                  <span className="font-medium text-gray-900">{resource.category}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Condition</span>
                  <span className="font-medium text-gray-900">{resource.condition}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Status</span>
                  <span className="font-medium text-gray-900">{resource.is_available ? 'Available' : 'Unavailable'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Posted</span>
                  <span className="font-medium text-gray-900">{new Date(resource.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {resource.ai_condition_assessment && (
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    AI Condition Assessment
                  </h3>
                  <p className="text-sm text-indigo-800">{resource.ai_condition_assessment}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Price, Owner, Actions) */}
          <div className="space-y-6">
            
            {/* Title & Actions */}
            <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{resource.title}</h1>
              <div className="text-2xl font-bold text-teal-700 mb-2">
                {resource.price > 0 ? `₹${resource.price}` : 'Free'}
                {resource.price_unit && <span className="text-lg font-normal text-gray-500 ml-1">{resource.price_unit}</span>}
              </div>
              {resource.security_deposit > 0 && (
                <div className="text-sm text-gray-500 mb-4">
                  Security Deposit: ₹{resource.security_deposit}
                </div>
              )}
              {!resource.security_deposit && <div className="mb-4"></div>}
              
              <div className="flex items-start gap-2 text-gray-500 text-sm mb-6">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                <span>{resource.location_name}</span>
              </div>

              {resource.location_lat && resource.location_lon && (
                <div className="h-48 w-full rounded border border-gray-200 overflow-hidden relative z-0 mb-6">
                  <MapContainer 
                    center={[resource.location_lat, resource.location_lon]} 
                    zoom={14} 
                    scrollWheelZoom={false} 
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[resource.location_lat, resource.location_lon]}>
                      <Popup>{resource.location_name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              {user && user.id === resource.owner_id ? (
                <button 
                  onClick={handleToggleStatusClick}
                  className={`w-full rounded py-3 font-bold text-lg transition-colors shadow-sm mb-3 ${resource.is_available ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200' : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'}`}
                >
                  {resource.is_available ? 'Mark as Unavailable (Rented/Sold)' : 'Mark as Available'}
                </button>
              ) : resource.is_available ? (
                <div className="flex flex-col gap-3 mb-3">
                  <button 
                    onClick={() => {
                      if(!user) toast.error("Please login first!"); 
                      else setShowRequestModal(true);
                    }}
                    disabled={resource.has_requested || actionLoading}
                    className={`w-full text-white rounded py-3 font-bold text-lg transition-colors shadow-sm ${resource.has_requested ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                  >
                    {resource.has_requested ? 'Requested' : `Request to ${actionWord}`}
                  </button>
                  <button 
                    onClick={handleChatStart}
                    disabled={chatLoading}
                    className="w-full bg-white text-teal-600 border border-teal-600 rounded py-3 font-bold text-lg hover:bg-teal-50 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {chatLoading ? 'Creating chat...' : 'Chat with Owner'}
                  </button>
                </div>
              ) : (
                <button disabled className="w-full bg-gray-300 text-gray-600 rounded py-3 font-bold text-lg cursor-not-allowed mb-3">
                  Currently Unavailable
                </button>
              )}
              
              <button 
                onClick={handleSave}
                disabled={saveLoading}
                className="w-full bg-white text-teal-700 border-2 border-teal-600 rounded py-2.5 font-bold hover:bg-teal-50 transition-colors"
              >
                {saveLoading ? 'Saving...' : isSaved ? 'Saved (Click to unsave)' : 'Save for later'}
              </button>
            </div>

            {/* Owner Details */}
            <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Lender Profile</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <UserCircle className="w-12 h-12 text-gray-400" />
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{resource.owner_name}</h4>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
                    <span className="bg-amber-100 text-amber-800 px-1.5 rounded text-xs font-bold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-current" /> {resource.owner_rating || 0}
                    </span>
                    <span className="ml-1 text-xs text-gray-500">({resource.owner_reviews || 0} reviews)</span>
                    <span>· Member since {resource.owner_member_since || 2026}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Link to={`/profile/${resource.owner_id}`} className="flex items-center justify-center w-full bg-gray-100 text-gray-800 rounded py-2 font-medium hover:bg-gray-200 transition-colors">
                  View Profile & Activity
                </Link>
              </div>
            </div>

            {/* Safety Warning */}
            <div className="bg-white rounded border border-gray-200 p-4 shadow-sm flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Meet in a public place for the exchange. Inspect the item thoroughly. Do not pay any security deposit outside the EcoSync platform.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Request to {actionWord}</h3>
              <button onClick={() => {setShowRequestModal(false); setRequestStatus('');}} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {requestStatus === 'success' ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Request Sent!</h4>
                  <p className="text-sm text-gray-600 mt-2">The owner has been notified. You can track this in your dashboard.</p>
                  <button onClick={() => setShowRequestModal(false)} className="mt-6 w-full bg-teal-600 text-white rounded py-2 font-bold hover:bg-teal-700">Close</button>
                </div>
              ) : (
                <>
                  {requestError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">{requestError}</div>}
                  <div className="flex gap-4 items-center mb-6 bg-gray-50 p-3 rounded border border-gray-200">
                    <img src={resource.image_url} alt="" className="w-12 h-12 rounded object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/e2e8f0/64748b?text=Error"; }} />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{resource.title}</p>
                      <p className="text-xs text-gray-500">Owner: {resource.owner_name}</p>
                    </div>
                  </div>
                  
                  {(actionWord === 'BORROW' || actionWord === 'RENT') && (
                    <div className="mb-4">
                      {bookedDates.length > 0 && (
                        <div className="mb-3 text-sm text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                          <strong>Unavailable Dates:</strong>
                          <ul className="list-disc pl-4 mt-1 text-xs">
                            {bookedDates.map((b, i) => (
                              <li key={i}>{new Date(b.start_date).toLocaleDateString()} to {new Date(b.end_date).toLocaleDateString()}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-800 mb-1">Start Date *</label>
                          <input type="date" min={new Date().toISOString().split('T')[0]} value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-800 mb-1">End Date *</label>
                          <input type="date" min={startDate || new Date().toISOString().split('T')[0]} value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="block text-sm font-semibold text-gray-800 mb-2">Message to owner (Optional)</label>
                  <textarea 
                    rows={4}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Hi, I would like to borrow this for a couple of days. I stay in the same neighborhood."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500 mb-6"
                  ></textarea>
                  
                  <button 
                    onClick={handleSendRequest}
                    disabled={requestStatus === 'sending'}
                    className="w-full bg-teal-600 text-white rounded py-3 font-bold text-lg hover:bg-teal-700 transition-colors disabled:opacity-70"
                  >
                    {requestStatus === 'sending' ? 'Sending...' : 'Send Request'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        {...confirmConfig}
      />
    </div>
  );
}
