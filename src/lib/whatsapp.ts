/** wa.me click-to-chat link. `phone` is digits only, e.g. 919800000002. */
export function waShareUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
