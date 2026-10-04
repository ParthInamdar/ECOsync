import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { Star, X } from 'lucide-react';

export default function MyRequests() {
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'outgoing'
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTransactionId, setReviewTransactionId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [inRes, outRes] = await Promise.all([
        api.get('/requests/incoming'),
        api.get('/requests/me')
      ]);
      setIncoming(inRes.data.requests);
      setOutgoing(outRes.data.requests);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await api.patch(`/requests/${requestId}`, { status: newStatus });
      fetchRequests(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request');
    }
  };

  const submitReview = async () => {
    setReviewSubmitting(true);
    try {
      await api.post('/reviews/', {
        transaction_id: reviewTransactionId,
        rating: reviewRating,
        comment: reviewComment
      });
      alert('Review submitted successfully!');
      setReviewModalOpen(false);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openReviewModal = (transactionId) => {
    setReviewTransactionId(transactionId);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded border uppercase ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading requests...</div>;

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Requests</h1>
          <p className="text-sm text-gray-600 mt-1">Approve incoming requests or track items you want to borrow.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6 gap-6">
          <button 
            onClick={() => setActiveTab('incoming')}
            className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'incoming' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Incoming Requests ({incoming.length})
          </button>
          <button 
            onClick={() => setActiveTab('outgoing')}
            className={`pb-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'outgoing' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            My Sent Requests ({outgoing.length})
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          
          {activeTab === 'incoming' && (
            <div>
              {incoming.length === 0 ? (
                <div className="p-8 text-center text-gray-500">You don't have any incoming requests yet.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {incoming.map(req => (
                    <li key={req.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Link to={`/resource/${req.resource_id}`} className="font-bold text-lg text-teal-700 hover:underline">{req.resource_title}</Link>
                            <StatusBadge status={req.status} />
                          </div>
                          <p className="text-sm text-gray-800 font-medium mb-1">
                            Requested by: <Link to={`/profile/${req.requester_id}`} className="font-bold hover:underline text-teal-600">{req.requester_name}</Link>
                          </p>
                          <p className="text-sm text-gray-600 italic bg-gray-50 border border-gray-200 rounded p-3 mt-2">
                            "{req.message || "No message provided."}"
                          </p>
                          <p className="text-xs text-gray-400 mt-2">Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        {req.status === 'PENDING' && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                              className="bg-teal-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-teal-700"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                              className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded text-sm font-bold hover:bg-red-50"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        
                        {req.status === 'ACCEPTED' && req.transaction_id && (
                          <div className="flex flex-col gap-2 items-end shrink-0">
                            <p className="text-sm font-bold text-green-600">Approved</p>
                            <button onClick={() => openReviewModal(req.transaction_id)} className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-3 py-1.5 rounded">
                              Leave Review
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'outgoing' && (
            <div>
              {outgoing.length === 0 ? (
                <div className="p-8 text-center text-gray-500">You haven't requested any items yet.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {outgoing.map(req => (
                    <li key={req.id} className="p-6 hover:bg-gray-50">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 shrink-0 overflow-hidden">
                          <img src={req.resource_image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <Link to={`/resource/${req.resource_id}`} className="font-bold text-lg text-teal-700 hover:underline">{req.resource_title}</Link>
                            <StatusBadge status={req.status} />
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Owner: <span className="font-medium text-gray-900">{req.owner_name}</span></p>
                          <p className="text-xs text-gray-400 mt-2">Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                          
                          {req.status === 'ACCEPTED' && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded flex justify-between items-center">
                              <p className="text-sm text-green-800 font-medium">Your request was approved! Arrange pickup.</p>
                              {req.transaction_id && (
                                <button onClick={() => openReviewModal(req.transaction_id)} className="text-sm bg-white border border-green-300 text-green-700 hover:bg-green-100 font-bold px-3 py-1.5 rounded">
                                  Leave Review
                                </button>
                              )}
                            </div>
                          )}
                          
                          {req.status === 'PENDING' && (
                            <button 
                              onClick={() => handleUpdateStatus(req.id, 'CANCELLED')}
                              className="mt-3 text-sm text-red-600 hover:underline font-medium"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Leave a Review</h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">How was your experience with this transaction?</p>
              
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              
              <label className="block text-sm font-semibold text-gray-800 mb-2">Comment</label>
              <textarea 
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience (e.g., condition of the item, friendliness...)"
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-teal-500 mb-6"
              ></textarea>
              
              <button 
                onClick={submitReview}
                disabled={reviewSubmitting}
                className="w-full bg-teal-600 text-white rounded py-3 font-bold hover:bg-teal-700 transition-colors disabled:opacity-70"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
