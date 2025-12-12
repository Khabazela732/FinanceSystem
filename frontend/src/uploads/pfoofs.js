import React, { useState } from "react";

export default function ClientProofUpload({ clientId }) {
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file before uploading.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("proofFile", file);
    formData.append("clientId", clientId);
    formData.append("comment", comment);

    try {
      const res = await fetch("http://localhost:3001/api/proofs/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Proof of payment uploaded successfully.");
        setFile(null);
        setComment("");
      } else {
        setMessage(data.message || "Upload failed.");
      }
    } catch {
      setMessage("Upload error, please try again.");
    }
    setUploading(false);
  };

  return (
    <form onSubmit={handleUpload} style={{ maxWidth: "400px" }}>
      <label>
        Upload Proof of Payment (PDF, JPG, PNG):
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
      </label>
      <br />
      <label>
        Comment (Optional):
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
      </label>
      <br />
      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
