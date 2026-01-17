"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                style: {
                    background: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(12px)",
                    color: "#333",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    padding: "16px",
                    borderRadius: "16px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                    fontSize: "14px",
                    fontWeight: 600,
                },
                success: {
                    iconTheme: {
                        primary: "#16a34a", // green-600
                        secondary: "white",
                    },
                },
                error: {
                    iconTheme: {
                        primary: "#dc2626", // red-600
                        secondary: "white",
                    },
                },
            }}
        />
    );
}
