import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bike } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { fetchMenuItems } from "@/lib/mockMenuApi";

// Validation schema
const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name too long"),
    middleName: z.string().max(50, "Middle name too long").optional(),
    lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name too long"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
    dob: z.string().refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    }, "You must be at least 18 years old"),
    country: z.string().min(2, "Country is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State/Province is required"),
    postalCode: z.string().min(3, "Postal code is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const Login = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("renter");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMenuLoading, setIsMenuLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsMenuLoading(true);

    try {
      const authenticatedUser = await login(loginEmail, loginPassword);
      const menuItems = fetchMenuItems(authenticatedUser.role);
      const redirectPath = menuItems[0]?.path || "/";
      navigate(redirectPath);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
      setIsMenuLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Validate form data
      const formData = {
        firstName,
        middleName,
        lastName,
        email,
        phone,
        dob,
        country,
        city,
        state,
        postalCode,
        password,
        confirmPassword,
      };

      const result = signupSchema.safeParse(formData);

      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Please fix the validation errors");
        return;
      }

      // MOCK SIGNUP - Comment out API call
      // Call signup API
      // const response = await api.post("/auth/signup", {
      //   firstName,
      //   middleName,
      //   lastName,
      //   email,
      //   phone,
      //   dob,
      //   address: {
      //     country,
      //     city,
      //     state,
      //     postalCode,
      //   },
      //   password,
      //   role: registerRole,
      // });

      // Mock signup response
      const mockUser = {
        id: 'user-' + Date.now(),
        email,
        name: `${firstName} ${lastName}`,
        role: registerRole,
      };
      const mockToken = 'mock-token-' + email;

      // Store auth token if provided
      if (mockToken) {
        localStorage.setItem("auth_token", mockToken);
        localStorage.setItem("user", JSON.stringify(mockUser));
      }

      toast.success("Account created successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Registration failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Registration failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMenuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Bike className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Gear Quest</h1>
        </div>

        <Card className="shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => {
                        const registerTab = document.querySelector('[value="register"]') as HTMLButtonElement;
                        registerTab?.click();
                      }}
                    >
                      Register
                    </button>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Fill in your details to get started</CardDescription>

                  {/* Name Fields */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                      />
                      {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="M."
                      />
                      {errors.middleName && <p className="text-xs text-destructive">{errors.middleName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                      />
                      {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth * (Must be 18+)</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                    />
                    {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
                  </div>

                  {/* Address Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="United States"
                      />
                      {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
                      {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province *</Label>
                      <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="NY" />
                      {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="10001"
                      />
                      {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be 8+ characters with uppercase, lowercase, and number
                    </p>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="register-role">I want to *</Label>
                    <Select value={registerRole} onValueChange={(value: UserRole) => setRegisterRole(value)}>
                      <SelectTrigger id="register-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="renter">Rent Bikes</SelectItem>
                        <SelectItem value="owner">List My Bikes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-gradient-accent hover:opacity-90" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => {
                        const loginTab = document.querySelector('[value="login"]') as HTMLButtonElement;
                        loginTab?.click();
                      }}
                    >
                      Login
                    </button>
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;
