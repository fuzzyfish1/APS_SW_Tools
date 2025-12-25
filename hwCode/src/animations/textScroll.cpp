#ifndef TEXTSCROLL_CPP
#define TEXTSCROLL_CPP

#include <stdint.h>
#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_NeoMatrix.h>
#include <Adafruit_GFX.h>

#include "animations/textScroll.h"

extern void textScrollExample(Adafruit_NeoMatrix& matrix) {

	int y = 0; // vertical position
	const char* message = "Chckn"; // text to scroll

	// x=8 screen width to start off screen
	// x = -36 magic number
	// x counts down

	for (int x = 8; x > -36; x--) {
		matrix.fillScreen(0);
		matrix.setCursor(x, y);
		matrix.print(message);
		matrix.show();

		delay(100);
	}
}

#endif
