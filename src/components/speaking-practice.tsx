"use client"

import { useEffect, useRef, useState } from "react"
import { MicIcon, SquareIcon, Trash2Icon, Volume2Icon } from "lucide-react"
import { formatTime } from "@/lib/day"
import type { SpeakingAttempt } from "@/lib/types"
import { Button } from "@/components/ui/button"

// The Web Speech API isn't in TypeScript's DOM lib yet.
type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

function createRecognition(): Recognition | null {
  const w = window as unknown as Record<string, (new () => Recognition) | undefined>
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function speak(text: string) {
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = "en-US"
  u.rate = 0.95
  speechSynthesis.speak(u)
}

export function SpeakingPractice({
  script,
  attempts,
  onAttempt,
  onRemove,
}: {
  /** The English text the user is practicing, read aloud on request. */
  script: string
  attempts: SpeakingAttempt[]
  onAttempt: (attempt: SpeakingAttempt) => void
  onRemove: (index: number) => void
}) {
  const [supported, setSupported] = useState(true)
  const [listening, setListening] = useState(false)
  const [finalText, setFinalText] = useState("")
  const [interim, setInterim] = useState("")
  const recRef = useRef<Recognition | null>(null)
  const finalRef = useRef("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection needs window
    setSupported(createRecognition() !== null)
    return () => recRef.current?.stop()
  }, [])

  function start() {
    const rec = createRecognition()
    if (!rec) return
    rec.lang = "en-US"
    rec.continuous = true
    rec.interimResults = true
    finalRef.current = ""
    setFinalText("")
    setInterim("")
    rec.onresult = (e) => {
      let live = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalRef.current += r[0].transcript + " "
        else live += r[0].transcript
      }
      setFinalText(finalRef.current)
      setInterim(live)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => {
      setListening(false)
      setInterim("")
      const text = finalRef.current.trim()
      if (text) onAttempt({ text, at: new Date().toISOString() })
    }
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {supported ? (
          listening ? (
            <Button variant="destructive" onClick={() => recRef.current?.stop()}>
              <SquareIcon /> 그만 말하기
            </Button>
          ) : (
            <Button onClick={start}>
              <MicIcon /> 영어로 말해보기
            </Button>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            이 브라우저는 음성 인식을 지원하지 않아요. Chrome이나 Safari에서 열어주세요.
          </p>
        )}
        <Button variant="outline" onClick={() => speak(script)} disabled={!script.trim()}>
          <Volume2Icon /> 영어 글 들어보기
        </Button>
      </div>

      {listening && (
        <p className="min-h-12 rounded-xl bg-muted p-3 text-sm" aria-live="polite">
          {finalText}
          <span className="text-muted-foreground">{interim}</span>
          {!finalText && !interim && <span className="text-muted-foreground">듣고 있어요…</span>}
        </p>
      )}

      {attempts.length > 0 && (
        <ul className="space-y-2">
          {attempts.map((a, i) => (
            <li key={a.at} className="flex items-start gap-2 rounded-xl border p-3 text-sm">
              <div className="flex-1 space-y-1">
                <time className="text-xs text-muted-foreground">{formatTime(a.at)}</time>
                <p>{a.text}</p>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => speak(a.text)} aria-label="들어보기">
                <Volume2Icon />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => onRemove(i)} aria-label="삭제">
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
