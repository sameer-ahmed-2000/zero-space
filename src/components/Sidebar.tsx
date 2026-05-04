import { Page } from '@/types'
import { ChevronDown, ChevronRight, FileText, Moon, Plus, Search, Settings, Sun, Trash2, X } from 'lucide-react'
import { memo, useMemo, useState } from 'react'

interface SidebarProps {
    isOpen: boolean
    toggle: () => void
    darkMode: boolean
    toggleDarkMode: () => void
    pages: Page[]
    currentPageId: string
    onPageSelect: (pageId: string) => void
    onNewPage: (parentId?: string) => void
    onDeletePage: (pageId: string) => void
}

interface PageNode extends Page {
    children: PageNode[]
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
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const toggleExpand = (e: React.MouseEvent, pageId: string) => {
        e.stopPropagation()
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(pageId)) {
                next.delete(pageId)
            } else {
                next.add(pageId)
            }
            return next
        })
    }

    // Build hierarchical tree
    const pageTree = useMemo(() => {
        const pageMap = new Map<string, PageNode>()
        const roots: PageNode[] = []

        // First pass: create nodes
        pages.forEach(page => {
            pageMap.set(page.id, { ...page, children: [] })
        })

        // Second pass: connect children
        pages.forEach(page => {
            const node = pageMap.get(page.id)!
            if (page.parentId && pageMap.has(page.parentId)) {
                pageMap.get(page.parentId)!.children.push(node)
            } else {
                roots.push(node)
            }
        })

        return roots
    }, [pages])

    // Filtered tree for search
    const filteredTree = useMemo(() => {
        if (!searchQuery) return pageTree

        const filterNodes = (nodes: PageNode[]): PageNode[] => {
            return nodes
                .map(node => ({
                    ...node,
                    children: filterNodes(node.children)
                }))
                .filter(node => 
                    (node.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase()) || 
                    node.children.length > 0
                )
        }

        return filterNodes(pageTree)
    }, [pageTree, searchQuery])

    // Recursive component to render tree items
    const renderPageItem = (node: PageNode, level: number = 0) => {
        const isExpanded = expandedIds.has(node.id) || searchQuery !== ''
        const hasChildren = node.children.length > 0
        const isActive = currentPageId === node.id

        return (
            <div key={node.id} className="flex flex-col">
                <div
                    className={`page-item ${isActive ? 'active' : ''}`}
                    style={{ paddingLeft: level * 12 }}
                >
                    <div className="flex items-center w-full group">
                        {hasChildren ? (
                            <button 
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
                                onClick={(e) => toggleExpand(e, node.id)}
                            >
                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                        ) : (
                            <div className="w-5" />
                        )}
                        
                        <button
                            className="page-button"
                            onClick={() => onPageSelect(node.id)}
                        >
                            <span className="page-icon">
                                <FileText size={14} />
                            </span>
                            <span className="sidebar-page-title">{node.title || 'Untitled'}</span>
                        </button>

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                            <button
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onNewPage(node.id)
                                    setExpandedIds(prev => new Set(prev).add(node.id))
                                }}
                                title="Add sub-page"
                            >
                                <Plus size={13} />
                            </button>
                            <button
                                className="delete-page-btn p-1"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Delete "${node.title || 'Untitled'}" and all its sub-pages?`)) {
                                        onDeletePage(node.id)
                                    }
                                }}
                                title="Delete page"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="flex flex-col">
                        {node.children.map(child => renderPageItem(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="workspace-info">
                    <div className="workspace-icon">Z</div>
                    <div className="workspace-details">
                        <h3>Zero-Space</h3>
                        <p>Personal Workspace</p>
                    </div>
                </div>
                <button
                    className="sidebar-toggle"
                    onClick={toggle}
                    title="Close sidebar"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="sidebar-search">
                <Search size={14} />
                <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                <button className="nav-item new-page-btn" onClick={() => onNewPage()}>
                    <Plus size={16} />
                    <span>New Page</span>
                </button>

                <div className="pages-list mt-2">
                    {filteredTree.length > 0 ? (
                        filteredTree.map((node) => renderPageItem(node))
                    ) : (
                        <div className="p-4 text-xs text-center text-zinc-500 dark:text-zinc-400 italic">
                            {searchQuery ? 'No results found' : 'No pages yet'}
                        </div>
                    )}
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" onClick={toggleDarkMode}>
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button className="nav-item">
                    <Settings size={16} />
                    <span>Settings</span>
                </button>
            </div>
        </aside>
    )
}

export default memo(Sidebar)
