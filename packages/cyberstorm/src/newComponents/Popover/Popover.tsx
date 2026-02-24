import * as PopoverPrimitive from "@radix-ui/react-popover";
import { type ReactElement, type ReactNode, memo } from "react";

import { classnames } from "../../utils/utils";
import "./Popover.css";

export interface PopoverProps {
  trigger: ReactNode | ReactElement;
  children: ReactNode;
  rootClasses?: string;
  contentAlignment?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Popover = memo(function Popover(props: PopoverProps) {
  const {
    trigger,
    children,
    rootClasses,
    contentAlignment = "center",
    side = "bottom",
    sideOffset = 8,
    open,
    onOpenChange,
  } = props;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={contentAlignment}
          side={side}
          sideOffset={sideOffset}
          className={classnames("popover", rootClasses)}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});

Popover.displayName = "Popover";
