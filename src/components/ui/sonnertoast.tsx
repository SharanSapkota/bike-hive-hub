import { toast } from "sonner";

export const sonnerToast = (title: string, description: string) => toast(title, {
    description: description,
    duration: 5000, // milliseconds
    style: {
        background: "#1e1e2f",
        color: "#fff",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      },
  })
  