'use client';

const EventsPage = () => {
  return (
    <div className="p-8 min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center max-w-md">
        {/* Animated Calendar Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-1/3 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
          <div className="absolute bottom-2 left-1/3 w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300" />
        </div>

        {/* Heading */}
        <h1 className="text-white text-3xl font-bold mb-3">
          Events &amp; Promotions
        </h1>
        <p className="text-purple-400 text-lg font-medium mb-6">Coming Soon</p>

        {/* Description */}
        <p className="text-slate-400 mb-8 leading-relaxed">
          We are working on powerful promotional tools to help you manage
          flash sales, discount campaigns, and special events across the platform.
        </p>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Flash Sales</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Create time-limited sales with countdown timers
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Discount Campaigns</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Schedule promotional campaigns with custom rules
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Analytics Dashboard</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Track event performance with detailed reports
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-slate-300 text-sm">In Development</span>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
