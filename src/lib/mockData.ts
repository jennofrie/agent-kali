// Mock data for FormPilot demo

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  ndis: string;
  diagnosis: string;
  planExpiry: string;
  status: string;
}

export interface RealParticipant {
  id: string;
  name: string;
  initials: string;
  folderPath: string;
  folderName: string;
  subfolders: string[];
  fileCount: number;
  hasIntakeForm: boolean;
  hasServiceAgreement: boolean;
  hasCaseNotes: boolean;
  recentFiles: { name: string; path: string; modified: number }[];
  // These fields are populated later from RAG or manual entry
  ndis?: string;
  dob?: string;
  diagnosis?: string;
  phone?: string;
  email?: string;
  address?: string;
  planExpiry?: string;
  planManagement?: string;
  status?: string;
  color?: string;
}

export interface MockForm {
  id: string;
  title: string;
  participant: string;
  duration: string;
  thumbType: string;
  date: string;
  status: "done" | "review" | "progress" | "pending";
  pct: number;
}

export interface Template {
  id: string;
  name: string;
  provider: string;
  fields: number;
  type: string;
}

export interface Provider {
  id: string;
  name: string;
  service: string;
  location: string;
  capacity: string;
}

export interface Draft {
  id: string;
  participant: string;
  title: string;
  date: string;
  type: string;
}

export interface MockField {
  id: string;
  label: string;
  value: string;
  confidence: string;
  source: string;
  flagged?: boolean;
}

