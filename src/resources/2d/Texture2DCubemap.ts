import { VK_IMAGE_VIEW_TYPE_CUBE } from 'vulkan-api';
import { Texture2D } from './Texture2D';
export class Texture2DCubemap extends Texture2D
{
    viewType = VK_IMAGE_VIEW_TYPE_CUBE;
}
