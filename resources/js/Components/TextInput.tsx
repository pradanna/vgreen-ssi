import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
    ref,
) {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-2xl border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-slate-800 shadow-xs focus:bg-white focus:border-[#2D60FF] focus:ring-4 focus:ring-blue-500/10 transition ' +
                className
            }
            ref={localRef}
        />
    );
});
