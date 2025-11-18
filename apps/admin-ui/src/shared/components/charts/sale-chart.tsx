'use client';

import React from 'react';
import Chart, { Props } from 'react-apexcharts';
import Box from '../box';

export const SaleChart = ({
  ordersData,
}: {
  ordersData?: { month: string; count: number }[];
}) => {
  const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  const chartSeries: Props['series'] = [
    {
      name: 'Sales',
      data: ordersData?.map((d) => d.count) ?? [31, 40, 28, 51, 42, 109, 100],
    },
  ];

  const chartOptions: Props['options'] = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      categories: ordersData?.map((d) => d.month) ?? defaultMonths,
      labels: {
        style: {
          colors: '#cbd5e1',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#cbd5e1',
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.6,
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    colors: ['#4f46e5'],
    grid: {
      borderColor: '#334155',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
    },
  };

  return (
    <Box className="p-4">
      <Chart
        options={chartOptions}
        series={chartSeries}
        type="area"
        width="100%"
        height={300}
      />
    </Box>
  );
};

export default SaleChart;
