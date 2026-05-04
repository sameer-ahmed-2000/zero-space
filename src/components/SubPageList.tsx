
import React, { useMemo } from 'react'
import { FileText, Plus } from 'lucide-react'
import { Page } from '../types'

interface SubPageListProps {
    pages: Page[]
    currentPageId: string
    onPageSelect: (pageId: string) => void
    onNewPage: (parentId: string) => void
}

export default function SubPageList({ pages, currentPageId, onPageSelect, onNewPage }: SubPageListProps) {
    const subPages = useMemo(() => {
        return pages.filter(p => p.parentId === currentPageId)
    }, [pages, currentPageId])

    return (
        <div className="sub-page-list-wrapper mt-8 mb-12">
            {subPages.length === 0 ? (
                <button 
                    onClick={() => onNewPage(currentPageId)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-blue-500 dark:text-zinc-500 dark:hover:text-blue-400 transition-colors group opacity-0 hover:opacity-100"
                >
                    <Plus size={14} />
                    <span>Add a sub-page</span>
                </button>
            ) : (
                <div className="flex flex-col gap-1">
                    {subPages.map(page => (
                        <button 
                            key={page.id}
                            onClick={() => onPageSelect(page.id)}
                            className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 group transition-all duration-150 w-fit"
                        >
                            <div className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                                <FileText size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-[16px] font-semibold text-zinc-700 dark:text-zinc-300 border-b border-transparent group-hover:border-zinc-400 dark:group-hover:border-zinc-500 transition-all">
                                {page.title || 'Untitled'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
