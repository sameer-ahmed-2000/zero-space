import { BookOpen, FileCode, StickyNote } from 'lucide-react'

interface EmptyStateProps {
    onCreatePage: () => void
    onCreateCode: () => void
    onCreateDoc: () => void
}

export default function EmptyState({ onCreatePage, onCreateCode, onCreateDoc }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center select-none pointer-events-none">
            <div className="max-w-md space-y-8 pointer-events-auto">
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
                        Start Creating
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Type <kbd className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-700 dark:text-gray-300 shadow-sm">/</kbd> for commands or start writing
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <button
                        onClick={onCreatePage}
                        className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <StickyNote size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Note</span>
                    </button>

                    <button
                        onClick={onCreateCode}
                        className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <FileCode size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Snippet</span>
                    </button>

                    <button
                        onClick={onCreateDoc}
                        className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Docs</span>
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 mx-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Recent</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md cursor-pointer transition-colors text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            JavaScript Arrays
                        </div>
                        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md cursor-pointer transition-colors text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            React Hooks Guide
                        </div>
                        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-md cursor-pointer transition-colors text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            System Design Notes
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
