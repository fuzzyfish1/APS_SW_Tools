#ifndef BOUNCINGBALL_CPP
#define BOUNCINGBALL_CPP

#include <stdint.h>
#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_NeoMatrix.h>
#include <Adafruit_GFX.h>

#include <animations/bouncingBall.h>

/** bouncingBallExample 
 * @param matrix - whatever matrix with whatever settings we setup in setup
*/
extern void bouncingBallExample(Adafruit_NeoMatrix &matrix) {


	/*
	static means these variables are global, meaning remove the static and put above setup()

	they represent physical values of a thing
	*/

	static float x = 3;
	static float y = 3;
	static float vx = 0.6;
	static float vy = 0.8;
	
	/*
	the limit is just here so it does not continue forever, but this would go inside of
	void loop() {...}
	*/
	for (int i = 0; i < 100; i++) {
		// fill the screen wit black to clear it
		matrix.fillScreen(0);

		// spot wit bal
		matrix.drawPixel((int)x, (int)y, matrix.Color(255, 0, 0));

		matrix.show();

		// Update position
		x += vx;
		y += vy;

		const max_size = 8;
		// direction reverse at border, replace max_size with the #define MAX_SZE_X 
		if (x <= 0 || x > max_size) vx = -vx;
		if (y <= 0 || y > max_size) vy = -vy;

		delay(30);
	}
}

#endif
