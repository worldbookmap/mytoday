"use client"

import { useRef, useState } from "react"
import { ImagePlusIcon, Loader2Icon, MapPinIcon, MapPinOffIcon, SendIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { supabase, PHOTO_BUCKET } from "@/lib/supabase"
import { currentPosition, shrinkImage } from "@/lib/image"
import type { Fragment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function FragmentComposer({
  userId,
  day,
  onSaved,
}: {
  userId: string
  day: string
  onSaved: (fragment: Fragment) => void
}) {
  const [text, setText] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [withLocation, setWithLocation] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function pickPhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview)
    setPhoto(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  async function save() {
    const content = text.trim()
    if ((!content && !photo) || saving) return
    setSaving(true)
    try {
      const [coords, imagePath] = await Promise.all([
        withLocation ? currentPosition() : Promise.resolve(null),
        photo ? uploadPhoto(userId, photo) : Promise.resolve(null),
      ])
      const { data, error } = await supabase
        .from("fragments")
        .insert({
          day,
          content: content || null,
          image_path: imagePath,
          lat: coords?.latitude ?? null,
          lng: coords?.longitude ?? null,
        })
        .select()
        .single()
      if (error) throw error
      setText("")
      pickPhoto(null)
      onSaved(data as Fragment)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장하지 못했어요")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-3 shadow-xs">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            save()
          }
        }}
        placeholder="지금 떠오른 단어나 한두 문장…"
        rows={2}
        className="min-h-14 resize-none border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      {preview && (
        <div className="relative mt-2 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
          <img src={preview} alt="" className="h-24 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => pickPhoto(null)}
            className="absolute -top-2 -right-2 rounded-full bg-foreground p-1 text-background"
            aria-label="사진 빼기"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      )}
      <div className="mt-2 flex items-center gap-1">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
        />
        <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} aria-label="사진 추가">
          <ImagePlusIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWithLocation((v) => !v)}
          aria-label={withLocation ? "위치 기록 끄기" : "위치 기록 켜기"}
          aria-pressed={withLocation}
          className={withLocation ? "text-foreground" : "text-muted-foreground"}
        >
          {withLocation ? <MapPinIcon /> : <MapPinOffIcon />}
        </Button>
        <Button className="ml-auto" onClick={save} disabled={saving || (!text.trim() && !photo)}>
          {saving ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
          남기기
        </Button>
      </div>
    </div>
  )
}

async function uploadPhoto(userId: string, file: File): Promise<string> {
  const blob = await shrinkImage(file)
  const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "img")
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: blob.type || file.type })
  if (error) throw error
  return path
}
