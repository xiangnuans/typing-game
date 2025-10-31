import React from "react";

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-bg text-text">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-primary h-16 w-16"></div>
      <span className="ml-3 text-2xl">Loading...</span>
    </div>
  );
};

export default Loading;
