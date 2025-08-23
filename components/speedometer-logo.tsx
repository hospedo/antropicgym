'use client'

interface SpeedometerLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  animated?: boolean
}

export default function SpeedometerLogo({ 
  size = 'md', 
  showText = true, 
  animated = false 
}: SpeedometerLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Speedometer SVG */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 80 A 30 30 0 0 1 80 80"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <path
            d="M 20 80 A 30 30 0 0 1 80 80"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="94.2"
            strokeDashoffset={animated ? "0" : "23.55"}
            className={animated ? "animate-pulse" : ""}
            style={animated ? {
              animation: "dash 2s ease-in-out infinite alternate"
            } : {}}
          />
          
          {/* Needle */}
          <line
            x1="50"
            y1="80"
            x2="65"
            y2="45"
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
            className={animated ? "animate-pulse" : ""}
          />
          
          {/* Center dot */}
          <circle
            cx="50"
            cy="80"
            r="4"
            fill="#dc2626"
          />
          
          {/* 0 marker */}
          <text
            x="15"
            y="85"
            fontSize="12"
            fill="#374151"
            fontWeight="bold"
            textAnchor="middle"
          >
            0
          </text>
          
          {/* 100 marker */}
          <text
            x="85"
            y="85"
            fontSize="12"
            fill="#dc2626"
            fontWeight="bold"
            textAnchor="middle"
          >
            100
          </text>
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Text Logo */}
      {showText && (
        <div className={`font-bold ${textSizeClasses[size]}`}>
          <span className="text-gray-900">De</span>
          <span className="text-red-600">0a100</span>
        </div>
      )}
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes dash {
          from {
            stroke-dashoffset: 94.2;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}