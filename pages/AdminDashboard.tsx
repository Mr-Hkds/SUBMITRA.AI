import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, onSnapshot, doc, deleteDoc, updateDoc, getDoc, setDoc, Timestamp, where, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User, TokenRequest } from '../types';
import { CheckCircle, XCircle, Clock, ShieldCheck, ArrowLeft, ArrowRight, Users, RefreshCw, Trash2, Edit2, Activity, Search, Filter, ChevronDown, Download, Bell, Lock, Unlock } from 'lucide-react';

const AdminDashboard = ({ user, onBack }: { user: User; onBack: () => void }) => {
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);

    // User Management State
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [cleaningUsers, setCleaningUsers] = useState(false);

    // Token Requests State
    const [tokenRequests, setTokenRequests] = useState<TokenRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    // New state for multi-select
    const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

    // Search & Filter State
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userFilterType, setUserFilterType] = useState<'all' | 'premium' | 'free' | 'inactive'>('all');

    // Site Lock State
    const [siteLocked, setSiteLocked] = useState(true);
    const [lockLoading, setLockLoading] = useState(true);
    const [lockToggling, setLockToggling] = useState(false);

    let filteredRequests = tokenRequests.filter(req => {
        if (requestFilter === 'all') return true;
        return req.status === requestFilter;
    });

    // Limit approved/rejected to latest 10
    if (requestFilter === 'approved' || requestFilter === 'rejected') {
        filteredRequests = filteredRequests.slice(0, 10);
    }

    // Derived State: Filtered Users
    const filteredUsers = allUsers.filter(u => {
        const term = userSearchTerm.toLowerCase();
        const matchesSearch = (u.displayName || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);

        const matchesFilter = userFilterType === 'all' ? true :
            userFilterType === 'premium' ? u.isPremium :
                userFilterType === 'free' ? !u.isPremium :
                    userFilterType === 'inactive' ? (u.tokens === 0) : true;

        return matchesSearch && matchesFilter;
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            setTotalUsers(usersSnapshot.size);
        } catch (e) {
            console.error('Failed to fetch data:', e);
        }
        setLoading(false);
    };

    const fetchTokenRequests = async () => {
        setLoadingRequests(true);
        try {
            const q = query(collection(db, 'tokenRequests'));
            const snapshot = await getDocs(q);
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TokenRequest));
            // Sort client-side latest first
            reqs.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setTokenRequests(reqs);
        } catch (error) {
            console.error("Error fetching token requests:", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchTokenRequests();
    }, []);

    // Real-time listener for site lock state
    useEffect(() => {
        const configRef = doc(db, 'config', 'site');
        const unsub = onSnapshot(configRef, (snap) => {
            if (snap.exists()) {
                setSiteLocked(snap.data().locked !== false);
            } else {
                setSiteLocked(true);
            }
            setLockLoading(false);
        }, () => {
            setLockLoading(false);
        });
        return () => unsub();
    }, []);

    const handleToggleSiteLock = async () => {
        setLockToggling(true);
        try {
            const configRef = doc(db, 'config', 'site');
            const snap = await getDoc(configRef);
            if (snap.exists()) {
                await updateDoc(configRef, { locked: !siteLocked });
            } else {
                await setDoc(configRef, { locked: !siteLocked });
            }
        } catch (e: any) {
            console.error('Failed to toggle site lock:', e);
            alert('Failed to toggle site lock: ' + (e.message || 'Unknown error'));
        } finally {
            setLockToggling(false);
        }
    };

    const handleApproveRequest = async (req: TokenRequest) => {
        if (!confirm(`Approve request of ${req.requestedAmount} tokens for ${req.userName}?`)) return;
        try {
            await updateDoc(doc(db, 'tokenRequests', req.id!), {
                status: 'approved',
                processedAt: serverTimestamp()
            });
            await updateDoc(doc(db, 'users', req.userId), {
                tokens: increment(req.requestedAmount),
                isPremium: true
            });
            // Re-fetch completely to reflect changes
            await fetchTokenRequests();
            await fetchData();
            if (showUsersModal) fetchAllUsers();
            alert(`✅ Approved ${req.requestedAmount} tokens for ${req.userName}.`);
        } catch (e: any) {
            console.error("Failed to approve request:", e);
            if (e.code === 'permission-denied') {
                alert("Permission Denied: Check your Firestore Security Rules. The admin user may not have the isAdmin flag set in the database.");
            } else {
                alert("Error approving request: " + (e.message || "Unknown error"));
            }
        }
    };

    const handleMultiApprove = async () => {
        if (selectedRequests.size === 0) return;
        if (!confirm(`Approve ${selectedRequests.size} selected requests?`)) return;

        setLoadingRequests(true);
        try {
            const promises = Array.from(selectedRequests).map(async (reqId) => {
                const req = tokenRequests.find(r => r.id === reqId);
                if (!req || req.status !== 'pending') return;

                await updateDoc(doc(db, 'tokenRequests', req.id!), {
                    status: 'approved',
                    processedAt: serverTimestamp()
                });
                await updateDoc(doc(db, 'users', req.userId), {
                    tokens: increment(req.requestedAmount),
                    isPremium: true
                });
            });

            await Promise.all(promises);

            // Re-fetch completely to be safe
            await fetchTokenRequests();
            await fetchData();
            if (showUsersModal) fetchAllUsers();

            setSelectedRequests(new Set()); // Clear selection
        } catch (e) {
            console.error("Failed to multi-approve requests:", e);
            alert("Error processing multiple approvals.");
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleRejectRequest = async (req: TokenRequest) => {
        if (!confirm(`Reject request from ${req.userName}?`)) return;
        try {
            await updateDoc(doc(db, 'tokenRequests', req.id!), {
                status: 'rejected',
                processedAt: serverTimestamp()
            });
            setTokenRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
        } catch (e) {
            console.error("Failed to reject request:", e);
            alert("Error rejecting request.");
        }
    };

    const fetchAllUsers = async () => {
        setLoadingUsers(true);
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersList = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
            // Sort by tokens (descending) by default to show most active/valuable users first
            usersList.sort((a, b) => (b.tokens || 0) - (a.tokens || 0));
            setAllUsers(usersList);
            setShowUsersModal(true);
        } catch (error) {
            console.error("Error fetching users:", error);
            alert("Failed to fetch users.");
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAutoClean = async () => {
        if (!confirm("WARNING: This will PERMANENTLY DELETE users who have 0 tokens left AND have been inactive for over 1.5 years. This action cannot be undone. Proceed?")) {
            return;
        }

        setCleaningUsers(true);
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const now = new Date();
            const cutoffDate = new Date(now.setMonth(now.getMonth() - 18)); // 1.5 years ago

            let deletedCount = 0;
            const usersToDelete: string[] = [];

            usersSnapshot.forEach((doc) => {
                const userData = doc.data() as User;
                const tokens = userData.tokens || 0;

                // Check if lastLogin is older than cutoff
                let lastLoginDate = new Date(0); // Epoch
                if (userData.lastLogin) {
                    if (userData.lastLogin instanceof Timestamp) {
                        lastLoginDate = userData.lastLogin.toDate();
                    } else if (typeof userData.lastLogin === 'string' || typeof userData.lastLogin === 'number') {
                        lastLoginDate = new Date(userData.lastLogin);
                    }
                }

                if (tokens === 0 && lastLoginDate < cutoffDate) {
                    usersToDelete.push(doc.id);
                }
            });

            if (usersToDelete.length === 0) {
                alert("No inactive users found matching the criteria (0 tokens, > 1.5 years inactive).");
                setCleaningUsers(false);
                return;
            }

            const confirmMsg = `Found ${usersToDelete.length} users to delete.Confirm deletion ? `;
            if (!window.confirm(confirmMsg)) {
                setCleaningUsers(false);
                return;
            }

            // Perform Deletions
            for (const uid of usersToDelete) {
                await deleteDoc(doc(db, 'users', uid));
                deletedCount++;
            }

            alert(`Successfully deleted ${deletedCount} inactive users.`);
            // Refresh stats
            fetchData();
            if (showUsersModal) fetchAllUsers();

        } catch (error) {
            console.error("Error cleaning users:", error);
            alert("An error occurred during cleanup.");
        } finally {
            setCleaningUsers(false);
        }
    };

    const handleEditTokens = async (targetUser: User) => {
        const newTokensStr = prompt(`Enter new token balance for ${targetUser.displayName}: `, targetUser.tokens?.toString() || "0");
        if (newTokensStr === null) return; // Cancelled
        const newTokens = parseInt(newTokensStr);
        if (isNaN(newTokens) || newTokens < 0) {
            alert("Invalid token amount. Please enter a valid non-negative number.");
            return;
        }

        const shouldBePremium = newTokens > 0;

        try {
            await updateDoc(doc(db, "users", targetUser.uid), {
                tokens: newTokens,
                isPremium: shouldBePremium
            });
            // Optimistic Update
            setAllUsers(prev => prev.map(u => u.uid === targetUser.uid ? { ...u, tokens: newTokens, isPremium: shouldBePremium } : u));
        } catch (e: any) {
            console.error("Error updating tokens:", e);
            if (e.code === 'permission-denied') {
                alert("Permission Denied: You do not have permission to edit this user. Please check your Firestore Security Rules in the Firebase Console.");
            } else {
                alert("Failed to update tokens. " + e.message);
            }
        }
    };

    const handleDeleteUser = async (targetUser: User) => {
        if (!confirm(`Are you sure you want to PERMANENTLY DELETE user ${targetUser.displayName} (${targetUser.email})? This action cannot be undone.`)) return;

        try {
            await deleteDoc(doc(db, "users", targetUser.uid));
            // Optimistic Update
            setAllUsers(prev => prev.filter(u => u.uid !== targetUser.uid));
            setTotalUsers(prev => prev - 1); // approximate update
        } catch (e: any) {
            console.error("Error deleting user:", e);
            if (e.code === 'permission-denied') {
                alert("Permission Denied: Unable to delete user. Check Firestore Security Rules.");
            } else {
                alert("Failed to delete user. " + e.message);
            }
        }
    };

    if (!user.isAdmin) {
        return (
            <div className="flex h-[80vh] items-center justify-center text-slate-500">
                Access Denied. Admin Only.
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 animate-fade-in-up w-full">
            {/* Mobile-Optimized Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                            title="Back to Main"
                        >
                            <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-3xl font-serif font-bold text-white mb-1">Admin Dashboard</h1>
                            <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">Real-time payment monitoring and user management.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                        <span className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider hidden sm:inline">Super Admin</span>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider sm:hidden">Admin</span>
                    </div>
                </div>

                {/* Mobile: Auto Clean Button */}
                <button
                    onClick={handleAutoClean}
                    disabled={cleaningUsers}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all text-xs sm:text-xs font-semibold flex items-center justify-center gap-2 group disabled:opacity-50"
                    title="Delete users with 0 tokens and >1.5 years inactivity"
                >
                    {cleaningUsers ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    <span className="hidden sm:inline">Auto Clean Inactive</span>
                    <span className="sm:hidden">Clean Inactive Users</span>
                </button>
            </div>

            {/* SITE LOCK TOGGLE */}
            <div className="glass-panel rounded-xl overflow-hidden border border-white/10 mb-6 sm:mb-8">
                <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${siteLocked ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                            {siteLocked ? <Lock className="w-5 h-5 text-red-400" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Site Access Lock</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {siteLocked ? 'Site is locked \u2014 visitors see the access key screen' : 'Site is open \u2014 anyone can access without a key'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleSiteLock}
                        disabled={lockLoading || lockToggling}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 ${siteLocked
                            ? 'bg-red-500/30 focus:ring-red-500/20'
                            : 'bg-emerald-500/30 focus:ring-emerald-500/20'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-all duration-300 shadow-lg ${siteLocked
                                ? 'translate-x-0 bg-red-500'
                                : 'translate-x-7 bg-emerald-500'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Stats Check - KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-8 sm:mb-12">
                {/* USERS CARD */}
                <button
                    onClick={fetchAllUsers}
                    className="glass-panel p-6 sm:p-8 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent relative overflow-hidden group text-left transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-900/20"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-blue-400">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest">User Database</span>
                        </div>
                        <div className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                            {loadingUsers ? <RefreshCw className="w-8 h-8 animate-spin" /> : totalUsers.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm group-hover:text-blue-300 transition-colors">
                            <span>Manage Users & Tokens</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </button>
            </div>

            {/* TOKEN REQUESTS INBOX */}
            <div className="glass-panel rounded-xl overflow-hidden border border-white/10 mb-8 sm:mb-12">
                <div className="px-4 sm:px-6 py-4 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${requestFilter === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'}`} />
                            Token Requests
                        </h3>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setRequestFilter(status);
                                        setSelectedRequests(new Set()); // Clear selection on filter change
                                    }}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${requestFilter === status
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {requestFilter === 'pending' && selectedRequests.size > 0 && (
                            <button
                                onClick={handleMultiApprove}
                                disabled={loadingRequests}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 rounded-lg text-xs font-bold transition-all tracking-wide disabled:opacity-50"
                            >
                                APPROVE SELECTED ({selectedRequests.size})
                            </button>
                        )}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {loadingRequests && (
                                <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                            )}
                            <button onClick={fetchTokenRequests} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto p-0 max-h-[600px] w-full">
                    {loadingRequests && filteredRequests.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                            <p className="text-slate-400 text-sm">Loading requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-16 text-center text-slate-500 text-sm flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                                <CheckCircle className="w-6 h-6 text-emerald-500/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-300 font-medium text-lg">{requestFilter === 'pending' ? 'All Caught Up!' : 'No Requests Found'}</p>
                                <p className="text-sm text-slate-500">There are no token requests matching your criteria.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {/* Select All Toggle for Pending */}
                            {requestFilter === 'pending' && filteredRequests.length > 0 && (
                                <div className="p-3 sm:px-6 flex items-center gap-3 bg-white/[0.01]">
                                    <input
                                        type="checkbox"
                                        checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedRequests(new Set(filteredRequests.map(r => r.id!)));
                                            } else {
                                                setSelectedRequests(new Set());
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-slate-950"
                                    />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select All Pending</span>
                                </div>
                            )}

                            {filteredRequests.map(req => (
                                <div key={req.id} className={`p-4 sm:p-6 hover:bg-white/[0.04] transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${selectedRequests.has(req.id!) ? 'bg-emerald-500/5' : ''}`}>
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Checkbox for selection (only if pending) */}
                                        {req.status === 'pending' && (
                                            <div className="pt-1.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRequests.has(req.id!)}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selectedRequests);
                                                        if (e.target.checked) newSet.add(req.id!);
                                                        else newSet.delete(req.id!);
                                                        setSelectedRequests(newSet);
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-slate-950"
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-white">{req.userName}</h3>
                                                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/20">
                                                    +{req.requestedAmount} TOKENS
                                                </span>
                                                {req.status !== 'pending' && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {req.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-slate-400 font-medium">
                                                <a href={`mailto:${req.userEmail}`} className="hover:text-amber-300 hover:underline">{req.userEmail}</a>
                                            </div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : 'Recent'}
                                            </div>
                                        </div>
                                        <div className="flex w-full sm:w-auto items-center gap-2 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                                            {req.status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleRejectRequest(req)}
                                                        className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-sm font-bold transition-all transition-colors tracking-wide"
                                                    >
                                                        REJECT
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveRequest(req)}
                                                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 rounded-lg text-sm font-bold transition-all tracking-wide"
                                                    >
                                                        APPROVE
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                    {req.processedAt?.toDate ? `Processed: ${req.processedAt.toDate().toLocaleString()}` : ''}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* User List Modal */}
            {showUsersModal && (
                <div className="fixed inset-0 z-[150] flex items-start justify-center pt-20 p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
                    <div className="bg-[#0a0a0a] rounded-xl border border-white/10 w-full max-w-5xl flex flex-col shadow-2xl mb-20 relative mx-auto">
                        <div className="p-6 border-b border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Users className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">User Management</h2>
                                        <p className="text-xs text-slate-400">Total Database: {allUsers.length} Users</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowUsersModal(false)}
                                    className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            {/* User Search & Filter Bar */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:border-blue-500/50 focus:outline-none placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="flex bg-black/40 rounded-lg border border-white/10 p-1">
                                    {(['all', 'premium', 'free', 'inactive'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setUserFilterType(type)}
                                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${userFilterType === type
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto p-0 w-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 sticky top-0 backdrop-blur-sm z-10 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4 text-center">Tokens</th>
                                        <th className="px-6 py-4 text-center">Plan</th>
                                        <th className="px-6 py-4 text-right">Last Login</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {filteredUsers.map(u => {
                                        // Format Date
                                        let lastLoginStr = "Never";
                                        if (u.lastLogin) {
                                            if (u.lastLogin instanceof Timestamp) {
                                                lastLoginStr = u.lastLogin.toDate().toLocaleDateString();
                                            } else if (typeof u.lastLogin === 'string') {
                                                lastLoginStr = new Date(u.lastLogin).toLocaleDateString();
                                            }
                                        }

                                        return (
                                            <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs overflow-hidden relative">
                                                            {u.photoURL ? (
                                                                <>
                                                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-400">
                                                                        {u.displayName?.charAt(0).toUpperCase() || '?'}
                                                                    </div>
                                                                    <img
                                                                        src={u.photoURL}
                                                                        alt={u.displayName}
                                                                        className="w-full h-full object-cover relative z-10"
                                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                    />
                                                                </>
                                                            ) : (
                                                                <span className="font-bold text-slate-400">
                                                                    {u.displayName?.charAt(0).toUpperCase() || '?'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {u.displayName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400">
                                                    <a
                                                        href={`mailto:${u.email}?subject=Submitra Support`}
                                                        className="hover:text-amber-400 hover:underline transition-colors decoration-dotted underline-offset-4"
                                                        title="Send Email"
                                                    >
                                                        {u.email}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-mono font-bold ${u.tokens > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {u.tokens}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {u.isPremium ? (
                                                        <span className="px-2 py-1 rounded text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">PREMIUM</span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-400">FREE</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500">{lastLoginStr}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditTokens(u)}
                                                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors"
                                                            title="Edit Tokens"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u)}
                                                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
