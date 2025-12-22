import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { forgotPassword } from '../../features/authSlice';
import { Button, Input } from '../../components/ui';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const result = await dispatch(forgotPassword(data.email));
    if (forgotPassword.fulfilled.match(result)) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-900">Nexus CRM</h1>
          <p className="mt-2 text-slate-600">Reset your password</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-600 mb-6">
                If an account exists for that email, we've sent password reset instructions.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="you@example.com"
                />

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Send reset link
                </Button>
              </form>

              <Link
                to="/login"
                className="mt-6 flex items-center justify-center text-sm text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
