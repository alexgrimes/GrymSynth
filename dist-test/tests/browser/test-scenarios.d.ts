import { ValidationScenario } from './types';
export declare const testScenarios: {
    createModelLoadingTest(): ValidationScenario;
    createResourceContentionTest(): ValidationScenario;
    createNetworkConditionsTest(): ValidationScenario;
    createBrowserCompatTest(): ValidationScenario;
};
declare global {
    interface Window {
        audioManager: any;
    }
}
export default testScenarios;
