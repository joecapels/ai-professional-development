import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, UserPlus, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient"; // Fix: Import queryClient

export default function SuperUserLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isRegistering && password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? "/api/super-register" : "/api/super-login";
      const response = await apiRequest("POST", endpoint, {
        username,
        password,
        isAdmin: true,
        email: `${username}@admin.com`,
        phoneNumber: "",
        country: "",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || (isRegistering ? "Failed to register super user" : "Invalid super user credentials"));
      }

      const data = await response.json();
      if (!data.isAdmin) {
        throw new Error("Insufficient privileges");
      }

      // Force refresh auth state
      await queryClient.invalidateQueries(["/api/user"]);

      toast({
        title: isRegistering ? "Registration Successful" : "Welcome, Administrator",
        description: isRegistering ? "Super user account created successfully" : "Successfully logged in as super user",
      });

      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isRegistering ? "Create Super User" : "Super User Access"}
            </CardTitle>
            <CardDescription>
              {isRegistering 
                ? "Register a new administrator account"
                : "Enter your administrator credentials to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Super User ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Access Key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10"
                    required
                  />
                  <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              {isRegistering && (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="Confirm Access Key"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pr-10"
                      required
                    />
                    <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Shield className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <>
                    {isRegistering ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register Super User
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Authenticate
                      </>
                    )}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? "Already have an account? Login" : "Create Super User Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}