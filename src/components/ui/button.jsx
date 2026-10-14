import React from 'react';

export const Button = React.forwardRef(({ className, variant, size, children, ...props }, ref) => {
  // Estilos muito básicos para começar
  const baseStyle = "px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantStyle = variant === "destructive" ? "bg-red-500 hover:bg-red-600 text-white"
                     : variant === "ghost" ? "hover:bg-gray-700"
                     : variant === "secondary" ? "bg-white/10 hover:bg-white/20 text-white"
                     : variant === "outline" ? "border border-white/20 hover:bg-white/10 text-white"
                     : "bg-primary hover:bg-primary/90 text-white"; // Adicionando a cor primária
  const sizeStyle = size === "icon" ? "p-2" : size === "sm" ? "px-3 py-1.5 text-sm" : "";

  // Remova cn(...) se não tiver a função cn (clsx + tailwind-merge)
  return <button className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ''}`} ref={ref} {...props}>{children}</button>;
});
Button.displayName = "Button";
