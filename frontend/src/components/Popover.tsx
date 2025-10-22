import { useState, useRef, useEffect, ReactNode, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '../hooks/useClickOutside.ts';
import { useEscapeKey } from '../hooks/useEscapeKey.ts';
import classNames from 'classnames';

type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';
type PopoverTrigger = 'click' | 'hover';

type PopoverProps = {
  trigger: ReactNode;
  content: ReactNode;
  placement?: PopoverPlacement;
  triggerType?: PopoverTrigger;
  offset?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & HTMLAttributes<HTMLDivElement>;

const Popover = ({
  trigger,
  content,
  placement = 'bottom',
  triggerType = 'click',
  offset = 8,
  disabled = false,
  className,
  contentClassName,
  open: controlledOpen,
  onOpenChange,
  ...props
}: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top + scrollY - contentRect.height - offset;
        left = triggerRect.left + scrollX + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + offset;
        left = triggerRect.left + scrollX + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.left + scrollX - contentRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.right + scrollX + offset;
        break;
    }

    // Ensure popover stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < scrollX + 8) {
      left = scrollX + 8;
    } else if (left + contentRect.width > scrollX + viewportWidth - 8) {
      left = scrollX + viewportWidth - contentRect.width - 8;
    }

    if (top < scrollY + 8) {
      top = scrollY + 8;
    } else if (top + contentRect.height > scrollY + viewportHeight - 8) {
      top = scrollY + viewportHeight - contentRect.height - 8;
    }

    setPosition({ top, left });
  }, [placement, offset]);

  useEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) {
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [open, updatePosition]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (triggerType === 'click') {
      setOpen(!open);
    }
  }, [disabled, triggerType, open, setOpen]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    if (triggerType === 'hover') {
      setOpen(true);
    }
  }, [disabled, triggerType, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    if (triggerType === 'hover') {
      setOpen(false);
    }
  }, [disabled, triggerType, setOpen]);

  useClickOutside(triggerRef, () => {
    if (open && triggerType === 'click') {
      setOpen(false);
    }
  });

  useEscapeKey(() => {
    if (open) {
      setOpen(false);
    }
  });

  const triggerProps = {
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    'aria-expanded': open,
    'aria-haspopup': 'dialog' as const,
    'aria-disabled': disabled,
    tabIndex: disabled ? -1 : 0
  };

  return (
    <div
      className={classNames('popover', className)}
      ref={triggerRef}
      {...props}
    >
      <div {...triggerProps} className="popover__trigger">
        {trigger}
      </div>

      {open && createPortal(
        <div
          className={classNames('popover__content', contentClassName, `popover__content--${placement}`)}
          style={{ position: 'absolute', top: position.top, left: position.left, zIndex: 1000 }}
          ref={contentRef}
          role="dialog"
          aria-modal="false"
        >
          <div className="popover__arrow" />
          {content}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Popover;