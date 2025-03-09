"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingVisualization = void 0;
const react_1 = __importDefault(require("react"));
const card_1 = require("@/components/ui/card");
require("chart.js/auto");
const react_chartjs_2_1 = require("react-chartjs-2");
const TrainingMetricsChart = ({ data }) => {
    const chartData = {
        labels: data.epochs,
        datasets: [
            {
                label: 'Loss',
                data: data.loss,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Accuracy',
                data: data.accuracy,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            ...(data.validationLoss ? [{
                    label: 'Validation Loss',
                    data: data.validationLoss,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    borderDash: [5, 5],
                }] : []),
            ...(data.validationAccuracy ? [{
                    label: 'Validation Accuracy',
                    data: data.validationAccuracy,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderDash: [5, 5],
                }] : []),
        ],
    };
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Training Metrics',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };
    return <react_chartjs_2_1.Line data={chartData} options={options}/>;
};
const FeatureImportanceChart = ({ data }) => {
    const sortedFeatures = Array.from(data.entries())
        .sort((a, b) => b[1] - a[1]);
    const chartData = {
        labels: sortedFeatures.map(([feature]) => feature),
        datasets: [
            {
                label: 'Feature Importance',
                data: sortedFeatures.map(([_, value]) => value),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                borderColor: 'rgb(53, 162, 235)',
                borderWidth: 1,
            },
        ],
    };
    const options = {
        indexAxis: 'y',
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Feature Importance',
            },
        },
    };
    return <react_chartjs_2_1.Line data={chartData} options={options}/>;
};
const TrainingVisualization = ({ trainingMetrics, featureImportance, }) => {
    return (<div className="training-visualization">
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Model Training Progress</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="w-full">
              <TrainingMetricsChart data={trainingMetrics}/>
            </div>
            <div className="w-full">
              <FeatureImportanceChart data={featureImportance}/>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
};
exports.TrainingVisualization = TrainingVisualization;
//# sourceMappingURL=training-visualization.jsx.map