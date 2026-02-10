
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  query, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  runTransaction, 
  where, 
  deleteDoc, 
  writeBatch, 
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  addDoc
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateEmail
} from "firebase/auth";
import { Mod, ModType, AdminPermissions, User, VerificationStatus, Notification, ModReport, ChatMessage, GameInvite, FriendRequest, NewsItem, Complaint, StaffMessage, MinecraftServer, Contest, QuestionProgress, QuestionChallenge, CommunityPost, PostComment } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyDiBxFISZbY3MveLqDo75T2ILMcH-BNEyQ",
  authDomain: "over-mods-d2d03.firebaseapp.com",
  projectId: "over-mods-d2d03",
  storageBucket: "over-mods-d2d03.firebasestorage.app",
  messagingSenderId: "460799504048",
  appId: "1:460799504048:web:4ff9fadce080bf1ff1d575"
};

const app = initializeApp(firebaseConfig);
export const firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});
export const auth = getAuth(app);

let cachedIP: string | null = null;
let ipRequestPromise: Promise<string> | null = null;

const readCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 30000; 

const COMMISSION_RATE = 0.15;
const PLATFORM_EMAIL = 'overmods1@gmail.com';

export class PlatformDB {
  /**
   * Sanitizes data for Firestore and prevents circular JSON errors.
   */
  private sanitizeData(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== 'object') return obj;
    
