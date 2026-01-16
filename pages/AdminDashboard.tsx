
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, onSnapshot, doc, deleteDoc, updateDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PaymentTransaction, User } from '../types';
import { CheckCircle, XCircle, Clock, ShieldCheck, ArrowLeft, ArrowRight, Users, DollarSign, RefreshCw, Trash2, Edit2, Activity, CreditCard, TrendingUp } from 'lucide-react';

const AdminDashboard = ({ user, onBack }: { user: User; onBack: () => void }) => {
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [autoRefreshing, setAutoRefreshing] = useState(false);

    // User Management State
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [cleaningUsers, setCleaningUsers] = useState(false);

    const fetchData = async () => {
        setLoading(true);

        try {
            // 1. Fetch ALL transactions (for accurate client-side calc)
            // Note: In a massive app, we'd use aggregation queries, but for <10k txns, this is fine and more accurate for now.
            const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const allTxns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentTransaction));

            setTransactions(allTxns.slice(0, 50)); // Show top 50 in list

            // 2. Calculate Revenue & Stats
            let totalRev = 0;
            // let todayRev = 0; // Future use

            allTxns.forEach(tx => {
                // Accept both 'success' (legacy) and 'completed' (new secure backend)
                // Also accept 'captured' if strictly needed, but 'completed' is the main one now.
                if (tx.status === 'success' || tx.status === 'completed' || tx.status === 'captured') {
                    totalRev += (tx.amount || 0);
                }
            });

            setTotalRevenue(totalRev);

        } catch (e) {
            console.error('Failed to fetch data:', e);
        }

        // Fetch User Count
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            setTotalUsers(usersSnapshot.size);
        } catch (e) { console.error(e); }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // Real-time listener for new transactions
        const transactionsQuery = query(
            collection(db, 'transactions'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    console.log('🔄 New transaction detected');
                    // Refresh full data to update stats
                    setAutoRefreshing(true);
                    fetchData().then(() => {
                        setTimeout(() => setAutoRefreshing(false), 1000);
                    });
                }
            });
        });

        // Auto-refresh every 30 seconds as backup
        const refreshInterval = setInterval(() => {
            setAutoRefreshing(true);
            fetchData().then(() => {
                setTimeout(() => setAutoRefreshing(false), 1000);
            });
        }, 30000);

        return () => {
            unsubscribe();
            clearInterval(refreshInterval);
        };
    }, []);

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 animate-fade-in-up">
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

            {/* Stats Check - KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">

                {/* REVENUE CARD - The most important metric */}
                <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-24 h-24 text-amber-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-amber-400">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest">Total Revenue</span>
                        </div>
                        <div className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                            ₹{totalRevenue.toLocaleString()}
                        </div>
                        <p className="text-slate-400 text-sm">
                            Lifetime earnings from token sales
                        </p>
                    </div>
                </div>

                {/* USERS CARD - Click to Manage */}
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

            {/* Transactions List */}
            <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">Recent Transactions</h3>

                        <div className="flex items-center gap-3">
                            {autoRefreshing && (
                                <div className="flex items-center gap-2 text-xs text-emerald-400">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span className="hidden sm:inline">Updating...</span>
                                </div>
                            )}
                            <button onClick={fetchData} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-sm">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">No transactions found.</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-start gap-3">
                                    {/* Status Icon */}
                                    <div className="mt-1">
                                        {(tx.status === 'success' || tx.status === 'completed' || tx.status === 'captured') ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        ) : tx.status === 'pending' ? (
                                            <Clock className="w-5 h-5 text-amber-400" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {/* Clickable Email for Direct Contact */}
                                            <a
                                                href={`mailto:${tx.userEmail}?subject=AutoForm AI - Special Offer&body=Hi, thanks for using AutoForm!`}
                                                className="font-medium text-white text-sm sm:text-base hover:text-amber-400 transition-colors underline decoration-dotted underline-offset-4"
                                                title="Send Email to User"
                                            >
                                                {tx.userEmail}
                                            </a>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(tx.status === 'success' || tx.status === 'completed' || tx.status === 'captured') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                'bg-red-500/10 text-red-400 border border-red-500/20'
                                                } `}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-slate-500 font-mono mb-2">
                                            ID: {tx.paymentId || tx.id}
                                        </div>

                                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-6 text-xs sm:text-sm">
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                <span className="text-[10px] sm:text-xs">
                                                    {tx.createdAt ? (
                                                        tx.createdAt instanceof Timestamp
                                                            ? tx.createdAt.toDate().toLocaleString()
                                                            : new Date(tx.createdAt).toLocaleString()
                                                    ) : 'Unknown Date'}
                                                </span>
                                            </div>
                                            <div className="font-mono text-emerald-400 font-bold">₹{tx.amount}</div>
                                            <div className="font-mono text-amber-400 font-bold">{tx.tokens} Tokens</div>
                                            <div className="font-mono text-slate-400 text-[10px] sm:text-xs">Method: {tx.method}</div>
                                        </div>
                                    </div>

                                    {/* Dismiss / Delete Transaction Button */}
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            // Confirm dismissal
                                            if (!confirm('Dismiss this transaction? It will be removed from this list permanently.')) return;
                                            try {
                                                await deleteDoc(doc(db, 'transactions', tx.id!));
                                                setTransactions(prev => prev.filter(t => t.id !== tx.id));
                                            } catch (err) {
                                                console.error('Error deleting transaction:', err);
                                                alert('Failed to delete transaction.');
                                            }
                                        }}
                                        className="p-2 opacity-50 group-hover:opacity-100 bg-white/5 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                                        title="Dismiss (Remove from Inbox)"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* User List Modal */}
            {showUsersModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#0a0a0a] rounded-xl border border-white/10 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-blue-400" />
                                <h2 className="text-xl font-bold text-white">All Users ({allUsers.length})</h2>
                            </div>
                            <button
                                onClick={() => setShowUsersModal(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-0">
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
                                    {allUsers.map(u => {
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
                                                        href={`mailto:${u.email}?subject=AutoForm AI Support`}
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
