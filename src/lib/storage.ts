export function compressImage(file: File, maxBytes = 520_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("ย่อรูปไม่สำเร็จ"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.82;
        let data = canvas.toDataURL("image/jpeg", quality);
        while (data.length > maxBytes && quality > 0.4) {
          quality -= 0.12;
          data = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(data);
      };
      img.onerror = () => reject(new Error("ไฟล์รูปไม่ถูกต้อง"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
