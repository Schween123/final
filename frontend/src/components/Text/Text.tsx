const sizes = {
    "5xl": "text-[70px] font-normal md:text-5x1",
    xs: "text-[15px] font-normal",
    lg: "text-3xl font-normal md:text-[28px] sm:text-[26px]",
    s: "text-xl font-light",
    "2xl": "text-[40px] font-normal md:text-[38px] sm:text-4x1",
    "3xl": "text-[45px] font-normal md:text-[41px] sm:text-[35px]",
    "4xl": "text-[50px] font-normal md:text-[46px] sm:text-[40px]",
    xl: "text-[35px] font-normal md:text-[33px] sm:text-[31px]",
    md: "text-[25px] font-normal md:text-[23px] sm:text-[21px]",
};

export type TextProps = Partial<{
    className: string;
    as: any;
    size: keyof typeof sizes;
}> &
React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

const Text: React.FC<React.PropsWithChildren<TextProps>> = ({
    children,
    className = "",
    as,
    size = "lg",
    ...restProps
}) => {
    const Component = as || "p";

    return (
        <Component className={`text-gray-800 font-opensanshebrew ${className} ${sizes[size]}`}
        {...restProps}>
            {children}
        </Component>
    );
};

export { Text };