    // Handle circular references
    if (seen.has(obj)) return "[Circular Reference]";
    seen.add(obj);

    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Timestamp) return obj.toDate().toISOString();
    
    // Check for DOM nodes or React Events (common cause of circular errors)
    if (obj.nodeType || (obj.nativeEvent && obj.preventDefault)) return "[DOM/Event Object]";

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeData(item, seen));
    }
    
    // Check for non-plain objects (like Firestore internal classes or Minified objects)
    const proto = Object.getPrototypeOf(obj);
    if (proto && proto.constructor && proto.constructor.name !== 'Object' && proto.constructor.name !== 'Array') {
      // Allow simple objects, reject complex instances that might be circular or internal
      if ('_firestore' in obj || 'firestore' in obj || proto.constructor.name.length <= 2) {
         return "[Complex Object]"; 
      }
    }

    const sanitized: any = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = obj[key];
      if (value === undefined || typeof value === 'function') continue;
      sanitized[key] = this.sanitizeData(value, seen);
    }
    return sanitized;
  }

  async get(coll: string, id: string) {
    const cacheKey = `${coll}_${id}`;
    const now = Date.now();
    if (readCache[cacheKey] && (now - readCache[cacheKey].timestamp < CACHE_TTL)) return readCache[cacheKey].data;
    try {
      const docSnap = await getDoc(doc(firestore, coll, id));
      if (!docSnap.exists()) return null;
      const data = { id: docSnap.id, ...docSnap.data() };
      readCache[cacheKey] = { data, timestamp: now };
      return data;
    } catch (e) { return null; }
  }

  async put(coll: string, data: any) {
    const id = data.id || (data.title ? data.title.replace(/\s+/g, '-').toLowerCase() + Date.now() : 'id_' + Date.now());
    await setDoc(doc(firestore, coll, id), this.sanitizeData({ ...data, id }), { merge: true });
    delete readCache[`${coll}_${id}`];
  }

  async getAll(coll: string, limitCount?: number) {
    let q = query(collection(firestore, coll), orderBy('createdAt', 'desc'));
    if (limitCount) q = query(q, limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getUserMods(userId: string): Promise<Mod[]> {
    const q = query(collection(firestore, 'mods'), where('publisherId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Mod));
  }

  async getAllUsers(): Promise<User[]> {
    const snap = await getDocs(collection(firestore, 'users'));
    return snap.docs.map(d => d.data() as User);
  }

  async getPendingVerifications(): Promise<User[]> {
    const q = query(collection(firestore, 'users'), where('verificationStatus', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  }

  async getUserIP(): Promise<string> {
    if (cachedIP) return cachedIP;
    if (ipRequestPromise) return ipRequestPromise;
    ipRequestPromise = fetch('https://api64.ipify.org?format=json')
      .then(res => res.json())
      .then(data => { cachedIP = data.ip; return data.ip; })
      .catch(() => "guest_ip")
      .finally(() => { ipRequestPromise = null; });
    return ipRequestPromise;
  }

  // --- Views Logic ---
  async incrementViews(modId: string, ip: string) {
    const userId = auth.currentUser?.uid || 'guest';
    const deviceId = localStorage.getItem('device_fp') || 'unknown_device';
    const logId = `${modId}_${userId}_${ip.replace(/\./g, '_')}`;
    const logRef = doc(firestore, 'mod_view_logs', logId);
    const modRef = doc(firestore, 'mods', modId);
    try {
      await runTransaction(firestore, async (transaction) => {
        const modSnap = await transaction.get(modRef);
        if (!modSnap.exists()) return;
        const modData = modSnap.data();
        const logSnap = await transaction.get(logRef);
        if (!logSnap.exists()) {
          transaction.set(logRef, { modId, userId, ip, deviceId, timestamp: serverTimestamp() });
          if (!modData.stats) {
             transaction.set(modRef, { stats: { views: 1, uniqueViews: 1, downloads: 0, likes: 0, dislikes: 0, ratingCount: 0, averageRating: 0, totalRatingScore: 0 } }, { merge: true });
          } else {
             transaction.update(modRef, { 'stats.views': increment(1), 'stats.uniqueViews': increment(1) });
          }
          const publisherId = modData.publisherId;
          if (publisherId) {
             const currentTotalViews = modData.stats?.views || 0;
             let pointsToAdd = 0.1;
             const bonusProbability = 0.05 / (1 + (currentTotalViews * 0.0001)); 
             if (Math.random() < bonusProbability) pointsToAdd = Math.random() < 0.2 ? 0.7 : 0.5;
             const publisherRef = doc(firestore, 'users', publisherId);
             transaction.update(publisherRef, { 'wallet.earned': increment(pointsToAdd) });
          }
        } else {
          if (!modData.stats) {
             transaction.set(modRef, { stats: { views: 1, uniqueViews: 0, downloads: 0, likes: 0, dislikes: 0, ratingCount: 0, averageRating: 0, totalRatingScore: 0 } }, { merge: true });
          } else {
             transaction.update(modRef, { 'stats.views': increment(1) });
          }
        }
      });
    } catch (e) { console.error("Increment view transaction failed", e); }
  }

  async incrementDownloads(modId: string, ip: string) {
    const modRef = doc(firestore, 'mods', modId);
    await runTransaction(firestore, async (tx) => {
        const snap = await tx.get(modRef);
        if (!snap.exists()) return;
        const data = snap.data();
        if (!data.stats) {
            tx.set(modRef, { stats: { views: 0, uniqueViews: 0, downloads: 1, likes: 0, dislikes: 0 } }, { merge: true });
        } else {
            tx.update(modRef, { 'stats.downloads': increment(1) });
        }
    });
  }

  // --- Auth & User ---
  async register(email: string, pass: string, displayName: string, username: string, avatarFile: File) {
    let deviceId = localStorage.getItem('device_fp');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('device_fp', deviceId);
    }
    const ip = await this.getUserIP();
    let isFraud = false;
    try {
      const ipDoc = await getDoc(doc(firestore, 'fraud_registrations', ip.replace(/\./g, '_')));
      const devDoc = await getDoc(doc(firestore, 'fraud_registrations', deviceId));
      if (ipDoc.exists() || devDoc.exists()) isFraud = true;
    } catch (e) { console.warn("Fraud check error", e); }
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const avatarData = await this.resizeImage(avatarFile, 400, 400);
    await updateProfile(result.user, { displayName });
    const giftPoints = isFraud ? 0 : 10;
    const userData: User = {
      id: result.user.uid,
      numericId: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      displayName,
      username: username.toLowerCase().trim(),
      email,
      avatar: avatarData,
      followers: 0,
      following: [],
      blockedUsers: [],
      role: 'User',
      isBlocked: false,
      verificationStatus: 'none',
      isVerified: false,
      createdAt: new Date().toISOString(),
      privacySettings: { showInSearch: true, showFollowersList: true, showJoinDate: true, privateCollections: false, showOnlineStatus: true, messagingPermission: 'everyone' },
      wallet: { gift: giftPoints, earned: 0 }
    };
    await this.put('users', userData);
    if (!isFraud) {
       try {
         await setDoc(doc(firestore, 'fraud_registrations', ip.replace(/\./g, '_')), { userId: result.user.uid, timestamp: serverTimestamp() });
         await setDoc(doc(firestore, 'fraud_registrations', deviceId), { userId: result.user.uid, timestamp: serverTimestamp() });
       } catch (e) {}
    }
    await sendEmailVerification(result.user);
    return userData;
  }

  async checkAndInitWallet(userId: string) {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data() as User;
    if (userData.wallet) return;
    let deviceId = localStorage.getItem('device_fp');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('device_fp', deviceId);
    }
    const ip = await this.getUserIP();
    let isFraud = false;
    try {
      const ipDoc = await getDoc(doc(firestore, 'fraud_registrations', ip.replace(/\./g, '_')));
      const devDoc = await getDoc(doc(firestore, 'fraud_registrations', deviceId));
      if (ipDoc.exists() || devDoc.exists()) isFraud = true;
    } catch (e) {}
    const giftPoints = isFraud ? 0 : 10;
    await updateDoc(userRef, { wallet: { gift: giftPoints, earned: 0 } });
    if (!isFraud) {
       try {
         await setDoc(doc(firestore, 'fraud_registrations', ip.replace(/\./g, '_')), { userId: userId, timestamp: serverTimestamp() });
         await setDoc(doc(firestore, 'fraud_registrations', deviceId), { userId: userId, timestamp: serverTimestamp() });
       } catch (e) {}
    }
    delete readCache[`users_${userId}`];
  }

  async checkOwnerRules(user: User) {
    if (user.email !== PLATFORM_EMAIL) return;
    const now = Date.now();
    const lastGrant = user.lastOwnerGrant ? new Date(user.lastOwnerGrant).getTime() : 0;
    const fiveDays = 5 * 24 * 60 * 60 * 1000;
    const initialBalance = 1000000;
    const userRef = doc(firestore, 'users', user.id);
    if (!user.lastOwnerGrant) { await updateDoc(userRef, { 'wallet.earned': increment(initialBalance), lastOwnerGrant: new Date().toISOString() }); return; }
    if (now - lastGrant >= fiveDays) { await updateDoc(userRef, { 'wallet.earned': increment(initialBalance), lastOwnerGrant: new Date().toISOString() }); }
  }

  // --- Community Posts System ---

  async createCommunityPost(post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments'>) {
    const data: CommunityPost = {
      ...post,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };
    await this.put('community_posts', data);
  }

  async getCommunityPosts(): Promise<CommunityPost[]> {
    const q = query(collection(firestore, 'community_posts'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const now = new Date();
    const posts: CommunityPost[] = [];
    const expiredIds: string[] = [];

    snap.forEach(d => {
      const data = { id: d.id, ...d.data() } as CommunityPost;
      if (new Date(data.expiresAt) > now) {
        posts.push(data);
      } else {
        expiredIds.push(d.id);
      }
    });

    // Cleanup expired posts lazily
    if (expiredIds.length > 0) {
      const batch = writeBatch(firestore);
      expiredIds.forEach(id => batch.delete(doc(firestore, 'community_posts', id)));
      batch.commit().catch(e => console.error("Cleanup error", e));
    }

    return posts;
  }

  async likeCommunityPost(postId: string, userId: string) {
    const ref = doc(firestore, 'community_posts', postId);
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data() as CommunityPost;
      const likes = data.likes || [];
      if (likes.includes(userId)) {
        tx.update(ref, { likes: arrayRemove(userId) });
      } else {
        tx.update(ref, { likes: arrayUnion(userId) });
      }
    });
  }

  async commentOnPost(postId: string, comment: PostComment) {
    const ref = doc(firestore, 'community_posts', postId);
    await updateDoc(ref, { comments: arrayUnion(this.sanitizeData(comment)) });
  }

  async deletePostComment(postId: string, comment: PostComment) {
    const ref = doc(firestore, 'community_posts', postId);
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data() as CommunityPost;
      const newComments = (data.comments || []).filter(c => c.id !== comment.id);
      tx.update(ref, { comments: newComments });
    });
  }

  async likePostComment(postId: string, commentId: string, userId: string) {
    const ref = doc(firestore, 'community_posts', postId);
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data() as CommunityPost;
      const comments = data.comments || [];
      const commentIndex = comments.findIndex(c => c.id === commentId);
      
      if (commentIndex === -1) return;
      
      const comment = comments[commentIndex];
      const likes = comment.likes || [];
      let newLikes = [...likes];
      
      if (likes.includes(userId)) {
        newLikes = newLikes.filter(id => id !== userId);
      } else {
        newLikes.push(userId);
      }
      
      comments[commentIndex] = { ...comment, likes: newLikes };
      tx.update(ref, { comments: comments });
    });
  }

  async deleteCommunityPost(postId: string) {
    await deleteDoc(doc(firestore, 'community_posts', postId));
  }

  // --- End Community Posts ---

  async transferPoints(senderId: string, recipientIdentifier: string, amount: number) {
     if (amount <= 0) throw new Error("Amount must be positive");
     const usersRef = collection(firestore, 'users');
     const qNumeric = query(usersRef, where('numericId', '==', recipientIdentifier));
     const snapNumeric = await getDocs(qNumeric);
     let recipientId = '';
     if (!snapNumeric.empty) { recipientId = snapNumeric.docs[0].id; } 
     else { const docSnap = await getDoc(doc(firestore, 'users', recipientIdentifier)); if (docSnap.exists()) recipientId = docSnap.id; }
     if (!recipientId) throw new Error("Recipient not found");
     if (recipientId === senderId) throw new Error("Cannot send points to yourself");
     const senderRef = doc(firestore, 'users', senderId);
     const recipientRef = doc(firestore, 'users', recipientId);
     await runTransaction(firestore, async (transaction) => {
        const senderSnap = await transaction.get(senderRef);
        if (!senderSnap.exists()) throw new Error("Sender not found");
        const senderData = senderSnap.data() as User;
        const currentEarned = senderData.wallet?.earned || 0;
        if (currentEarned < amount) throw new Error("Insufficient earned balance. Gift points cannot be transferred.");
        transaction.update(senderRef, { 'wallet.earned': increment(-amount) });
        transaction.update(recipientRef, { 'wallet.earned': increment(amount) });
        const txRef = doc(collection(firestore, 'transactions'));
        transaction.set(txRef, { senderId, recipientId, amount, type: 'transfer', timestamp: serverTimestamp() });
     });
     await this.sendNotification(recipientId, "استلام نقاط", `لقد استلمت ${amount} نقطة من ${senderId === auth.currentUser?.uid ? 'مستخدم' : 'صديق'}`, 'points', 'Wallet');
  }

  async createContest(data: { title: string; description: string; rewardPoints: number; numberOfWinners: number }) { await this.put('contests', { ...data, participants: [], status: 'active', createdAt: new Date().toISOString() }); }
  async joinContest(contestId: string, userId: string) { const contestRef = doc(firestore, 'contests', contestId); await updateDoc(contestRef, { participants: arrayUnion(userId) }); }
  async endContest(contestId: string) {
    const contestRef = doc(firestore, 'contests', contestId);
    await runTransaction(firestore, async (transaction) => {
      const snap = await transaction.get(contestRef);
      if (!snap.exists()) throw new Error("Contest not found");
      const contest = snap.data() as Contest;
      if (contest.status !== 'active') throw new Error("Contest already ended");
      const participants = contest.participants || [];
      const numWinners = Math.min(contest.numberOfWinners, participants.length);
      const winners: { userId: string; displayName: string; avatar: string }[] = [];
      if (numWinners > 0) {
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        const winnerIds = shuffled.slice(0, numWinners);
        for (const uid of winnerIds) {
          const userSnap = await getDoc(doc(firestore, 'users', uid));
          if (userSnap.exists()) {
            const u = userSnap.data() as User;
            winners.push({ userId: u.id, displayName: u.displayName, avatar: u.avatar });
            transaction.update(doc(firestore, 'users', uid), { 'wallet.earned': increment(contest.rewardPoints) });
          }
        }
      }
      transaction.update(contestRef, { status: 'ended', winners: winners });
    });
  }
  async getContests(): Promise<Contest[]> { const snap = await getDocs(query(collection(firestore, 'contests'), orderBy('createdAt', 'desc'))); return snap.docs.map(d => ({ id: d.id, ...d.data() } as Contest)); }
  async saveQuestionProgress(userId: string, progress: QuestionProgress) { await updateDoc(doc(firestore, 'users', userId), { questionProgress: progress }); }
  async createQuestionChallenge(sender: User, receiverId: string, difficulty: string, questionCount: number): Promise<string> {
    const receiverSnap = await getDoc(doc(firestore, 'users', receiverId)); if (!receiverSnap.exists()) throw new Error("Receiver not found"); const receiver = receiverSnap.data() as User;
    const challenge: QuestionChallenge = { id: '', senderId: sender.id, senderName: sender.displayName, senderAvatar: sender.avatar, receiverId: receiver.id, receiverName: receiver.displayName, receiverAvatar: receiver.avatar, difficulty, questionCount, status: 'pending', senderScore: { correct: 0, wrong: 0, finished: false }, receiverScore: { correct: 0, wrong: 0, finished: false }, createdAt: new Date().toISOString() };
    const ref = doc(collection(firestore, 'question_challenges')); challenge.id = ref.id; await setDoc(ref, challenge); return challenge.id;
  }
  async acceptQuestionChallenge(challengeId: string) { await updateDoc(doc(firestore, 'question_challenges', challengeId), { status: 'accepted' }); }
  async updateChallengeScore(challengeId: string, userId: string, correct: number, wrong: number, finished: boolean) {
    const ref = doc(firestore, 'question_challenges', challengeId);
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(ref); if (!snap.exists()) return; const data = snap.data() as QuestionChallenge;
      if (data.senderId === userId) tx.update(ref, { senderScore: { correct, wrong, finished } }); else if (data.receiverId === userId) tx.update(ref, { receiverScore: { correct, wrong, finished } });
      const senderFinished = (data.senderId === userId) ? finished : data.senderScore.finished; const receiverFinished = (data.receiverId === userId) ? finished : data.receiverScore.finished;
      if (senderFinished && receiverFinished) tx.update(ref, { status: 'finished' });
    });
  }
  async adminDistributePoints(recipientId: string, amount: number) { const recipientRef = doc(firestore, 'users', recipientId); await updateDoc(recipientRef, { 'wallet.earned': increment(amount) }); await this.sendNotification(recipientId, "مكافأة خاصة", `لقد استلمت ${amount} نقطة من إدارة المنصة!`, 'points', 'Gift'); }
  async login(email: string, pass: string) { 
    const credentials = await signInWithEmailAndPassword(auth, email, pass); await updateDoc(doc(firestore, 'users', credentials.user.uid), { loginCount: increment(1) });
    const userSnap = await getDoc(doc(firestore, 'users', credentials.user.uid)); if (userSnap.exists()) await this.checkOwnerRules({ id: userSnap.id, ...userSnap.data() } as User); return credentials.user; 
  }
  async logout() { await signOut(auth); }
  async updateAccount(userId: string, data: Partial<User>) { await updateDoc(doc(firestore, 'users', userId), this.sanitizeData(data)); delete readCache[`users_${userId}`]; }
  async resizeImage(file: File, maxWidth = 800, maxHeight = 800): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } } canvas.width = width; canvas.height = height; canvas.getContext('2d')?.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.7)); }; img.src = e.target?.result as string; }; reader.onerror = reject; reader.readAsDataURL(file);
    });
  }
  generateShareCode(type: string): string { const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = type.charAt(0).toUpperCase(); for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length)); return code; }
  async getNotifications(userId: string): Promise<Notification[]> { const q = query(collection(firestore, 'notifications'), where('userId', '==', userId)); const snap = await getDocs(q); return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  async markNotificationRead(id: string) { await updateDoc(doc(firestore, 'notifications', id), { isRead: true }); }
  async deleteNotification(id: string) { await deleteDoc(doc(firestore, 'notifications', id)); }
  async deleteAllNotifications(userId: string) { const q = query(collection(firestore, 'notifications'), where('userId', '==', userId)); const snap = await getDocs(q); const batch = writeBatch(firestore); snap.docs.forEach(d => batch.delete(d.ref)); await batch.commit(); }
  async sendNotification(userId: string, title: string, message: string, type: string, icon?: string, scheduledAt?: string) { await this.put('notifications', { userId, title, message, type, icon, isRead: false, createdAt: new Date().toISOString(), scheduledAt }); }
  async getReportsForPublisher(publisherId: string): Promise<ModReport[]> { const q = query(collection(firestore, 'reports'), where('publisherId', '==', publisherId)); const snap = await getDocs(q); return snap.docs.map(d => ({ id: d.id, ...d.data() } as ModReport)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  async resolveReport(id: string) { await updateDoc(doc(firestore, 'reports', id), { status: 'reviewed' }); }
  async deleteReport(id: string) { await deleteDoc(doc(firestore, 'reports', id)); }
  async deleteMod(id: string) { await deleteDoc(doc(firestore, 'mods', id)); }
  async followUser(followerId: string, followingId: string) { const userRef = doc(firestore, 'users', followerId); const targetRef = doc(firestore, 'users', followingId); await runTransaction(firestore, async (tx) => { const uSnap = await tx.get(userRef); if (!uSnap.exists()) return; const following = uSnap.data().following || []; if (following.includes(followingId)) { tx.update(userRef, { following: arrayRemove(followingId) }); tx.update(targetRef, { followers: increment(-1) }); } else { tx.update(userRef, { following: arrayUnion(followingId) }); tx.update(targetRef, { followers: increment(1) }); } }); }
  onAuthChange(callback: (user: any) => void) { return onAuthStateChanged(auth, callback); }
  
  async getFollowers(userId: string): Promise<User[]> {
    const q = query(collection(firestore, 'users'), where('following', 'array-contains', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  }

  async banUser(userId: string, durationDays: number, reason: string) {
    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + durationDays);
    await updateDoc(doc(firestore, 'users', userId), {
      isBlocked: true,
      blockedReason: reason,
      blockedUntil: blockedUntil.toISOString()
    });
  }

  async unbanUser(userId: string) {
    await updateDoc(doc(firestore, 'users', userId), {
      isBlocked: false,
      blockedReason: null,
      blockedUntil: null
    });
  }

  async deleteUser(userId: string) {
    await deleteDoc(doc(firestore, 'users', userId));
  }

  async resolveVerification(userId: string, status: VerificationStatus) {
    const update: any = { verificationStatus: status };
    if (status === 'verified') update.isVerified = true;
    else if (status === 'none') update.isVerified = false;
    await updateDoc(doc(firestore, 'users', userId), update);
  }

  async updateAuthEmail(email: string) {
    if (auth.currentUser) {
      await updateEmail(auth.currentUser, email);
    }
  }

  async scheduleAccountDeletion(userId: string) {
    await updateDoc(doc(firestore, 'users', userId), {
      scheduledDeletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  }

  async getPurchasedMods(userId: string): Promise<Mod[]> {
    const snap = await getDocs(collection(firestore, `users/${userId}/purchases`));
    const modIds = snap.docs.map(d => d.data().modId);
    if (modIds.length === 0) return [];
    
    const mods: Mod[] = [];
    for (const mid of modIds) {
      const m = await this.get('mods', mid);
      if (m) mods.push(m as Mod);
    }
    return mods;
  }

  async hasPurchased(userId: string, modId: string): Promise<boolean> {
    const snap = await getDoc(doc(firestore, `users/${userId}/purchases`, modId));
    return snap.exists();
  }

  async purchaseMod(user: User, mod: Mod) {
    const price = mod.price || 0;
    if (price <= 0) return;
    
    await runTransaction(firestore, async (tx) => {
      const userRef = doc(firestore, 'users', user.id);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data() as User;
      const totalPoints = (userData.wallet?.gift || 0) + (userData.wallet?.earned || 0);
      
      if (totalPoints < price) throw new Error("رصيد غير كافٍ");
      
      let newEarned = userData.wallet.earned;
      let newGift = userData.wallet.gift;
      
      if (newEarned >= price) {
        newEarned -= price;
      } else {
        const remainder = price - newEarned;
        newEarned = 0;
        newGift -= remainder; 
      }
      
      tx.update(userRef, { 
        'wallet.earned': newEarned, 
        'wallet.gift': newGift 
      });
      
      const purchaseRef = doc(firestore, `users/${user.id}/purchases`, mod.id);
      tx.set(purchaseRef, { modId: mod.id, price, timestamp: serverTimestamp() });
      
      if (mod.publisherId) {
        const pubRef = doc(firestore, 'users', mod.publisherId);
        const earnings = price * (1 - COMMISSION_RATE);
        tx.update(pubRef, { 'wallet.earned': increment(earnings) });
      }
    });
  }

  async getRecentChats(userId: string): Promise<string[]> {
    const q1 = query(collection(firestore, 'messages'), where('senderId', '==', userId), orderBy('createdAt', 'desc'), limit(20));
    const q2 = query(collection(firestore, 'messages'), where('receiverId', '==', userId), orderBy('createdAt', 'desc'), limit(20));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const partners = new Set<string>();
    s1.forEach(d => partners.add(d.data().receiverId));
    s2.forEach(d => partners.add(d.data().senderId));
    return Array.from(partners);
  }

  async getFriends(userId: string): Promise<string[]> {
    const q1 = query(collection(firestore, 'friendships'), where('user1Id', '==', userId));
    const q2 = query(collection(firestore, 'friendships'), where('user2Id', '==', userId));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const friends = new Set<string>();
    s1.forEach(d => friends.add(d.data().user2Id));
    s2.forEach(d => friends.add(d.data().user1Id));
    return Array.from(friends);
  }

  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    const q = query(collection(firestore, 'friend_requests'), where('receiverId', '==', userId), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
  }

  async acceptFriendRequest(request: FriendRequest, currentUserName: string) {
    const batch = writeBatch(firestore);
    const friendshipRef = doc(collection(firestore, 'friendships'));
    batch.set(friendshipRef, { user1Id: request.senderId, user2Id: request.receiverId, createdAt: new Date().toISOString() });
    batch.delete(doc(firestore, 'friend_requests', request.id));
    
    const user1Ref = doc(firestore, 'users', request.senderId);
    const user2Ref = doc(firestore, 'users', request.receiverId);
    batch.update(user1Ref, { following: arrayUnion(request.receiverId), followers: increment(1) });
    batch.update(user2Ref, { following: arrayUnion(request.senderId), followers: increment(1) });

    await batch.commit();
    
    await this.sendNotification(request.senderId, 'قبول الصداقة', `قام ${currentUserName} بقبول طلب الصداقة`, 'friend_request', 'UserPlus');
  }

  async rejectFriendRequest(requestId: string) {
    await deleteDoc(doc(firestore, 'friend_requests', requestId));
  }

  async getGameInvites(): Promise<GameInvite[]> {
    const snap = await getDocs(query(collection(firestore, 'game_invites'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GameInvite));
  }

  async createGameInvite(host: User, mcName: string, version: string, expiresAt: string) {
    await this.put('game_invites', {
      hostId: host.id,
      hostName: host.displayName,
      hostAvatar: host.avatar,
      mcName,
      version,
      expiresAt,
      createdAt: new Date().toISOString()
    });
  }

  async deleteGameInvite(inviteId: string) {
    await deleteDoc(doc(firestore, 'game_invites', inviteId));
  }

  async acceptGameInvite(userId: string, hostId: string, mcName: string) {
    await this.sendMessage(userId, hostId, `مرحباً! لقد قبلت دعوة اللعب الخاصة بك. اسمي في اللعبة: ${mcName}`);
  }

  async getMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    const chatId = [userId1, userId2].sort().join('_');
    const q = query(collection(firestore, `chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
  }

  async sendMessage(senderId: string, receiverId: string, text: string) {
    const chatId = [senderId, receiverId].sort().join('_');
    const msg: ChatMessage = {
      id: '',
      senderId,
      receiverId,
      text,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(firestore, `chats/${chatId}/messages`), msg);
    
    await setDoc(doc(firestore, 'chats', chatId), {
      participants: [senderId, receiverId],
      lastMessage: text,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await addDoc(collection(firestore, 'messages'), msg);
  }

  async blockUser(blockerId: string, blockedId: string) {
    await updateDoc(doc(firestore, 'users', blockerId), {
      blockedUsers: arrayUnion(blockedId)
    });
    await this.followUser(blockerId, blockedId); 
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await updateDoc(doc(firestore, 'users', blockerId), {
      blockedUsers: arrayRemove(blockedId)
    });
  }

  async hideChat(userId: string, targetId: string) {
    await updateDoc(doc(firestore, 'users', userId), {
      hiddenChats: arrayUnion(targetId)
    });
  }

  async deleteServer(serverId: string) {
    await deleteDoc(doc(firestore, 'servers', serverId));
  }

  async getSiteSettings() {
    const snap = await getDoc(doc(firestore, 'settings', 'general'));
    return snap.exists() ? snap.data() : {};
  }

  async getStaffMessages(): Promise<StaffMessage[]> {
    const q = query(collection(firestore, 'staff_messages'), orderBy('createdAt', 'asc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMessage));
  }

  async sendStaffMessage(user: User, text: string) {
    await addDoc(collection(firestore, 'staff_messages'), {
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatar,
      userRole: user.role,
      text,
      createdAt: new Date().toISOString()
    });
  }

  async postNews(newsItem: Partial<NewsItem>) {
    await this.put('news', { ...newsItem, createdAt: new Date().toISOString() });
  }

  async deleteNews(newsId: string) {
    await deleteDoc(doc(firestore, 'news', newsId));
  }

  generateAdminCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  async updatePermissions(userId: string, permissions: AdminPermissions, role: string, code?: string) {
    const update: any = { adminPermissions: permissions, role };
    if (code) update.adminCode = code;
    await updateDoc(doc(firestore, 'users', userId), update);
  }

  async createComplaint(userId: string, username: string, subject: string, message: string) {
    await this.put('complaints', {
      userId, username, subject, message, status: 'pending', createdAt: new Date().toISOString()
    });
  }

  async resolveComplaint(complaintId: string) {
    await updateDoc(doc(firestore, 'complaints', complaintId), { status: 'resolved' });
  }

  async deleteComplaint(complaintId: string) {
    await deleteDoc(doc(firestore, 'complaints', complaintId));
  }

  async likeMod(modId: string, userId: string) {
    const modRef = doc(firestore, 'mods', modId);
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(modRef);
      if (!snap.exists()) return;
      const data = snap.data() as Mod;
      const likes = data.likedBy || [];
      const dislikes = data.dislikedBy || [];
      
      let newLikes = [...likes];
      let newDislikes = [...dislikes];
      let likeCount = data.stats.likes;
      let dislikeCount = data.stats.dislikes;

      if (likes.includes(userId)) {
        newLikes = newLikes.filter(id => id !== userId);
        likeCount--;
      } else {
        newLikes.push(userId);
        likeCount++;
        if (dislikes.includes(userId)) {
          newDislikes = newDislikes.filter(id => id !== userId);
          dislikeCount--;
        }
      }
      
      tx.update(modRef, { 
        likedBy: newLikes, 
        dislikedBy: newDislikes,
        'stats.likes': likeCount,
        'stats.dislikes': dislikeCount
      });
    });
  }

  async dislikeMod(modId: string, userId: string) {
    const modRef = doc(firestore, 'mods', modId);
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(modRef);
      if (!snap.exists()) return;
      const data = snap.data() as Mod;
      const likes = data.likedBy || [];
      const dislikes = data.dislikedBy || [];
      
      let newLikes = [...likes];
      let newDislikes = [...dislikes];
      let likeCount = data.stats.likes;
      let dislikeCount = data.stats.dislikes;

      if (dislikes.includes(userId)) {
        newDislikes = newDislikes.filter(id => id !== userId);
        dislikeCount--;
      } else {
        newDislikes.push(userId);
        dislikeCount++;
        if (likes.includes(userId)) {
          newLikes = newLikes.filter(id => id !== userId);
          likeCount--;
        }
      }
      
      tx.update(modRef, { 
        likedBy: newLikes, 
        dislikedBy: newDislikes,
        'stats.likes': likeCount,
        'stats.dislikes': dislikeCount
      });
    });
  }

  async rateMod(modId: string, userId: string, rating: number) {
    const modRef = doc(firestore, 'mods', modId);
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(modRef);
      if (!snap.exists()) return;
      const data = snap.data() as Mod;
      const ratedBy = data.ratedBy || {};
      const oldRating = ratedBy[userId] || 0;
      
      ratedBy[userId] = rating;
      
      let totalScore = data.stats.totalRatingScore || 0;
      let count = data.stats.ratingCount || 0;
      
      if (oldRating === 0) {
        count++;
        totalScore += rating;
      } else {
        totalScore = totalScore - oldRating + rating;
      }
      
      const avg = count > 0 ? totalScore / count : 0;
      
      tx.update(modRef, {
        ratedBy: ratedBy,
        'stats.ratingCount': count,
        'stats.totalRatingScore': totalScore,
        'stats.averageRating': Number(avg.toFixed(1))
      });
    });
  }

  async recordDownload(userId: string, mod: Mod) {
    await addDoc(collection(firestore, `users/${userId}/downloads`), {
      modId: mod.id,
      modTitle: mod.title,
      downloadedAt: new Date().toISOString()
    });
  }

  async sendVerificationEmail(): Promise<boolean> {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return true;
    }
    return false;
  }

  async sendPasswordReset(email: string) {
    await sendPasswordResetEmail(auth, email);
  }
}

export const db = new PlatformDB();
