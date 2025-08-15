import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";
import { BiometricAuth } from "@/lib/webauthn";
import { Fingerprint, Key, Eye, EyeOff } from "lucide-react";
import { AppIcon } from "../ui/app-icon";

interface BiometricGateProps {
  onAuthenticated: () => void;
  title?: string;
  description?: string;
}

export const BiometricGate: React.FC<BiometricGateProps> = ({
  onAuthenticated,
  title = "Authentication Required",
  description = "Please authenticate to continue",
}) => {
  const [devicePassword, setDevicePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { authenticate, authenticateWithBiometric } = useAuthStore();
  const { toast } = useToast();

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        onAuthenticated();
      } else {
        toast({
          title: "Authentication Failed",
          description: "Biometric authentication was not successful",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Biometric authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAuth = async () => {
    if (!devicePassword) {
      toast({
        title: "Error",
        description: "Please enter your device password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await authenticate(devicePassword);
      if (success) {
        onAuthenticated();
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid device password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasBiometric = BiometricAuth.hasBiometricCredential();

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <AppIcon size="xl" className="mx-auto mb-4" />

          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasBiometric && (
            <Button
              onClick={handleBiometricAuth}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Use Biometric
            </Button>
          )}

          {hasBiometric && (
            <div className="relative text-center text-xs text-muted-foreground">
              or
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="devicePassword">Device Password</Label>
            <div className="relative">
              <Input
                id="devicePassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your device password"
                value={devicePassword}
                onChange={(e) => setDevicePassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordAuth()}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-full w-10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            onClick={handlePasswordAuth}
            disabled={isLoading || !devicePassword}
            className="w-full"
          >
            {isLoading ? "Authenticating..." : "Authenticate"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
