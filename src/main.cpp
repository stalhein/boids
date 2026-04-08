// clang-format off
#include <glad/glad.h>
#include <GLFW/glfw3.h>
// clang-format on

#include <glm/glm.hpp>

#include <array>
#include <vector>
#include <cmath>
#include <cstdlib>
#include <ctime>
#include <iostream>
#include <algorithm>

#include "shader.hpp"
#include "shaders.hpp"

constexpr int START_SCR_WIDTH = 800;
constexpr int START_SCR_HEIGHT = 600;

constexpr int NUMBER_BOIDS = 1000;

constexpr float SEPERATION_DISTANCE = 30.f;
constexpr float ALIGNMENT_DISTANCE = 80.f;
constexpr float COHESION_DISTANCE = 150.f;

constexpr float SEPERATION_MULT = 3.f;
constexpr float ALIGNMENT_MULT = 0.05f;
constexpr float COHESION_MULT = 0.015f;
constexpr float WANDER_MULT = 0.1f;

constexpr float MIN_SPEED = 50.f;
constexpr float MAX_SPEED = 150.f;

constexpr float PADDING = 80.f;
constexpr float ICE = 1.f;

constexpr float FOV_COS = -0.70710678118f;

void framebuffer_size_callback(GLFWwindow *, int width, int height);
void process_input(GLFWwindow *window);

float deltaTime = 0.f;
float lastFrame = 0.f;

struct Instance {
  float x, y;
  float cosTheta, sinTheta;
  int colour;
};

