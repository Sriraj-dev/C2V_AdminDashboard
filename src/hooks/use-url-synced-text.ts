"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Text input state for a value that lives in the URL. Typing is committed (trimmed) after `delayMs`.
 * URL values this hook pushed itself are echoes and never reset the text, even when an older echo
 * arrives after a newer push; any other URL value (back button, a link) replaces the text.
 */
export function useUrlSyncedText(value: string, onCommit: (v: string) => void, delayMs = 300) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  // Values pushed and not yet echoed back, oldest first. The last one is what the URL will end up with.
  // Accepted edge cases: an outside URL change equal to a still-pending push counts as our echo (the text
  // already shows a newer value), and a push the server never echoes stays listed until a later echo drops it.
  const [pushed, setPushed] = useState<string[]>([value]);
  if (value !== seen) {
    setSeen(value);
    const at = pushed.indexOf(value);
    if (at >= 0) {
      setPushed(pushed.slice(at));
    } else {
      setPushed([value]);
      setText(value);
    }
  }
  const last = pushed[pushed.length - 1];

  const commit = useRef(onCommit);
  useEffect(() => {
    commit.current = onCommit;
  });

  useEffect(() => {
    const next = text.trim();
    if (next === last) return;
    const t = setTimeout(() => {
      setPushed((p) => [...p, next]);
      commit.current(next);
    }, delayMs);
    return () => clearTimeout(t);
  }, [text, last, delayMs]);

  return [text, setText] as const;
}
