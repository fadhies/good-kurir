// Kompres & resize gambar sebelum diunggah agar hemat kuota & cepat.
// Maksimum lebar 1080px, kualitas 75%, output JPEG. Mengembalikan File.
// Jika file bukan gambar atau sudah lebih kecil dari maxWidth, dikembalikan apa adanya.
export async function compressImage(file, maxWidth = 1080, quality = 0.75) {
  if (!file || !file.type || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width <= maxWidth) return file;
    const scale = maxWidth / bitmap.width;
    const canvas = document.createElement("canvas");
    canvas.width = maxWidth;
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}