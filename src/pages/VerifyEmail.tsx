import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2, MailCheck, MailWarning } from "lucide-react";
import { sonnerToast } from "@/components/ui/sonnertoast";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const initialEmail = searchParams.get("email") || "";
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(() => {
    if (verified === "true") return "success";
    if (errorParam) return "error";
    return token ? "verifying" : "idle";
  });
  const [errorMessage, setErrorMessage] = useState<string>(() => {
    if (errorParam === "missing_token") return "Verification token is missing.";
    if (errorParam === "invalid_token") return "Invalid verification token.";
    if (errorParam === "token_already_used") return "This verification link has already been used.";
    if (errorParam === "token_expired") return "Verification link has expired.";
    if (errorParam === "verification_failed") return "Verification failed. Please try again.";
    return "";
  });
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disableResend, setDisableResend] = useState(false);

  useEffect(() => {
    const verify = async () => {
      // If already verified by backend redirect, don't verify again
      if (verified === "true") {
        setStatus("success");
        sonnerToast('Email verified successfully!', 'You can now log in.');
        return;
      }

      // If there's an error from backend redirect, don't verify
      if (errorParam) {
        setStatus("error");
        return;
      }

      // Only verify via POST if we have a token but no verified/error params
      if (!token) return;
      
      try {
        await api.post("/auth/verify-email", { token });
        setStatus("success");
        sonnerToast('Email verified successfully!', 'You can now log in.');
      } catch (error: any) {
        const message =
          error?.response?.data?.data || error?.message || "Verification failed.";
        setErrorMessage(message);
        setStatus("error");
      }
    };

    verify();
  }, [token, verified, errorParam]);

  const canSubmitResend = useMemo(() => email.trim().length > 0, [email]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitResend || disableResend) return;
    setIsSubmitting(true);
    setDisableResend(true);
    try {
      await api.post("/auth/resend-verification", { email });
      sonnerToast('Verification email sent!', 'Please check your inbox.');
    } catch (error: any) {
      sonnerToast('Failed to resend verification email', 'Failed to resend the verification email.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setDisableResend(true);
      }, 2000);
    }
  };

  const renderStatusIcon = () => {
    if (status === "verifying" || isSubmitting) {
      return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
    }

    if (status === "success") {
      return <MailCheck className="h-6 w-6 text-primary" />;
    }

    if (status === "error") {
      return <MailWarning className="h-6 w-6 text-destructive" />;
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-2 text-center">
            {renderStatusIcon()}
            <CardTitle className="text-2xl">
              {status === "success"
                ? "Email verified!"
                : status === "verifying"
                ? "Verifying your email"
                : "Verify your email"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "verifying" && (
              <p className="text-sm text-muted-foreground text-center">
                Hold on while we confirm your email address…
              </p>
            )}

            {status === "success" && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Thanks! Your email address has been verified. You can now sign in and start using
                  Adventure Gear Rentals.
                </p>
                <Button onClick={() => navigate("/login")}>Go to login</Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <p className="text-sm text-destructive text-center font-medium">{errorMessage}</p>
                <p className="text-sm text-muted-foreground text-center">
                  Don’t worry—enter your email below and we’ll send you a new verification link.
                </p>
              </div>
            )}

            {status !== "success" && (
              <form className="space-y-4" onSubmit={handleResend}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!canSubmitResend || disableResend}>
                  {isSubmitting ? "sending..." : "Resend verification email"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
