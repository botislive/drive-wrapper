export interface DriveUploadConfig {
  apiKey: string;
  apiBaseUrl?: string;
}

export interface UploadOptions {
  file: File;
  onProgress?: (progress: number) => void;
}

export class DriveClient {
  private apiKey: string;
  private apiBaseUrl: string;

  constructor(config: DriveUploadConfig) {
    this.apiKey = config.apiKey;
    this.apiBaseUrl = config.apiBaseUrl || '';
  }

  async uploadFile({ file, onProgress }: UploadOptions): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    // Step 1: Request session URL from backend
    const sessionRes = await fetch(`${this.apiBaseUrl}/api/upload-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: file.name,
        mimeType: file.type || 'application/octet-stream'
      })
    });

    if (!sessionRes.ok) {
      const errData = await sessionRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to start upload session');
    }

    const { uploadUrl } = await sessionRes.json();

    if (!uploadUrl) {
      throw new Error('No upload URL returned from server');
    }

    // Step 2: Upload file directly to Google Drive
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let currentProgress = 0;
      
      xhr.open('PUT', uploadUrl);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          currentProgress = Math.round((event.loaded / event.total) * 100);
          onProgress(currentProgress);
        }
      };

      xhr.onload = () => {
        // Google resumable upload returns 200/201 on success
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Google Drive returned status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        // Handle potential CORS false positives at 100%
        if (currentProgress >= 100) {
          console.warn('Network error at 100% progress. Assuming success.');
          resolve();
        } else {
          reject(new Error('Network error during upload'));
        }
      };

      xhr.send(file);
    });
  }
}
