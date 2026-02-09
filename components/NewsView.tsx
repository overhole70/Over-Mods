
import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, Calendar, User as UserIcon, ArrowRight, Loader2, Sparkles, Image as ImageIcon, LayoutGrid, Plus, Clock, MessageSquare, Send, Heart, Trash2, ShieldCheck, X, Search, Users, AlertTriangle } from 'lucide-react';
import { NewsItem, User, CommunityPost, PostComment } from '../types';
import { db } from '../db';
import { useTranslation } from '../LanguageContext';

interface NewsViewProps {
  onBack: () => void;
  currentUser: User | null;
  onViewProfile?: (user: User) => void;
}

const NewsView: React.FC<NewsViewProps> = ({ onBack, currentUser, onViewProfile }) => {
  const { isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<'news' | 'community' | 'users'>('news');
  
  // News State
  const [news, setNews] = useState<NewsItem[]>([]);
  
  // Community Posts State
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Delete Confirmation State
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Users Tab State
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Comments State
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm('');
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'news') {
        const data = await db.getAll('news');
        setNews((data as NewsItem[]) || []);
      } else if (activeTab === 'community') {
        const data = await db.getCommunityPosts();
        setPosts(data || []);
      } else if (activeTab === 'users') {
        const data = await db.getAllUsers();
        setAllUsers(data || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (postImages.length >= 3) return alert("الحد الأقصى 3 صور");
      const file = e.target.files[0];
      try {
        const resized = await db.resizeImage(file, 800, 800);
        setPostImages([...postImages, resized]);
      } catch (err) {
        alert("فشل رفع الصورة");
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postDesc.trim() || !currentUser) return;
    
    setIsProcessing(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      
      await db.createCommunityPost({
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
        title: postTitle,
        description: postDesc,
        images: postImages,
        expiresAt: expiresAt.toISOString()
      });
      
      setIsCreatingPost(false);
      setPostTitle('');
      setPostDesc('');
      setPostImages([]);
      loadData();
    } catch (err) {
      alert("حدث خطأ أثناء النشر");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await db.deleteCommunityPost(postToDelete);
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
      setPostToDelete(null);
    } catch (err) {
      alert("فشل الحذف");
    }
  };

  const handleLikePost = async (post: CommunityPost) => {
    if (!currentUser) return alert("يرجى تسجيل الدخول");
    const isLiked = post.likes.includes(currentUser.id);
    
    // Optimistic UI
    const updatedLikes = isLiked 
      ? post.likes.filter(id => id !== currentUser.id)
      : [...post.likes, currentUser.id];
      
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: updatedLikes } : p));
    await db.likeCommunityPost(post.id, currentUser.id);
  };

  const handleSendComment = async (postId: string) => {
    if (!commentText.trim() || !currentUser) return;
    setIsSendingComment(true);
    const newComment: PostComment = {
      id: `c_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      text: commentText,
      createdAt: new Date().toISOString(),
      likes: []
    };

    try {
      await db.commentOnPost(postId, newComment);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...(p.comments || []), newComment] };
        }
        return p;
      }));
      setCommentText('');
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDeleteComment = async (postId: string, comment: PostComment) => {
    if (!confirm("حذف التعليق؟")) return;
    try {
      await db.deletePostComment(postId, comment);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: p.comments.filter(c => c.id !== comment.id) };
        }
        return p;
      }));
    } catch(e) {}
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    if (!currentUser) return;
    
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updatedComments = p.comments.map(c => {
          if (c.id === commentId) {
            const hasLiked = c.likes?.includes(currentUser.id);
            const newLikes = hasLiked 
              ? c.likes.filter(id => id !== currentUser.id)
              : [...(c.likes || []), currentUser.id];
            return { ...c, likes: newLikes };
          }
          return c;
        });
        return { ...p, comments: updatedComments };
      }
      return p;
    }));

    await db.likePostComment(postId, commentId, currentUser.id);
  };

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const filteredPosts = posts.filter(p => {
    const s = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(s) || 
           p.description.toLowerCase().includes(s) || 
           p.authorName.toLowerCase().includes(s);
  });

  const filteredUsers = allUsers.filter(u => {
    const s = searchTerm.toLowerCase();
    const matches = u.displayName.toLowerCase().includes(s) || 
                    u.username.toLowerCase().includes(s) || 
                    (u.numericId && u.numericId.includes(s));
    
    const isPublic = u.privacySettings?.showInSearch !== false;
    return matches && isPublic && u.id !== currentUser?.id;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 px-4 sm:px-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
         <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all font-black group self-start md:self-auto">
           <ArrowRight size={20} className={isRTL ? 'group-hover:translate-x-1' : 'rotate-180 group-hover:-translate-x-1'} />
           <span>العودة</span>
         </button>
         
         <div className="bg-zinc-900/50 p-1 rounded-2xl flex flex-wrap items-center justify-center gap-2 border border-white/5 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('news')}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'news' ? 'theme-bg-primary text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
               <Newspaper size={16} /> الأخبار
            </button>
            <button 
              onClick={() => setActiveTab('community')}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'community' ? 'theme-bg-primary text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
               <LayoutGrid size={16} /> المنشورات
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'theme-bg-primary text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
               <Users size={16} /> الأعضاء
            </button>
         </div>
      </div>

      {isLoading && (
        <div className="py-40 flex flex-col items-center justify-center">
           <Loader2 className="animate-spin text-lime-500" size={48} />
        </div>
      )}

      {/* --- News Tab --- */}
      {!isLoading && activeTab === 'news' && (
        <div className="space-y-10 animate-in slide-in-from-right-8">
          {news.map(item => (
            <div key={item.id} className="bg-zinc-950 border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl relative group">
               {item.images && item.images.length > 0 && (
                 <div className={`grid ${item.images.length === 1 ? 'grid-cols-1' : item.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} gap-2 p-4`}>
                    {item.images.slice(0, 3).map((img, i) => (
                      <div key={i} className={`overflow-hidden rounded-2xl ${item.images.length === 3 && i === 0 ? 'col-span-2 aspect-[21/9]' : 'aspect-video'}`}>
                         <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
                      </div>
                    ))}
                 </div>
               )}
               <div className="p-10 md:p-14 space-y-8">
                  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    <div className="flex items-center gap-2"><UserIcon size={14} className="text-lime-500" /> {item.authorName}</div>
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-lime-500" /> {new Date(item.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  
                  <div className="space-y-6">
                     <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">{item.title}</h2>
                     <p className="text-zinc-400 text-lg leading-relaxed font-medium whitespace-pre-wrap">{item.content}</p>
                  </div>
                  
                  <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                     <div className="inline-flex items-center gap-2 text-lime-500 text-[10px] font-black uppercase tracking-widest">
                       <Sparkles size={16} /> Over Mods Update
                     </div>
                  </div>
               </div>
            </div>
          ))}
          {news.length === 0 && <EmptyState icon={Newspaper} text="لا توجد أخبار منشورة حالياً" />}
        </div>
      )}

      {/* --- Community Posts Tab --- */}
      {!isLoading && activeTab === 'community' && (
        <div className="space-y-8 animate-in slide-in-from-left-8">
           {/* Search & Action Bar */}
           <div className="flex items-center gap-4">
              <div className="relative flex-1 group">
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:theme-text-primary transition-colors" size={20} />
                 <input 
                   type="text" 
                   placeholder="بحث في المنشورات..." 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm outline-none focus:theme-border-primary transition-all shadow-inner font-bold"
                 />
              </div>
              {currentUser && (
                <button 
                  onClick={() => setIsCreatingPost(true)}
                  className="w-14 h-14 bg-lime-500 text-black rounded-2xl flex items-center justify-center shadow-lg hover:bg-lime-400 active:scale-95 transition-all"
                  title="إنشاء منشور"
                >
                   <Plus size={24} strokeWidth={3} />
                </button>
              )}
           </div>

           {/* Post Creation Modal */}
           {isCreatingPost && (
             <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsCreatingPost(false)}></div>
                <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-xl p-8 rounded-[3rem] relative z-10 shadow-2xl animate-in zoom-in duration-300">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black text-white">منشور جديد</h3>
                      <button type="button" onClick={() => setIsCreatingPost(false)} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-all"><X size={20}/></button>
                   </div>
                   
                   <form onSubmit={handleCreatePost} className="space-y-6">
                      <div className="space-y-4">
                         <input 
                           type="text" 
                           placeholder="عنوان المنشور" 
                           value={postTitle}
                           onChange={e => setPostTitle(e.target.value)}
                           className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:theme-border-primary"
                           maxLength={60}
                         />
                         <textarea 
                           placeholder="اكتب وصفاً أو محتوى المنشور..." 
                           value={postDesc}
                           onChange={e => setPostDesc(e.target.value)}
                           className="w-full bg-zinc-900 border border-white/5 rounded-3xl p-5 text-white font-medium outline-none focus:theme-border-primary resize-none"
                           rows={5}
                         />
                         
                         <div className="flex gap-3 overflow-x-auto pb-2">
                            {postImages.map((img, i) => (
                              <div key={i} className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden group border border-white/10">
                                 <img src={img} className="w-full h-full object-cover" />
                                 <button type="button" onClick={() => setPostImages(postImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                              </div>
                            ))}
                            {postImages.length < 3 && (
                              <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 shrink-0 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center cursor-pointer hover:theme-border-primary text-zinc-600 hover:theme-text-primary transition-all">
                                 <ImageIcon size={24} />
                              </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                         </div>

                         <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                            <Clock size={20} className="text-yellow-500" />
                            <div className="flex-1">
                               <p className="text-zinc-400 text-xs font-bold">مدة بقاء المنشور</p>
                               <p className="text-zinc-600 text-[10px]">سيحذف تلقائياً بعد المدة المحددة</p>
                            </div>
                            <select 
                              value={expiryDays} 
                              onChange={e => setExpiryDays(parseInt(e.target.value))}
                              className="bg-zinc-950 text-white font-black text-xs p-2 rounded-xl border border-white/10 outline-none"
                            >
                               {[1, 2, 3, 5, 7, 10, 15].map(d => <option key={d} value={d}>{d} يوم</option>)}
                            </select>
                         </div>
                      </div>
                      <button type="submit" disabled={isProcessing} className="w-full py-5 bg-lime-500 text-black rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl shadow-lime-900/20 flex items-center justify-center gap-3">
                         {isProcessing ? <Loader2 className="animate-spin" /> : 'نشر الآن'}
                      </button>
                   </form>
                </div>
             </div>
           )}

           {/* Post List */}
           <div className="space-y-6">
             {filteredPosts.map(post => {
               const daysLeft = getDaysLeft(post.expiresAt);
               const isExpiredSoon = daysLeft <= 2;
               
               return (
                 <div key={post.id} className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden group">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-4">
                          <img src={post.authorAvatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                          <div>
                             <h4 className="text-white font-black flex items-center gap-1">
                               {post.authorName}
                               {post.isVerified && <ShieldCheck size={14} className="text-lime-500" />}
                             </h4>
                             <span className="text-zinc-600 text-[10px] font-bold">{new Date(post.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1 ${isExpiredSoon ? 'bg-red-600/10 text-red-500' : 'bg-zinc-950 text-zinc-500 border border-white/5'}`}>
                          <Clock size={10} /> ينتهي خلال {daysLeft} يوم
                       </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-white">{post.title}</h3>
                       <p className="text-zinc-400 text-sm font-medium leading-relaxed whitespace-pre-wrap">{post.description}</p>
                       
                       {post.images && post.images.length > 0 && (
                         <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 rounded-2xl overflow-hidden`}>
                            {post.images.map((img, idx) => (
                              <img key={idx} src={img} className={`w-full object-cover bg-zinc-950 ${post.images.length === 1 ? 'aspect-video' : 'aspect-square'}`} />
                            ))}
                         </div>
                       )}
                    </div>

                    {/* Interaction Bar */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                       <button 
                         onClick={() => handleLikePost(post)}
                         className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${post.likes.includes(currentUser?.id || '') ? 'text-red-500 bg-red-500/10' : 'text-zinc-500 hover:bg-zinc-950 hover:text-white'}`}
                       >
                          <Heart size={18} fill={post.likes.includes(currentUser?.id || '') ? "currentColor" : "none"} />
                          <span className="text-xs font-black">{post.likes.length}</span>
                       </button>
                       <button 
                         onClick={() => setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)}
                         className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${activeCommentsPostId === post.id ? 'theme-text-primary theme-bg-primary-alpha' : 'text-zinc-500 hover:bg-zinc-950 hover:text-white'}`}
                       >
                          <MessageSquare size={18} />
                          <span className="text-xs font-black">{(post.comments || []).length}</span>
                       </button>
                       {(currentUser?.id === post.authorId || currentUser?.role === 'Admin') && (
                          <button onClick={() => setPostToDelete(post.id)} className="p-3 text-zinc-600 hover:text-red-500 transition-colors">
                             <Trash2 size={18} />
                          </button>
                       )}
                    </div>

                    {/* Comments Section */}
                    {activeCommentsPostId === post.id && (
                      <div className="pt-4 space-y-4 animate-in slide-in-from-top-2">
                         <div className="max-h-60 overflow-y-auto space-y-3 no-scrollbar pr-1">
                            {(post.comments || []).length > 0 ? (
                              post.comments.map(comment => (
                                <div key={comment.id} className="flex gap-3 bg-zinc-950/50 p-3 rounded-2xl border border-white/5">
                                   <img src={comment.userAvatar} className="w-8 h-8 rounded-lg object-cover" />
                                   <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                         <span className="text-white text-xs font-black">{comment.userName}</span>
                                         <span className="text-zinc-600 text-[8px]">{new Date(comment.createdAt).toLocaleDateString('ar-EG')}</span>
                                      </div>
                                      <p className="text-zinc-400 text-xs mt-1">{comment.text}</p>
                                      
                                      <div className="flex gap-3 mt-2">
                                         <button onClick={() => handleLikeComment(post.id, comment.id)} className={`text-[9px] font-bold flex items-center gap-1 ${comment.likes?.includes(currentUser?.id || '') ? 'text-red-500' : 'text-zinc-600 hover:text-white'}`}>
                                            <Heart size={10} fill={comment.likes?.includes(currentUser?.id || '') ? "currentColor" : "none"} /> {comment.likes?.length || 0}
                                         </button>
                                         {(currentUser?.id === post.authorId || currentUser?.id === comment.userId) && (
                                            <button onClick={() => handleDeleteComment(post.id, comment)} className="text-[9px] font-bold text-zinc-600 hover:text-red-500">حذف</button>
                                         )}
                                      </div>
                                   </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center text-zinc-600 text-xs py-4">كن أول من يعلق!</p>
                            )}
                         </div>

                         {currentUser ? (
                           <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="أضف تعليقاً..." 
                                className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-white text-xs outline-none focus:theme-border-primary"
                                onKeyDown={e => e.key === 'Enter' && handleSendComment(post.id)}
                              />
                              <button 
                                onClick={() => handleSendComment(post.id)}
                                disabled={isSendingComment || !commentText.trim()}
                                className="p-3 theme-bg-primary text-black rounded-xl hover:opacity-80 disabled:opacity-50"
                              >
                                 {isSendingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                              </button>
                           </div>
                         ) : (
                           <div className="text-center p-3 bg-zinc-950 rounded-xl text-zinc-500 text-xs">يرجى تسجيل الدخول للتعليق</div>
                         )}
                      </div>
                    )}
                 </div>
               );
             })}
             
             {filteredPosts.length === 0 && <EmptyState icon={LayoutGrid} text="لا توجد منشورات مجتمع تطابق بحثك" />}
           </div>
        </div>
      )}

      {/* --- Users Tab --- */}
      {!isLoading && activeTab === 'users' && (
        <div className="space-y-8 animate-in slide-in-from-left-8">
           <div className="relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:theme-text-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن عضو (الاسم، المعرف، اسم المستخدم)..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-white text-sm outline-none focus:theme-border-primary transition-all shadow-inner font-bold"
              />
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => onViewProfile && onViewProfile(user)}
                  className="bg-zinc-900/50 border border-white/5 p-5 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-white/10 hover:bg-zinc-900 transition-all"
                >
                   <div className="flex items-center gap-4">
                      <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-white/10 group-hover:scale-105 transition-transform" alt="" />
                      <div className="text-right">
                         <h5 className="text-white font-black text-sm flex items-center gap-1">
                           {user.displayName}
                           {user.isVerified && <ShieldCheck size={14} className="text-lime-500" />}
                         </h5>
                         <p className="text-zinc-500 text-[10px] ltr font-bold">@{user.username}</p>
                      </div>
                   </div>
                   <div className="p-3 bg-zinc-950 rounded-2xl text-zinc-500 group-hover:text-white transition-colors">
                      <ArrowRight className={isRTL ? 'rotate-180' : ''} size={18} />
                   </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-900/10">
                   <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-800">
                      <Users size={32} />
                   </div>
                   <h4 className="text-xl font-black text-zinc-600">لا توجد نتائج</h4>
                   <p className="text-zinc-800 text-xs font-bold mt-2">جرب البحث بكلمات مختلفة أو تأكد من إعدادات الخصوصية</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setPostToDelete(null)}></div>
           <div className="bg-[#0f0f0f] border border-red-500/20 p-10 md:p-14 rounded-[4rem] w-full max-w-lg relative z-10 shadow-2xl text-center animate-in zoom-in">
              <div className="w-24 h-24 bg-red-600/10 text-red-500 rounded-[2.2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-xl">
                <AlertTriangle size={56} />
              </div>
              <h3 className="text-3xl font-black text-white mb-4">حذف المنشور؟</h3>
              
              <div className="bg-red-600/5 p-6 rounded-3xl mb-10 text-right space-y-3">
                 <p className="text-red-500 font-black text-sm">⚠️ تأكيد الحذف</p>
                 <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                    هل أنت متأكد من رغبتك في حذف هذا المنشور؟ سيتم مسحه نهائياً مع كافة التعليقات والإعجابات المرتبطة به.
                 </p>
              </div>

              <div className="flex flex-col gap-4">
                 <button 
                  onClick={handleDeletePost}
                  className="w-full py-6 bg-red-600 text-white rounded-3xl font-black text-xl active:scale-95 transition-all shadow-xl shadow-red-900/20"
                 >
                   تأكيد الحذف
                 </button>
                 <button onClick={() => setPostToDelete(null)} className="w-full py-6 bg-zinc-900 text-zinc-500 rounded-3xl font-black text-xl hover:text-white transition-colors">إلغاء</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="py-40 text-center border-2 border-dashed border-zinc-900 rounded-[4rem]">
     <div className="w-20 h-20 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-zinc-800 mx-auto mb-6">
        <Icon size={40} />
     </div>
     <h4 className="text-xl font-black text-zinc-600">{text}</h4>
  </div>
);

export default NewsView;