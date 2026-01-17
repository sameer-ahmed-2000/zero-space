import { FileDown, List, Menu, Trash2, Upload } from 'lucide-react'
import React, { useRef } from 'react'

interface TopBarProps {
    sidebarOpen: boolean
    toggleSidebar: () => void
    toggleToc: () => void
    onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void
    onExport: () => void
    onClear: () => void
}

export default function TopBar({ sidebarOpen, toggleSidebar, toggleToc, onImportFile, onExport, onClear }: TopBarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

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
