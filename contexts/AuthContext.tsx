import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  paymentQrCode: string | null;
  setPaymentQrCode: (base64: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_AUTH_KEY = 'xuanchen_auth_token';
const LOCAL_STORAGE_QR_KEY = 'xuanchen_payment_qr';
const LOCAL_STORAGE_PASSWORD_KEY = 'xuanchen_access_password';

// Default password for access
const DEFAULT_PASSWORD = 'admin123';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [paymentQrCode, setQrCodeState] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string>(DEFAULT_PASSWORD);

  // Load state from local storage on mount
  useEffect(() => {
    const token = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    if (token) {
      setIsLoggedIn(true);
    }
    
    const savedQr = localStorage.getItem(LOCAL_STORAGE_QR_KEY);
    if (savedQr) {
      setQrCodeState(savedQr);
    }

    const savedPassword = localStorage.getItem(LOCAL_STORAGE_PASSWORD_KEY);
    if (savedPassword) {
      setCurrentPassword(savedPassword);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === currentPassword) {
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, 'mock_token_' + Date.now());
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    setIsLoggedIn(false);
  };

  const changePassword = (newPassword: string) => {
    setCurrentPassword(newPassword);
    localStorage.setItem(LOCAL_STORAGE_PASSWORD_KEY, newPassword);
  };

  const setPaymentQrCode = (base64: string | null) => {
    if (base64) {
      localStorage.setItem(LOCAL_STORAGE_QR_KEY, base64);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_QR_KEY);
    }
    setQrCodeState(base64);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, changePassword, paymentQrCode, setPaymentQrCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};