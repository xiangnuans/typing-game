import React from "react";

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-white h-16 w-16"></div>
      <span className="ml-3 text-white text-2xl">Loading...</span>
    </div>
  );
};

export default Loading;
