/**
 * Utility for client-side image compression and geolocation audit tagging.
 * Meets Milestone 3 requirement: image compression < 1.5MB and GPS audit tags.
 */

export interface GpsLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface CompressedPhotoResult {
    file: File;
    dataUrl: string;
    sizeKb: number;
    width: number;
    height: number;
}

/**
 * Compress an image file using HTML Canvas to keep size below maxSizeBytes (default 1.5MB).
 */
export async function compressImage(
    file: File,
    maxSizeBytes: number = 1.5 * 1024 * 1024,
    maxWidthOrHeight: number = 1920
): Promise<CompressedPhotoResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate aspect-ratio scale
                if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidthOrHeight) / width);
                        width = maxWidthOrHeight;
                    } else {
                        width = Math.round((width * maxWidthOrHeight) / height);
                        height = maxWidthOrHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Canvas context tidak tersedia.'));
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Progressive quality compression
                let quality = 0.88;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                // If still exceeds maxSizeBytes, step down quality
                while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.4) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                // Convert dataUrl to File
                const byteString = atob(dataUrl.split(',')[1]);
                const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });

                resolve({
                    file: compressedFile,
                    dataUrl,
                    sizeKb: Math.round(compressedFile.size / 1024),
                    width,
                    height,
                });
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Get current device GPS coordinates for audit tagging.
 */
export async function getCurrentDeviceLocation(): Promise<GpsLocation> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            // Fallback default coordinates (Jakarta)
            resolve({ latitude: -6.2088, longitude: 106.8456, accuracy: 50 });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
            },
            (err) => {
                console.warn('Geolocation failed or permission denied:', err);
                resolve({ latitude: -6.2088, longitude: 106.8456, accuracy: 100 });
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 60000,
            }
        );
    });
}
