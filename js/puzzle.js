/*
 * Puzzle.js - stores information about the predefined puzzles
 * Copyright (c) 2016 Ian Jones
 */

Puzzles = {
	"1": {
		atoms: [
			{
				type: "eye",
				x: 150,
				y: 300
			},
			{
				x: 300,
				y: 300,
				r: 150
			}
		]
	},
	"2": {
		atoms: [
			{
				type: "eye",
				x: 75,
				y: 300
			},
			{
				x: 200,
				y: 300,
				r: 125
			},
			{
				x: 400,
				y: 300,
				r: 125
			}
		]
	},
	"3": {
		atoms: [
			{
				type: "eye",
				x: 75,
				y: 300
			},
			{
				x: 200,
				y: 300,
				r: 125
			},
			{
				x: 400,
				y: 300,
				r: 125
			}
		],
		negative: [
			{
				x: 300,
				y: 300,
				r: 50
			}
		]
	},
	"4": {
		atoms: [
			{
				type: "eye",
				x: 75,
				y: 300
			},
			{
				x: 200,
				y: 300,
				r: 125
			},
			{
				x: 400,
				y: 300,
				r: 125
			},
			{
				type: "eye",
				x: 525,
				y: 300
			}
		],
		negative: [
			{
				x: 200,
				y: 425,
				r: 25
			},
			{
				x: 400,
				y: 175,
				r: 25
			}
		]
	},
	"5": {
		atoms: [
			{
				type: "eye",
				x: 90,
				y: 475
			},
			{
				type: "eye",
				x: 510,
				y: 475
			},
			{
				type: "eye",
				x: 300,
				y: 75
			},
			{
				x: 190,
				y: 400,
				r: 125
			},
			{
				x: 410,
				y: 400,
				r: 125
			},
			{
				x: 300,
				y: 200,
				r: 125
			}
		]
	},
	"6": {
		atoms: [
			{
				type: "eye",
				x: 90,
				y: 475
			},
			{
				type: "eye",
				x: 300,
				y: 75
			},
			{
				x: 190,
				y: 400,
				r: 125
			},
			{
				x: 410,
				y: 400,
				r: 125
			},
			{
				x: 300,
				y: 200,
				r: 125
			}
		],
		negative: [
			{
				x: 200,
				y: 275,
				r: 10
			},
			{
				x: 300,
				y: 330,
				r: 20
			}
		]
	},
	"7": {
		atoms: [
			{
				type: "eye",
				x: 75,
				y: 300
			},
			{
				x: 200,
				y: 300,
				r: 125
			},
			{
				type: "die",
				value: 1,
				x: 400,
				y: 300,
				r: 125
			}
		]
	}
};