import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Shield, AlertTriangle, KeyRound, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { classNames } from '~/utils/classNames';
import { currentUser } from '~/lib/stores/auth';

type AuthMode = 'login' | 'signup' | 'reset';
type RegistrationStep = 'details' | 'verification' | 'complete';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  rememberMe: boolean;
  agreeToTerms: boolean;
  verificationCode: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  agreeToTerms?: string;
  verificationCode?: string;
  general?: string;
}

interface AuthFormProps {
  onSuccess?: (userData: { email: string }) => void;
  onClose?: () => void;
  className?: string;
  initialMode?: AuthMode;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;

  if (password.length >= 8) {
    score++;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  }

  if (/\d/.test(password)) {
    score++;
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  }

  if (password.length >= 12) {
    score++;
  }

  if (score <= 1) {
    return { score, label: 'Weak', color: 'bg-red-400' };
  }

  if (score <= 2) {
    return { score, label: 'Fair', color: 'bg-orange-400' };
  }

  if (score <= 3) {
    return { score, label: 'Good', color: 'bg-yellow-400' };
  }

  return { score, label: 'Strong', color: 'bg-green-400' };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 space-y-1.5"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={classNames(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= strength.score ? strength.color : 'bg-white/10',
            )}
          />
        ))}
      </div>
      <p className={classNames(
        'text-[10px] transition-colors duration-300',
        strength.score <= 1 ? 'text-red-400' : strength.score <= 2 ? 'text-orange-400' : strength.score <= 3 ? 'text-yellow-400' : 'text-green-400',
      )}>
        {strength.label}
      </p>
    </motion.div>
  );
}

