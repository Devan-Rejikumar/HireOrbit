import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1a1a,_#000)]">
        <div className="absolute w-1 h-1 bg-white rounded-full top-10 left-20 animate-pulse"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full top-1/3 left-1/2 animate-pulse"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full bottom-20 right-20 animate-pulse"></div>
        <div className="absolute w-1 h-1 bg-white rounded-full bottom-1/3 left-1/4 animate-pulse"></div>
      </div>

      {/* Floating Astronaut */}
      <motion.img
        src="https://cdn-icons-png.flaticon.com/512/3212/3212608.png" // astronaut png
        alt="Astronaut"
        className="w-48 h-48 z-10"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Text */}
      <div className="text-center mt-6 z-10">
        <h1 className="text-7xl font-bold text-white drop-shadow-lg">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-300">
          Lost in Space
        </h2>
        <p className="mt-2 text-gray-400">
          The page you are looking for drifted into another galaxy.
        </p>

        {/* Buttons */}
        <div className="mt-6 space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
