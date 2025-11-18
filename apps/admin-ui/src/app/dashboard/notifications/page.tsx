// Notifications
// Will make it dynamic after some time

import { Breadcrumb } from 'apps/admin-ui/src/shared/components/navigation/Breadcrumb';

const Notifications = () => {
  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">Notifications</h2>
      {/* BreadCrumbs */}

      <Breadcrumb
        title="Notifications"
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Notifications' },
        ]}
      />

      <p className="text-center pt-24 text-white text-sm font-heading">
        No Notifications Available yet!
      </p>
    </div>
  );
};

export default Notifications;
