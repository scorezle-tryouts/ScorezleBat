import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  activeColorClass: string; // e.g., 'text-blue-500'
  barColorClass: string;    // e.g., 'bg-blue-500'
  isDarkMode: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps, 
  labels, 
  activeColorClass,
  barColorClass,
  isDarkMode
}) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2">
        {labels.map((label, index) => (
          <span 
            key={index} 
            className={`text-xs md:text-sm font-semibold uppercase tracking-wider transition-colors duration-300 ${
              index + 1 <= currentStep ? activeColorClass : (isDarkMode ? 'text-gray-600' : 'text-gray-300')
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div 
          className={`h-full transition-all duration-500 ease-out ${barColorClass}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default StepIndicator;