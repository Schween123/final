const shapes = {
  round: "rounded-[15px]",
  square: "rounded-[0px]",
} as const;
const variants = {
  fill: {
  },
  blue_gray_100: "bg-blue_gray-100 text-cyan-800",
  cyan_800: "bg-cyan-800 text-white-A700",
} as const;
const sizes = {
  xs: "h-[57px] px-[35px] text-[35px]",
  md: "h-[77px] px-[23px] text-[40px]",
  sm: "h-[74px] px-[35px] text-[45px]",
} as const;
type ButtonProps = Omit<
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
  "onClick"
> &
Partial<{
  className: string;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  onClick: () => void;
  shape: keyof typeof shapes;
  variant: keyof typeof variants;
  size: keyof typeof sizes;
  color: string;
  }>;
  const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  children,
  className = "",
  leftIcon,
  rightIcon,
  shape,
  variant = "fill",
  size = "xs",
  color = "cyan_800",
  ...restProps
  }) => {
  return (
  <button
  className={`$${className} flex flex-row items-center justify-center text-center cursor-pointer 
            ${(shape && shapes[shape]) || ""} ${(size && sizes[size]) || ""} 
            ${(variant && variants[variant]?.[color as keyof (typeof variants)[typeof variant]]) || ""}`}
            {...restProps}
        >
            {!!leftIcon && leftIcon}
            {children}
            {!!rightIcon && rightIcon}
  </button>
  );
  };

  export { Button };