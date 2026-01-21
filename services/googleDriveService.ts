
// NOTE: You must obtain a Client ID from Google Cloud Console (https://console.cloud.google.com)
// Enable "Google Drive API" and "Google People API" (or just use userInfo endpoint).
// Create an OAuth 2.0 Client ID for a Web Application.
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

export interface GoogleUser {
    name: string;
    picture: string;
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let accessToken: string | null = null;
let currentUser: GoogleUser | null = null;
const folderCache = new Map<string, string>();

const authListeners: ((isAuth: boolean) => void)[] = [];

const notifyAuthListeners = () => {
    const isAuth = isAuthenticated();
    authListeners.forEach(l => l(isAuth));
};

export const subscribeToAuthStatus = (listener: (isAuth: boolean) => void) => {
    authListeners.push(listener);
    listener(isAuthenticated()); // Emit current state immediately
    return () => {
        const index = authListeners.indexOf(listener);
        if (index > -1) authListeners.splice(index, 1);
    };
};

export const getCurrentUser = (): GoogleUser | null => {
    return currentUser;
};

const fetchUserProfile = async (token: string) => {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            currentUser = {
                name: data.name,
                picture: data.picture
            };
        } else {
            // If token is invalid (e.g. expired), sign out
            if (response.status === 401) {
                signOutDrive();
            }
        }
    } catch (e) {
        console.error("Failed to fetch user profile", e);
    }
};

export const initGoogleDrive = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const checkGapi = () => {
      if ((window as any).gapi) {
        (window as any).gapi.load('client', async () => {
          await (window as any).gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          gapiInited = true;
          if (gisInited) finishInit();
        });
      } else {
        setTimeout(checkGapi, 100);
      }
    };

    const checkGis = () => {
      if ((window as any).google) {
        tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: async (resp: any) => {
            if (resp.error !== undefined) {
              throw (resp);
            }
            accessToken = resp.access_token;
            localStorage.setItem('drive_access_token', accessToken!);
            await fetchUserProfile(accessToken!);
            notifyAuthListeners();
          },
        });
        gisInited = true;
        if (gapiInited) finishInit();
      } else {
        setTimeout(checkGis, 100);
      }
    };

    const finishInit = async () => {
        // Check for existing token
        const storedToken = localStorage.getItem('drive_access_token');
        if (storedToken) {
            accessToken = storedToken;
            await fetchUserProfile(storedToken);
            notifyAuthListeners();
        }
        resolve(true);
    };

    checkGapi();
    checkGis();
  });
};

export const signInToDrive = () => {
  if (tokenClient) {
    if ((window as any).gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      tokenClient.requestAccessToken({prompt: ''});
    }
  }
};

export const signOutDrive = () => {
    accessToken = null;
    currentUser = null;
    folderCache.clear(); // Clear the cache on sign out
    localStorage.removeItem('drive_access_token');
    if ((window as any).gapi && (window as any).gapi.client) {
        (window as any).gapi.client.setToken(null);
    }
    notifyAuthListeners();
};

export const isAuthenticated = () => {
    return !!accessToken;
}

// Helper to find or create a folder
export const getOrCreateFolder = async (folderName: string, parentId: string = 'root'): Promise<string> => {
  const cacheKey = `${parentId}/${folderName}`;
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!;
  }

  try {
    const safeFolderName = folderName.replace(/'/g, "\\'");
    const q = `mimeType='application/vnd.google-apps.folder' and name='${safeFolderName}' and '${parentId}' in parents and trash=false`;
    const response = await (window as any).gapi.client.drive.files.list({
      q: q,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    let folderId: string;
    if (response.result.files && response.result.files.length > 0) {
      folderId = response.result.files[0].id;
    } else {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      };
      const createResponse = await (window as any).gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });
      folderId = createResponse.result.id;
    }

    folderCache.set(cacheKey, folderId);
    return folderId;
  } catch (e) {
    console.error("Error getting/creating folder", e);
    throw e;
  }
};

export const uploadToDrive = async (filename: string, content: string, path: string): Promise<string> => {
    if (!isAuthenticated()) throw new Error("Not Authenticated");

    // Ensure folder structure: Gemini_API_Data / YYYY / MM / DD / RoadName
    const parts = path.split('/').filter(p => p);
    let parentId = 'root';

    for (const part of parts) {
        parentId = await getOrCreateFolder(part, parentId);
    }

    const fileMetadata = {
      name: filename,
      parents: [parentId],
    };

    // Multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const contentType = 'application/json';
    
    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(fileMetadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        content +
        close_delim;

    const request = (window as any).gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody});

    const result = await request;
    return result.result.id;
};
