import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default function RoutesLayout(props: { children: ReactNode }) {
  return <>{props.children}</>;
}
