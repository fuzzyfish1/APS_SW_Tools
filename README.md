# APS_MatrixKit

I am using the readme to write notes on the development lifecycle for this project as well as future projects


## Requirements/Planning
	Showcases certain requirements that we have for the project
	
	- webapp
		- runs on linux
		- runs on windows
		- runs on web
		
	- Embedded-SW
		- modular and independent animations
		- ability to demo all animations of the project to kids very quickly
		- use well documented and maintained libraries
		- easy to port to Arduino IDE
		
	- HW
		- 8x8 neopixel array grid
		- Arduino Nano (new bootloader)

	- Internal Documentation (for engineering and production)
		- TODO: BOM
		- TODO: controlled Semantic Versioning, in progress
		- Embedded-SW
			- curriculum development comments
		
	- External Documentation (for kids/teaching)
		- accessible to kids
		
## Design
	Showcases SW Architectural decisions, dev environments, tools, etc.

	- webapp
		- electron-vite dev environment (from v1 being nextjs)
		- react + typescript + tailwind

	- Embedded-SW
		- Written in platformIO for potential pivoting to different MCU later
		- Using specifically adafruit libraries
		- TODO: consider wrap HW access to gain HW UNIT testing
			- could switch through exchangable implementation files
			- CONS: 
				- kids now have to use our wrappers
				- might also be really overkill	
			- PROS: verifiably tested code
		- main.cpp switches between different example animation functions from a list
		- animation function should be directly copy pastable into the loop

	- HW
		- TBD
		
	- Internal Documentation (for engineering)
		- this readme

	- External Documentation (for kids/teaching)
		- how to: install + use app
		- how to: build 
		- how to: flash 
		- how to: wire
		
## Implementation
	Showcases tools and things to write and develop the project, kinda blends with design

	- webapp
		- npm run dev :: electron vite dev
		- TODO: prettier formatter
		- TODO: tsc typecheckers
		
	- Embedded-SW
		- PIO got this covered
		
	- HW
		- 3d printer got this covered

	- Internal Documentation (for engineering)
		- based on development lifecycle because I needed to pen + paper CICD through github Actions, and this gets those thoughts out

	- External Documentation (for kids/teaching)
		- MkDocs?
		
## Testing
	Showcases how to test if things work for this project

	- webapp
		- TODO: e2e, use playwright?
		- TODO: linter
		
	- Embedded-SW
		- TODO: UNITY testing framework, maybe not useful for this project

	- HW

	- Internal Documentation
	
	- External Documentation
		- mkdocs build --strict?
		
## CI + Build
	- add integration checks here

	- Webapp
		- Linter
		- Vercel Test Deploy
		- run e2e/playwright tester
	
	- Embedded-SW
		- Clang-Tidy
		- Clang-Format
		- Compiler Warnings

	- HW

	- Internal Documentation
		- version num incrementer?

	- External Documentation
		- mkdocs build --strict?

## Deployment
	- vercel deploys from a branch

	- Webapp
		- Vercel Deploy
		- release binary build
	
	- Embedded-SW

	- HW

	- Internal Documentation

	- External Documentation
		- github pages

## monitoring + maintenance
