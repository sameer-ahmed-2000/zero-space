import { googleLogout, useGoogleLogin } from '@react-oauth/google'
import { Editor } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Page, SyncStatus } from '../types'
import { debounce } from '../utils/debounce'
import * as GoogleDrive from '../utils/googleDrive'
import { workerManager } from '../utils/workerManager'

interface UseDriveSyncConfig {
    pages: Page[]
    setPages: React.Dispatch<React.SetStateAction<Page[]>>
    setCurrentPageId: React.Dispatch<React.SetStateAction<string>>
    createInitialPage: () => void
    editor: Editor | null
}

export function useDriveSync({
    pages,
    setPages,
    setCurrentPageId,
    createInitialPage,
    editor
}: UseDriveSyncConfig) {
    const [isSignedIn, setIsSignedIn] = useState(false)
    const [driveFileId, setDriveFileId] = useState<string | null>(null)
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
    const [userEmail, setUserEmail] = useState<string>('')
    const [gapiInitialized, setGapiInitialized] = useState(false)

    // Store pages in ref to access fresh value in closures without re-creating login function
    const pagesRef = useRef(pages)
    useEffect(() => {
        pagesRef.current = pages
    }, [pages])

    // Initialize Google Drive API (Client ID Check)
    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

        if (!clientId) {
            console.warn('⚠️ Google Client ID not configured. Drive sync will not be available.')
            return
        }

        if (clientId.startsWith('GOCSPX-')) {
            console.error('❌ INVALID CREDENTIAL DETECTED!')
            console.error('You provided a Client Secret (GOCSPX-...) instead of a Client ID')
            console.error('Client ID should look like: 123456789-abc.apps.googleusercontent.com')

            setGapiInitialized(true)
            setSyncStatus('error')

            alert(
                '⚠️ GOOGLE DRIVE CONFIGURATION ERROR\n\n' +
                'You entered a Client Secret instead of a Client ID!\n\n' +
                'Please check the console for instructions.'
            )
            return
        }

        const initGapi = async () => {
            try {
                await GoogleDrive.initializeGapiClient()
                setGapiInitialized(true)
            } catch (error) {
                console.error('❌ Failed to initialize Google Drive API:', error)
                setGapiInitialized(true)
                setSyncStatus('error')
            }
        }
        initGapi()
    }, [])

    const initializeDriveFile = async (accessToken: string) => {
        try {
            // Search for existing file
            const existingFile = await GoogleDrive.searchDriveFile()

            if (existingFile) {
                // File found - download and load content
                setDriveFileId(existingFile.id)

                const content = await GoogleDrive.downloadDriveFileContent(existingFile.id)
                const loadedPages: Page[] = JSON.parse(content)

                // Safety: Clear editor before loading new user's data
                if (editor) {
                    editor.commands.clearContent()
                }

                setPages(loadedPages)

                if (loadedPages.length > 0) {
                    setCurrentPageId(loadedPages[0].id)
                }

                setSyncStatus('synced')
                setTimeout(() => setSyncStatus('idle'), 2000)
            } else {
                // No file found - create new one with current pages
                const currentPages = pagesRef.current
                const initialContent = JSON.stringify(currentPages)
                const newFileId = await GoogleDrive.createDriveFile(initialContent)
                setDriveFileId(newFileId)

                setSyncStatus('synced')
                setTimeout(() => setSyncStatus('idle'), 2000)
            }
        } catch (error) {
            console.error('Failed to initialize Drive file:', error)
            setSyncStatus('error')
        }
    }

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('✅ Google login successful')
            try {
                GoogleDrive.setGapiAccessToken(tokenResponse.access_token)
                const email = await GoogleDrive.getCurrentUserEmail(tokenResponse.access_token)
                setUserEmail(email)
                setIsSignedIn(true)
                await initializeDriveFile(tokenResponse.access_token)
            } catch (error) {
                console.error('Error after Google login:', error)
                setSyncStatus('error')
                alert('Signed in successfully, but failed to initialize Drive. Please try again.')
            }
        },
        onError: (error) => {
            console.error('❌ Google login failed:', error)
            setSyncStatus('error')
            alert('Failed to sign in to Google Drive. Please try again.')
        },
        scope: GoogleDrive.DRIVE_API_SCOPE,
    })

    const handleConnectDrive = async () => {
        if (!isSignedIn) {
            if (!gapiInitialized) {
                alert('Google Drive is still loading. Please wait a moment and try again.')
                return
            }
            login()
        } else {
            googleLogout()
            GoogleDrive.clearAccessToken()
            setIsSignedIn(false)
            setUserEmail('')
            setDriveFileId(null)
            setSyncStatus('idle')
            if (editor) editor.commands.clearContent()
            createInitialPage()
        }
    }

    const syncPages = useCallback(
        debounce(async (pagesToSync: Page[]) => {
            if (!isSignedIn || !driveFileId) {
                console.log('Skipping sync: Not signed in or no file ID', { isSignedIn, driveFileId })
                return
            }

            console.log('Triggering Drive Sync...')
            setSyncStatus('saving')

            try {
                const contentString = await workerManager.stringifyContent(pagesToSync)

                let attempts = 0
                const maxAttempts = 3
                let lastError: Error | null = null

                while (attempts < maxAttempts) {
                    try {
                        await GoogleDrive.updateDriveFileContent(driveFileId, contentString)
                        setSyncStatus('synced')
                        setTimeout(() => {
                            setSyncStatus('idle')
                        }, 2000)
                        return
                    } catch (error) {
                        lastError = error as Error
                        attempts++
                        if (attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)))
                        }
                    }
                }
                throw lastError
            } catch (error) {
                console.error('Failed to sync to Drive:', error)
                setSyncStatus('error')
                setTimeout(() => {
                    setSyncStatus('idle')
                }, 5000)
            }
        }, 2000),
        [isSignedIn, driveFileId]
    )

    return {
        isSignedIn,
        syncStatus,
        userEmail,
        gapiInitialized,
        handleConnectDrive,
        syncPages,
    }
}
