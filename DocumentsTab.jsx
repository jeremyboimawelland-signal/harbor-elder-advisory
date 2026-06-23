import { useState } from "react";
import { Upload, FileText, X, Loader2, Info } from "lucide-react";
import { Card, SectionLabel } from "../ui/Card";
import { PrimaryButton } from "../ui/Buttons";
import { StatusPill } from "../ui/DataDisplay";
import { fmtUSD } from "../../lib/constants";
import { useDocuments } from "../../hooks/useDocuments";

const CATEGORIES = ["Financial", "Medical", "Legal", "Real Estate", "Medicare"];

/** Ported from the prototype's <DocumentsTab>, backed by useDocuments() (Supabase) instead of useStoredState. */
export function DocumentsTab({ client }) {
  const { documents, simulateUpload, deleteDocument } = useDocuments(client.id);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Financial");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleUpload = async () => {
    setUploading(true);
    await simulateUpload(uploadCategory);
    setUploading(false);
  };

  const handleDelete = (id) => {
    deleteDocument(id);
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-5">
      <Card>
        <SectionLabel info="Files are OCR-processed and schema-extracted automatically, then linked to the relevant principal's profile.">
          Asset Vault
        </SectionLabel>

        <fieldset className="mb-3 flex flex-wrap items-center gap-2.5 border-0 p-0">
          <legend className="mb-1.5 w-full p-0 text-[11px] font-bold uppercase tracking-wide text-slate">
            Category for next upload
          </legend>
          {CATEGORIES.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-soft">
              <input type="radio" name="uploadCategory" checked={uploadCategory === c} onChange={() => setUploadCategory(c)} />
              {c}
            </label>
          ))}
        </fieldset>

        <PrimaryButton small icon={Upload} onClick={handleUpload} className="mb-3.5" disabled={uploading}>
          {uploading ? "Uploading…" : `Upload ${uploadCategory} document`}
        </PrimaryButton>

        <div className="flex flex-col gap-2">
          {documents.length === 0 && (
            <div className="py-10 text-center text-[13.5px] text-slate">No documents yet. Upload a file to start OCR processing.</div>
          )}
          {documents.map((d) => (
            <div
              key={d.id}
              onClick={() => d.status === "Processed" && setSelectedDoc(d)}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                d.status === "Processed" ? "cursor-pointer" : ""
              } ${selectedDoc?.id === d.id ? "border-copper bg-copper-soft" : "border-paper-line"}`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-slate" />
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">{d.name}</div>
                  <div className="text-[11.5px] text-slate">{d.type} · uploaded {d.uploaded}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.status === "Processing" && <Loader2 size={14} className="animate-spin text-copper" />}
                <StatusPill status={d.status} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(d.id);
                  }}
                  aria-label={`Delete ${d.name}`}
                  className="flex p-1 text-slate"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {selectedDoc ? (
          <Card className="border-copper">
            <div className="mb-2.5 flex items-start justify-between">
              <SectionLabel>Extracted Fields</SectionLabel>
              <button onClick={() => setSelectedDoc(null)} aria-label="Close" className="text-slate">
                <X size={15} />
              </button>
            </div>
            <div className="mb-2.5 text-[13.5px] font-bold text-ink">{selectedDoc.name}</div>
            {(() => {
              const fields = selectedDoc.extractedFields || {};
              const rows = [
                { label: "Document type", value: selectedDoc.type },
                { label: "Policy number", value: fields.policy_number },
                { label: "Expiry", value: fields.expiry },
                { label: "Amount", value: fields.amount != null ? fmtUSD(fields.amount) : null },
              ].filter((r) => r.value);
              return (
                <div className="flex flex-col gap-2">
                  {rows.map((r) => (
                    <div key={r.label} className="flex justify-between rounded-md bg-paper p-2.5 text-[13px]">
                      <span className="text-slate">{r.label}</span>
                      <span className="font-mono font-semibold text-ink">{r.value}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="mt-2.5 flex gap-1.5 text-[11px] text-slate">
              <Info size={12} className="mt-0.5 shrink-0" /> Simulated OCR output for demo purposes.
            </div>
          </Card>
        ) : (
          <Card>
            <SectionLabel>OCR Processing Pipeline</SectionLabel>
            <div className="flex flex-col gap-2.5 text-[13px] text-ink-soft">
              {["Upload received", "OCR extraction (LlamaParse / Textract)", "Schema extraction (doc type, expiry, amount, policy #)", "Stored to Asset Vault + linked to principal"].map(
                (step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-line text-[11px] text-slate">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                )
              )}
            </div>
            <div className="mt-3 text-[11.5px] text-slate">Click any "Processed" document on the left to view its extracted fields here.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
