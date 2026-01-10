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
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              <img
                src="/logoimagetwo.png"
                alt="Margin"
                className="h-2.5 w-auto object-contain"
              />
              {title && title !== 'MARGIN' && (
                <ToastTitle className="text-xs font-semibold text-gray-900">{title}</ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-[10px] text-gray-600 font-normal">{description}</ToastDescription>
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
