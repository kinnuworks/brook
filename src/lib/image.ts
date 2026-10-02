// Photos are shrunk on the phone and re-encoded through a canvas, which drops
// every EXIF field, GPS position included, before anything leaves the device.

export interface PreparedPhoto {
  dataUrl: string;
  b64: string;
  width: number;
  height: number;
  bytes: number;
}

export async function preparePhoto(file: Blob, maxSide = 1024, quality = 0.82): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return { dataUrl, b64, width, height, bytes: Math.round((b64.length * 3) / 4) };
}

export async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}
