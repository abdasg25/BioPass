// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { motion } from 'framer-motion';
// import { useForm } from 'react-hook-form';
// import { yupResolver } from '@hookform/resolvers/yup';
// import * as yup from 'yup';
// import { toast, Toaster } from 'react-hot-toast';
// import PasskeyQRLogin from './PasskeyQRLogin';
// import Navbar from './NavBar';

// // Form validation schema
// const schema = yup.object({
//   email: yup
//     .string()
//     .email('Please enter a valid email')
//     .required('Email is required'),
//   password: yup
//     .string()
//     .required('Password is required')
//     .min(6, 'Password must be at least 6 characters')
// });

// const Login = () => {
//   const [loading, setLoading] = useState(false);
//   const [showQR, setShowQR] = useState(false);
//   const navigate = useNavigate();
  
//   const {
//     register,
//     handleSubmit,
//     formState: { errors }
//   } = useForm({
//     resolver: yupResolver(schema),
//     mode: 'onBlur'
//   });

//   const onSubmit = async (data) => {
//     setLoading(true);
//     try {
//       const response = await axios.post('http://localhost:5002/api/auth/login', {
//         email: data.email,
//         password: data.password
//       });
      
//       if (response.data.success) {
//         localStorage.setItem('user', JSON.stringify(response.data.user));
//         localStorage.setItem('token', response.data.token);
//         toast.success('Login successful! Redirecting...');
//         setTimeout(() => navigate('/'), 1500);
//       } else {
//         toast.error(response.data.message || 'Login failed.');
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Login failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Animation variants
//   const containerVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { 
//       opacity: 1, 
//       y: 0,
//       transition: { 
//         duration: 0.5,
//         ease: "easeOut",
//         when: "beforeChildren",
//         staggerChildren: 0.1
//       }
//     }
//   };
  
//   const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { 
//       opacity: 1, 
//       y: 0,
//       transition: { duration: 0.3 }
//     }
//   };

//   const buttonVariants = {
//     idle: { scale: 1 },
//     hover: { scale: 1.02, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
//     tap: { scale: 0.98 }
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//         <Toaster 
//           position="top-right" 
//           toastOptions={{ 
//             duration: 3000,
//             className: 'dark:bg-gray-800 dark:text-white',
//             style: {
//               borderRadius: '0.5rem',
//               padding: '1rem',
//             }
//           }} 
//         />
        
//         <motion.div
//           className="w-full max-w-md"
//           variants={containerVariants}
//           initial="hidden"
//           animate="visible"
//         >
//           <motion.div 
//             className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden"
//             variants={itemVariants}
//           >
//             <div className="p-8">
//               <div className="text-center mb-8">
//                 <motion.h2 
//                   className="text-3xl font-bold text-gray-900 dark:text-white"
//                   variants={itemVariants}
//                 >
//                   Welcome Back
//                 </motion.h2>
//                 <motion.p 
//                   className="mt-2 text-sm text-gray-600 dark:text-gray-300"
//                   variants={itemVariants}
//                 >
//                   Sign in to access your account
//                 </motion.p>
//               </div>

//               <motion.form 
//                 className="space-y-6" 
//                 onSubmit={handleSubmit(onSubmit)}
//                 variants={itemVariants}
//               >
//                 <motion.div variants={itemVariants}>
//                   <label 
//                     htmlFor="email" 
//                     className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
//                   >
//                     Email address
//                   </label>
//                   <input
//                     id="email"
//                     type="email"
//                     autoComplete="email"
//                     className={`w-full px-4 py-3 rounded-lg border ${
//                       errors.email 
//                         ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
//                         : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
//                     } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition duration-200`}
//                     placeholder="you@example.com"
//                     {...register('email')}
//                   />
//                   {errors.email && (
//                     <p className="mt-1 text-sm text-red-600 dark:text-red-400">
//                       {errors.email.message}
//                     </p>
//                   )}
//                 </motion.div>

//                 <motion.div variants={itemVariants}>
//                   <div className="flex justify-between items-center">
//                     <label 
//                       htmlFor="password" 
//                       className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
//                     >
//                       Password
//                     </label>
//                     <a 
//                       href="/forgot-password" 
//                       className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
//                     >
//                       Forgot password?
//                     </a>
//                   </div>
//                   <input
//                     id="password"
//                     type="password"
//                     autoComplete="current-password"
//                     className={`w-full px-4 py-3 rounded-lg border ${
//                       errors.password 
//                         ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
//                         : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
//                     } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition duration-200`}
//                     placeholder="••••••••"
//                     {...register('password')}
//                   />
//                   {errors.password && (
//                     <p className="mt-1 text-sm text-red-600 dark:text-red-400">
//                       {errors.password.message}
//                     </p>
//                   )}
//                 </motion.div>

//                 <motion.div variants={itemVariants}>
//                   <motion.button
//                     type="submit"
//                     variants={buttonVariants}
//                     initial="idle"
//                     whileHover="hover"
//                     whileTap="tap"
//                     className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
//                     disabled={loading}
//                   >
//                     {loading ? (
//                       <>
//                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                         Processing...
//                       </>
//                     ) : (
//                       'Sign in'
//                     )}
//                   </motion.button>
//                 </motion.div>
//               </motion.form>

