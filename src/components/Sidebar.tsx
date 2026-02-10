import { Page } from '@/types'
import {
    Archive,
    Book,
    Briefcase,
    ChevronDown,
    ChevronRight,
    Download,
    LayoutTemplate,
    Moon,
    Plus,
    Search,
    Settings,
    Star,
    Sun,
    Trash2,
    X
} from 'lucide-react'
import { memo, useState } from 'react'

interface SidebarProps {
    isOpen: boolean
    toggle: () => void
    darkMode: boolean
    toggleDarkMode: () => void
    pages: Page[]
    currentPageId: string
    onPageSelect: (pageId: string) => void
    onNewPage: () => void
    onDeletePage: (pageId: string) => void
}

function Sidebar({
    isOpen,
    toggle,
    darkMode,
    toggleDarkMode,
    pages,
    currentPageId,
    onPageSelect,
    onNewPage,
    onDeletePage
}: SidebarProps) {
    const [foldersOpen, setFoldersOpen] = useState({
        learning: true,
        projects: true,
        archive: false
    })

    const toggleFolder = (folder: keyof typeof foldersOpen) => {
        setFoldersOpen(prev => ({ ...prev, [folder]: !prev[folder] }))
    }

    return (
        <aside
            className={`fixed left-0 top-0 h-screen w-64 bg-[#F7F6F3] dark:bg-[#111118] border-r border-[#E9E9E7] dark:border-[#2F2F2F] flex flex-col transition-transform duration-300 z-50 shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
        >
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded transition-colors">
                    <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        Z
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-none">Zero-Space</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Personal Workspace</p>
                    </div>
                </div>
                <button
                    onClick={toggle}
                    className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Search */}
            <div className="px-3 pt-4 pb-2">
                <button className="w-full flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
                    <Search size={14} />
                    <span className="text-xs font-medium flex-1 text-left">Search pages...</span>
                    <kbd className="hidden group-hover:inline-block text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500">⌘K</kbd>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-6">
                {/* Quick Actions */}
                <div className="space-y-0.5">
                    <div className="px-2 pb-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Quick Actions
                    </div>
                    <button
                        onClick={onNewPage}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                        <Plus size={16} className="text-indigo-500" />
                        <span>New Page</span>
                    </button>
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors">
                        <LayoutTemplate size={16} className="text-amber-500" />
                        <span>New from Template</span>
                    </button>
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors">
                        <Download size={16} className="text-emerald-500" />
                        <span>Export PDF</span>
                    </button>
                </div>

                {/* Workspaces */}
                <div className="space-y-1">
                    <div className="px-2 pb-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Workspaces
                    </div>

                    {/* Learning Folder (Mock) */}
                    <div>
                        <button
                            onClick={() => toggleFolder('learning')}
                            className="w-full flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors group"
                        >
                            {foldersOpen.learning ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Book size={14} className="text-blue-500" />
                            <span>Learning</span>
                            <span className="ml-auto text-xs text-gray-400 opacity-0 group-hover:opacity-100">{pages.length}</span>
                        </button>

                        {foldersOpen.learning && (
                            <div className="ml-2 pl-2 border-l border-gray-200 dark:border-gray-800 mt-1 space-y-0.5">
                                {pages.map((page) => (
                                    <div
                                        key={page.id}
                                        className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${currentPageId === page.id
                                                ? 'bg-gray-200/80 dark:bg-[#1F1F28] text-gray-900 dark:text-white font-medium'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                            }`}
                                        onClick={() => onPageSelect(page.id)}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-lg leading-none shrink-0">{page.icon || '📄'}</span>
                                            <span className="text-sm truncate">{page.title || 'Untitled'}</span>
                                        </div>

                                        {pages.length > 1 && (
                                            <button
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300/50 dark:hover:bg-white/10 rounded text-gray-400 hover:text-red-500 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (confirm(`Delete "${page.title || 'Untitled'}"?`)) {
                                                        onDeletePage(page.id)
                                                    }
                                                }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Projects Folder (Mock) */}
                    <div>
                        <button
                            onClick={() => toggleFolder('projects')}
                            className="w-full flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                            {foldersOpen.projects ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Briefcase size={14} className="text-purple-500" />
                            <span>Projects</span>
                        </button>
                        {foldersOpen.projects && (
                            <div className="ml-2 pl-2 border-l border-gray-200 dark:border-gray-800 mt-1 space-y-0.5">
                                <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-500 italic">No projects yet</div>
                            </div>
                        )}
                    </div>

                    {/* Archive Folder (Mock) */}
                    <div>
                        <button
                            onClick={() => toggleFolder('archive')}
                            className="w-full flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                            {foldersOpen.archive ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Archive size={14} className="text-amber-500" />
                            <span>Archive</span>
                        </button>
                    </div>
                </div>

                {/* Favorites */}
                <div className="space-y-0.5">
                    <div className="px-2 pb-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Favorites
                    </div>
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span>Algorithm Notes</span>
                    </button>
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span>Project Ideas</span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-1 bg-white/50 dark:bg-black/20">
                <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors"
                >
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <div className="flex items-center gap-1">
                    <button className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors">
                        <Trash2 size={16} />
                        <span>Trash</span>
                        <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-800 px-1.5 rounded-full">3</span>
                    </button>
                    <button className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-md transition-colors">
                        <Settings size={16} />
                        <span>Settings</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}

export default memo(Sidebar)
