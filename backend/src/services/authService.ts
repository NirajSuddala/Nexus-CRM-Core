import crypto from 'crypto';
import { User } from '../models';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import { sendPasswordResetEmail } from '../config/email';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../models/User';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
  token: string;
  refreshToken: string;
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const existingUser = await User.findOne({ where: { email: data.email } });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({
    email: data.email,
    passwordHash: data.password,
    fullName: data.fullName,
    role: data.role || 'sales_rep',
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    token,
    refreshToken,
  };
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const user = await User.findOne({ where: { email: data.email } });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await user.comparePassword(data.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    token,
    refreshToken,
  };
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    // Don't reveal if email exists
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await user.update({
    resetToken,
    resetTokenExpires,
  });

  try {
    await sendPasswordResetEmail(email, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw error to prevent email enumeration
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const user = await User.findOne({
    where: {
      resetToken: token,
    },
  });

  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  await user.update({
    passwordHash: newPassword,
    resetToken: null,
    resetTokenExpires: null,
  });
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.toJSON();
};
