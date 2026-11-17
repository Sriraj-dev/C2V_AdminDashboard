import { whatsappSpans } from "../message-view";

/** WhatsApp text with *bold* and _italic_ drawn as <strong>/<em>. React escapes every run. */
export function WaText({ text }: { text: string }) {
  return whatsappSpans(text).map((s, i) =>
    s.bold ? <strong key={i}>{s.text}</strong> : s.italic ? <em key={i}>{s.text}</em> : s.text,
  );
}