//               <motion.div 
//                 className="mt-6 relative"
//                 variants={itemVariants}
//               >
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
//                     Or continue with
//                   </span>
//                 </div>
//               </motion.div>

//               <motion.div 
//                 className="mt-6 grid grid-cols-1 gap-3"
//                 variants={itemVariants}
//               >
//                 <motion.button
//                   type="button"
//                   variants={buttonVariants}
//                   initial="idle"
//                   whileHover="hover"
//                   whileTap="tap"
//                   className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
//                   onClick={() => setShowQR(!showQR)}
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
//                   </svg>
//                   {showQR ? 'Hide QR Login' : 'QR Code Login'}
//                 </motion.button>
//               </motion.div>

//               <motion.div
//                 initial={{ height: 0, opacity: 0 }}
//                 animate={{ 
//                   height: showQR ? 'auto' : 0, 
//                   opacity: showQR ? 1 : 0
//                 }}
//                 transition={{ duration: 0.3, ease: "easeInOut" }}
//                 className="overflow-hidden mt-4"
//               >
//                 {showQR && (
//                   <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
//                     <PasskeyQRLogin 
//                       onSuccess={() => {
//                         setShowQR(false);
//                         toast.success('QR login successful! Redirecting...');
//                         setTimeout(() => navigate('/'), 1500);
//                       }}
//                       onError={(error) => toast.error(error.message)}
//                     />
//                   </div>
//                 )}
//               </motion.div>
//             </div>

//             <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-center">
//               <motion.p 
//                 className="text-sm text-gray-600 dark:text-gray-300"
//                 variants={itemVariants}
//               >
//                 Don't have an account?{' '}
//                 <a 
//                   href="/signup" 
//                   className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
//                 >
//                   Sign up
//                 </a>
//               </motion.p>
//             </div>
//           </motion.div>
//         </motion.div>
//       </div>
//     </>
//   );
// };

// export default Login;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast, Toaster } from 'react-hot-toast';
import PasskeyQRLogin from './PasskeyQRLogin';
import Navbar from './NavBar';

// Form validation schema
const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
});

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();
  
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

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.remove();
    };
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5002/api/auth/login', {
        email: data.email,
        password: data.password
      });
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        toast.success('Login successful! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        toast.error(response.data.message || 'Login failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
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
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
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
          position="bottom-left" 
          toastOptions={{ 
            duration: 3000,
            className: 'dark:bg-gray-800 dark:text-white',
            style: {
              borderRadius: '0.5rem',
              padding: '1rem',
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
                <motion.h2 
                  className="text-3xl font-bold text-gray-900 dark:text-white"
                  variants={itemVariants}
                >
                  Welcome Back
                </motion.h2>
                <motion.p 
                  className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                  variants={itemVariants}
                >
                  Sign in to access your account
                </motion.p>
              </div>

              <motion.form 
                className="space-y-6" 
                onSubmit={handleSubmit(onSubmit)}
                variants={itemVariants}
              >
                <motion.div variants={itemVariants} className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`peer w-full px-4 py-3 rounded-lg border ${
                      errors.email 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-transparent shadow-sm transition duration-200`}
                    placeholder="Email address"
                    {...register('email')}
                  />
                  <label 
                    htmlFor="email" 
                    className="absolute -top-2.5 left-3 text-sm text-gray-600 dark:text-gray-300 transition-all duration-200 
                    peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
                    peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
                  >
                    Email address
                  </label>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                  <div className="flex justify-between items-center">
                    <div />
                    {/* <a 
                      href="/forgot-password" 
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </a> */}
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className={`peer w-full px-4 py-3 rounded-lg border ${
                      errors.password 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-transparent shadow-sm transition duration-200`}
                    placeholder="Password"
                    {...register('password')}
                  />
                  <label 
                    htmlFor="password" 
                    // className="absolute -top-2.5 left-3 text-sm text-gray-600 dark:text-gray-300 transition-all duration-200 
                    // peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 
                    // peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
                    className="absolute -top-0.25 left-3 text-sm text-gray-600 dark:text-gray-300 transition-all duration-200
           peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500
           peer-focus:-top-1.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"

                  >
                    Password
                  </label>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.password.message}
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
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>

              <motion.div 
                className="mt-6 relative"
                variants={itemVariants}
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </motion.div>

              <motion.div 
                className="mt-6 grid grid-cols-1 gap-3"
                variants={itemVariants}
              >
                <motion.button
                  type="button"
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 relative overflow-hidden group"
                  onClick={() => setShowQR(!showQR)}
                >
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  {showQR ? 'Hide QR Login' : 'QR Code Login'}
                </motion.button>
              </motion.div>

              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: 'auto', 
                      opacity: 1,
                      transition: { duration: 0.3, ease: "easeInOut" }
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0,
                      transition: { duration: 0.3, ease: "easeInOut" }
                    }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <PasskeyQRLogin 
                        onSuccess={() => {
                          setShowQR(false);
                          toast.success('QR login successful! Redirecting...');
                          setTimeout(() => navigate('/'), 1500);
                        }}
                        onError={(error) => toast.error(error.message)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-center">
              <motion.p 
                className="text-sm text-gray-600 dark:text-gray-300"
                variants={itemVariants}
              >
                Don't have an account?{' '}
                <a 
                  href="/signup" 
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  Sign up
                </a>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;