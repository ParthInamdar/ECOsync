import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { UserCircle, Star, MapPin, Calendar, Flag, ShieldAlert } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    api.get(`/users/${id}`, { signal: controller.signal })
      .then(res => {
        setProfile(res.data.profile);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        setError('Failed to load profile.');
        setLoading(false);
      });
      
    return () => controller.abort();
  }, [id]);

  const handleReport = async () => {
    if (!user) return toast.error("Please login first.");
    if (actionLoading) return;
    const reason = prompt("Why are you reporting this user?");
    if (!reason) return;
    setActionLoading(true);
    try {
      await api.post(`/users/${id}/report`, { reason, description: "Reported from profile" });
      toast.success("User has been reported to the moderation team.");
    } catch (err) {
      toast.error("Failed to report user.");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockClick = () => {
    if (!user) return toast.error("Please login first.");
    if (actionLoading) return;
    setConfirmConfig({
      title: "Block User",
      message: "Are you sure you want to block this user? They won't be able to interact with you.",
      isDestructive: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await api.post(`/users/${id}/block`);
          toast.success("User has been blocked.");
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to block user.");
          console.error(err);
        } finally {
          setActionLoading(false);
        }
      }
    });
    setShowConfirm(true);
  };

  const handleToggleStatusClick = (e, resource) => {
    e.preventDefault(); // Prevent link click
    e.stopPropagation();
    
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
            // Update the profile state
            setProfile(prev => ({
              ...prev,
              resources: prev.resources.map(r => 
                r.id === resource.id ? { ...r, is_available: res.data.is_available } : r
              )
            }));
          }
        } catch (err) {
          alert("Failed to update status.");
        }
      }
    });
    setShowConfirm(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  if (error || !profile) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Profile not found'}</div>;

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <div className="bg-white rounded border border-gray-200 p-8 shadow-sm mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
          <UserCircle className="w-24 h-24 text-gray-300" />
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.username}</h1>
            
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
              </div>
              <div className="hidden md:block w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {profile.average_rating > 0 ? (
                  <span>{profile.average_rating} ({profile.total_reviews} reviews)</span>
                ) : (
                  <span className="text-gray-500 font-normal">No reviews yet</span>
                )}
              </div>
            </div>
            
            <p className="text-gray-700 max-w-2xl">
              Hi! I love sharing my unused items with the community. Let's make our neighborhood more sustainable together!
            </p>
          </div>
          
          {user && user.id !== parseInt(id) && (
            <div className="flex flex-col gap-2">
              <button disabled={actionLoading} onClick={handleReport} className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 rounded px-6 py-2 font-bold hover:bg-gray-50 shadow-sm transition-colors text-sm disabled:opacity-50">
                <Flag className="w-4 h-4" /> {actionLoading ? 'Processing...' : 'Report'}
              </button>
              <button disabled={actionLoading} onClick={handleBlockClick} className="flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 rounded px-6 py-2 font-bold hover:bg-red-50 shadow-sm transition-colors text-sm disabled:opacity-50">
                <ShieldAlert className="w-4 h-4" /> Block
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Listings */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Listings ({profile.resources.length})</h2>
            
            {profile.resources.length === 0 ? (
              <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-500">
                No listings found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.resources.map(resource => (
                  <div key={resource.id} className="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                    <Link to={`/resource/${resource.id}`} className="flex group flex-1">
                      <div className="w-32 h-32 bg-gray-100 shrink-0 relative border-r border-gray-100">
                        <img src={resource.image_url} alt={resource.title} className={`w-full h-full object-cover transition-transform duration-200 ${resource.is_available ? 'group-hover:scale-105' : 'opacity-60 grayscale'}`} />
                        <div className="absolute top-1 left-1 bg-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm text-gray-800 uppercase">
                          {resource.sharing_type}
                        </div>
                        {!resource.is_available && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">Unavailable</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h3 className={`text-sm font-bold line-clamp-2 leading-tight mb-1 ${resource.is_available ? 'text-gray-900 group-hover:text-teal-700' : 'text-gray-500'}`}>
                          {resource.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">{resource.category}</p>
                        
                        <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{resource.location_name}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {user && user.id === parseInt(id) && (
                      <div className="p-2 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <button 
                          onClick={(e) => handleToggleStatusClick(e, resource)}
                          className={`text-xs font-bold px-3 py-1.5 border rounded shadow-sm transition-colors ${
                            resource.is_available 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          }`}
                        >
                          {resource.is_available ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews ({profile.total_reviews})</h2>
            
            {profile.reviews.length === 0 ? (
              <div className="bg-white rounded border border-gray-200 p-6 text-center text-sm text-gray-500">
                No reviews yet. Complete a transaction with them to leave a review!
              </div>
            ) : (
              <div className="space-y-4">
                {profile.reviews.map(review => (
                  <div key={review.id} className="bg-white rounded border border-gray-200 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-6 h-6 text-gray-400" />
                        <span className="font-bold text-sm text-gray-900">{review.reviewer_name}</span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 italic">"{review.comment}"</p>
                    <p className="text-xs text-gray-400 mt-3">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        {...confirmConfig}
      />
    </div>
  );
}
