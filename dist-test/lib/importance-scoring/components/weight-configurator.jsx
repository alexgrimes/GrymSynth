"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightConfigurator = void 0;
const react_1 = __importDefault(require("react"));
const slider_1 = require("../../../components/ui/slider");
const label_1 = require("../../../components/ui/label");
const WeightConfigurator = ({ weights, onWeightChange, mlWeight, onMLWeightChange, }) => {
    const weightCategories = Object.entries(weights).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        key,
        value,
    }));
    return (<div className="space-y-6 p-4 bg-background rounded-lg border">
      <h3 className="text-lg font-semibold">Weight Configuration</h3>
      
      {/* Traditional weights */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Traditional Scoring Weights</h4>
        {weightCategories.map(({ label, key, value }) => (<div key={key} className="space-y-2">
            <div className="flex justify-between">
              <label_1.Label>{label}</label_1.Label>
              <span className="text-sm text-muted-foreground">
                {(value * 100).toFixed(0)}%
              </span>
            </div>
            <slider_1.Slider value={[value * 100]} min={0} max={100} step={1} onValueChange={(newValue) => {
                onWeightChange(key, newValue[0] / 100);
            }}/>
          </div>))}
      </div>

      {/* ML weight */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between">
          <label_1.Label>ML Model Influence</label_1.Label>
          <span className="text-sm text-muted-foreground">
            {(mlWeight * 100).toFixed(0)}%
          </span>
        </div>
        <slider_1.Slider value={[mlWeight * 100]} min={10} max={90} step={1} onValueChange={(newValue) => onMLWeightChange(newValue[0] / 100)}/>
        <p className="text-sm text-muted-foreground mt-1">
          Balance between traditional scoring and ML predictions
        </p>
      </div>
    </div>);
};
exports.WeightConfigurator = WeightConfigurator;
//# sourceMappingURL=weight-configurator.jsx.map