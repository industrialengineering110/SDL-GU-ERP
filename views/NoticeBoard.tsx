import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, Info, Calendar, User, Image as ImageIcon, X as CloseIcon } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { AppNotification } from '../types';
import { useGlobal } from '../App';

const NoticeBoard: React.FC = () => {
  const { currentUser, theme } = useGlobal();
  const [notices, setNotices] = useState<AppNotification[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNotice, setNewNotice] = useState({
    message: '',
    type: 'INFO' as 'INFO' | 'ALERT',
    image: ''
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewNotice(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchNotices = () => {
    const all = mockDb.getNotifications();
    // For notice board, we show all notifications that were sent to 'ALL'
    setNotices(all.filter(n => n.toDepartment === 'ALL').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleAddNotice = () => {
    if (!newNotice.message.trim()) return;

    const notice: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      type: newNotice.type,
      message: newNotice.message,
      timestamp: new Date().toISOString(),
      from: currentUser?.name || 'Admin',
      toDepartment: 'ALL',
      readBy: [],
      image: newNotice.image || undefined
    };

    mockDb.addNotification(notice);
    setShowAddModal(false);
    setNewNotice({ message: '', type: 'INFO', image: '' });
    fetchNotices();
    alert('Notice published and broadcasted to all users!');
  };

  const deleteNotice = (id: string) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      mockDb.deleteNotification(id);
      fetchNotices();
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none text-slate-900 dark:text-white">
            Notice Board
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Enterprise Announcements</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
          >
            <Plus size={16} /> Post Notice
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {notices.map(notice => (
          <div 
            key={notice.id} 
            className={`p-6 rounded-3xl border transition-all ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex gap-4">
              <div className={`p-3 rounded-2xl h-fit ${
                notice.type === 'ALERT' 
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' 
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {notice.type === 'ALERT' ? <Bell size={20} /> : <Info size={20} />}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1"><User size={12} /> {notice.from}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(notice.timestamp).toLocaleDateString()}</span>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => deleteNotice(notice.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {notice.message}
                </p>
                {notice.image && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 max-w-md">
                    <img src={notice.image} alt="Notice Attachment" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {notices.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300 mx-auto">
              <Bell size={32} />
            </div>
            <p className="text-slate-400 font-bold italic">No notices posted yet.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-6">Post New Notice</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notice Type</label>
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button 
                    onClick={() => setNewNotice({...newNotice, type: 'INFO'})}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                      newNotice.type === 'INFO' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Information
                  </button>
                  <button 
                    onClick={() => setNewNotice({...newNotice, type: 'ALERT'})}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                      newNotice.type === 'ALERT' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Alert / Urgent
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message</label>
                <textarea 
                  className={`w-full rounded-2xl p-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[120px] border ${
                    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'
                  }`}
                  placeholder="Type your notice here..."
                  value={newNotice.message}
                  onChange={e => setNewNotice({...newNotice, message: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachment (Optional)</label>
                {!newNotice.image ? (
                  <div className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all ${
                    theme === 'dark' ? 'border-slate-800 hover:border-slate-700 bg-slate-800/50' : 'border-slate-200 hover:border-blue-400 bg-slate-50'
                  }`}>
                    <ImageIcon size={24} className="text-slate-400" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Click to upload image</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                    <img src={newNotice.image} alt="Preview" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setNewNotice({...newNotice, image: ''})}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CloseIcon size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddNotice}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
