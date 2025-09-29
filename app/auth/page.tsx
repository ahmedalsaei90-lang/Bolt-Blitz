'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Eye, EyeOff, Check, X, Mail, Lock, User, Calendar } from 'lucide-react';
import { LightningLogo } from '@/components/ui/lightning-logo';
import { toast } from 'sonner';

interface Language {
  code: string;
  name: string;
  flag: string;
  rtl: boolean;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];

const translations = {
  en: {
    title: 'Bolt Blitz ⚡️',
    subtitle: 'Join the Ultimate Trivia Challenge',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    age: 'Age',
    ageMin: 'Minimum age is 7 years',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    usernamePlaceholder: 'Choose a username',
    agePlaceholder: 'Enter your age',
    signInButton: 'Sign In',
    signUpButton: 'Create Account',
    switchToSignUp: "Don't have an account? Sign Up",
    switchToSignIn: 'Already have an account? Sign In',
    loading: 'Loading...',
    passwordWeak: 'Weak',
    passwordMedium: 'Medium',
    passwordStrong: 'Strong',
    validEmail: 'Valid email',
    invalidEmail: 'Invalid email',
    signInSuccess: 'Welcome back!',
    signUpSuccess: 'Account created successfully!',
    signInError: 'Invalid credentials. Please check your email and password.',
    signUpError: 'This email is already registered. Please sign in instead.',
    genericError: 'An error occurred. Please try again.',
  },
  ar: {
    title: 'بولت بليتز ⚡️',
    subtitle: 'انضم إلى تحدي المعرفة الأقوى',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    username: 'اسم المستخدم',
    age: 'العمر',
    ageMin: 'الحد الأدنى للعمر 7 سنوات',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    passwordPlaceholder: 'أدخل كلمة المرور',
    usernamePlaceholder: 'اختر اسم المستخدم',
    agePlaceholder: 'أدخل عمرك',
    signInButton: 'تسجيل الدخول',
    signUpButton: 'إنشاء الحساب',
    switchToSignUp: 'ليس لديك حساب؟ أنشئ حساباً',
    switchToSignIn: 'لديك حساب بالفعل؟ سجل الدخول',
    loading: 'جاري التحميل...',
    passwordWeak: 'ضعيفة',
    passwordMedium: 'متوسطة',
    passwordStrong: 'قوية',
    validEmail: 'بريد إلكتروني صحيح',
    invalidEmail: 'بريد إلكتروني غير صحيح',
    signInSuccess: 'مرحباً بعودتك!',
    signUpSuccess: 'تم إنشاء الحساب بنجاح!',
    signInError: 'بيانات غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.',
    signUpError: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.',
    genericError: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
  },
};

export default function AuthPage() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<string>('en');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  
  // Validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const t = translations[currentLang as keyof typeof translations];
  const isRTL = languages.find(lang => lang.code === currentLang)?.rtl || false;

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('language') || 'en';
    setCurrentLang(savedLang);
    
    // Apply RTL to document
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang, isRTL]);

  useEffect(() => {
    // Check if user is already authenticated
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      router.push('/main');
    }
  };

  const switchLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('language', langCode);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailValid(isValid);
    return isValid;
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
    return strength;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) calculatePasswordStrength(value);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const ageNum = parseInt(age);
        if (ageNum < 7) {
          toast.error(t.ageMin);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              username,
              age: ageNum,
              gems: 100,
              coins: 50,
              stats: { games_played: 0, wins: 0, accuracy: 0 }
            });

          if (profileError) throw profileError;
          
          toast.success(t.signUpSuccess);
          router.push('/main');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success(t.signInSuccess);
        router.push('/main');
      }
    } catch (error: any) {
      if (isSignUp) {
        if (error.message === 'User already registered') {
          toast.error(t.signUpError);
          setIsSignUp(false);
        } else {
          toast.error(t.genericError);
        }
      } else {
        if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid email or password')) {
          toast.error(t.signInError);
        } else {
          toast.error(t.genericError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return t.passwordWeak;
    if (passwordStrength <= 3) return t.passwordMedium;
    return t.passwordStrong;
  };

  return (
    <div className={`min-h-screen relative page-container ${isRTL ? 'rtl' : 'ltr'}`} style={{
      background: 'radial-gradient(ellipse at top, rgba(128, 0, 128, 0.6) 0%, transparent 50%), radial-gradient(ellipse at bottom left, rgba(0, 0, 255, 0.6) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(75, 0, 130, 0.5) 0%, transparent 50%), radial-gradient(ellipse at center, #000000 0%, #0a0a0a 100%)'
    }}>
      {/* Animated Background */}
      <div className="absolute inset-0 space-content">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full animate-pulse ${
              i % 3 === 0 ? 'bg-purple-400' : i % 3 === 1 ? 'bg-blue-400' : 'bg-indigo-400'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
        
        {/* Lightning Bolts */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-20 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex gap-2 bg-white/10 backdrop-blur-md rounded-lg p-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ${
                currentLang === lang.code
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-105">
          <CardHeader className="text-center space-y-4">
            {/* Animated Logo */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <LightningLogo size={48} className="animate-pulse drop-shadow-lg" />
                <div className="absolute inset-0 w-12 h-12 bg-yellow-400/20 rounded-full animate-ping" />
              </div>
            </div>
            
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">
                {t.title}
              </CardTitle>
              <CardDescription className="text-white/80 mt-2">
                {t.subtitle}
              </CardDescription>
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 ${
                  !isSignUp
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t.signIn}
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 ${
                  isSignUp
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t.signUp}
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t.email}
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={handleEmailChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20 pr-10"
                    required
                  />
                  {email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailValid ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {email && (
                  <p className={`text-xs ${emailValid ? 'text-green-400' : 'text-red-400'}`}>
                    {emailValid ? t.validEmail : t.invalidEmail}
                  </p>
                )}
              </div>

              {/* Username Field (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t.username}
                  </label>
                  <Input
                    type="text"
                    placeholder={t.usernamePlaceholder}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20"
                    required
                  />
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t.password}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={handlePasswordChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/70">{getPasswordStrengthText()}</span>
                      <span className="text-xs text-white/70">{passwordStrength}/5</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Age Field (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t.age}
                  </label>
                  <Input
                    type="number"
                    placeholder={t.agePlaceholder}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="7"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20"
                    required
                  />
                  <p className="text-xs text-white/60">{t.ageMin}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.loading}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {isSignUp ? t.signUpButton : t.signInButton}
                  </div>
                )}
              </Button>
            </form>

            {/* Switch Mode */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-white/70 hover:text-white transition-colors underline"
              >
                {isSignUp ? t.switchToSignIn : t.switchToSignUp}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}