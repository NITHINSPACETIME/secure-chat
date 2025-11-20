/**
 * MOCK SERVICES
 *
 * These functions simulate external API calls (File Storage, AI Analysis)
 * for local development purposes.
 *
 * TODO: Integrate with AWS S3 and OpenAI API in production environment.
 */
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
