import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, LogOut, CreditCard, ShieldCheck, ChevronRight, CheckCircle2, XCircle, Upload, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

// Mock data - replace with API calls later
const PAYMENT_METHODS = [
  { id: 1, type: 'Credit Card', last4: '4242', expiry: '12/25', isDefault: true },
  { id: 2, type: 'PayPal', email: 'user@example.com', isDefault: false },
  { id: 3, type: 'Bank', accountNumber: '****5678', bankName: 'Chase Bank', isDefault: false },
];

const VERIFICATION_DATA = {
  name: 'John Doe',
  address: '123 Main St, New York, NY 10001',
  passportPhoto: '/placeholder.svg',
  selfiePhoto: '/placeholder.svg',
  emailVerified: true,
  phoneVerified: false,
  email: 'john@example.com',
  phone: '+1 (555) 123-4567',
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'credit' | 'paypal' | 'bank'>('credit');
  
  // Identity verification states
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState(VERIFICATION_DATA.phone);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  
  // Payment form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardName, setCardName] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Call API to update profile
      // await api.put('/profile', { name, email, phone });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePaymentNext = () => {
    setIsPaymentModalOpen(false);
    setIsPaymentFormOpen(true);
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPassportFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyEmail = async () => {
    if (!showEmailVerification) {
      setShowEmailVerification(true);
      return;
    }
    
    try {
      // TODO: Call API to send verification email
      toast.success('Verification email sent! Please check your inbox.');
      setIsCodeSent(true);
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  const handleVerifyPhone = async () => {
    if (!showPhoneVerification) {
      setShowPhoneVerification(true);
      return;
    }
    
    try {
      // TODO: Call API to send verification SMS
      toast.success(`Verification code sent to ${verificationPhone}!`);
      setIsCodeSent(true);
    } catch (error) {
      toast.error('Failed to send verification code');
    }
  };

  const handleVerifyCode = async () => {
    try {
      // TODO: Call API to verify the code
      if (verificationCode.length === 6) {
        toast.success('Successfully verified!');
        setShowEmailVerification(false);
        setShowPhoneVerification(false);
        setIsCodeSent(false);
        setVerificationCode('');
      } else {
        toast.error('Please enter a valid 6-digit code');
      }
    } catch (error) {
      toast.error('Failed to verify code');
    }
  };

  const handlePaymentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Call API to save payment method
      toast.success('Payment method saved successfully!');
      setIsPaymentFormOpen(false);
      // Reset form
      setCardNumber('');
      setCardExpiry('');
      setCardCVV('');
      setCardName('');
      setPaypalEmail('');
      setBankName('');
      setAccountNumber('');
      setRoutingNumber('');
    } catch (error) {
      toast.error('Failed to save payment method');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl bg-gradient-primary text-white">
                {user?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" className="gap-2">
              <Camera className="h-4 w-4" />
              Upload Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={user?.role}
                disabled
                className="capitalize"
              />
            </div>

            <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Identity Verification Section */}
      <Card 
        className="cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setIsVerificationModalOpen(true)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>View your verification status</CardDescription>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>

      {/* Payment Information Section */}
      <Card 
        className="cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setIsPaymentModalOpen(true)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Manage your payment methods</CardDescription>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>

      {/* Logout Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>Log out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* Identity Verification Modal */}
      <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Identity Verification</DialogTitle>
            <DialogDescription>Complete your identity verification</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Full Name</Label>
              <p className="text-base">{VERIFICATION_DATA.name}</p>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <p className="text-base">{VERIFICATION_DATA.address}</p>
            </div>

            {/* Passport Upload */}
            <div className="space-y-3">
              <Label htmlFor="passport">Passport/Citizenship Photo</Label>
              <div className="flex items-start gap-4">
                {passportPreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-primary">
                    <img src={passportPreview} alt="Passport" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setPassportFile(null);
                        setPassportPreview(null);
                      }}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <FileCheck className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="passport"
                    type="file"
                    accept="image/*"
                    onChange={handlePassportUpload}
                    className="hidden"
                  />
                  <Label htmlFor="passport">
                    <Button variant="outline" className="gap-2" asChild>
                      <span>
                        <Upload className="h-4 w-4" />
                        Upload Passport
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG up to 5MB. Must be a clear photo of your passport or citizenship card.
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <Label htmlFor="photo">Your Photo (Selfie)</Label>
              <div className="flex items-start gap-4">
                {photoPreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-primary">
                    <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Label htmlFor="photo">
                    <Button variant="outline" className="gap-2" asChild>
                      <span>
                        <Camera className="h-4 w-4" />
                        Take/Upload Photo
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG up to 5MB. Take a clear selfie showing your face.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Verification */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Email Verification</Label>
                  <p className="text-sm text-muted-foreground">{VERIFICATION_DATA.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {VERIFICATION_DATA.emailVerified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-500">Verified</span>
                    </>
                  ) : (
                    <Button 
                      onClick={handleVerifyEmail}
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                      Verify Email
                    </Button>
                  )}
                </div>
              </div>
              
              {showEmailVerification && !VERIFICATION_DATA.emailVerified && (
                <div className="space-y-3 pt-2 border-t">
                  {!isCodeSent ? (
                    <Button 
                      onClick={handleVerifyEmail}
                      className="w-full bg-gradient-primary hover:opacity-90"
                    >
                      Send Verification Code
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="emailCode">Enter 6-digit code</Label>
                        <Input
                          id="emailCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                        />
                      </div>
                      <Button 
                        onClick={handleVerifyCode}
                        className="w-full bg-gradient-primary hover:opacity-90"
                      >
                        Verify Code
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phone Verification */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Phone Verification</Label>
                  <p className="text-sm text-muted-foreground">{VERIFICATION_DATA.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  {VERIFICATION_DATA.phoneVerified ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-500">Verified</span>
                    </>
                  ) : (
                    <Button 
                      onClick={handleVerifyPhone}
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                      Verify Phone
                    </Button>
                  )}
                </div>
              </div>
              
              {showPhoneVerification && !VERIFICATION_DATA.phoneVerified && (
                <div className="space-y-3 pt-2 border-t">
                  {!isCodeSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={verificationPhone}
                          onChange={(e) => setVerificationPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <Button 
                        onClick={handleVerifyPhone}
                        className="w-full bg-gradient-primary hover:opacity-90"
                      >
                        Send Verification Code
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="phoneCode">Enter 6-digit code</Label>
                        <Input
                          id="phoneCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                        />
                      </div>
                      <Button 
                        onClick={handleVerifyCode}
                        className="w-full bg-gradient-primary hover:opacity-90"
                      >
                        Verify Code
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Information Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>Choose your preferred payment method</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Payment Type Selector */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Payment Type</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentType('credit')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedPaymentType === 'credit' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 ${selectedPaymentType === 'credit' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${selectedPaymentType === 'credit' ? 'text-primary' : 'text-foreground'}`}>
                    Card
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedPaymentType('paypal')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedPaymentType === 'paypal' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 ${selectedPaymentType === 'paypal' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${selectedPaymentType === 'paypal' ? 'text-primary' : 'text-foreground'}`}>
                    PayPal
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedPaymentType('bank')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedPaymentType === 'bank' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 ${selectedPaymentType === 'bank' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${selectedPaymentType === 'bank' ? 'text-primary' : 'text-foreground'}`}>
                    Bank
                  </span>
                </button>
              </div>
            </div>

            <Button 
              onClick={handlePaymentNext}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Form Modal */}
      <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>Enter your payment information</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePaymentFormSubmit} className="space-y-4 mt-4">
            {/* Payment Type Selector */}
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={selectedPaymentType === 'credit' ? 'default' : 'outline'}
                  onClick={() => setSelectedPaymentType('credit')}
                  className="w-full"
                >
                  Card
                </Button>
                <Button
                  type="button"
                  variant={selectedPaymentType === 'paypal' ? 'default' : 'outline'}
                  onClick={() => setSelectedPaymentType('paypal')}
                  className="w-full"
                >
                  PayPal
                </Button>
                <Button
                  type="button"
                  variant={selectedPaymentType === 'bank' ? 'default' : 'outline'}
                  onClick={() => setSelectedPaymentType('bank')}
                  className="w-full"
                >
                  Bank
                </Button>
              </div>
            </div>

            {/* Credit Card Form */}
            {selectedPaymentType === 'credit' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Expiry Date</Label>
                    <Input
                      id="cardExpiry"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCVV">CVV</Label>
                    <Input
                      id="cardCVV"
                      type="password"
                      value={cardCVV}
                      onChange={(e) => setCardCVV(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* PayPal Form */}
            {selectedPaymentType === 'paypal' && (
              <div className="space-y-2">
                <Label htmlFor="paypalEmail">PayPal Email</Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            )}

            {/* Bank Form */}
            {selectedPaymentType === 'bank' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Chase Bank"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="1234567890"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="021000021"
                    required
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Payment Method'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
