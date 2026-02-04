import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { authAPI, verificationAPI, payoutsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { 
  Loader2, 
  CheckCircle, 
  Phone, 
  Shield, 
  DollarSign,
  User,
  MapPin,
  Send
} from 'lucide-react';
import { formatPrice } from '../lib/utils';

export default function SettingsPage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [payoutSummary, setPayoutSummary] = useState(null);

  // Profile form
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  // Phone verification
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      setPhoneNumber(user.phone_number || '');

      // Fetch payout summary
      payoutsAPI.getSummary()
        .then(res => setPayoutSummary(res.data))
        .catch(err => console.error('Failed to fetch payout summary:', err));
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await authAPI.updateProfile({ name, location, bio });
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    setSendingCode(true);
    try {
      await verificationAPI.sendPhoneCode(phoneNumber);
      setCodeSent(true);
      toast.success('Verification code sent!');
    } catch (error) {
      console.error('Send code error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setVerifying(true);
    try {
      await verificationAPI.verifyPhoneCode(phoneNumber, verificationCode);
      updateUser({ phone_verified: true, phone_number: phoneNumber });
      setCodeSent(false);
      setVerificationCode('');
      toast.success('Phone number verified!');
    } catch (error) {
      console.error('Verify code error:', error);
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E05D44]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-enter min-h-screen pb-12" data-testid="settings-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-8 font-heading">
          Account Settings
        </h1>

        {/* Verification Status */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 font-heading flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#8DA399]" />
            Verification Status
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.phone_verified ? 'bg-green-100' : 'bg-stone-100'}`}>
                  <Phone className={`h-5 w-5 ${user.phone_verified ? 'text-green-600' : 'text-stone-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-stone-900">Phone Number</p>
                  <p className="text-sm text-stone-500">
                    {user.phone_verified ? user.phone_number : 'Not verified'}
                  </p>
                </div>
              </div>
              {user.phone_verified ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge className="bg-stone-100 text-stone-600">Not verified</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Phone Verification Form */}
        {!user.phone_verified && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 font-heading">
              Verify Your Phone
            </h2>
            <p className="text-stone-600 text-sm mb-4">
              Verified users get a badge on their profile, building trust with renters and owners.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 rounded-xl"
                    disabled={codeSent}
                    data-testid="phone-input"
                  />
                  <Button
                    onClick={handleSendCode}
                    disabled={sendingCode || codeSent}
                    className="rounded-xl bg-[#E05D44] hover:bg-[#C54E36]"
                    data-testid="send-code-btn"
                  >
                    {sendingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {codeSent && (
                <div>
                  <Label htmlFor="code">Verification Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      className="flex-1 rounded-xl"
                      data-testid="code-input"
                    />
                    <Button
                      onClick={handleVerifyCode}
                      disabled={verifying}
                      className="rounded-xl bg-[#8DA399] hover:bg-[#768C82]"
                      data-testid="verify-code-btn"
                    >
                      {verifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-stone-500 mt-2">
                    Didn't receive the code?{' '}
                    <button
                      onClick={() => {
                        setCodeSent(false);
                        setVerificationCode('');
                      }}
                      className="text-[#E05D44] hover:underline"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Earnings Summary */}
        {payoutSummary && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 font-heading flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#E05D44]" />
              Earnings
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-stone-50 rounded-xl">
                <p className="text-2xl font-bold text-stone-900">
                  {formatPrice(payoutSummary.total_earnings)}
                </p>
                <p className="text-sm text-stone-500">Total Earned</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(payoutSummary.pending_payout)}
                </p>
                <p className="text-sm text-stone-500">Pending Payout</p>
              </div>
              <div className="text-center p-4 bg-stone-50 rounded-xl">
                <p className="text-2xl font-bold text-stone-900">
                  {formatPrice(payoutSummary.paid_out)}
                </p>
                <p className="text-sm text-stone-500">Paid Out</p>
              </div>
            </div>

            {payoutSummary.pending_payout >= 10 && (
              <Button
                className="w-full mt-4 rounded-xl bg-[#E05D44] hover:bg-[#C54E36]"
                onClick={async () => {
                  try {
                    await payoutsAPI.requestPayout();
                    toast.success('Payout request submitted!');
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Failed to request payout');
                  }
                }}
              >
                Request Payout
              </Button>
            )}
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 font-heading flex items-center gap-2">
            <User className="h-5 w-5 text-stone-600" />
            Profile Information
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 rounded-xl"
                data-testid="name-input"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  id="location"
                  placeholder="City, State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 rounded-xl"
                  data-testid="location-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell others about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="mt-1 rounded-xl resize-none"
                data-testid="bio-input"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-stone-900 hover:bg-stone-800"
              data-testid="save-profile-btn"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
