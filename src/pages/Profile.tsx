import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, LogOut, CreditCard, ShieldCheck, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
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

  const handlePaymentMethodClick = (type: 'credit' | 'paypal' | 'bank') => {
    setSelectedPaymentType(type);
    setIsPaymentModalOpen(false);
    setIsPaymentFormOpen(true);
  };

  const handleAddNewPayment = () => {
    setIsPaymentModalOpen(false);
    setIsPaymentFormOpen(true);
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
            <DialogDescription>Your identity verification details</DialogDescription>
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

            {/* Photos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Passport/Citizenship Photo</Label>
                <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                  <img 
                    src={VERIFICATION_DATA.passportPhoto} 
                    alt="Passport" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Your Photo (Selfie)</Label>
                <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                  <img 
                    src={VERIFICATION_DATA.selfiePhoto} 
                    alt="Selfie" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Email Verification */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
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
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Not Verified</span>
                  </>
                )}
              </div>
            </div>

            {/* Phone Verification */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
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
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Not Verified</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Information Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Information</DialogTitle>
            <DialogDescription>Your saved payment methods</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {PAYMENT_METHODS.map((method) => (
              <div 
                key={method.id}
                onClick={() => handlePaymentMethodClick(
                  method.type === 'Credit Card' ? 'credit' : 
                  method.type === 'PayPal' ? 'paypal' : 'bank'
                )}
                className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{method.type}</h4>
                    {method.type === 'Credit Card' && (
                      <p className="text-sm text-muted-foreground">
                        •••• {method.last4} • Expires {method.expiry}
                      </p>
                    )}
                    {method.type === 'PayPal' && (
                      <p className="text-sm text-muted-foreground">{method.email}</p>
                    )}
                    {method.type === 'Bank' && (
                      <p className="text-sm text-muted-foreground">
                        {method.bankName} • {method.accountNumber}
                      </p>
                    )}
                  </div>
                </div>
                {method.isDefault && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Default
                  </span>
                )}
              </div>
            ))}
            
            <Button 
              onClick={handleAddNewPayment}
              className="w-full bg-gradient-primary hover:opacity-90 mt-4"
            >
              Add New Payment Method
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
