#ifndef CUSTOM_CPP
#define CUSTOM_CPP

#include <stdint.h>
#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_NeoMatrix.h>
#include <Adafruit_GFX.h>

#include "custom.h"

/* drawImage()
  @param matrix - the matrix to draw onto
  @param img - an immutable matrix of all the colors to display

  maybe give this function the kid
*/
extern void drawImage(Adafruit_NeoMatrix& matrix, const uint32_t img[8][8]) {
	// comment VV out to draw over another image
	matrix.fillScreen(0);

	for (int y = 0; y < 8; y++) {
		for (int x = 0; x < 8; x++) {
			matrix.drawPixel(x, y, img[x][y]);
		}
	}
	matrix.show();
}

/*
  drawImageExample()
  @param matrix - matrix to draw onto

  
*/
extern void drawImageExample(Adafruit_NeoMatrix& matrix) {
	uint32_t SMILEY_FACE[8][8] {
		{ matrix.Color(0, 0, 0), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(0, 0, 0) },
		{ matrix.Color(245, 194, 17), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(245, 194, 17) },
		{ matrix.Color(245, 194, 17), matrix.Color(246, 211, 45), matrix.Color(153, 193, 241), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(153, 193, 241), matrix.Color(246, 211, 45), matrix.Color(245, 194, 17) },
		{ matrix.Color(245, 194, 17), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(245, 194, 17) },
		{ matrix.Color(245, 194, 17), matrix.Color(0, 0, 0), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(0, 0, 0), matrix.Color(245, 194, 17) },
		{ matrix.Color(245, 194, 17), matrix.Color(246, 211, 45), matrix.Color(0, 0, 0), matrix.Color(0, 0, 0), matrix.Color(0, 0, 0), matrix.Color(0, 0, 0), matrix.Color(246, 211, 45), matrix.Color(245, 194, 17) },
		{ matrix.Color(245, 194, 17), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(255, 255, 255), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(246, 211, 45), matrix.Color(245, 194, 17) },
		{ matrix.Color(0, 0, 0), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(245, 194, 17), matrix.Color(0, 0, 0) }
	};

	// the rotation is because I think I accidentally flipped somn in the drawImage, TODO: FIX TS
	matrix.setRotation(2);

	drawImage(matrix, SMILEY_FACE);
	delay(3000);

	matrix.setRotation(1);
}

#endif
