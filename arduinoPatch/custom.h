#ifndef CUSTOM_H
#define CUSTOM_H

#include <stdint.h>
#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_NeoMatrix.h>
#include <Adafruit_GFX.h>

extern void drawImage(Adafruit_NeoMatrix& matrix, const uint32_t img[8][8]);

extern void drawImageExample(Adafruit_NeoMatrix& matrix);

#endif