import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ActionDropdownProps {
    /**
     * The trigger element (e.g. 3-dot button)
     */
    trigger: ReactNode | ((isOpen: boolean) => ReactNode);
    /**
     * Menu contents (action buttons, links, divider, etc.)
     */
    children: ReactNode | ((helpers: { close: () => void }) => ReactNode);
    /**
     * Controlled open state (optional)
     */
    isOpen?: boolean;
    /**
     * Callback when open state changes
     */
    onToggle?: (open: boolean) => void;
    /**
     * Horizontal alignment relative to trigger ('right' or 'left'). Default is 'right'.
     */
    align?: 'right' | 'left';
    /**
     * Width class or custom className for the floating menu container
     */
    className?: string;
    /**
     * Custom width in pixels for accurate edge calculation (default: 192px / 12rem)
     */
    width?: number;
    /**
     * Automatically close menu when any menu item inside is clicked. Default: true.
     */
    closeOnItemClick?: boolean;
}

export default function ActionDropdown({
    trigger,
    children,
    isOpen: controlledOpen,
    onToggle,
    align = 'right',
    className = 'w-48',
    width = 192,
    closeOnItemClick = true,
}: ActionDropdownProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = typeof controlledOpen === 'boolean';
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [coords, setCoords] = useState<{
        top?: number;
        bottom?: number;
        left: number;
        placement: 'bottom' | 'top';
    } | null>(null);

    const handleSetOpen = useCallback((newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        if (onToggle) {
            onToggle(newOpen);
        }
    }, [isControlled, onToggle]);

    const handleClose = useCallback(() => {
        handleSetOpen(false);
    }, [handleSetOpen]);

    const handleTriggerClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleSetOpen(!isOpen);
    };

    // Calculate fixed positioning relative to viewport
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const menuWidth = width;
        const estimatedMenuHeight = 170; // buffer for 3-4 items

        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

        let left = align === 'right' ? rect.right - menuWidth : rect.left;

        // Ensure within horizontal viewport bounds
        if (left + menuWidth > window.innerWidth - 8) {
            left = window.innerWidth - menuWidth - 8;
        }
        if (left < 8) {
            left = 8;
        }

        if (openUpwards) {
            // Position above the trigger button
            setCoords({
                bottom: window.innerHeight - rect.top + 6,
                left,
                placement: 'top',
            });
        } else {
            // Position below the trigger button
            setCoords({
                top: rect.bottom + 6,
                left,
                placement: 'bottom',
            });
        }
    }, [align, width]);

    // Recalculate on open
    useEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [isOpen, updatePosition]);

    // Dismiss listeners: Outside click, window scroll/resize, Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleMouseDown = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            if (
                menuRef.current && !menuRef.current.contains(target) &&
                triggerRef.current && !triggerRef.current.contains(target)
            ) {
                handleClose();
            }
        };

        const handleScroll = () => {
            handleClose();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleMouseDown, true);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown, true);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleClose]);

    // SSR safety check
    const isBrowser = typeof document !== 'undefined';

    return (
        <div ref={triggerRef} className="inline-block relative" onClick={(e) => e.stopPropagation()}>
            {/* Trigger element */}
            <div onClick={handleTriggerClick}>
                {typeof trigger === 'function' ? trigger(isOpen) : trigger}
            </div>

            {/* Floating Portal Menu (Escape from container bounds) */}
            {isOpen && isBrowser && coords && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: coords.top !== undefined ? `${coords.top}px` : undefined,
                        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
                        left: `${coords.left}px`,
                        zIndex: 9999,
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (closeOnItemClick) {
                            handleClose();
                        }
                    }}
                    className={`bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 text-left font-sans animate-in fade-in zoom-in-95 duration-100 ${className}`}
                >
                    {typeof children === 'function' ? children({ close: handleClose }) : children}
                </div>,
                document.body
            )}
        </div>
    );
}
