import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ResetPassword() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  
  const email = watch('email');

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.post('/auth/send-reset-code', { email });
      if (res.data.success) {
        setSuccess(res.data.message);
        setCodeSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/reset-password', {
        email: data.email,
        code: data.code,
        new_password: data.newPassword
      });
      
      if (res.data.success) {
        setSuccess(res.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#f2f4f5]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/logo.jpg" alt="EcoSync Logo" className="mx-auto h-16 w-auto rounded-xl shadow-sm mb-4" />
        <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-gray-900">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 hover:underline">
            Back to login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-200 sm:rounded-lg sm:px-10 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded bg-green-50 p-3 border border-green-200">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="email"
                  type="email"
                  disabled={codeSent}
                  {...register('email', { required: 'Email is required' })}
                  className="block w-full appearance-none rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm disabled:bg-gray-100"
                />
                {!codeSent && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded border border-transparent bg-teal-100 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    Send Code
                  </button>
                )}
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {codeSent && (
              <>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="code"
                      type="text"
                      placeholder="6-digit code"
                      {...register('code', { required: 'Verification code is required' })}
                      className="block w-full appearance-none rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                    />
                    {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="newPassword"
                      type="password"
                      {...register('newPassword', { 
                        required: 'New password is required',
                        minLength: { value: 6, message: 'Must be at least 6 characters' }
                      })}
                      className="block w-full appearance-none rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                    />
                    {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center rounded border border-transparent bg-teal-600 py-2 px-4 text-sm font-bold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-70 transition-colors"
                  >
                    {loading ? 'Resetting...' : 'Verify & Reset Password'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
