'use client';

import { ForecastForm } from '@/components/forecast/ForecastForm';

export default function ForecastPage() {
  return (
    <div className="space-y-6">
      {/* Page title and description are handled within ForecastForm Card */}
      <ForecastForm />
    </div>
  );
}
