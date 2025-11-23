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
              <div className="select-none font-black uppercase tracking-[0.4em] text-[11px] text-gray-500">
                CLARIO
              </div>
              {title && title !== 'CLARIO' && (
                <ToastTitle className="text-[#BBD58E] font-semibold">{title}</ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-white font-normal">{description}</ToastDescription>
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
