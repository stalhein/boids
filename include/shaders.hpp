#ifndef SHADERS_H
#define SHADERS_H

const char* vertex = 
"#version 330 core\n"
"layout (location = 0) in vec2 aPos;\n"
"layout (location = 1) in vec2 instancePos;\n"
"layout (location = 2) in vec2 instanceDir;\n"
"layout (location = 3) in int colourIndex;\n"
"flat out int vColourIndex;\n"
"void main() {\n"
" mat2 rotation = mat2(instanceDir.x, instanceDir.y, -instanceDir.y, instanceDir.x);\n"
" vec2 position = rotation * aPos + instancePos;\n"
" gl_Position = vec4(position, 0.0, 1.0);\n"
" vColourIndex = colourIndex;\n"
"}\n";

const char* fragment = 
"#version 330 core\n"
"out vec4 FragColor;\n"
"flat in int vColourIndex;\n"
"void main() {\n"
" FragColor = vec4(1/float(vColourIndex+1), 0.2, 0.8, 1.0);\n"
"}\n";

#endif
