import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} duration={props.variant === 'destructive' ? 120000 : undefined} {...props}>
            <div className="grid min-w-0 gap-1.5">
              <div className="flex items-center gap-2" aria-label="Margin">
                <img
                  src="/logoimagetwo.png"
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 object-contain brightness-0"
                />
                <span className="font-merriweather text-[12px] font-bold tracking-[-0.02em] text-[#171C20]">
                  Margin
                </span>
              </div>
              {title && title !== 'MARGIN' && (
                <ToastTitle className="text-sm font-bold text-[#26313A]">{title}</ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-[13px] font-normal leading-5 text-[#6B7680]">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
