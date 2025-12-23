import { User } from '../models';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../models/User';

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
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
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    role: data.role || 'agent',
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

  // Password reset requires additional User model fields (resetToken, resetTokenExpires)
  // For now, just log the attempt - implement full reset when DB schema is updated
  console.log(`Password reset requested for: ${email}`);
};

export const resetPassword = async (_token: string, _newPassword: string): Promise<void> => {
  // Password reset requires additional User model fields (resetToken, resetTokenExpires)
  // For now, throw error - implement when DB schema is updated
  throw new AppError('Password reset is not yet implemented', 501);
};

export const getCurrentUser = async (userId: string): Promise<{
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  companyId: string | null;
  fullName: string;
  createdAt?: Date;
  updatedAt?: Date;
}> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.toJSON();
};
