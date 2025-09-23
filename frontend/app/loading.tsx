export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      <div className="text-center relative z-10">
        {/* Loading Animation */}
        <div className="w-20 h-20 mx-auto mb-6">
          <div className="w-full h-full border-4 border-[#8B86B8]/20 border-t-[#6B5FA8] rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-serif font-light text-[#6B5FA8] mb-2">
          Preparing Your Sanctuary
        </h2>
        
        <p className="text-[#8B86B8] font-light">
          Just a moment while we set things up for you...
        </p>
      </div>
    </div>
  );
}
