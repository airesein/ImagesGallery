import React, { useState, useRef, useEffect } from 'react';

// Divider
export const Divider: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`w-full h-[1px] bg-divider flex-shrink-0 ${className}`} />
);

// Card
export const Card: React.FC<{ children: React.ReactNode; className?: string; isPressable?: boolean; onClick?: React.MouseEventHandler<HTMLDivElement> }> = ({ 
  children, 
  className = "", 
  isPressable, 
  onClick 
}) => (
  <div 
    onClick={onClick}
    className={`bg-content1 rounded-large shadow-sm overflow-hidden border border-transparent hover:border-divider transition-all duration-200 ${isPressable ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''} ${className}`}
  >
    {children}
  </div>
);

// Button
export const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: React.MouseEventHandler<HTMLButtonElement>; 
  variant?: 'solid' | 'flat' | 'ghost'; 
  color?: 'primary' | 'default' | 'danger';
  className?: string;
  title?: string;
}> = ({ children, onClick, variant = 'solid', color = 'primary', className = '', title }) => {
  const baseStyles = "px-4 py-2 rounded-medium font-medium transition-colors text-sm flex items-center justify-center gap-2 select-none outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-background";
  
  let colorStyles = "";
  if (variant === 'solid') {
    if (color === 'primary') colorStyles = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20";
    else if (color === 'danger') colorStyles = "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20";
    else colorStyles = "bg-foreground text-background hover:opacity-90";
  } else if (variant === 'flat') {
    if (color === 'primary') colorStyles = "bg-primary/10 text-primary hover:bg-primary/20";
    else if (color === 'danger') colorStyles = "bg-red-500/10 text-red-500 hover:bg-red-500/20";
    else colorStyles = "bg-content2 text-foreground hover:bg-content3";
  } else if (variant === 'ghost') {
    if (color === 'primary') colorStyles = "border border-primary text-primary hover:bg-primary hover:text-primary-foreground";
    else colorStyles = "border border-transparent text-foreground hover:bg-content2";
  }

  return (
    <button onClick={onClick} className={`${baseStyles} ${colorStyles} ${className}`} title={title}>
      {children}
    </button>
  );
};

// Dropdown Menu
interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export const Dropdown: React.FC<{
  trigger: React.ReactNode;
  items: DropdownItem[];
}> = ({ trigger, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-medium bg-content1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-fade-in border border-divider">
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="group flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-content2 transition-colors"
              >
                {item.icon && <span className="mr-3 opacity-70 group-hover:opacity-100">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Textarea (ReadOnly)
export const DisplayTextarea: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
  <div className="flex flex-col gap-2 w-full group">
    <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider ml-1 group-hover:text-foreground/80 transition-colors">{label}</span>
    <div className={`w-full rounded-medium p-3 text-sm text-foreground/80 min-h-[80px] whitespace-pre-line border-2 border-transparent focus-within:border-primary/50 transition-all duration-200 ${className || 'bg-content2/50 hover:bg-content2'}`}>
      {value}
    </div>
  </div>
);

// Tab Item
export const TabItem: React.FC<{ isActive: boolean; label: string; onClick: () => void; icon?: React.ReactNode }> = ({ isActive, label, onClick, icon }) => (
  <div 
    onClick={onClick}
    className={`
      relative w-full px-4 py-3 cursor-pointer rounded-medium transition-all duration-200 flex items-center gap-3 select-none
      ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/60 hover:text-foreground hover:bg-content2'}
    `}
  >
    {icon && <span className={`text-lg ${isActive ? 'opacity-100' : 'opacity-70'}`}>{icon}</span>}
    <span className="truncate">{label}</span>
    {isActive && (
      <div className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(0,111,238,0.5)]" />
    )}
  </div>
);

// Accordion (Clean Style)
export const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full rounded-large overflow-hidden">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold cursor-pointer text-foreground/60 hover:text-foreground transition-colors select-none"
      >
        <span>{title}</span>
        <svg 
          className={`w-4 h-4 text-foreground/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pt-2 px-1">
          {children}
        </div>
      </div>
    </div>
  );
};