export interface OpenDoc {
  id: string;
  fileName: string;
  participant: string;
  pages: number;
  pct: number;
  status: "done" | "progress";
  filePath?: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

export const MOCK_PARTICIPANTS: Participant[] = [
  { id: "p1", name: "Marcus Chen", initials: "MC", color: "#8a64ff", ndis: "431 502 887", diagnosis: "Autism Spectrum Disorder, Level 2", planExpiry: "Mar 14, 2027", status: "active" },
  { id: "p2", name: "Aisha Okafor", initials: "AO", color: "#e74c8a", ndis: "612 408 119", diagnosis: "Cerebral Palsy, GMFCS III", planExpiry: "Aug 02, 2026", status: "active" },
  { id: "p3", name: "Liam Patterson", initials: "LP", color: "#34d399", ndis: "528 117 642", diagnosis: "Acquired Brain Injury", planExpiry: "Nov 22, 2026", status: "review" },
  { id: "p4", name: "Sofia Reyes", initials: "SR", color: "#60a5fa", ndis: "904 731 226", diagnosis: "Down Syndrome", planExpiry: "Jun 09, 2027", status: "active" },
  { id: "p5", name: "Noah Whitaker", initials: "NW", color: "#f6b73c", ndis: "317 845 502", diagnosis: "Intellectual Disability + Anxiety", planExpiry: "Jan 30, 2026", status: "warning" },
  { id: "p6", name: "Ivy Tanaka", initials: "IT", color: "#fb5168", ndis: "445 920 718", diagnosis: "Multiple Sclerosis", planExpiry: "Oct 16, 2026", status: "active" },
  { id: "p7", name: "Hassan Najafi", initials: "HN", color: "#a084ff", ndis: "771 339 405", diagnosis: "Spinal Cord Injury, T6", planExpiry: "Apr 03, 2027", status: "active" },
  { id: "p8", name: "Zara Mitchell", initials: "ZM", color: "#c4b5ff", ndis: "256 814 037", diagnosis: "ADHD + Dyslexia", planExpiry: "Dec 11, 2026", status: "active" },
];

export const MOCK_FORMS: MockForm[] = [
  { id: "f1", title: "Service Booking — Core Supports", participant: "Marcus Chen", duration: "12 fields", thumbType: "service", date: "Filled 2h ago", status: "done", pct: 100 },
  { id: "f2", title: "Plan Review Request 2026/27", participant: "Aisha Okafor", duration: "28 fields", thumbType: "review", date: "Filled 5h ago", status: "review", pct: 92 },
  { id: "f3", title: "Provider Travel Claim — Apr Wk2", participant: "Liam Patterson", duration: "8 fields", thumbType: "claim", date: "Updated yesterday", status: "progress", pct: 64 },
  { id: "f4", title: "Risk Assessment — Community Access", participant: "Sofia Reyes", duration: "16 fields", thumbType: "risk", date: "2 days ago", status: "pending", pct: 30 },
  { id: "f5", title: "Supported Independent Living Quote", participant: "Noah Whitaker", duration: "34 fields", thumbType: "sil", date: "3 days ago", status: "progress", pct: 71 },
  { id: "f6", title: "Behaviour Support Plan Cover Sheet", participant: "Ivy Tanaka", duration: "18 fields", thumbType: "bsp", date: "5 days ago", status: "done", pct: 100 },
];

export const MOCK_TEMPLATES: Template[] = [
  { id: "t1", name: "NDIS Service Agreement v3.2", provider: "NDIA", fields: 24, type: "agreement" },
  { id: "t2", name: "Support Coordination Monthly Report", provider: "Internal", fields: 17, type: "report" },
  { id: "t3", name: "Plan Review Submission Form", provider: "NDIA", fields: 38, type: "review" },
  { id: "t4", name: "Provider Travel Claim", provider: "Internal", fields: 9, type: "claim" },
  { id: "t5", name: "Risk Assessment — Community Access", provider: "SafeCare", fields: 22, type: "risk" },
  { id: "t6", name: "Behaviour Support Restrictive Practice", provider: "NDIS QSC", fields: 31, type: "behaviour" },
  { id: "t7", name: "SIL Quote Template 2026", provider: "Internal", fields: 41, type: "sil" },
  { id: "t8", name: "Incident Report — Reportable Form", provider: "NDIS QSC", fields: 19, type: "incident" },
];

export const MOCK_PROVIDERS: Provider[] = [
  { id: "pr1", name: "Hearthside Care Co-op", service: "SIL + Daily Living", location: "Brunswick VIC", capacity: "Open" },
  { id: "pr2", name: "Northern Reach Therapy", service: "Allied Health", location: "Preston VIC", capacity: "Wait 3w" },
  { id: "pr3", name: "Wallaby Transport", service: "Specialist Transport", location: "Footscray VIC", capacity: "Open" },
  { id: "pr4", name: "Bluegum Behaviour Support", service: "Positive Behaviour Support", location: "Coburg VIC", capacity: "Full" },
  { id: "pr5", name: "Tessellate OT", service: "Occupational Therapy", location: "Carlton VIC", capacity: "Open" },
  { id: "pr6", name: "Quokka Community Connect", service: "Capacity Building", location: "Northcote VIC", capacity: "Wait 1w" },
];

export const MOCK_DRAFTS: Draft[] = [
  { id: "d1", participant: "Marcus Chen", title: "Service Booking Confirmation", date: "Today, 14:22", type: "Service Booking" },
  { id: "d2", participant: "Aisha Okafor", title: "Plan Review Cover Letter — 2026/27", date: "Today, 09:15", type: "Plan Review" },
  { id: "d3", participant: "Liam Patterson", title: "Provider Travel Claim Summary", date: "Yesterday", type: "Claim" },
  { id: "d4", participant: "Sofia Reyes", title: "Risk Mitigation Notes — Community Access", date: "2 days ago", type: "Risk" },
  { id: "d5", participant: "Noah Whitaker", title: "SIL Quote Comparison Memo", date: "3 days ago", type: "Quote" },
];

export const MOCK_FIELDS: MockField[] = [
  { id: "fld1", label: "Participant Full Name", value: "Marcus Chen", confidence: "high", source: "Plan PDF, p.1" },
  { id: "fld2", label: "NDIS Number", value: "431 502 887", confidence: "high", source: "Plan PDF, p.1" },
  { id: "fld3", label: "Plan Start Date", value: "14/03/2026", confidence: "high", source: "Plan PDF, p.2" },
  { id: "fld4", label: "Plan End Date", value: "14/03/2027", confidence: "high", source: "Plan PDF, p.2" },
  { id: "fld5", label: "Core Supports Budget", value: "$ 38,420.00", confidence: "high", source: "Plan PDF, p.5" },
  { id: "fld6", label: "Nominated Plan Manager", value: "MyPlanCo (Self)", confidence: "med", source: "Email thread 2026-02-11" },
  { id: "fld7", label: "Service Start Date", value: "01/04/2026", confidence: "high", source: "Provider quote" },
  { id: "fld8", label: "Hourly Rate (Weekday)", value: "$ 67.56", confidence: "high", source: "NDIS Pricing 2026 \u00a73.1" },
  { id: "fld9", label: "Cancellation Notice (Hrs)", value: "", confidence: "low", source: "\u2014", flagged: true },
  { id: "fld10", label: "Termination Notice (Days)", value: "14", confidence: "med", source: "Provider T&C" },
  { id: "fld11", label: "Emergency Contact", value: "Dana Chen (Mother)", confidence: "high", source: "Intake form" },
  { id: "fld12", label: "Coordinator Signature Date", value: "", confidence: "low", source: "\u2014" },
];

export const MOCK_OPEN_DOCS: OpenDoc[] = [
  { id: "doc1", fileName: "ServiceBooking-MarcusChen.pdf", participant: "Marcus Chen", pages: 4, pct: 75, status: "progress" },
  { id: "doc2", fileName: "PlanReview-Okafor-2026.pdf", participant: "Aisha Okafor", pages: 12, pct: 30, status: "progress" },
  { id: "doc3", fileName: "TravelClaim-Patterson-Wk2.pdf", participant: "Liam Patterson", pages: 2, pct: 100, status: "done" },
];

// ---------------------------------------------------------------------------
// Participant avatar color palette
// ---------------------------------------------------------------------------

export const PARTICIPANT_COLORS = [
  '#8a64ff', '#e74c8a', '#34d399', '#60a5fa', '#f6b73c',
  '#fb5168', '#a084ff', '#2dd4bf', '#818cf8', '#f472b6',
  '#4ade80', '#38bdf8', '#facc15', '#c084fc', '#22d3ee',
  '#fb923c', '#a3e635', '#e879f9', '#67e8f9', '#fbbf24',
  '#ef4444', '#06b6d4',
];
