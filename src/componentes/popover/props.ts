export interface IPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<any>;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}