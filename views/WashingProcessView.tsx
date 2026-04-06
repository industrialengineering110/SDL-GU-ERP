import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, FileBarChart, Users, Hammer, Clock, Sparkles, ChevronRight } from 'lucide-react';

const ActivityCard = ({ title, sub, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex items-center gap-4"
  >
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
      <Icon size={20} />
    </div>
    
    <div className="min-w-0 flex-1">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{title}</h3>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{sub}</p>
    </div>

    <div className="text-slate-200 group-hover:text-indigo-600 transition-colors">
      <ChevronRight size={16} />
    </div>
  </div>
);

const WashingProcessView = () => {
  const { process } = useParams();
  const navigate = useNavigate();
  const title = process === 'wet-process' ? 'Wet Process' : 'Dry Process';

  const cards = [
    { title: 'IE Activity', sub: 'Industrial Engineering Tasks', icon: ClipboardList, color: 'bg-indigo-500', path: `/${process}/ie-activity` },
    { title: 'Section Report', sub: 'Performance & KPIs', icon: FileBarChart, color: 'bg-blue-500', path: `/${process}/report` },
    { title: 'Manpower', sub: 'Manage Manpower', icon: Users, color: 'bg-teal-500', path: `/${process}/input/manpower` },
    { title: 'Machinery', sub: 'Manage Machinery', icon: Hammer, color: 'bg-slate-700', path: `/${process}/input/machines` },
    { title: 'Hourly Production', sub: 'Production Tracking', icon: FileBarChart, color: 'bg-emerald-500', path: `/${process}/input/hourly` },
    { title: 'NPT', sub: 'Down Time Tracking', icon: Clock, color: 'bg-rose-500', path: `/${process}/input/npt` },
    { title: '5S Audit', sub: 'Workplace Standards', icon: Sparkles, color: 'bg-amber-500', path: `/${process}/audit/5s` },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">{title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <ActivityCard 
            key={card.title} 
            {...card} 
            onClick={() => navigate(card.path)} 
          />
        ))}
      </div>
    </div>
  );
};

export default WashingProcessView;
