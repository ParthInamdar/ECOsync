import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, Trash2, Users, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({});

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        if (activeTab === 'users') {
          const res = await api.get('/admin/users');
          setUsers(res.data.users);
        } else if (activeTab === 'resources') {
          const res = await api.get('/admin/resources');
          setResources(res.data.resources);
        } else if (activeTab === 'activities') {
          const res = await api.get('/admin/activities');
          setActivities(res.data.activities);
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, user, navigate]);

  const handleDeleteUserClick = (id) => {
    setConfirmConfig({
      title: "Delete User",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          setUsers(users.filter(u => u.id !== id));
        } catch (err) {
          alert(err.response?.data?.message || "Failed to delete user");
        }
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteResourceClick = (id) => {
    setConfirmConfig({
      title: "Delete Resource",
      message: "Are you sure you want to delete this resource? This action cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/resources/${id}`);
          setResources(resources.filter(r => r.id !== id));
        } catch (err) {
          alert("Failed to delete resource");
        }
      }
    });
    setShowConfirm(true);
  };

  if (loading && users.length === 0 && resources.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
            <p className="text-sm text-gray-500">Manage users and community resources.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'users' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Users className="w-4 h-4" /> Users
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'resources' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Package className="w-4 h-4" /> Resources
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 ${activeTab === 'activities' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 
              Activity Logs
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.id}</td>
                        <td className="px-4 py-3">{u.username}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          {u.id !== user.id && (
                            <button onClick={() => handleDeleteUserClick(u.id)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(r => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.id}</td>
                        <td className="px-4 py-3">{r.title}</td>
                        <td className="px-4 py-3">{r.owner}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${r.is_available ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {r.is_available ? 'AVAILABLE' : 'UNAVAILABLE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteResourceClick(r.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action Type</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No activity logs found.</td>
                      </tr>
                    ) : (
                      activities.map(a => (
                        <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                            {new Date(a.created_at).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{a.username || 'System'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold tracking-wider uppercase">
                              {a.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{a.details}</td>
                          <td className="px-4 py-3 text-gray-400 font-mono text-xs">{a.ip_address || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
