# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file LICENSE.rst or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION ${CMAKE_VERSION}) # this file comes with cmake

# If CMAKE_DISABLE_SOURCE_CHANGES is set to true and the source directory is an
# existing directory in our source tree, calling file(MAKE_DIRECTORY) on it
# would cause a fatal error, even though it would be a no-op.
if(NOT EXISTS "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-src")
  file(MAKE_DIRECTORY "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-src")
endif()
file(MAKE_DIRECTORY
  "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-build"
  "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-subbuild/cglm-populate-prefix"
  "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-subbuild/cglm-populate-prefix/tmp"
  "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-subbuild/cglm-populate-prefix/src/cglm-populate-stamp"
  "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-subbuild/cglm-populate-prefix/src"
  "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-subbuild/cglm-populate-prefix/src/cglm-populate-stamp"
)

set(configSubDirs )
foreach(subDir IN LISTS configSubDirs)
    file(MAKE_DIRECTORY "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-subbuild/cglm-populate-prefix/src/cglm-populate-stamp/${subDir}")
endforeach()
if(cfgdir)
  file(MAKE_DIRECTORY "/home/twhite/Projects/boids/c/out/Debug/_deps/cglm-subbuild/cglm-populate-prefix/src/cglm-populate-stamp${cfgdir}") # cfgdir has leading slash
endif()
