import React, { useEffect, useState } from 'react';
import { getPaymentRequests, approvePayment, rejectPayment } from '../services/paymentService';
import { collection, getDocs, query, where, onSnapshot, doc, deleteDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PaymentRequest, User } from '../types';
import { CheckCircle, XCircle, ExternalLink, Clock, ShieldCheck, Search, CheckSquare, Square, ArrowLeft, Users, TrendingUp, DollarSign, RefreshCw, Eye, Trash2, Edit2 } from 'lucide-react';

const AdminDashboard = ({ user, onBack }: { user: User; onBack: () => void }) => {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);
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
        const data = await getPaymentRequests();
        setRequests(data);

        // Fetch total users count
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            setTotalUsers(usersSnapshot.size);
        } catch (e) {
            console.error('Failed to fetch user count:', e);
        }

        // Fetch total revenue from approved requests
        try {
            const approvedQuery = query(
                collection(db, 'payment_requests'),
                where('status', '==', 'approved')
            );
            const approvedSnapshot = await getDocs(approvedQuery);
            const revenue = approvedSnapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().amount || 0);
            }, 0);
            setTotalRevenue(revenue);
        } catch (e) {
            console.error('Failed to fetch revenue:', e);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // Real-time listener for pending payment requests
        const pendingQuery = query(
            collection(db, 'payment_requests'),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(pendingQuery, (snapshot) => {
            console.log('🔄 Real-time update: Payment requests changed');
            setAutoRefreshing(true);
            fetchData().then(() => {
                setTimeout(() => setAutoRefreshing(false), 1000);
            });
        });

        // Auto-refresh every 30 seconds as backup
        const refreshInterval = setInterval(() => {
            console.log('⏰ Auto-refresh triggered');
            setAutoRefreshing(true);
            fetchData().then(() => {
                setTimeout(() => setAutoRefreshing(false), 1000);
            });
        }, 30000); // 30 seconds

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

            if (!confirm(`Found ${usersToDelete.length} users to delete. Confirm deletion?`)) {
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
        const newTokensStr = prompt(`Enter new token balance for ${targetUser.displayName}:`, targetUser.tokens?.toString() || "0");
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

    const handleApprove = async (req: PaymentRequest) => {
        if (!confirm(`Approve upgrade for ${req.userEmail}?`)) return;
        try {
            await approvePayment(req.id, req.userId);
            fetchData(); // Refresh
        } catch (e) {
            alert("Approval failed");
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Reject this request?")) return;
        try {
            await rejectPayment(id);
            fetchData();
        } catch (e) {
            alert("Rejection failed");
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === requests.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(requests.map(r => r.id)));
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Approve ${selectedIds.size} selected request(s)?`)) return;

        setBulkProcessing(true);
        try {
            const selectedRequests = requests.filter(r => selectedIds.has(r.id));
            for (const req of selectedRequests) {
                await approvePayment(req.id, req.userId);
            }
            setSelectedIds(new Set());
            fetchData();
        } catch (e) {
            alert("Some approvals failed");
        } finally {
            setBulkProcessing(false);
        }
    };

    const handleBulkReject = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Reject ${selectedIds.size} selected request(s)?`)) return;

        setBulkProcessing(true);
        try {
            for (const id of Array.from<string>(selectedIds)) {
                await rejectPayment(id);
            }
            setSelectedIds(new Set());
            fetchData();
        } catch (e) {
            alert("Some rejections failed");
        } finally {
            setBulkProcessing(false);
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
        <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                        title="Back to Main"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Admin Dashboard</h1>
                        <p className="text-slate-400 text-sm">Manage user upgrades and system status.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAutoClean}
                        disabled={cleaningUsers}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all text-xs font-semibold flex items-center gap-2 group disabled:opacity-50"
                        title="Delete users with 0 tokens and >1.5 years inactivity"
                    >
                        {cleaningUsers ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                        Auto Clean Inactive
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Super Admin</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 mb-12">
                <div
                    onClick={fetchAllUsers}
                    className="glass-panel p-6 rounded-xl border border-white/5 hover:border-blue-500/40 cursor-pointer transition-all hover:scale-[1.02] group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{loadingUsers ? <RefreshCw className="w-6 h-6 animate-spin" /> : totalUsers.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Total Users (View All)</div>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                        ₹{totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Total Revenue</div>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-amber-500/20 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-3xl font-bold text-amber-400 mb-1">{requests.length}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Pending Requests</div>
                </div>
                <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-purple-500/20 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <CheckSquare className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-3xl font-bold text-purple-400 mb-1">{selectedIds.size}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Selected</div>
                </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Payment Verification Queue</h3>
                        {requests.length > 0 && (
                            <button
                                onClick={toggleSelectAll}
                                className="text-xs text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
                            >
                                {selectedIds.size === requests.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                {selectedIds.size === requests.length ? 'Deselect All' : 'Select All'}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedIds.size > 0 && (
                            <>
                                <button
                                    onClick={handleBulkApprove}
                                    disabled={bulkProcessing}
                                    className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve ({selectedIds.size})
                                </button>
                                <button
                                    onClick={handleBulkReject}
                                    disabled={bulkProcessing}
                                    className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject ({selectedIds.size})
                                </button>
                            </>
                        )}
                        {autoRefreshing && (
                            <div className="flex items-center gap-2 text-xs text-emerald-400">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Updating...</span>
                            </div>
                        )}
                        <button onClick={fetchData} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-sm">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-sm">No pending requests found.</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {requests.map((req) => (
                            <div key={req.id} className={`p-6 flex items-center justify-between transition-colors ${selectedIds.has(req.id) ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'}`}>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleSelection(req.id)}
                                        className="text-slate-400 hover:text-amber-400 transition-colors"
                                    >
                                        {selectedIds.has(req.id) ? <CheckSquare className="w-5 h-5 text-amber-400" /> : <Square className="w-5 h-5" />}
                                    </button>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{req.userEmail}</span>
                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">{req.userId}</span>
                                        </div>
                                        <div className="text-sm text-slate-400 flex items-center gap-4">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(req.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                            <span className="font-mono text-emerald-400">₹{req.amount}</span>
                                            <span className="font-mono text-amber-400 font-bold">{req.tokens || 0} Tkn</span>
                                            <span className="font-mono text-slate-300">UTR: {req.utr}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {req.screenshotUrl && req.screenshotUrl !== "DELETED_TO_SAVE_STORAGE" && (
                                        <button
                                            onClick={() => setSelectedImage(req.screenshotUrl!)}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-2 transition-colors"
                                        >
                                            <Search className="w-3 h-3" /> Show Proof
                                        </button>
                                    )}

                                    <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                                        <button
                                            onClick={() => handleApprove(req)}
                                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                                            title="Approve & Upgrade"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all"
                                            title="Reject"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
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
                                                <td className="px-6 py-4 text-slate-400">{u.email}</td>
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

            {/* Proof View Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-2xl w-full max-h-[90vh] overflow-hidden rounded-xl border border-white/10">
                        <img
                            src={selectedImage}
                            alt="Payment Proof"
                            className="w-full h-auto object-contain bg-black"
                        />
                        <button
                            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full"
                            onClick={() => setSelectedImage(null)}
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
