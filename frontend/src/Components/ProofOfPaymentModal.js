// ProofOfPaymentModal.jsx
import React, { useState, useEffect } from "react";

export default function ProofOfPaymentModal({ invoice, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please upload a proof of payment file.");
      return;
    }
    onSave(invoice.id, file, comment);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Upload Proof for Invoice #{invoice?.id}</h2>
          <button onClick={onClose} className="text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Choose file</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
          </div>

          {previewUrl && file && (
            <div className="border rounded p-3 bg-gray-50">
              <div className="mb-2 font-semibold">Preview</div>
              {file.type === "application/pdf" ? (
                <iframe title="pdf-preview" src={previewUrl} className="w-full h-64" />
              ) : (
                <img src={previewUrl} alt="preview" className="max-h-64" />
              )}
            </div>
          )}

          <div>
            <label className="block mb-1 font-medium">Comment (optional)</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border rounded p-2" />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Save Proof</button>
          </div>
        </form>
      </div>
    </div>
  );
}
