import JSZip from 'jszip';

export const OFFICIAL_APK_INFO = {
  fileName: 'Musa_Mobile_Repairing_Center.apk',
  version: 'v2.0.3',
  sizeBytes: 4018419,
  sizeMB: '3.83 MB',
  packageId: 'com.musamobile.repairing',
  minSdk: 'Android 7.0 (API 24)',
  targetSdk: 'Android 15 (API 35)',
  signature: 'Digitally Signed (Permanent RSA 2048-bit v2 + v3)',
  localDownloadPath: '/Musa_Mobile_Repairing_Center.apk',
  directReleaseUrl:
    'https://github.com/citymobile81-lgtm/Musa-Mobile-apk/releases/download/v2.0.3/Musa_Mobile_Repairing_Center.apk',
};

/**
 * Service to generate and download the genuine Android APK package file
 * for Musa Mobile Repairing Center (Musa_Mobile_Repairing_Center.apk - 3.83 MB)
 */
export const generateAndDownloadApk = async (): Promise<{
  success: boolean;
  message: string;
  fileName: string;
  sizeMB: string;
}> => {
  const fileName = OFFICIAL_APK_INFO.fileName;
  const sizeMB = OFFICIAL_APK_INFO.sizeMB;

  try {
    // 1. Try directly downloading the compiled 3.83 MB release APK from local or CDN
    const candidateUrls = [
      OFFICIAL_APK_INFO.localDownloadPath,
      '/musa-mobile.apk',
      OFFICIAL_APK_INFO.directReleaseUrl,
    ];

    for (const testUrl of candidateUrls) {
      try {
        const resp = await fetch(testUrl);
        if (resp.ok) {
          const blob = await resp.blob();
          if (blob.size > 100000) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            return {
              success: true,
              message: `اصل اینڈرائیڈ APK (${sizeMB}) کامیابی سے ڈاؤن لوڈ ہو گئی ہے! اپنے موبائل میں اوپن کر کے انسٹال کریں۔`,
              fileName,
              sizeMB,
            };
          }
        }
      } catch (err) {
        console.warn(`URL fetch failed for ${testUrl}:`, err);
      }
    }

    // 2. Direct browser trigger to the verified GitHub Releases direct download URL
    const link = document.createElement('a');
    link.href = OFFICIAL_APK_INFO.directReleaseUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      message: `اینڈرائیڈ APK (${sizeMB}) کا براہِ راست ڈاؤن لوڈ شروع ہو گیا ہے!`,
      fileName,
      sizeMB,
    };
  } catch (err: unknown) {
    console.error('APK download error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg || 'Failed to download APK package',
      fileName,
      sizeMB,
    };
  }
};
