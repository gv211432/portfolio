export type InvoiceStatus = "DRAFT" | "FINALIZED" | "SENT" | "PENDING_SIGNATURE" | "SIGNED" | "VOID";

export interface LineItem {
  id?: string;
  dateLabel: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  sortOrder: number;
}

export interface PaymentInfo {
  accountName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  swiftCode?: string | null;
  branch?: string | null;
  upiId?: string | null;
  paypalOther?: string | null;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  isLocked?: boolean;
  currentVersion?: number;
  clientName: string;
  clientEmail?: string | null;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  total: string | number;
  pdfS3Key?: string | null;
  pdfGeneratedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

export interface InvoiceVersion {
  id: string;
  version: number;
  pdfS3Key: string;
  generatedAt: string;
}

export interface InvoiceFull extends InvoiceListItem {
  isLocked: boolean;
  currentVersion: number;
  clientId?: string | null;
  clientAddress?: string | null;
  paymentTerms: string;
  subtotal: string | number;
  adjustment: string | number;
  gstEnabled: boolean;
  gstRate?: string | number | null;
  gstAmount?: string | number | null;
  paymentProfileId?: string | null;
  paymentProfile?: { id: string; label: string; currency: string } | null;
  paymentInfoSnapshot?: PaymentInfo | null;
  companySnapshot?: Record<string, string> | null;
  notes?: string | null;
  items: LineItem[];
  emailLogs: EmailLog[];
  signatureLog?: SignatureLog | null;
}

export interface EmailLog {
  id: string;
  toEmail: string;
  toName?: string | null;
  subject: string;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt?: string | null;
  createdAt: string;
}

export interface SignatureLog {
  id: string;
  status: "INITIATED" | "SENT" | "SIGNED" | "FAILED";
  signingUrl?: string | null;
  initiatedAt: string;
  completedAt?: string | null;
}

export interface InvoiceClient {
  id: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  defaultCurrency: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PaymentProfile {
  id: string;
  label: string;
  isDefault: boolean;
  currency: string;
  branch?: string | null;
  accountName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  swiftCode?: string | null;
  upiId?: string | null;
  paypalOther?: string | null;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  address: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
}

export const CURRENCIES = ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "SGD", "AED"];

export const STATUS_META: Record<InvoiceStatus, { label: string; color: string }> = {
  DRAFT:             { label: "Draft",             color: "bg-slate-500" },
  FINALIZED:         { label: "Finalized",         color: "bg-blue-600" },
  SENT:              { label: "Sent",              color: "bg-indigo-600" },
  PENDING_SIGNATURE: { label: "Awaiting Signature", color: "bg-yellow-500" },
  SIGNED:            { label: "Signed",            color: "bg-green-600" },
  VOID:              { label: "Void",              color: "bg-red-600" },
};

export function fmtMoney(amount: number | string, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
