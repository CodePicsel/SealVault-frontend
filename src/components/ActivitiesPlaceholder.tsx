import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from '../ui/Button';

type FileDoc = {
    _id: string;
    id?: string;
    name?: string;
    originalName?: string;
    createdAt: string;
    signingStatus?: string;
    signedVersions?: Array<{ url: string, storagePath?: string, createdAt: string }>;
};

type AssignedRequest = {
    _id: string;
    fileId: { _id: string, originalName: string, uploader: string };
    title: string;
    message: string;
    status: string;
    expiresAt: string;
    mySigner: any;
    isMyTurn: boolean;
    createdAt: string;
};

type AuditEntry = {
    _id: string;
    action: string;
    userEmail: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
    createdAt: string;
};

export const ActivitiesPlaceholder: React.FC = () => {
    const [files, setFiles] = useState<FileDoc[]>([]);
    const [assignedReqs, setAssignedReqs] = useState<AssignedRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'my_docs' | 'assigned'>('my_docs');
    const [loading, setLoading] = useState(true);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [auditLog, setAuditLog] = useState<AuditEntry[] | null>(null);
    const [auditLoading, setAuditLoading] = useState(false);

    const [signingLoadingId, setSigningLoadingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [uploadsRes, assignedRes] = await Promise.all([
                    api.get('/api/uploads'),
                    api.get('/api/sign-requests/assigned')
                ]);
                const data = uploadsRes.data.files || uploadsRes.data.data || uploadsRes.data || [];
                setFiles(Array.isArray(data) ? data : []);
                setAssignedReqs(assignedRes.data.assigned || []);
            } catch (err) {
                console.error('Failed to fetch activity list', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchAudit = async (fId: string) => {
        setAuditLoading(true);
        setSelectedFileId(fId);
        try {
            const res = await api.get(`/api/audit/${fId}`);
            const data = res.data.auditTrail || res.data.data || res.data;
            setAuditLog(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch audit log', err);
            setAuditLog([]); // Empty on error to indicate no records
        } finally {
            setAuditLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading recent activities...</p>
            </div>
        );
    }

    return (
        <div className="bg-white/40 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl p-6 lg:p-8 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-teal-950 dark:text-teal-50 mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Trails
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">

                {/* File List / Sidebar */}
                <div className="lg:col-span-1 border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 rounded-xl overflow-hidden shadow-inner h-[600px] flex flex-col">
                    <div className="flex border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('my_docs')}
                            className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === 'my_docs' ? 'text-teal-700 dark:text-teal-300 border-b-2 border-teal-500 bg-black/5 dark:bg-white/5' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            My Docs ({files.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('assigned')}
                            className={`flex-1 p-3 text-sm font-semibold transition-colors ${activeTab === 'assigned' ? 'text-teal-700 dark:text-teal-300 border-b-2 border-teal-500 bg-black/5 dark:bg-white/5' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Assigned ({assignedReqs.length})
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {activeTab === 'my_docs' && (
                            files.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No documents found. Upload one to see activity.</div>
                            ) : (
                                files.map(f => {
                                    const id = f._id || f.id;
                                    const isSelected = selectedFileId === id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => { if (id) fetchAudit(id); }}
                                            className={`w-full text-left p-3 rounded-lg text-sm transition-all flex flex-col gap-1 border ${isSelected
                                                ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-700/50 shadow-sm'
                                                : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            <span className={`font-medium truncate block ${isSelected ? 'text-teal-900 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {f.name || f.originalName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(f.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </button>
                                    );
                                })
                            )
                        )}

                        {activeTab === 'assigned' && (
                            assignedReqs.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">No assigned sign requests found.</div>
                            ) : (
                                assignedReqs.map(req => {
                                    const fId = req.fileId?._id;
                                    const isSelected = selectedFileId === fId;
                                    return (
                                        <button
                                            key={req._id}
                                            onClick={() => { if (fId) fetchAudit(fId); }}
                                            className={`w-full text-left p-3 rounded-lg text-sm transition-all flex flex-col gap-1 border ${isSelected
                                                ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-700/50 shadow-sm'
                                                : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`font-medium truncate block ${isSelected ? 'text-teal-900 dark:text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {req.title || req.fileId?.originalName}
                                                </span>
                                                {req.isMyTurn && (
                                                    <span className="shrink-0 bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2 border border-red-200">
                                                        Wait on you
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${req.mySigner?.status === 'signed'
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    }`}>
                                                    My Status: {req.mySigner?.status}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            {req.mySigner?.status === 'pending' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="w-full mt-1 text-xs py-1.5"
                                                    disabled={signingLoadingId === req._id}
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            setSigningLoadingId(req._id);
                                                            const res = await api.get(`/api/sign-requests/assigned/${req._id}/token`);
                                                            window.open(`/sign/public/${res.data.inviteToken}`, '_blank');
                                                        } catch (err) {
                                                            console.error('Failed to get singing token', err);
                                                            alert('Failed to open signing page. Please try again.');
                                                        } finally {
                                                            setSigningLoadingId(null);
                                                        }
                                                    }}
                                                >
                                                    {signingLoadingId === req._id ? 'Opening...' : 'Open Signing Page'}
                                                </Button>
                                            )}
                                        </button>
                                    );
                                })
                            )
                        )}
                    </div>
                </div>

                {/* Audit Trail Detail View */}
                <div className="lg:col-span-2 border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 rounded-xl overflow-hidden shadow-inner h-[600px] flex flex-col relative">
                    {!selectedFileId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
                            <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            <p>Select a document to view its detailed audit trail.</p>
                        </div>
                    ) : auditLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm sticky top-0 z-10 flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Activity History</h3>
                                    <Button variant="ghost" size="sm" onClick={() => fetchAudit(selectedFileId)}>Refresh</Button>
                                </div>
                                {(() => {
                                    const file = files.find(f => (f._id || f.id) === selectedFileId);
                                    if (file && file.signedVersions && file.signedVersions.length > 0) {
                                        const latestSigned = file.signedVersions[file.signedVersions.length - 1];
                                        return (
                                            <Button
                                                variant="primary"
                                                className="w-full text-sm font-semibold"
                                                onClick={() => {
                                                    if (latestSigned.url) window.open(latestSigned.url, '_blank');
                                                }}
                                            >
                                                View Final Signed Document
                                            </Button>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {!auditLog || !Array.isArray(auditLog) || auditLog.length === 0 ? (
                                    <div className="bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center text-sm text-gray-500">
                                        No audit events recorded for this document yet.
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-teal-100 dark:border-teal-900/50 ml-3 md:ml-4 space-y-8 pb-4">
                                        {auditLog.map((entry) => {
                                            const isSignature = entry.action === 'signed' || entry.action === 'sign_applied';
                                            const isCreation = entry.action === 'created' || entry.action === 'uploaded';
                                            const isSent = entry.action === 'invited' || entry.action === 'email_sent';

                                            let icon = (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            );
                                            let badgeColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';

                                            if (isCreation) {
                                                icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
                                                badgeColor = 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
                                            } else if (isSignature) {
                                                icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
                                                badgeColor = 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800';
                                            } else if (isSent) {
                                                icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
                                                badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
                                            }

                                            return (
                                                <div key={entry._id} className="relative pl-6 sm:pl-8 group">
                                                    {/* Timeline node */}
                                                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-2 bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110 ${badgeColor}`}>
                                                        {icon}
                                                    </div>

                                                    {/* Content Card */}
                                                    <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-black/5 dark:border-white/5 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-2 gap-4">
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{entry.action.replace('_', ' ')}</h4>
                                                                <p className="text-sm font-medium text-teal-600 dark:text-teal-400">{entry.userEmail}</p>
                                                            </div>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap bg-gray-100 dark:bg-neutral-900 px-2 py-1 rounded-md">
                                                                {new Date(entry.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>

                                                        {entry.ipAddress && (
                                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-3 p-2 bg-gray-50 dark:bg-neutral-900/50 rounded-lg">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                                                <span className="font-mono">{entry.ipAddress}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
