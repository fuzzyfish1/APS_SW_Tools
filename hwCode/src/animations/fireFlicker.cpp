#ifndef FIREFLICKER_CPP
#define FIREFLICKER_CPP

#include <animations/fireFlicker.h>
#include <stdint.h>
#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_NeoMatrix.h>
#include <Adafruit_GFX.h>

/*
	fire animation, implements randomness and more loop based physics engines
*/
extern void fireAnimationExample(Adafruit_NeoMatrix &matrix) {
	static byte heat[8][8]; // heat map for the fire

	for (int x = 0; x < 50; x++) {
		//  a spot
		for (int x = 0; x < 8; x++) {
			for (int y = 0; y < 8; y++) {
				heat[x][y] = max(0, heat[x][y] - random(0, 65)); // random cooling
			}
		}

		// move every tile upward and cool as it a bit for a chunk
		for (int x = 0; x < 8; x++) {
			for (int y = 7; y > 0; y--) {
				heat[x][y] = (heat[x][y - 1] + heat[x][max(0, y - 2)]) / 2;
			}
		}

		// add sparks at the bottom row
		for (int x = 0; x < 8; x++) {
			if (random(0, 10) > 5) {
				heat[x][0] = random(160, 255); 
			}
		}

		// convert heat map to colors
		for (int x = 0; x < 8; x++) {
			for (int y = 0; y < 8; y++) {
				byte h = heat[x][y];

				uint32_t color;
				if (h > 180)
					color = matrix.Color(255, 80, 0);
				else if (h > 120)
					color = matrix.Color(200, 30, 0);
				else if (h > 60)
					color = matrix.Color(120, 10, 0);
				else
					color = matrix.Color(0, 0, 0);

				matrix.drawPixel(x, 7 - y, color); // invert y so fire rises upward
			}
		}

		matrix.show();
		delay(50);
	}
}

#endif
