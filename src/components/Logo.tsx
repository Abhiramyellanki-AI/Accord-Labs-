import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 text-white", className)}>
      <div className="flex items-center justify-center">
        <svg 
          width="42" 
          height="42" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>
          
          {/* Stylized "A" Frame */}
          <path 
            d="M50 15L20 85H35L50 45L65 85H80L50 15Z" 
            fill="url(#logo-gradient)" 
            fillOpacity="0.15"
          />
          <path 
            d="M50 15L20 85M50 15L80 85" 
            stroke="url(#logo-gradient)" 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Network Nodes (Left Side) */}
          <circle cx="38" cy="48" r="4.5" fill="url(#logo-gradient)" />
          <circle cx="48" cy="38" r="4.5" fill="url(#logo-gradient)" />
          <circle cx="48" cy="58" r="4.5" fill="url(#logo-gradient)" />
          <line x1="38" y1="48" x2="48" y2="38" stroke="url(#logo-gradient)" strokeWidth="2.5" />
          <line x1="38" y1="48" x2="48" y2="58" stroke="url(#logo-gradient)" strokeWidth="2.5" />
          <line x1="48" y1="38" x2="48" y2="58" stroke="url(#logo-gradient)" strokeWidth="2.5" />

          {/* Grid (Right Side) */}
          <rect x="58" y="42" width="9" height="9" rx="1.5" fill="url(#logo-gradient)" fillOpacity="0.9" />
          <rect x="69" y="42" width="9" height="9" rx="1.5" fill="url(#logo-gradient)" fillOpacity="0.7" />
          <rect x="58" y="53" width="9" height="9" rx="1.5" fill="url(#logo-gradient)" fillOpacity="0.5" />
          <rect x="69" y="53" width="9" height="9" rx="1.5" fill="url(#logo-gradient)" fillOpacity="0.3" />
        </svg>
      </div>
      {!iconOnly && (
        <span className="text-2xl font-extrabold tracking-tight font-display">
          AccordLabs
        </span>
      )}
    </div>
  );
}
