import { Warehouse, MapPin, Building2, FileCheck } from "lucide-react";

export const ADDRESS_FIELDS = [
  { key: "name", label: "Company / Name", span: 1 },
  { key: "contact_name", label: "Contact Name", span: 1 },
  { key: "address", label: "Street Address", span: "full" },
  { key: "city", label: "City", span: 1 },
  { key: "district", label: "District", span: 1 },
  { key: "state", label: "State", span: 1 },
  { key: "zip", label: "ZIP / Postal Code", span: 1 },
  { key: "country", label: "Country", span: 1 },
  { key: "phone", label: "Phone", span: 1 },
  { key: "email", label: "Email", span: 1 },
  { key: "contact_phone", label: "Contact Phone", span: 1 },
  { key: "extension_number", label: "Extension", span: 1 },
  { key: "eori_number", label: "EORI Number", span: 1 },
] as const;

export type AddressType = "shipper" | "receiver" | "billing" | "ior";

export const ADDRESS_TYPE_CONFIG: Record<
  AddressType,
  {
    label: string;
    icon: typeof Warehouse;
    iconBg: string;
    iconColor: string;
    ringColor: string;
  }
> = {
  shipper: {
    label: "Shipper",
    icon: Warehouse,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    ringColor: "ring-blue-500/20 border-blue-500/30",
  },
  receiver: {
    label: "Receiver",
    icon: MapPin,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-600 dark:text-green-400",
    ringColor: "ring-green-500/20 border-green-500/30",
  },
  billing: {
    label: "Billing",
    icon: Building2,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    ringColor: "ring-violet-500/20 border-violet-500/30",
  },
  ior: {
    label: "Importer of Record",
    icon: FileCheck,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600 dark:text-teal-400",
    ringColor: "ring-teal-500/20 border-teal-500/30",
  },
};
