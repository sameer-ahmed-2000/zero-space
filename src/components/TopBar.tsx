
import { AlertCircle, Check, Cloud, FileDown, List, Loader, Menu, Trash2, Upload } from 'lucide-react'
import React, { useRef } from 'react'

import { SyncStatus } from '@/types'

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
                        <span className="hidden sm:inline">Saving...</span>
                    </div>
                )
            case 'synced':
                return (
                    <div className="sync-status synced" title="Synced with Drive">
                        <Check size={16} />
                        <span className="hidden sm:inline">Synced</span>
                    </div>
                )
            case 'error':
                return (
                    <div className="sync-status error" title="Sync error">
                        <AlertCircle size={16} />
                        <span className="hidden sm:inline">Error</span>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="top-bar">
            {/* Left Section: Sidebar & File Management */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {!sidebarOpen && (
                    <button
                        className="sidebar-toggle-btn shrink-0"
                        onClick={toggleSidebar}
                        title="Open sidebar"
                    >
                        <Menu size={20} />
                    </button>
                )}

                <div className="top-bar-actions overflow-x-auto no-scrollbar">
                    <button className="action-btn shrink-0" onClick={() => fileInputRef.current?.click()} title="Import Markdown">
                        <Upload size={16} />
                        <span className="hidden md:inline">Import</span>
                    </button>
                    <button className="action-btn shrink-0" onClick={onExport} title="Export as PDF">
                        <FileDown size={16} />
                        <span className="hidden md:inline">Export</span>
                    </button>

                    <div className="w-px h-5 bg-gray-200 dark:bg-zinc-800 mx-1 shrink-0" />

                    {/* Google Drive Connection */}
                    {onConnectDrive && (
                        <div className="flex items-center gap-2 shrink-0">
                            {renderSyncStatus()}
                            <button
                                className={`action-btn drive-btn shrink-0 ${isSignedIn ? 'connected' : ''} ${!gapiInitialized && !isSignedIn ? 'loading' : ''}`}
                                onClick={onConnectDrive}
                                disabled={!gapiInitialized && !isSignedIn}
                                title={isSignedIn ? `Connected as ${userEmail}` : "Connect Google Drive"}
                            >
                                <Cloud size={16} />
                                <span className="hidden sm:inline">{isSignedIn ? 'Drive' : 'Connect'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Section: Utilities & Danger */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                    className="action-btn text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={() => {
                        if (confirm('Are you sure you want to clear all content? This cannot be undone.')) {
                            onClear();
                        }
                    }}
                    title="Clear content (Irreversible)"
                >
                    <Trash2 size={16} />
                </button>

                <div className="w-px h-5 bg-gray-200 dark:bg-zinc-800" />

                <button className="action-btn" onClick={toggleToc} title="Toggle Table of Contents">
                    <List size={20} />
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={onImportFile}
                accept=".md,.markdown,.txt"
                style={{ display: 'none' }}
            />
        </div>
    )
}
