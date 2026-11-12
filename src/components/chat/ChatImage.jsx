import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ImageOff } from "lucide-react";

// Foto chat disimpan privat: file_uri diubah jadi signed URL singkat saat
// pesan tampil, dan bisa diketuk untuk dilihat lebih besar.
export default function ChatImage({ fileUri }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 3600 })
      .then((r) => {
        if (active) setUrl(r.signed_url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [fileUri]);

  if (failed) {
    return (
      <div className="w-40 h-28 rounded-xl bg-black/10 flex items-center justify-center text-muted-foreground">
        <ImageOff className="w-5 h-5" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="w-40 h-28 rounded-xl bg-black/10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin opacity-60" />
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block">
        <Image src={url} alt="Foto chat" className="w-40 h-28 rounded-xl object-cover" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-2">
          <DialogTitle className="sr-only">Foto</DialogTitle>
          <Image src={url} alt="Foto chat" className="w-full" fittingType="fit" />
        </DialogContent>
      </Dialog>
    </>
  );
}