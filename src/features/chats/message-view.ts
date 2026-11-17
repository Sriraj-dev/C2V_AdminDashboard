import type { ChatMessage } from "@/lib/api/types";

export type MessageView =
  | { kind: "text"; body: string }
  | { kind: "interactive"; header?: string; body: string; footer?: string; options: string[] }
  | { kind: "reply"; title: string }
  | { kind: "form"; label: "Order form submitted" }
  | { kind: "image"; url?: string; caption?: string }
  | { kind: "template"; name: string; params: string[] }
  | { kind: "location"; mapUrl: string }
  | { kind: "fallback"; body: string };

type Obj = Record<string, unknown>;

function obj(v: unknown): Obj | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Obj) : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function strings(items: unknown[]): string[] {
  return items.map((i) => str(i)).filter((s): s is string => s !== undefined);
}

function interactiveView(i: Obj): MessageView | undefined {
  switch (i.type) {
    case "button_reply":
    case "list_reply": {
      const title = str(obj(i[i.type])?.title);
      return title ? { kind: "reply", title } : undefined;
    }
    case "nfm_reply":
      return { kind: "form", label: "Order form submitted" };
    case "button":
    case "list":
    case "flow":
    case "cta_url": {
      const body = str(obj(i.body)?.text);
      if (!body) return undefined;
      const action = obj(i.action);
      let options: string[] = [];
      if (i.type === "button") {
        options = strings(arr(action?.buttons).map((b) => obj(obj(b)?.reply)?.title));
      } else if (i.type === "list") {
        const rows = arr(action?.sections).flatMap((s) => arr(obj(s)?.rows).map((r) => obj(r)?.title));
        options = strings([action?.button, ...rows]);
      } else if (i.type === "flow") {
        options = strings([obj(action?.parameters)?.flow_cta]);
      } else {
        // A link button: show its label only; the dashboard never opens the link.
        options = strings([obj(action?.parameters)?.display_text]);
      }
      const header = str(obj(i.header)?.text);
      const footer = str(obj(i.footer)?.text);
      return { kind: "interactive", ...(header && { header }), body, ...(footer && { footer }), options };
    }
    default:
      return undefined;
  }
}

function drawn(p: Obj | undefined): MessageView | undefined {
  if (!p) return undefined;
  switch (p.type) {
    case "text": {
      const body = str(obj(p.text)?.body);
      return body ? { kind: "text", body } : undefined;
    }
    case "interactive": {
      const i = obj(p.interactive);
      return i ? interactiveView(i) : undefined;
    }
    case "button": {
      const title = str(obj(p.button)?.text);
      return title ? { kind: "reply", title } : undefined;
    }
    case "image": {
      const image = obj(p.image);
      if (!image) return undefined;
      const url = str(image.link);
      const caption = str(image.caption);
      return { kind: "image", ...(url && { url }), ...(caption && { caption }) };
    }
    case "template": {
      const t = obj(p.template);
      const name = str(t?.name);
      if (!name) return undefined;
      const body = arr(t?.components).map(obj).find((c) => c?.type === "body");
      const params = strings(arr(body?.parameters).map((x) => obj(x)?.text));
      return { kind: "template", name, params };
    }
    case "location": {
      const l = obj(p.location);
      if (typeof l?.latitude !== "number" || typeof l.longitude !== "number") return undefined;
      return { kind: "location", mapUrl: `https://maps.google.com/?q=${l.latitude},${l.longitude}` };
    }
    default:
      return undefined;
  }
}

/** Turns a stored WhatsApp message into something the thread can draw. Never throws. */
export function toMessageView(m: ChatMessage): MessageView {
  let view: MessageView | undefined;
  try {
    view = drawn(obj(m.payload));
  } catch {
    view = undefined;
  }
  return view ?? { kind: "fallback", body: m.text ?? `[${m.type}]` };
}

export type TextSpan = { text: string; bold?: true; italic?: true };

// WhatsApp marks *bold* and _italic_ at word edges, with no space just inside the markers, on one line.
const MARKUP = /(?<!\w)\*([^*\s](?:[^*\n]*[^*\s])?)\*(?!\w)|(?<!\w)_([^_\s](?:[^_\n]*[^_\s])?)_(?!\w)/g;

/** Splits WhatsApp text into plain, bold and italic runs (rendered as text nodes, never HTML). */
export function whatsappSpans(text: string): TextSpan[] {
  const spans: TextSpan[] = [];
  let at = 0;
  for (const m of text.matchAll(MARKUP)) {
    if (m.index > at) spans.push({ text: text.slice(at, m.index) });
    if (m[1] !== undefined) spans.push({ text: m[1], bold: true });
    else spans.push({ text: m[2] ?? "", italic: true });
    at = m.index + m[0].length;
  }
  if (at < text.length) spans.push({ text: text.slice(at) });
  return spans;
}
