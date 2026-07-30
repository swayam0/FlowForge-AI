import { AppLayout } from '@/components/layout/AppLayout';

export default function AppGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
