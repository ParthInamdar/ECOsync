import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Leaf, Recycle, TreePine, CloudRain } from 'lucide-react';

export default function MyImpact() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sustainability/me')
      .then(res => {
        setImpact(res.data.impact);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch impact", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Calculating impact...</div>;
  
  if (!impact) return <div className="min-h-screen flex items-center justify-center text-red-500">Failed to load data</div>;

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4 shadow-sm">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Your Ecological Impact</h1>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Every time you borrow or lend an item on EcoSync, you prevent new items from being manufactured, shipped, and eventually thrown away. Here is your real-world contribution!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <Recycle className="w-12 h-12 text-teal-500 mb-4" />
            <div className="text-4xl font-black text-gray-900 mb-1">{impact.total_items_reused}</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Items Reused</div>
            <p className="text-xs text-gray-400 mt-3">Total successful transactions you participated in.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 flex items-center justify-center text-3xl mb-4">🗑️</div>
            <div className="text-4xl font-black text-gray-900 mb-1">{impact.total_waste_avoided_kg} <span className="text-2xl text-gray-500">kg</span></div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Waste Avoided</div>
            <p className="text-xs text-gray-400 mt-3">Estimated physical weight of materials kept out of landfills.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <CloudRain className="w-12 h-12 text-blue-500 mb-4" />
            <div className="text-4xl font-black text-gray-900 mb-1">{impact.co2_prevented_kg} <span className="text-2xl text-gray-500">kg</span></div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">CO₂ Prevented</div>
            <p className="text-xs text-gray-400 mt-3">Estimated carbon emissions saved from manufacturing & transport.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow relative overflow-hidden">
            <TreePine className="w-12 h-12 text-green-600 mb-4 relative z-10" />
            <div className="text-4xl font-black text-gray-900 mb-1 relative z-10">{impact.trees_saved_equivalent}</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider relative z-10">Trees Equivalent</div>
            <p className="text-xs text-gray-400 mt-3 relative z-10">Number of mature trees needed to absorb this CO₂ in a year.</p>
            
            {/* Decorative background */}
            <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
              <TreePine className="w-40 h-40" />
            </div>
          </div>

        </div>

        <div className="bg-teal-50 border border-teal-200 rounded p-6 text-center shadow-sm">
          <p className="text-teal-900 font-medium">
            "We don't need a handful of people doing zero waste perfectly. We need millions of people doing it imperfectly."
          </p>
        </div>

      </div>
    </div>
  );
}
