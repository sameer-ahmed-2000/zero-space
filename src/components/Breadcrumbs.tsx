
import React, { useMemo } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { Page } from '../types'

interface BreadcrumbsProps {
    pages: Page[]
    currentPageId: string
    onPageSelect: (pageId: string) => void
}

export default function Breadcrumbs({ pages, currentPageId, onPageSelect }: BreadcrumbsProps) {
    const breadcrumbs = useMemo(() => {
        const path: Page[] = []
        let current = pages.find(p => p.id === currentPageId)

        while (current) {
            path.unshift(current)
            if (current.parentId) {
                current = pages.find(p => p.id === current?.parentId)
            } else {
                current = undefined
            }
        }

        return path
    }, [pages, currentPageId])

    if (breadcrumbs.length <= 1 && !breadcrumbs[0]?.parentId) {
        return null
    }

    return (
        <nav className="breadcrumbs-nav no-scrollbar">
            <div className="breadcrumb-item">
                <button
                    onClick={() => onPageSelect(pages[0]?.id || '')}
                    className="breadcrumb-btn group"
                    title="Home"
                >
                    <Home size={14} />
                </button>
            </div>

            {breadcrumbs.map((page, index) => (
                <div key={page.id} className="breadcrumb-item">
                    <div className="breadcrumb-separator">
                        <ChevronRight size={14} />
                    </div>
                    <button
                        onClick={() => onPageSelect(page.id)}
                        className={`breadcrumb-btn ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                        title={page.title || 'Untitled'}
                    >
                        {page.title || 'Untitled'}
                    </button>
                </div>
            ))}
        </nav>
    )
}
