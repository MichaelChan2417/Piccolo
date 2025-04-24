#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

void main()
{
    // Get the size of the colour grading lookup table 
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);

    // store the size of y-direction in the _COLORS constant
    highp float _COLORS      = float(lut_tex_size.y);

    // Load the colour values
    highp vec4 color       = subpassLoad(in_color).rgba;
    
    // calculate the num of color blocks
    highp vec2 lutSize = vec2(lut_tex_size.x, lut_tex_size.y);
    highp float blockNum = lutSize.x / lutSize.y;
    
    // The colours have been converted to sRGB space, and colour values are between 0 and 1.
    // Multiply the blue channel value of input colour by the blocks nums to get the 
    // position of the block in the LUT where the input colour is located.
    highp float blockIndexL = floor(color.b * blockNum);
    highp float blockIndexR = ceil(color.b * blockNum);

    // Calculate the u-values of the left and right maps (normalised to 0-1)
    highp float lutCoordXL = (blockIndexL * lutSize.y + color.r * lutSize.y) / lutSize.x;
    highp float lutCoordXR = (blockIndexR * lutSize.y + color.r * lutSize.y) / lutSize.x;

    // Use the green channel as the v-value for the lookup table
    highp float lutCoorY = color.g;

    // Constructing lookup table coordinates
    highp vec2 lutCoordL = vec2(lutCoordXL, lutCoorY);
    highp vec2 lutCoordR = vec2(lutCoordXR, lutCoorY);

    // Reading the colour value from the lookup table
    highp vec4 lutcolorL = texture(color_grading_lut_texture_sampler, lutCoordL);
    highp vec4 lutcolorR = texture(color_grading_lut_texture_sampler, lutCoordR);

    // Calculate interpolation weights
    highp float weight = fract(color.b * blockNum);

    // Interpolates and outputs the final colour
    out_color = mix(lutcolorL, lutcolorR, weight);
}