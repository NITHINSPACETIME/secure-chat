/**
 * MOCK SERVICES
 *
 * So These functions simulate external API calls (Like File Storage, AI Analysis bla bla)
 * for local development purposes.
 *
 * TODO: Integrate with AWS S3 and OpenAI API (i dont like openAI though) in production environment.
 */
/**
 * Okay so guys this just Simulates uploading encrypted binary data to cloud storage.
 * In a real app, this would upload 'data' to Firebase Storage / AWS S3 or other server
 * and return the public download Nyx URL.
 */

export async function uploadEncryptedFile(
  data: Uint8Array,
  mimeType: string
): Promise<string> {
  return new Promise((resolve) => {
    const blob = new Blob([data as any], { type: "application/octet-stream" });
    const mockUrl = URL.createObjectURL(blob);

    setTimeout(() => {
      resolve(mockUrl);
    }, 1000);
  });
}

export async function fileToUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(new Uint8Array(e.target.result as ArrayBuffer));
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export async function uploadFile({
  file,
}: {
  file: File;
}): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ url: reader.result as string });
    reader.onerror = (error) => reject(error);
  });
}

export async function analyzeImage({
  imageUrl,
  prompt,
}: any): Promise<{ analysis: any }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        analysis: {
          id: "user_" + Math.random().toString(36).substr(2, 9),
          name: "Scanned User",
          publicKey: "demo_key_" + Math.random().toString(36).substr(2, 9),
        },
      });
    }, 1500);
  });
}

export async function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
