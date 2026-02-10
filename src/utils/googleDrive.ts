// Google Drive integration using Google Identity Services (GIS)
// This uses the modern @react-oauth/google package instead of deprecated gapi.auth2

export const DRIVE_API_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const DRIVE_FILE_NAME = 'zero_space_db.json'

export interface DriveFile {
    id: string
    name: string
}

// Store access token
let accessToken: string | null = null

// Load the Google API client library (for Drive API calls)
export const loadGapiClient = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if ((window as any).gapi) {
            resolve()
            return
        }

        const script = document.createElement('script')
        script.src = 'https://apis.google.com/js/api.js'
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Google API script'))
        document.body.appendChild(script)
    })
}

// Initialize gapi client for Drive API
export const initializeGapiClient = async (): Promise<void> => {
    console.log('🔍 Initializing Google Drive API client...')

    await loadGapiClient()

    return new Promise((resolve, reject) => {
        (window as any).gapi.load('client', async () => {
            try {
                await (window as any).gapi.client.init({
                    apiKey: '', // Not needed for OAuth
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                })
                console.log('✅ Drive API client initialized')
                resolve()
            } catch (error) {
                console.error('❌ Failed to initialize Drive API client:', error)
                reject(error)
            }
        })
    })
}

//Set the access token for gapi client
export const setGapiAccessToken = (token: string) => {
    accessToken = token
    // Also set it for gapi.client just in case, though we primarily use fetch now
    if ((window as any).gapi?.client) {
        (window as any).gapi.client.setToken({ access_token: token })
    }
}

// Get access token
export const getAccessToken = () => accessToken

// Clear access token
export const clearAccessToken = () => {
    accessToken = null
}

// Get current user email using the access token
export const getCurrentUserEmail = async (token: string): Promise<string> => {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const data = await response.json()
        return data.email || ''
    } catch (error) {
        console.error('Error getting user email:', error)
        return ''
    }
}

// Search for the zero_space_db.json file
export const searchDriveFile = async (): Promise<DriveFile | null> => {
    console.log('🚀 Using new Fetch-based searchDriveFile')
    if (!accessToken) {
        throw new Error('No access token available')
    }

    try {
        const query = `name='${DRIVE_FILE_NAME}' and trashed=false`
        const params = new URLSearchParams({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive'
        })

        const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            console.error('Drive API Error:', errorData)
            throw new Error(`Drive API query failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const files = data.files

        if (files && files.length > 0) {
            return files[0]
        }
        return null
    } catch (error) {
        console.error('Error searching for Drive file:', error)
        throw error
    }
}

// Create a new zero_space_db.json file
export const createDriveFile = async (initialContent: string): Promise<string> => {
    if (!accessToken) {
        throw new Error('No access token available')
    }

    try {
        const fileMetadata = {
            name: DRIVE_FILE_NAME,
            mimeType: 'application/json',
        }

        const form = new FormData()
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }))
        form.append('file', new Blob([initialContent], { type: 'application/json' }))

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({
                Authorization: `Bearer ${accessToken}`,
            }),
            body: form,
        })

        if (!response.ok) {
            throw new Error(`Failed to create file: ${response.statusText}`)
        }

        const result = await response.json()
        return result.id
    } catch (error) {
        console.error('Error creating Drive file:', error)
        throw error
    }
}

// Download file content from Drive
export const downloadDriveFileContent = async (fileId: string): Promise<string> => {
    if (!accessToken) {
        throw new Error('No access token available')
    }

    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`)
        }

        // Return the text content directly since it's a JSON string
        return await response.text()
    } catch (error) {
        console.error('Error download Drive file content:', error)
        throw error
    }
}

// Update file content in Drive
export const updateDriveFileContent = async (fileId: string, content: string): Promise<void> => {
    if (!accessToken) {
        throw new Error('No access token available')
    }

    console.log(`📤 Syncing to Drive File ID: ${fileId} (${content.length} bytes)...`)

    try {
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
            {
                method: 'PATCH',
                headers: new Headers({
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }),
                body: content,
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ Sync failed:', response.status, errorText)
            throw new Error(`Failed to update Drive file: ${response.statusText}`)
        }

        console.log('✅ Drive Sync Successful!')
    } catch (error) {
        console.error('Error updating Drive file content:', error)
        throw error
    }
}
