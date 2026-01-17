export interface TocItem {
    id: string
    text: string
    level: number
}

export interface Page {
    id: string
    title: string
    icon: string
    content: string
    createdAt: number
    updatedAt: number
}
