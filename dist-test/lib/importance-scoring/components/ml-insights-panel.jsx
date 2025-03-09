"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLInsightsPanel = void 0;
const react_1 = __importDefault(require("react"));
const MLInsightsPanel = ({ performanceMetrics, recentPredictions, }) => {
    const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;
    const formatDate = (date) => date.toLocaleTimeString();
    return (<div className="space-y-6 p-4 bg-background rounded-lg border">
      <h3 className="text-lg font-semibold">ML Model Insights</h3>

      {/* Performance Metrics */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Performance Metrics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-lg font-medium">{formatPercent(performanceMetrics.accuracy)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Confidence</p>
            <p className="text-lg font-medium">{formatPercent(performanceMetrics.confidence)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Learning Rate</p>
            <p className="text-lg font-medium">{formatPercent(performanceMetrics.learningRate)}</p>
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Recent Predictions</h4>
        <div className="space-y-2">
          {recentPredictions.map((prediction, index) => (<div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
              <div className="space-y-1">
                <p className="text-sm">
                  Predicted: {formatPercent(prediction.predicted)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Actual: {formatPercent(prediction.actual)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(prediction.timestamp)}
              </p>
            </div>))}
        </div>
      </div>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground">
        <p>
          The model learns from user feedback to improve importance scoring accuracy.
          Higher confidence indicates more reliable predictions.
        </p>
      </div>
    </div>);
};
exports.MLInsightsPanel = MLInsightsPanel;
//# sourceMappingURL=ml-insights-panel.jsx.map