int main() {
  if (!glfwInit()) {
    std::cout << "Error initialising GLFW." << std::endl;
    return 1;
  }

  glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
  glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
  glfwWindowHint(GLFW_SAMPLES, 4);

  GLFWwindow *window =
      glfwCreateWindow(START_SCR_WIDTH, START_SCR_HEIGHT, "Boids", NULL, NULL);
  if (!window) {
    std::cout << "Error creating GLFWwindow." << std::endl;
    glfwTerminate();
    return 1;
  }

  glfwMakeContextCurrent(window);
  glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

  if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
    std::cout << "Error loading OpenGL." << std::endl;
    glfwDestroyWindow(window);
    glfwTerminate();
    return 1;
  }

  glEnable(GL_MULTISAMPLE);

  int width, height;
  glfwGetWindowSize(window, &width, &height);

  Shader shader(vertex, fragment);

  float size = 0.02f;
  float vertices[] = {
      size, 0.f, -size * 0.6f, size * 0.35f, -size * 0.6f, -size * 0.35f,
  };

  GLuint vbo, vao, instanceVbo;
  glGenVertexArrays(1, &vao);
  glBindVertexArray(vao);

  // Triangle
  glGenBuffers(1, &vbo);
  glBindBuffer(GL_ARRAY_BUFFER, vbo);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

  glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void *)0);
  glEnableVertexAttribArray(0);

  // Instances
  glGenBuffers(1, &instanceVbo);
  glBindBuffer(GL_ARRAY_BUFFER, instanceVbo);
  glBufferData(GL_ARRAY_BUFFER, NUMBER_BOIDS * sizeof(Instance), NULL,
               GL_DYNAMIC_DRAW);

  glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, sizeof(Instance), (void *)0);
  glEnableVertexAttribArray(1);
  glVertexAttribDivisor(1, 1);

  glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Instance),
                        (void *)(2 * sizeof(float)));
  glEnableVertexAttribArray(2);
  glVertexAttribDivisor(2, 1);

  glVertexAttribIPointer(3, 1, GL_INT, sizeof(Instance),
                         (void *)(4 * sizeof(float)));
  glEnableVertexAttribArray(3);
  glVertexAttribDivisor(3, 1);

  std::array<float, NUMBER_BOIDS> posX, posY, velX, velY;
  srand(time(0));
  for (int i = 0; i < NUMBER_BOIDS; ++i) {
    posX[i] = rand() % (width + 1);
    posY[i] = rand() % (height + 1);
    velX[i] = (((float)rand() / RAND_MAX) * 2.f - 1.f) * MIN_SPEED;
    velY[i] = (((float)rand() / RAND_MAX) * 2.f - 1.f) * MAX_SPEED;
  }

  std::array<Instance, NUMBER_BOIDS> instances;

  // Tiles
  const int TILE_SIZE = COHESION_DISTANCE;
  int tileCols = static_cast<int>(width / TILE_SIZE);
  int tileRows = static_cast<int>(height / TILE_SIZE);
  std::vector<int> firstTileBoid(tileRows * tileCols);
  std::array<int, NUMBER_BOIDS> nextTileBoid;

  while (!glfwWindowShouldClose(window)) {
    float currentFrame = (float)glfwGetTime();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;

    // printf("FPS: %f\n", (1.f/deltaTime));

    process_input(window);

    // Update
    std::fill(firstTileBoid.begin(), firstTileBoid.end(), -1);

    for (int i = 0; i < NUMBER_BOIDS; ++i) {
      int col = std::clamp(static_cast<int>(posX[i] / TILE_SIZE), 0, tileCols-1);
      int row = std::clamp(static_cast<int>(posY[i] / TILE_SIZE), 0, tileRows-1);

      int index = row * tileCols + col;

      nextTileBoid[i] = firstTileBoid[index];
      firstTileBoid[index] = i;
    }

    for (int i = 0; i < NUMBER_BOIDS; ++i) {
      int col = static_cast<int>(posX[i] / TILE_SIZE);
      int row = static_cast<int>(posY[i] / TILE_SIZE);

      float sX = 0.f, sY = 0.f;
      float aX = 0.f, aY = 0.f;
      float cX = 0.f, cY = 0.f;
      int aCount = 0;
      int cCount = 0;

      for (int dr = -1; dr <= 1; ++dr) {
        for (int dc = -1; dc <= 1; ++dc) {
          int r = row + dr;
          int c = col + dc;

          if (r < 0 || c < 0 || r >= tileRows || c >= tileCols) continue;

          int index = r * tileCols + c;
          int neighbour = firstTileBoid[index];

          while (neighbour != -1) {
            if (neighbour == i) {
              neighbour = nextTileBoid[neighbour];
              continue;
            }

            float dx = posX[neighbour] - posX[i];
            float dy = posY[neighbour] - posY[i];

            float distanceSquared = dx*dx+dy*dy;

            if (distanceSquared <= 0) {
              neighbour = nextTileBoid[neighbour];
              continue;
            }

            float distance = sqrtf(distanceSquared);

            if (distance <= SEPERATION_DISTANCE) {
              float factor = 1.f - distance / SEPERATION_DISTANCE;
              sX -= (dx / distance) * factor;
              sY -= (dy / distance) * factor;
            }

            if (distance <= ALIGNMENT_DISTANCE) {
              aX += velX[neighbour];
              aY += velY[neighbour];
              aCount++;
            }

            if (distance <= COHESION_DISTANCE) {
              cX += posX[neighbour];
              cY += posY[neighbour];
              cCount++;
            }

            neighbour = nextTileBoid[neighbour];
          }
        }
      }

      float accelerationX = 0.f;
      float accelerationY = 0.f;

      accelerationX += sX * SEPERATION_MULT;
      accelerationY += sY * SEPERATION_MULT;

      if (aCount > 0) {
        accelerationX += ((aX / aCount) - velX[i]) * ALIGNMENT_MULT;
        accelerationY += ((aY / aCount) - velY[i]) * ALIGNMENT_MULT;
      }

      if (cCount > 0) {
        accelerationX += ((cX / cCount) - posX[i]) * COHESION_MULT;
        accelerationY += ((cY / cCount) - posY[i]) * COHESION_MULT;
      }

      if (posX[i] < PADDING) accelerationX += ICE;
      else if (posX[i] > width-PADDING) accelerationX -= ICE;
      if (posY[i] < PADDING) accelerationY += ICE;
      else if (posY[i] > height-PADDING) accelerationY -= ICE;

      velX[i] += accelerationX;
      velY[i] += accelerationY;

      float speed = sqrtf(velX[i]*velX[i]+velY[i]*velY[i]);

      if (speed > MAX_SPEED) {
        velX[i] = (velX[i]/speed) * MAX_SPEED;
        velY[i] = (velY[i]/speed) * MAX_SPEED;
      } else if (speed < MIN_SPEED) {
        velX[i] = (velX[i]/speed) * MIN_SPEED;
        velY[i] = (velY[i]/speed) * MIN_SPEED;
      }

      posX[i] += velX[i] * deltaTime;
      posY[i] += velY[i] * deltaTime;


    }

    for (int i = 0; i < NUMBER_BOIDS; ++i) {
      float length = sqrtf(velX[i] * velX[i] + velY[i] * velY[i]);
      if (length == 0)
        length = 0.000001f;
      float cosTheta = velX[i] / length;
      float sinTheta = velY[i] / length;

      instances[i].x = (posX[i] / width) * 2.f - 1.f;
      instances[i].y = (posY[i] / height) * 2.f - 1.f;
      instances[i].cosTheta = cosTheta;
      instances[i].sinTheta = sinTheta;
      instances[i].colour = 1;
    }

    glBindBuffer(GL_ARRAY_BUFFER, instanceVbo);
    glBufferSubData(GL_ARRAY_BUFFER, 0, NUMBER_BOIDS * sizeof(Instance),
                    instances.data());

    // Render
    glClearColor(0.f, 0.f, 0.f, 1.f);
    glClear(GL_COLOR_BUFFER_BIT);

    shader.use();
    glBindVertexArray(vao);

    glDrawArraysInstanced(GL_TRIANGLES, 0, 3, NUMBER_BOIDS);

    glfwSwapBuffers(window);
    glfwPollEvents();
  }

  glfwDestroyWindow(window);
  glfwTerminate();
  return 0;
}

void framebuffer_size_callback(GLFWwindow *, int width, int height) {
  glViewport(0, 0, width, height);
}

void process_input(GLFWwindow *window) {
  if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS) {
    glfwSetWindowShouldClose(window, 1);
  }
}
