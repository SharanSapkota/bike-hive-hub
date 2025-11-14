import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bike, Loader2, ArrowRight, Shield, Zap } from "lucide-react";
import { z } from "zod";
import { fetchMenuItems } from "@/lib/mockMenuApi";
import { sonnerToast } from "@/components/ui/sonnertoast";

// Validation schema
const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name too long"),
    middleName: z.string().max(50, "Middle name too long").optional(),
    lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name too long"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
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

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const authenticatedUser = await login(loginEmail, loginPassword);
      const menuItems = fetchMenuItems(authenticatedUser.role);
      const redirectPath = menuItems[0]?.path || "/";
      navigate(redirectPath);
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.data || error?.message || "Login failed";

      if (status === 403) {
        navigate(`/verify-email?email=${encodeURIComponent(loginEmail)}`);
      } else {
        sonnerToast("Login failed", message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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
      result.error.errors.forEach((error) => {
        if (error.path) {
          newErrors[error.path[0]] = error.message;
        }
      });
      setErrors(newErrors);
      const firstError = result.error.errors[0];
      sonnerToast("Registration failed", firstError.message);
      return;
    }

    setIsLoading(true);

    try {
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      await register({
        firstName,
        middleName,
        lastName,
        email,
        address: {
          country,
          city,
          state,
          postalCode,
        },
        phone,
        dob,
        password,
        confirmPassword,
        role: registerRole,
      });

      sonnerToast("Registration successful!", "Please verify your email.");
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      sonnerToast("Registration failed", error?.response?.data?.data || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="mb-8 animate-fade-in">
            <Bike className="w-24 h-24 mb-6" />
            <h1 className="text-5xl font-bold mb-4">Bike Rentals </h1>
            <p className="text-xl opacity-90 mb-8">Your Journey Starts Here</p>
          </div>
          
          <div className="space-y-6 max-w-md animate-fade-in">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Zap className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Quick & Easy</h3>
                <p className="text-sm opacity-90">Find and rent bikes in seconds</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Shield className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Secure & Safe</h3>
                <p className="text-sm opacity-90">Your data is protected with us</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-scale-in">
          <div className="lg:hidden mb-8 text-center">
            <Bike className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Bike Rentals </h1>
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => navigate("/forgot-password")}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">I want to</Label>
                      <Select value={registerRole} onValueChange={(value: UserRole) => setRegisterRole(value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="renter">Rent bikes</SelectItem>
                          <SelectItem value="owner">List my bikes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={errors.firstName ? "border-destructive" : ""}
                          required
                        />
                        {errors.firstName && (
                          <p className="text-xs text-destructive">{errors.firstName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={errors.lastName ? "border-destructive" : ""}
                          required
                        />
                        {errors.lastName && (
                          <p className="text-xs text-destructive">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? "border-destructive" : ""}
                        required
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="1234567890"
                        value={phone}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(cleaned);
                        }}
                        maxLength={10}
                        inputMode="numeric"
                        className={errors.phone ? "border-destructive" : ""}
                        required
                      />
                      {errors.phone && (
                        <p className="text-xs text-destructive">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={errors.dob ? "border-destructive" : ""}
                        required
                      />
                      {errors.dob && (
                        <p className="text-xs text-destructive">{errors.dob}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className={errors.country ? "border-destructive" : ""}
                          required
                        />
                        {errors.country && (
                          <p className="text-xs text-destructive">{errors.country}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State/Province *</Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className={errors.state ? "border-destructive" : ""}
                          required
                        />
                        {errors.state && (
                          <p className="text-xs text-destructive">{errors.state}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={errors.city ? "border-destructive" : ""}
                          required
                        />
                        {errors.city && (
                          <p className="text-xs text-destructive">{errors.city}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code *</Label>
                        <Input
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className={errors.postalCode ? "border-destructive" : ""}
                          required
                        />
                        {errors.postalCode && (
                          <p className="text-xs text-destructive">{errors.postalCode}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? "border-destructive" : ""}
                        required
                      />
                      {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Must contain uppercase, lowercase, and number
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={errors.confirmPassword ? "border-destructive" : ""}
                        required
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 text-base" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
