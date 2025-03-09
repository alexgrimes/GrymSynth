/// <reference types="react" />
export declare function ModelRoleSwitcher({ models, onSwitch, disabled }: {
    models: {
        responder: string;
        listener: string;
    };
    onSwitch: () => void;
    disabled: boolean;
}): import("react").JSX.Element;
