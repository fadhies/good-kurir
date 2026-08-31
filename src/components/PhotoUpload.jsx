import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Upload, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/compressImage";
import { useToast } from "@/components/ui/use-toast";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ label, value, onChange, hint, folder }) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const base64 = await fileToBase64(compressed);
      const res = await base44.functions.invoke("uploadPhoto", {
        base64,
        filename: compressed.name,
        contentType: compressed.type || "image/jpeg",
        folder,
      });
      if (res.data?.url) {
        onChange(res.data.url);
      } else {
        throw new Error(res.data?.error || "Gagal unggah");
      }
    } catch (err) {
      toast({ title: "Gagal unggah foto", description: err?.message || "Coba lagi", variant: "destructive" });
    } finally {
      setUploading(false);
      // reset so the same file can be re-picked after an error
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="text-sm font-semibold block mb-1.5">{label}</label>
      {value ? (
        <div className="relative">
          <div className="w-full aspect-square rounded-xl overflow-hidden border border-border bg-secondary">
            <Image src={value} fittingType="fit" className="w-full h-full" />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 w-full aspect-square rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 text-muted-foreground transition-colors">
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          <span className="text-sm font-medium">{uploading ? "Mengunggah..." : "Ketuk untuk unggah foto"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}