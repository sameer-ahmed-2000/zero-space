import { AlertCircle, Check, Cloud, FileDown, List, Loader, Menu, Trash2, Upload } from 'lucide-react'
import React, { useRef } from 'react'

type SyncStatus = 'idle' | 'saving' | 'synced' | 'error'

interface TopBarProps {
    sidebarOpen: boolean
    toggleSidebar: () => void
    toggleToc: () => void
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void
    onExport: () => void
    onClear: () => void
    // Google Drive props
    isSignedIn?: boolean
    syncStatus?: SyncStatus
    userEmail?: string
    onConnectDrive?: () => void
    gapiInitialized?: boolean
}

export default function TopBar({
    sidebarOpen,
    toggleSidebar,
    toggleToc,
    onImportFile,
    onExport,
    onClear,
    isSignedIn = false,
    syncStatus = 'idle',
    userEmail = '',
    onConnectDrive,
    gapiInitialized = false
}: TopBarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const renderSyncStatus = () => {
        if (!isSignedIn) return null

        switch (syncStatus) {
            case 'saving':
                return (
                    <div className="sync-status saving" title="Saving to Drive...">
                        <Loader size={16} className="spinning" />
                        <span>Saving...</span>
                    </div>
                )
            case 'synced':
                return (
                    <div className="sync-status synced" title="Synced with Drive">
                        <Check size={16} />
                        <span>Synced</span>
                    </div>
                )
            case 'error':
                return (
                    <div className="sync-status error" title="Sync error">
                        <AlertCircle size={16} />
                        <span>Error</span>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="top-bar">
            {!sidebarOpen && (
                <button
                    className="sidebar-toggle-btn"
                    onClick={toggleSidebar}
                    title="Open sidebar"
                >
                    <Menu size={20} />
                </button>
            )}

            <div className="top-bar-actions">
                <button className="action-btn" onClick={() => fileInputRef.current?.click()} title="Import Markdown">
                    <Upload size={18} />
                    <span>Import</span>
                </button>
                <button className="action-btn" onClick={onExport} title="Export as PDF">
                    <FileDown size={18} />
                    <span>Export</span>
                </button>
                <button className="action-btn danger" onClick={onClear} title="Clear all">
                    <Trash2 size={18} />
                </button>
                <button className="action-btn" onClick={toggleToc} title="Toggle TOC">
                    <List size={18} />
                </button>

                {/* Google Drive Connection */}
                {onConnectDrive && (
                    <div className="drive-connection">
                        {renderSyncStatus()}
                        <button
                            className={`action-btn drive-btn ${isSignedIn ? 'connected' : ''} ${!gapiInitialized && !isSignedIn ? 'loading' : ''}`}
                            onClick={onConnectDrive}
                            disabled={!gapiInitialized && !isSignedIn}
                            title={
                                !gapiInitialized && !isSignedIn
                                    ? 'Loading Google Drive API...'
                                    : isSignedIn
                                        ? `Connected as ${userEmail}`
                                        : 'Connect to Google Drive'
                            }
                        >
                            {!gapiInitialized && !isSignedIn ? (
                                <>
                                    <Loader size={18} className="spinning" />
                                    <span>Loading...</span>
                                </>
                            ) : (
                                <>
                                    <Cloud size={18} />
                                    <span>{isSignedIn ? userEmail.split('@')[0] : 'Connect Drive'}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={onImportFile}
                accept=".md,.txt"
                style={{ display: 'none' }}
            />
        </div>
    )
}
