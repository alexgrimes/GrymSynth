declare module 'chart.js/auto' {
  export * from 'chart.js';
}

declare module 'react-chartjs-2' {
  import { ChartProps } from 'chart.js';
  import React from 'react';

  export interface LineProps extends ChartProps {
    data: any;
    options?: any;
  }

  export const Line: React.FC<LineProps>;
}