import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, MousePointer, Eye, Calendar, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { User } from '../types';

interface AdStatsViewProps {
  currentUser: User | null;
}

interface AdStats {
  impressions: number;
  clicks: number;
  revenue: number;
  ecpm: number;
}

const AdStatsView: React.FC<AdStatsViewProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'today' | 'yesterday' | '7days' | '30days'>('today');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Access Control
  if (!currentUser || currentUser.email !== 'overmods1@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
        <p className="text-zinc-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/adsterra-stats?range=${range}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      
      // Calculate totals from API response (assuming standard Adsterra format)
      // If API returns totals directly, use that. Otherwise sum up items.
      // For now, assume API returns { totals: { ... } } or similar.
      // If API returns array of items, sum them up.
      
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalRevenue = 0;
      let totalEcpm = 0;

      if (data.totals) {
        totalImpressions = data.totals.impressions || 0;
        totalClicks = data.totals.clicks || 0;
        totalRevenue = data.totals.revenue || 0;
        totalEcpm = data.totals.ecpm || 0;
      } else if (Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          totalImpressions += item.impressions || 0;
          totalClicks += item.clicks || 0;
          totalRevenue += item.revenue || 0;
        });
        // Calculate average eCPM
        if (totalImpressions > 0) {
          totalEcpm = (totalRevenue / totalImpressions) * 1000;
        }
      }

      setStats({
        impressions: totalImpressions,
        clicks: totalClicks,
        revenue: totalRevenue,
        ecpm: totalEcpm
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError('Failed to load ad statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Auto refresh every 60s
    return () => clearInterval(interval);
  }, [range]);

  const StatCard = ({ title, value, icon, color, subtext }: any) => (
    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:border-white/10 transition-all">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${color} bg-white/5`}>
            {React.cloneElement(icon, { size: 20 })}
          </div>
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <h3 className="text-3xl font-black text-white mb-1">{value}</h3>
        {subtext && <p className="text-zinc-600 text-[10px] font-medium">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#0a0a0a] border border-white/5 p-6 rounded-[2.5rem]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Ad Revenue</h1>
            <p className="text-zinc-500 text-xs font-medium mt-1">Real-time Adsterra Performance</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
          {(['today', 'yesterday', '7days', '30days'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                range === r 
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-900/20' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {r === 'today' ? 'Today' : r === 'yesterday' ? 'Yesterday' : r === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
          <p className="text-zinc-500 text-xs font-bold">Fetching latest data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={32} />
          <h3 className="text-white font-bold mb-2">Data Unavailable</h3>
          <p className="text-zinc-500 text-sm mb-6">{error}</p>
          <button 
            onClick={fetchStats}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Revenue" 
            value={`$${stats?.revenue.toFixed(2)}`} 
            icon={<DollarSign />} 
            color="text-emerald-500"
            subtext="Total earnings for selected period"
          />
          <StatCard 
            title="Impressions" 
            value={stats?.impressions.toLocaleString()} 
            icon={<Eye />} 
            color="text-blue-500"
            subtext="Total ad views"
          />
          <StatCard 
            title="Clicks" 
            value={stats?.clicks.toLocaleString()} 
            icon={<MousePointer />} 
            color="text-purple-500"
            subtext={`CTR: ${stats && stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) : 0}%`}
          />
          <StatCard 
            title="eCPM" 
            value={`$${stats?.ecpm.toFixed(2)}`} 
            icon={<TrendingUp />} 
            color="text-orange-500"
            subtext="Average revenue per 1k impressions"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-zinc-600 text-[10px]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Live Connection
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 text-zinc-500 hover:text-white text-[10px] font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </button>
      </div>
    </div>
  );
};

export default AdStatsView;
