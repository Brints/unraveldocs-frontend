export interface AreaChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth?: number;
    fill: boolean;
    tension?: number;
  }[];
}
