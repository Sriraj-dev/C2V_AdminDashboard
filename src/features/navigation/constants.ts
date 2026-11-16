import {
  Truck,
  ClipboardList,
  RotateCcw,
  MessageSquare,
  Users,
  Package,
  MapPin,
  Contact,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  primary: boolean;
  badge?: "refunds" | "chats";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Deliveries", icon: Truck, primary: true },
  { href: "/orders", label: "Orders", icon: ClipboardList, primary: true },
  { href: "/refunds", label: "Refunds", icon: RotateCcw, primary: true, badge: "refunds" },
  { href: "/chats", label: "Chats", icon: MessageSquare, primary: true, badge: "chats" },
  { href: "/partners", label: "Partners", icon: Users, primary: false },
  { href: "/products", label: "Products", icon: Package, primary: false },
  { href: "/pincodes", label: "Pincodes", icon: MapPin, primary: false },
  { href: "/customers", label: "Customers", icon: Contact, primary: false },
  { href: "/settings", label: "Settings", icon: Settings, primary: false },
];
