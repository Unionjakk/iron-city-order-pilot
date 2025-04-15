
import React from "react";

interface PinnacleLogoProps {
  className?: string;
}

const PinnacleLogo: React.FC<PinnacleLogoProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 200 50" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="10"
        y="30"
        fontFamily="Arial, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="#16a34a"
      >
        PINNACLE
      </text>
      <path
        d="M 170 15 L 180 25 L 170 35"
        stroke="#16a34a"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
};

export default PinnacleLogo;
