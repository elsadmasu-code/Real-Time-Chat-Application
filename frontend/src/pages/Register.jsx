import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, reset } from '../store/slices/authSlice';
import { MessageSquare } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const { name, email, phone, password, confirmPassword } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      alert(message);
    }
    if (isSuccess || user) {
      navigate('/');
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
    } else {
      dispatch(register({ name, email, phone, password }));
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto p-4">
      <div className="flex min-h-full flex-col items-center justify-center py-8">
        <div className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-lg">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">Sign up to get started</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Full Name</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-accent"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-accent"
              placeholder="john@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={onChange}
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-accent"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-accent py-3 font-semibold text-white transition hover:bg-accent/80 focus:ring-4 focus:ring-accent/50"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Login here
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
};

export default Register;
