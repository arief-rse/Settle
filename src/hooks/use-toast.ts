import { toast } from 'sonner';

export { toast };
export const useToast = () => ({
  toast,
  dismiss: toast.dismiss,
  error: toast.error,
  success: toast.success,
  loading: toast.loading,
  promise: toast.promise,
});
