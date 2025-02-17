import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, LogIn } from "lucide-react";

const powerUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  powerKey: z.string().min(1, "Power user key is required"),
});

type PowerUserData = z.infer<typeof powerUserSchema>;

export default function PowerLoginPage() {
  const { loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);

  const form = useForm<PowerUserData>({
    resolver: zodResolver(powerUserSchema),
    defaultValues: {
      username: "",
      password: "",
      powerKey: "",
    },
  });

  const onSubmit = async (data: PowerUserData) => {
    const mutation = isRegistering ? registerMutation : loginMutation;

    mutation.mutate(
      { ...data, isPowerUser: true },
      {
        onSuccess: () => {
          setLocation("/power-dashboard");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-background">
      <Card className="w-[400px] shadow-lg">
        <CardHeader>
          <CardTitle>{isRegistering ? "Power User Registration" : "Power User Access"}</CardTitle>
          <CardDescription>
            {isRegistering
              ? "Create your power user account to access advanced analytics"
              : "Enter your credentials and power user key to access the analytics dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="powerKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Power User Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                >
                  {loginMutation.isPending || registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isRegistering ? "Creating Account..." : "Authenticating..."}
                    </>
                  ) : (
                    <>
                      {isRegistering ? (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Account
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Access Dashboard
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
                  {isRegistering
                    ? "Already have an account? Login"
                    : "Need an account? Register"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}