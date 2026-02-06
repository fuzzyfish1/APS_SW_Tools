#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include <Adafruit_NeoMatrix.h>
#include <Adafruit_GFX.h>

#include "custom.h"
#include "textScroll.h"
#include "fireFlicker.h"
#include "bouncingBall.h"

/**
 * System -
 *   OS:  [Linux Mint 22.1 x86 Cinnamon]
 *   IDE: [CLion + PlatformIO]
 * Author: Zain Ali
 *
 * APS ReadySetCode MATRIX Kit Examples
 * Runs the following examples in order
 *		- display from 2D array
 *		- scrolling texts
 *		- calculatable animations
 *
 *
 * I don't imagine students will ever see this code directly, function pointers will fry a child
 * this should be simple enough for any instructor with the added comments
 * This code is for
 * 		1) Instructor to quickly demo a large number of possible animations to the kids
 *		2) to have working code examples
 *		3) to isolate the examples from each other while also running them consecutively
*/

#define MTRX_PIN 4
#define MTRX_SZ_X 8
#define MTRX_SZ_Y 8

/*an interesting sort of configuration, defines which chunk of code is like top right and other shii */
Adafruit_NeoMatrix matrix = Adafruit_NeoMatrix(
	MTRX_SZ_X, MTRX_SZ_Y, MTRX_PIN,
	NEO_MATRIX_BOTTOM + NEO_MATRIX_LEFT +
	NEO_MATRIX_ROWS + NEO_MATRIX_ZIGZAG,
	NEO_GRB + NEO_KHZ800
);

/*
	creates a list of pointers to functions that you can then execute

	typedef: defines a type
	(*): function pointer
	void (*AnimationFunc) (Adafruit_Neomatrix)
	[ret type] (* [name]) ([params])

	makes the code less ugly, but you can do vv and skip this line ngl, up to preference

	void (*)(Adafruit_NeoMatrix &) [] = {animationFunc1, animationFunc2, ...};
*/

typedef void (*AnimationFunc)(Adafruit_NeoMatrix &);
AnimationFunc animations[] = {drawImageExample, textScrollExample, fireAnimationExample, bouncingBallExample};

// I forgot why i put this here I dont thin k I need it anymore
// constexpr int NUM_ANIMATIONS = sizeof(animations) / sizeof(AnimationFunc);

/*
 *	the setup() is the same/similar for all animations
*/
void setup() {
	Serial.begin(9600);

	matrix.begin();
	matrix.setBrightness(40);
	matrix.setRotation(1);

	// GFX library setup, don't need this unless 
	matrix.setTextWrap(false);
	matrix.setTextColor(matrix.Color(255, 0, 0));
	matrix.setFont();
}

/* 
   this code just switches the void loop() segment to whatever example loop is running in the moment
   have the kid replace this code with whatever they are writing in the moment
*/

void loop() {
	for (const auto& animation : animations) {
		animation(matrix);
		delay(200);
	}
}
