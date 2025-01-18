import { Toast } from "@radix-ui/react-toast"
import { ReactNode, useState } from "react"

interface ToastMessage {
  message: ReactNode
  type?: "success" | "error" | "loading"
}

export function Toaster() {
  const [message, setMessage] = useState<ToastMessage | null>(null)

  return message ? (
    <Toast
      open={true}
      onOpenChange={() => setMessage(null)}
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm items-center space-x-4 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800"
    >
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-white">
          {message.message}
        </div>
      </div>
    </Toast>
  ) : null
}
