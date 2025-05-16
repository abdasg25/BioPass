import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast, Toaster } from 'react-hot-toast';
import Navbar from './NavBar';

// Form validation schema
const schema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'OTP must be a 6-digit number')
});

const VerifyOTP = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onBlur'
  });

  // Particle effect
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.className = 'fixed inset-0 pointer-events-none z-0';
    // document.querySelector('.min-h-screen').prepend(canvas);

    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: Math.random() * 0.6 - 0.3,
      speedY: Math.random() * 0.6 - 0.3,
      opacity: Math.random() * 0.4 + 0.2,
      pulse: Math.random() * 0.02 + 0.01
    }));

    let animationFrameId;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity = Math.max(0.2, Math.min(0.6, p.opacity + Math.sin(Date.now() * p.pulse) * 0.1));

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(99, 102, 241, ${p.opacity})`);
        gradient.addColorStop(1, `rgba(79, 70, 229, ${p.opacity * 0.5})`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distance = Math.hypot(p.x - p2.x, p.y - p2.y);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    };
  }, []);

  const onSubmit = async (data) => {
    if (!email) {
      toast.error('Email not found. Please try signing up again.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5002/api/auth/verify-otp-signup', {
        email,
        otp: data.otp
      });

      if (response.data.success) {
        toast.success('OTP verified successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(response.data.message || 'OTP verification failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            className: 'dark:bg-gray-800 dark:text-white',
            style: {
              borderRadius: '0.5rem',
              padding: '1rem'
            }
          }}
        />

        <motion.div
          className="w-full max-w-md relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl overflow-hidden backdrop-blur-sm bg-opacity-90"
            variants={itemVariants}
          >
            <div className="p-8">
              <div className="text-center mb-8">
                <motion.div variants={itemVariants} className="flex justify-center items-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                  <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">BioPass</span>
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold text-gray-900 dark:text-white"
                  variants={itemVariants}
                >
                  Verify Your Email
                </motion.h2>
                <motion.p
                  className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                  variants={itemVariants}
                >
                  Enter the 6-digit OTP sent to {email || 'your email'}
                </motion.p>
              </div>

              <motion.form
                className="space-y-6"
                onSubmit={handleSubmit(onSubmit)}
                variants={itemVariants}
              >
                <motion.div variants={itemVariants} className="relative">
                  <input
                    id="otp"
                    type="text"
                    autoComplete="off"
                    className={`peer w-full px-4 py-3 rounded-lg border ${
                      errors.otp
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-transparent shadow-sm transition duration-200 text-center tracking-widest`}
                    placeholder="123456"
                    maxLength="6"
                    {...register('otp')}
                  />
                  <label
                    htmlFor="otp"
                    className="absolute -top-2.5 left-3 text-sm text-gray-600 dark:text-gray-300 transition-all duration-200 
                    peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
                    peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
                  >
                    OTP Code
                  </label>
                  {errors.otp && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.otp.message}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 relative overflow-hidden group"
                    disabled={loading}
                  >
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></span>
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>

              <motion.div
                className="mt-6 text-center"
                variants={itemVariants}
              >
                <motion.p
                  className="text-sm text-gray-600 dark:text-gray-300"
                  variants={itemVariants}
                >
                  Didn't receive the OTP?{' '}
                  <a
                    href="/signup"
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                  >
                    Try signing up again
                  </a>
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default VerifyOTP;