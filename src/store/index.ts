import { create } from "zustand";

export type EditabilityFlag = "fillable" | "locked" | "flattened" | "scanned" | null;
export type FillPath = "direct" | "replicate" | null;

export type FieldSchema = {
  id: string;
  type: "text" | "checkbox" | "radio" | "signature" | "choice";
  label: string;
  instructions?: string;
  required?: boolean;
  maxLength?: number;
  options?: string[];
  checkStyle?: "tick" | "cross" | "filled" | "check";
  location: { page: number; x: number; y: number; w: number; h: number };
};

export type AmbiguousField = {
  field: FieldSchema;
  sourceContext: string;
};

export type AppState = {
  uploadedPath: string | null;
  editability: EditabilityFlag;
  path: FillPath;
  formMap: any | null;
  replicaPath: string | null;
  fields: FieldSchema[];
  fieldValues: Record<string, string | boolean>;
  filledPath: string | null;
  ambiguousQueue: AmbiguousField[];
  setUploaded: (p: string | null) => void;
  setEditability: (e: EditabilityFlag, p: FillPath) => void;
  setFormMap: (fm: any) => void;
  setReplicaPath: (p: string | null) => void;
  setFields: (f: FieldSchema[]) => void;
  setFieldValue: (id: string, v: string | boolean) => void;
  setFilled: (p: string | null) => void;
  enqueueAmbiguous: (a: AmbiguousField) => void;
  resolveAmbiguous: (id: string, value: boolean | string | null) => void;
  reset: () => void;
};

export const useStore = create<AppState>((set) => ({
  uploadedPath: null,
  editability: null,
  path: null,
  formMap: null,
  replicaPath: null,
  fields: [],
  fieldValues: {},
  filledPath: null,
  ambiguousQueue: [],
  setUploaded: (p) => set({ uploadedPath: p }),
  setEditability: (e, p) => set({ editability: e, path: p }),
  setFormMap: (fm) => set({ formMap: fm }),
  setReplicaPath: (p) => set({ replicaPath: p }),
  setFields: (f) => set({ fields: f }),
  setFieldValue: (id, v) => set((s) => ({ fieldValues: { ...s.fieldValues, [id]: v } })),
  setFilled: (p) => set({ filledPath: p }),
  enqueueAmbiguous: (a) => set((s) => ({ ambiguousQueue: [...s.ambiguousQueue, a] })),
  resolveAmbiguous: (id, value) =>
    set((s) => ({
      ambiguousQueue: s.ambiguousQueue.filter((q) => q.field.id !== id),
      fieldValues: value === null ? s.fieldValues : { ...s.fieldValues, [id]: value as any },
    })),
  reset: () => set({
    uploadedPath: null, editability: null, path: null, formMap: null, replicaPath: null,
    fields: [], fieldValues: {}, filledPath: null, ambiguousQueue: [],
  }),
}));
