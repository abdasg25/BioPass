// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { toast } from 'react-hot-toast';
// import Navbar from './NavBar';

// const Home = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) {
//       setUser(JSON.parse(storedUser));
//       setLoading(false);
//     } else {
//       toast.error('Please login to access this page');
//       navigate('/login');
//     }

//     const handleStorageChange = () => {
//       const currentUser = localStorage.getItem('user');
//       if (!currentUser) {
//         toast.error('Session expired. Please login again.');
//         navigate('/login');
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, [navigate]);

//   const handleLogout = () => {
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     toast.success('Logged out successfully!');
//     navigate('/login');
//   };

//   // Animation variants
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         duration: 0.5,
//         staggerChildren: 0.1,
//         when: "beforeChildren"
//       }
//     }
//   };

//   const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: 0.5 }
//     }
//   };

//   const buttonVariants = {
//     idle: { scale: 1 },
//     hover: { scale: 1.03, transition: { duration: 0.2 } },
//     tap: { scale: 0.97 }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Navbar />
//       {/* Add pt-16 (4rem) to account for fixed navbar height */}
//       <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 pt-16 relative overflow-hidden">
//         <motion.div
//           className="max-w-4xl mx-auto"
//           variants={containerVariants}
//           initial="hidden"
//           animate="visible"
//         >
//           <motion.div 
//             className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
//             variants={itemVariants}
//           >
//             <div className="p-8 sm:p-10">
//               <motion.div 
//                 className="text-center mb-10"
//                 variants={itemVariants}
//               >
//                 <motion.h1 
//                   className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
//                   variants={itemVariants}
//                 >
//                   Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user.username}</span>!
//                 </motion.h1>
//                 <motion.p 
//                   className="text-base sm:text-lg text-gray-600 dark:text-gray-300"
//                   variants={itemVariants}
//                 >
//                   You've successfully logged in using secure authentication.
//                 </motion.p>
//               </motion.div>

//               <motion.div 
//                 className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10"
//                 variants={itemVariants}
//               >
//                 <motion.div 
//                   className="bg-indigo-50 dark:bg-gray-700 p-6 rounded-lg"
//                   variants={itemVariants}
//                 >
//                   <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">Your Account</h3>
//                   <p className="text-gray-600 dark:text-gray-300 mb-4">
//                     Email: <span className="font-medium">{user.email}</span>
//                   </p>
//                   <p className="text-gray-600 dark:text-gray-300">
//                     Last login: <span className="font-medium">{new Date().toLocaleString()}</span>
//                   </p>
//                 </motion.div>

//                 {/* <motion.div 
//                   className="bg-indigo-50 dark:bg-gray-700 p-6 rounded-lg"
//                   variants={itemVariants}
//                 >
//                   <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
//                   <div className="space-y-3">
//                     <button 
//                       className="w-full text-left px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-600 rounded-md transition-colors"
//                       onClick={() => navigate('/profile')}
//                     >
//                       View Profile
//                     </button>
//                     <button 
//                       className="w-full text-left px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-600 rounded-md transition-colors"
//                       onClick={() => navigate('/settings')}
//                     >
//                       Account Settings
//                     </button>
//                   </div>
//                  </motion.div> */}
//               </motion.div>

//               <motion.div 
//                 className="flex justify-center"
//                 variants={itemVariants}
//               >
//                 <motion.button
//                   onClick={handleLogout}
//                   variants={buttonVariants}
//                   initial="idle"
//                   whileHover="hover"
//                   whileTap="tap"
//                   className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
//                 >
//                   Logout
//                 </motion.button>
//               </motion.div>
//             </div>
//           </motion.div>

//           <motion.div 
//             className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm"
//             variants={itemVariants}
//           >
//             <p>Secure authentication provided by BioPass</p>
//           </motion.div>
//         </motion.div>
//       </div>
//     </>
//   );
// };

// export default Home;


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Navbar from './NavBar';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Particle effect
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.className = 'fixed inset-0 pointer-events-none z-0';
    // document.querySelector('.h-screen').prepend(canvas);

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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    } else {
      toast.error('Please login to access this page');
      navigate('/login');
    }

    const handleStorageChange = () => {
      const currentUser = localStorage.getItem('user');
      if (!currentUser) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 pt-16 relative overflow-hidden">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            variants={itemVariants}
          >
            <div className="p-8 sm:p-10">
              <motion.div 
                className="text-center mb-10"
                variants={itemVariants}
              >
                <motion.div className="flex justify-center items-center mb-4">
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
                <motion.h1 
                  className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                  variants={itemVariants}
                >
                  Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user.username}</span>!
                </motion.h1>
                <motion.p 
                  className="text-base sm:text-lg text-gray-600 dark:text-gray-300"
                  variants={itemVariants}
                >
                  You've successfully logged in using secure authentication.
                </motion.p>
              </motion.div>

              <motion.div 
                className="flex justify-center mb-10"
                variants={itemVariants}
              >
                <motion.div 
                  className="bg-indigo-50 dark:bg-gray-700 p-6 rounded-lg w-full max-w-md"
                  variants={itemVariants}
                >
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">My Account</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Email: <span className="font-medium">{user.email}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Last login: <span className="font-medium">{new Date().toLocaleString()}</span>
                  </p>
                </motion.div>
              </motion.div>

              <motion.div 
                className="flex justify-center"
                variants={itemVariants}
              >
                <motion.button
                  onClick={handleLogout}
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Logout
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm"
            variants={itemVariants}
          >
            <p>Secure authentication provided by BioPass</p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Home;