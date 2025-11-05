import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 md:p-6">
      <Card className="p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Install GearQuest</h1>
            <p className="text-muted-foreground">Get the full app experience on your device</p>
          </div>

          {isInstalled ? (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <Check className="h-5 w-5" />
                <span className="font-medium">App is already installed!</span>
              </div>
              <p className="text-sm text-muted-foreground">You can find GearQuest on your home screen.</p>
            </div>
          ) : (
            <div className="space-y-6 w-full">
              {deferredPrompt ? (
                <Button size="lg" className="w-full" onClick={handleInstallClick}>
                  <Download className="h-5 w-5 mr-2" />
                  Install App
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">To install this app on your device:</p>
                  <div className="text-left space-y-3 bg-muted/50 p-4 rounded-lg">
                    <div className="flex gap-3">
                      <span className="font-bold text-primary">iOS:</span>
                      <p className="text-sm">Tap the Share button, then "Add to Home Screen"</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold text-primary">Android:</span>
                      <p className="text-sm">Tap the menu (⋮), then "Install app" or "Add to Home screen"</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Why install?</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Faster access from your home screen</li>
                  <li>Works offline</li>
                  <li>Full-screen experience</li>
                  <li>Push notifications (coming soon)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Install;