export function AuthForm({ onSuccess, onClose, className, initialMode = 'login' }: AuthFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    rememberMe: false,
    agreeToTerms: false,
    verificationCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('foil_has_visited');

    if (hasVisited) {
      setIsReturningUser(true);
    }

    localStorage.setItem('foil_has_visited', 'true');
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FormErrors];

        return next;
      });
    }
  }, [errors]);

  const validateField = useCallback((field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          return 'Name is required';
        }

        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }

        return undefined;
      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email';
        }

        return undefined;
      case 'password':
        if (!value) {
          return 'Password is required';
        }

        if (value.length < 8) {
          return 'Password must be at least 8 characters';
        }

        return undefined;
      case 'confirmPassword':
        if (!value) {
          return 'Please confirm your password';
        }

        if (value !== formData.password) {
          return 'Passwords do not match';
        }

        return undefined;
      case 'phone':
        if (value && !/^\+?[\d\s-()]{7,}$/.test(value)) {
          return 'Please enter a valid phone number';
        }

        return undefined;
      case 'verificationCode':
        if (!value.trim()) {
          return 'Verification code is required';
        }

        if (value.length !== 6) {
          return 'Code must be 6 digits';
        }

        return undefined;
      default:
        return undefined;
    }
  }, [formData.password]);

  const handleBlur = useCallback((field: keyof FormErrors) => {
    setFieldTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof FormData] as string);

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  }, [formData, validateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (authMode === 'login') {
      const emailError = validateField('email', formData.email);
      const passwordError = validateField('password', formData.password);

      if (emailError) {
        newErrors.email = emailError;
      }

      if (passwordError) {
        newErrors.password = passwordError;
      }
    } else if (authMode === 'signup') {
      if (registrationStep === 'details') {
        const nameError = validateField('name', formData.name);
        const emailError = validateField('email', formData.email);
        const passwordError = validateField('password', formData.password);
        const confirmError = validateField('confirmPassword', formData.confirmPassword);
        const phoneError = validateField('phone', formData.phone);

        if (nameError) {
          newErrors.name = nameError;
        }

        if (emailError) {
          newErrors.email = emailError;
        }

        if (passwordError) {
          newErrors.password = passwordError;
        }

        if (confirmError) {
          newErrors.confirmPassword = confirmError;
        }

        if (phoneError) {
          newErrors.phone = phoneError;
        }

        if (!formData.agreeToTerms) {
          newErrors.agreeToTerms = 'You must agree to the terms';
        }
      } else if (registrationStep === 'verification') {
        const codeError = validateField('verificationCode', formData.verificationCode);

        if (codeError) {
          newErrors.verificationCode = codeError;
        }
      }
    } else if (authMode === 'reset') {
      const emailError = validateField('email', formData.email);

      if (emailError) {
        newErrors.email = emailError;
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [authMode, registrationStep, formData, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (authMode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErrors({ general: data.error || 'Login failed' });
          return;
        }

        currentUser.set(data.user);
        onSuccess?.({ email: formData.email });
        onClose?.();
      } else if (authMode === 'signup') {
        if (registrationStep === 'details') {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: formData.password,
              phone: formData.phone || undefined,
            }),
          });
          const data = await res.json();

          if (!res.ok) {
            setErrors({ general: data.error || 'Signup failed' });
            return;
          }

          setRegistrationStep('verification');
        } else if (registrationStep === 'verification') {
          const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, code: formData.verificationCode }),
          });
          const data = await res.json();

          if (!res.ok) {
            setErrors({ verificationCode: data.error || 'Verification failed' });
            return;
          }

          currentUser.set(data.user);
          setRegistrationStep('complete');
        }
      } else if (authMode === 'reset') {
        // Password reset still mocked until reset endpoint is implemented
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSuccessMessage('Password reset link sent! Check your email.');
      }
    } catch (err) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [authMode, registrationStep, validateForm, formData, onSuccess]);

  const switchMode = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setErrors({});
    setFieldTouched({});
    setSuccessMessage('');
    setRegistrationStep('details');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const renderInput = ({
    field,
    type = 'text',
    placeholder,
    icon: Icon,
    showToggle,
    toggleValue,
    onToggle,
  }: {
    field: keyof FormData;
    type?: string;
    placeholder: string;
    icon: React.ComponentType<{ className?: string }>;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: () => void;
  }) => {
    const hasError = fieldTouched[field] && errors[field as keyof FormErrors];

    return (
      <motion.div
        className={classNames('relative', focusedInput === field ? 'z-10' : '')}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="relative flex items-center overflow-hidden rounded-lg">
          <Icon
            className={classNames(
              'absolute left-3 w-4 h-4 transition-all duration-300',
              hasError ? 'text-red-400' : focusedInput === field ? 'text-white' : 'text-white/40',
            )}
          />
          <input
            type={showToggle ? (toggleValue ? 'text' : 'password') : type}
            placeholder={placeholder}
            value={formData[field] as string}
            onChange={(e) => updateField(field, e.target.value as FormData[typeof field])}
            onFocus={() => setFocusedInput(field)}
            onBlur={() => {
              setFocusedInput(null);
              handleBlur(field as keyof FormErrors);
            }}
            className={classNames(
              'w-full bg-white/5 border text-white placeholder:text-white/30 h-10 rounded-lg transition-all duration-300 text-sm focus:bg-white/10 focus:outline-none',
              showToggle ? 'pl-10 pr-10' : 'pl-10 pr-3',
              hasError ? 'border-red-400/50 focus:border-red-400' : 'border-transparent focus:border-white/20',
            )}
          />
          {showToggle && onToggle && (
            <div onClick={onToggle} className="absolute right-3 cursor-pointer">
              {toggleValue ? (
                <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
              ) : (
                <EyeOff className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
              )}
            </div>
          )}
          {focusedInput === field && (
            <motion.div
              className="absolute inset-0 bg-white/5 -z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>
        <AnimatePresence>
          {hasError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-red-400 text-[10px] mt-1 ml-1 flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              {errors[field as keyof FormErrors]}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const getHeaderTitle = () => {
    if (authMode === 'reset') {
      return 'Reset Password';
    }

    if (authMode === 'signup') {
      if (registrationStep === 'verification') {
        return 'Verify Email';
      }

      if (registrationStep === 'complete') {
        return 'All Set!';
      }

      return 'Create Account';
    }

    return isReturningUser ? 'Welcome Back' : 'Welcome';
  };

  const getHeaderSubtitle = () => {
    if (authMode === 'reset') {
      return "Enter your email and we'll send you a reset link";
    }

    if (authMode === 'signup') {
      if (registrationStep === 'verification') {
        return `We sent a code to ${formData.email}`;
      }

      if (registrationStep === 'complete') {
        return 'Your account has been created successfully';
      }

      return 'Sign up to get started with LAB';
    }

    return 'Sign in to continue to LAB';
  };

  return (
    <div style={{ perspective: 1500 }} className={className}>
      <motion.div
        className="relative"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ z: 10 }}
      >
        <div className="relative group">
          {/* Card glow effect */}
          <motion.div
            className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
            animate={{
              boxShadow: [
                '0 0 10px 2px rgba(255,255,255,0.03)',
                '0 0 15px 5px rgba(255,255,255,0.05)',
                '0 0 10px 2px rgba(255,255,255,0.03)',
              ],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
          />

          {/* Traveling light beams */}
          <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
            {/* Top beam */}
            <motion.div
              className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
              initial={{ filter: 'blur(2px)' }}
              animate={{
                left: ['-50%', '100%'],
                opacity: [0.3, 0.7, 0.3],
                filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
              }}
              transition={{
                left: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 },
                opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror' },
                filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' },
              }}
            />
            {/* Right beam */}
            <motion.div
              className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
              initial={{ filter: 'blur(2px)' }}
              animate={{
                top: ['-50%', '100%'],
                opacity: [0.3, 0.7, 0.3],
                filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
              }}
              transition={{
                top: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 0.6 },
                filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 0.6 },
              }}
            />
            {/* Bottom beam */}
            <motion.div
              className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
              initial={{ filter: 'blur(2px)' }}
              animate={{
                right: ['-50%', '100%'],
                opacity: [0.3, 0.7, 0.3],
                filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
              }}
              transition={{
                right: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.2 },
                filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 1.2 },
              }}
            />
            {/* Left beam */}
            <motion.div
              className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
              initial={{ filter: 'blur(2px)' }}
              animate={{
                bottom: ['-50%', '100%'],
                opacity: [0.3, 0.7, 0.3],
                filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
              }}
              transition={{
                bottom: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.8 },
                filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 1.8 },
              }}
            />

            {/* Corner glows */}
            <motion.div className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }} />
            <motion.div className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2.4, repeat: Infinity, repeatType: 'mirror', delay: 0.5 }} />
            <motion.div className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror', delay: 1 }} />
            <motion.div className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2.3, repeat: Infinity, repeatType: 'mirror', delay: 1.5 }} />
          </div>

          {/* Card border glow */}
          <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/3 via-white/7 to-white/3 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />

          {/* Glass card */}
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)',
                backgroundSize: '30px 30px',
              }}
            />

            {/* Success banner */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-green-400 text-xs">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-red-400 text-xs">{errors.general}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative text-center space-y-1 mb-5">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={getHeaderTitle()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                >
                  {getHeaderTitle()}
                </motion.h1>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.p
                  key={getHeaderSubtitle()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="text-white/60 text-xs"
                >
                  {getHeaderSubtitle()}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Login / Signup tab toggle */}
            {authMode !== 'reset' && registrationStep === 'details' && (
              <div className="relative flex mb-5 bg-white/5 rounded-lg p-0.5">
                <motion.div
                  className="absolute top-0.5 bottom-0.5 rounded-md bg-white/10"
                  layout
                  style={{
                    left: authMode === 'login' ? '2px' : '50%',
                    width: 'calc(50% - 4px)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={classNames(
                    'relative flex-1 text-xs font-medium py-2 rounded-md transition-colors duration-200 cursor-pointer bg-transparent border-none',
                    authMode === 'login' ? 'text-white' : 'text-white/40 hover:text-white/60',
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={classNames(
                    'relative flex-1 text-xs font-medium py-2 rounded-md transition-colors duration-200 cursor-pointer bg-transparent border-none',
                    authMode === 'signup' ? 'text-white' : 'text-white/40 hover:text-white/60',
                  )}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Form content */}
            <AnimatePresence mode="wait">
              {/* ===== LOGIN FORM ===== */}
              {authMode === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="relative space-y-3"
                >
                  {renderInput({ field: 'email', type: 'email', placeholder: 'Email address', icon: Mail })}
                  {renderInput({
                    field: 'password',
                    placeholder: 'Password',
                    icon: Lock,
                    showToggle: true,
                    toggleValue: showPassword,
                    onToggle: () => setShowPassword(!showPassword),
                  })}

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          checked={formData.rememberMe}
                          onChange={() => updateField('rememberMe', !formData.rememberMe)}
                          className="appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-white checked:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200 cursor-pointer"
                        />
                        {formData.rememberMe && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center text-black pointer-events-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                      <label htmlFor="remember-me" className="text-xs text-white/60 hover:text-white/80 transition-colors duration-200 cursor-pointer">
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-xs text-white/40 hover:text-white/60 transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Sign in button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group/button mt-5 cursor-pointer bg-transparent border-none p-0"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-lg opacity-0 group-hover/button:opacity-50 transition-opacity duration-300" />
                    <div className="relative overflow-hidden bg-white text-gray-900 font-medium h-10 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/60 to-white/0 -z-10"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                        style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                      />
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-gray-900 animate-spin" />
                          </motion.div>
                        ) : (
                          <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
                            Sign In
                            <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>

                  {/* Divider */}
                  <div className="relative mt-2 mb-5 flex items-center">
                    <div className="flex-grow border-t border-white/5" />
                    <span className="mx-3 text-xs text-white/40">or</span>
                    <div className="flex-grow border-t border-white/5" />
                  </div>

                  {/* Google Sign In */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className="w-full relative group/google cursor-pointer bg-transparent border-none p-0"
                  >
                    <div className="relative overflow-hidden bg-white font-medium h-10 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="text-black transition-colors text-sm font-medium">Sign in with Google</span>
                    </div>
                  </motion.button>
                </motion.form>
              )}

              {/* ===== SIGNUP FORM — Details step ===== */}
              {authMode === 'signup' && registrationStep === 'details' && (
                <motion.form
                  key="signup-details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="relative space-y-3"
                >
                  {renderInput({ field: 'name', placeholder: 'Full name', icon: User })}
                  {renderInput({ field: 'email', type: 'email', placeholder: 'Email address', icon: Mail })}
                  <div>
                    {renderInput({
                      field: 'password',
                      placeholder: 'Password',
                      icon: Lock,
                      showToggle: true,
                      toggleValue: showPassword,
                      onToggle: () => setShowPassword(!showPassword),
                    })}
                    <PasswordStrengthIndicator password={formData.password} />
                  </div>
                  {renderInput({
                    field: 'confirmPassword',
                    placeholder: 'Confirm password',
                    icon: Shield,
                    showToggle: true,
                    toggleValue: showConfirmPassword,
                    onToggle: () => setShowConfirmPassword(!showConfirmPassword),
                  })}
                  {renderInput({ field: 'phone', type: 'tel', placeholder: 'Phone number (optional)', icon: Phone })}

                  {/* Terms checkbox */}
                  <div className="pt-1">
                    <div className="flex items-start space-x-2">
                      <div className="relative mt-0.5">
                        <input
                          id="agree-terms"
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={() => updateField('agreeToTerms', !formData.agreeToTerms)}
                          className="appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-white checked:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200 cursor-pointer"
                        />
                        {formData.agreeToTerms && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center text-black pointer-events-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                      <label htmlFor="agree-terms" className="text-xs text-white/60 cursor-pointer leading-relaxed">
                        I agree to the{' '}
                        <span className="text-white hover:text-white/80 transition-colors">Terms of Service</span>
                        {' '}and{' '}
                        <span className="text-white hover:text-white/80 transition-colors">Privacy Policy</span>
                      </label>
                    </div>
                    <AnimatePresence>
                      {fieldTouched.agreeToTerms && errors.agreeToTerms && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-red-400 text-[10px] mt-1 ml-6 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {errors.agreeToTerms}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Create account button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group/button mt-4 cursor-pointer bg-transparent border-none p-0"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-lg opacity-0 group-hover/button:opacity-50 transition-opacity duration-300" />
                    <div className="relative overflow-hidden bg-white text-gray-900 font-medium h-10 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/60 to-white/0 -z-10"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                        style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                      />
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-gray-900 animate-spin" />
                          </motion.div>
                        ) : (
                          <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
                            Create Account
                            <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                </motion.form>
              )}

              {/* ===== SIGNUP — Verification step ===== */}
              {authMode === 'signup' && registrationStep === 'verification' && (
                <motion.form
                  key="signup-verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="relative space-y-4"
                >
                  <div className="flex justify-center mb-2">
                    <motion.div
                      className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Mail className="w-6 h-6 text-white/60" />
                    </motion.div>
                  </div>

                  {renderInput({ field: 'verificationCode', placeholder: 'Enter 6-digit code', icon: KeyRound })}

                  <p className="text-center text-[10px] text-white/40">
                    Didn&apos;t receive a code?{' '}
                    <button type="button" className="text-white hover:text-white/80 transition-colors cursor-pointer bg-transparent border-none p-0 text-[10px]">
                      Resend
                    </button>
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group/button mt-4 cursor-pointer bg-transparent border-none p-0"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-lg opacity-0 group-hover/button:opacity-50 transition-opacity duration-300" />
                    <div className="relative overflow-hidden bg-white text-gray-900 font-medium h-10 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/60 to-white/0 -z-10"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                        style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                      />
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-gray-900 animate-spin" />
                          </motion.div>
                        ) : (
                          <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
                            Verify Email
                            <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setRegistrationStep('details')}
                    className="w-full text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center justify-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    Back to details
                  </button>
                </motion.form>
              )}

              {/* ===== SIGNUP — Complete step ===== */}
              {authMode === 'signup' && registrationStep === 'complete' && (
                <motion.div
                  key="signup-complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative text-center space-y-4 py-4"
                >
                  <motion.div
                    className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </motion.div>

                  <motion.p
                    className="text-white/60 text-xs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Your account is ready. Start building with LAB.
                  </motion.p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="w-full relative group/button cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-lg opacity-0 group-hover/button:opacity-50 transition-opacity duration-300" />
                    <div className="relative overflow-hidden bg-white text-gray-900 font-medium h-10 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center">
                      <span className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
                        Get Started
                        <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                      </span>
                    </div>
                  </motion.button>
                </motion.div>
              )}

              {/* ===== PASSWORD RESET FORM ===== */}
              {authMode === 'reset' && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="relative space-y-4"
                >
                  <div className="flex justify-center mb-2">
                    <motion.div
                      className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <KeyRound className="w-6 h-6 text-white/60" />
                    </motion.div>
                  </div>

                  {renderInput({ field: 'email', type: 'email', placeholder: 'Email address', icon: Mail })}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group/button cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-lg opacity-0 group-hover/button:opacity-50 transition-opacity duration-300" />
                    <div className="relative overflow-hidden bg-white text-gray-900 font-medium h-10 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-gray-900 animate-spin" />
                          </motion.div>
                        ) : (
                          <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-gray-900">
                            Send Reset Link
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    Back to sign in
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Mode toggle link at bottom */}
            {authMode !== 'reset' && registrationStep === 'details' && (
              <motion.p
                className="relative text-center text-xs text-white/60 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {authMode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="relative inline-block group/toggle cursor-pointer bg-transparent border-none p-0"
                    >
                      <span className="relative z-10 text-white/60 group-hover/toggle:text-white/40 transition-colors duration-300 font-medium">
                        Sign up
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="relative inline-block group/toggle cursor-pointer bg-transparent border-none p-0"
                    >
                      <span className="relative z-10 text-white/60 group-hover/toggle:text-white/40 transition-colors duration-300 font-medium">
                        Sign in
                      </span>
                    </button>
                  </>
                )}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
