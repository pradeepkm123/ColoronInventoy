  // src/components/StockOutwardDialog.js
import React, { useState } from "react";

export default function StockOutwardDialog({ product, onClose, onSubmit }) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!quantity || !reason) {
      setError("Quantity and Reason are required");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number");
      return;
    }

    if (qty > product.quantity) {
      setError("Quantity exceeds available stock");
      return;
    }

    setIsSubmitting(true);

    onSubmit({
      modelNo: product.modelNo,
      quantity: qty,
      reason,
      reference,
    });

    setIsSubmitting(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h2 style={styles.title}>Stock Outward</h2>
        <p>
          <strong>Model No:</strong> {product.modelNo}
        </p>
        <p>
          <strong>Available Quantity:</strong> {product.quantity}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Quantity Input */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={styles.input}
              disabled={isSubmitting || product.quantity === 0}
            />
          </div>

          {/* Reason Select */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={styles.select}
              disabled={isSubmitting}
            >
              <option value="">Select reason</option>
              <option value="Sale">Sale</option>
              <option value="Transfer">Transfer</option>
              <option value="Damage">Damage</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Reference Input */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Reference (optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              style={styles.input}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && <p style={styles.error}>{error}</p>}

          {/* Action Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={isSubmitting || product.quantity === 0}
            >
              {isSubmitting ? "Processing..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  dialog: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "400px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },
  title: {
    margin: "0 0 15px",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  select: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  error: {
    color: "red",
    marginBottom: "10px",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
  },
  cancelButton: {
    background: "#ccc",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  submitButton: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
