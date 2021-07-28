
export enum GraphicsApiDebugLevelType {
    /// <summary>
    /// disable graphics api output
    /// This is for production use
    /// </summary> 
    None = 0,
    /// <summary>
    /// enables errors
    /// </summary>
    Error = 1,
    /// <summary>
    /// enables warnings
    /// </summary>
    Warning = 2,
    /// <summary>
    /// enables information
    /// </summary>
    Info = 3,
    /// <summary>
    /// enables verbose input
    /// </summary>
    Debug = 4
}

export var GraphicsApiDebugLevel : any = (
    GraphicsApiDebugLevelType.Debug |
    GraphicsApiDebugLevelType.Error |
    GraphicsApiDebugLevelType.Info |
    GraphicsApiDebugLevelType.Warning
);

export class Settings {

    static get IsGraphicsApiDebugingEnabled(): boolean {

        return (
            (GraphicsApiDebugLevel & GraphicsApiDebugLevelType.Error) != 0 ||
            (GraphicsApiDebugLevel & GraphicsApiDebugLevelType.Warning) != 0 ||
            (GraphicsApiDebugLevel & GraphicsApiDebugLevelType.Info) != 0 ||
            (GraphicsApiDebugLevel & GraphicsApiDebugLevelType.Debug) != 0
        );

    }
}
