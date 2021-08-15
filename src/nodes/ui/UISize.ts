export enum UISizeType {
    Pixel,
    Percentage
}
export class UISize {
    value: number = 0;
    minimum: number = -1;
    maximum: number = -1;
    type: UISizeType = UISizeType.Percentage;

    constructor(value: number = 0, type: UISizeType = UISizeType.Percentage, minimum: number = -1, maximum: number = -1) {
        this.value = value;
        this.type = type;
        this.minimum = minimum;
        this.maximum = maximum;
    }

}