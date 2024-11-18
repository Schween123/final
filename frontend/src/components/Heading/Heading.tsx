const sizes = {
  xl: "text-[70px] font-semibold md:text-5xl",
  s: "text-4xl font-bold md:text-[34px] sm:text-[32px]",
  md: "text-[45px] font-bold md:text-[41px] sm:text-[35px]",
  xs: "text-[35px] font-bold md:text-[33px] sm:text-[31px]",
  lg: "text-[50px] font-semibold md:text-[46px] sm:text-[40px]",
};

export type HeadingProps = Partial<{
  className: string;
  as: any;
  size: keyof typeof sizes;
}> &
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

const Heading: React.FC<React.PropsWithChildren<HeadingProps>> = ({
  children,
  className = "",
  size = "md",
  as,
  ...restProps
}) => {
  const Component = as || "h6";

  return(
    <Component className= {`text-white-A700 font-montserrat ${className} ${sizes[size]}`} {...restProps}>
        {children}
    </Component>
  );
};

export { Heading };