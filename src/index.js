import Rx from 'rxjs/Rx';



const GAME_WIDTH = 700;
const GAME_HEIGHT = 600;
const PLAYER_HEIGHT = 20;
const PLAYER_WIDTH = 20;

const domElements = {
	gameElement: null,
	playerElement: null,
	bulletElements: {},
	enemyElements: {},
	starElements: {},
	scoreTextElement: null,
};

const createDefaultState = () => ({
	game: {
		width: GAME_WIDTH,
		height: GAME_HEIGHT,
		level: 1,
		gameStarted: false,
		gameOver: false,
		score: 0,
	},
	player: {
		x: GAME_WIDTH/2 - PLAYER_WIDTH,
		y: GAME_HEIGHT - PLAYER_HEIGHT,
		canShoot: true,
		keyPress: {
			left: false,
			right: false,
			shoot: false,
		},
		width: PLAYER_WIDTH,
		height: PLAYER_HEIGHT,
		speed: 5,
	},
	bulletConfig: {
		width: 2,
		height: 10,
		speed: 10,
	},
	enemyConfig: {
		width: 20,
		height: 20,
		speed: 1.5,
	},
	starConfig: {
		width: 2,
		height: 2,
	},
	bullets: {},
	bulletsFired: 0,
	enemies: {},
	stars: {},
});

//
// Enemies
//
const enemyColors = [
	'#bd464f',
	'#7e5cd5',
	'#c659b3',
	'#74b5ef',
	'#54b898',
	'#d2d23f',
	'#e39758',
	'#86b754',
	'#c84847',
];

const createEnemies = (state) => {
	const enemies = {...state.enemies};
	const enemiesPerRow = state.game.level + 5;
	const enemiesCount = enemiesPerRow + (state.game.level * enemiesPerRow);
	const enemyPadding = 10;
	const xStartPosition = (state.game.width / 2) - (((enemiesPerRow * state.enemyConfig.width) + (enemiesPerRow * enemyPadding)) / 2);

	for (let i = 0; i < enemiesCount; i++) {
		const enemyId = i;
		const newEnemy = {
			id: enemyId,
			x: (state.enemyConfig.width * (i % enemiesPerRow)) + ((i % enemiesPerRow) * enemyPadding) + (xStartPosition),
			y: state.enemyConfig.height * Math.floor(i / enemiesPerRow) + (Math.floor(i / enemiesPerRow) * enemyPadding),
			speed: state.enemyConfig.speed + (state.game.level / 4),
			width: state.enemyConfig.width,
			height: state.enemyConfig.height,
		};

		const newEnemyElement = document.createElement('div');
		const enemyColor = enemyColors[i % enemyColors.length];
		newEnemyElement.style.cssText = `
			position: absolute;
			width: 0;
			height: 0;
			border-left: ${newEnemy.width/2}px solid transparent;
			border-right: ${newEnemy.width/2}px solid transparent;
			border-top: ${newEnemy.height}px solid ${enemyColor};
			left: ${newEnemy.x}px;
			top: ${newEnemy.y}px;
		`;

		domElements.enemyElements[enemyId] = newEnemyElement;
		domElements.gameElement.appendChild(newEnemyElement);
		enemies[enemyId] = newEnemy;
	}

	return {
		...state,
		enemies,
	};
};

const updateEnemies = (state) => {
	const enemies = {...state.enemies};

	for (const enemyId in enemies) {
		if (enemies.hasOwnProperty(enemyId)) {
			const enemy = enemies[enemyId];

			enemy.y = enemy.y + enemy.speed;
			domElements.enemyElements[enemyId].style.top = `${enemy.y}px`;

			enemy.x = enemy.x + (Math.cos(enemy.y/10) * (3 + state.game.level / 4));
			domElements.enemyElements[enemyId].style.left = `${enemy.x}px`;

			if (enemy.y + enemy.speed + enemy.height > state.game.height) {
				state = gameOver(state);
				return {...state};
			}
		}
	}

	return {
		...state,
		enemies,
	};
};

const removeEnemy = (enemiesState, enemyId) => {
	domElements.gameElement.removeChild(domElements.enemyElements[enemyId]);
	delete domElements.enemyElements[enemyId];

	let enemies = {...enemiesState};
	delete enemies[enemyId];

	return {
		...enemies,
	};
};

//
// Starfield
//
const createStarfield = (state) => {
	const starsCount = 20;
	let stars = {};

	for (let i = 0; i < starsCount; i++) {
		const starId = i;

		const newStar = {
			id: starId,
			x: Math.floor((Math.random() * state.game.width) + 1),
			y: Math.floor((Math.random() * state.game.height) + 1),
			speed: Math.floor((Math.random() * 50) + 5),
			width: state.starConfig.width,
			height: state.starConfig.height,
		};

		const newStarElement = document.createElement('div');
		newStarElement.style.cssText = `
			position: absolute;
			background-color: white;
			width: ${newStar.width}px;
			height: ${newStar.height}px;
			left: ${newStar.x}px;
			top: ${newStar.y}px;
		`;

		domElements.starElements[starId] = newStarElement;
		domElements.gameElement.appendChild(newStarElement);
		stars[starId] = newStar;
	}

	return {
		...state,
		stars,
	};
};

const updateStars = (state) => {
	const stars = {...state.stars};

	for (const starId in stars) {
		if (stars.hasOwnProperty(starId)) {
			const star = stars[starId];

			star.y = star.y + star.speed;
			domElements.starElements[starId].style.top = `${star.y}px`;

			if (star.y > state.game.height) {
				star.y = 0;
				domElements.starElements[starId].style.top = `${star.y}px`;

				star.x = Math.floor((Math.random() * state.game.width) + 1);
				domElements.starElements[starId].style.left = `${star.x}px`;

				star.speed = Math.floor((Math.random() * 50) + 5);
			}
		}
	}

	return {
		...state,
		stars,
	};
};

//
// Game
//
const createGameContainer = (state) => {
	domElements.gameElement = document.createElement('div');
	domElements.gameElement.style.cssText = `
		color: white;
		border: 2px solid white;
		position: relative;
		width: ${state.game.width}px;
		height: ${state.game.height}px;
	`;
	document.body.appendChild(domElements.gameElement);

	return {...state};
};

const showWelcomeMessage = (state) => {
	domElements.messageElement = document.createElement('p');
	domElements.messageElement.innerHTML = 'Shooter<br><b>Press any key to start</b>';
	domElements.messageElement.style.cssText = `
		position: absolute;
		text-align: center;
		top: ${state.game.height/2 + 10}px;
		font: 21px Gadget, sans-serif;
	`;
	document.body.appendChild(domElements.messageElement);

	return {...state};
};

const initGame = (state) => {
	state = createGameContainer(state);
	state = createStarfield(state);
	state = showWelcomeMessage(state);

	return {...state};
};

const startGame = (state) => {
	document.body.removeChild(domElements.messageElement);

	domElements.scoreTextElement = document.createElement('p');
	domElements.scoreTextElement.innerHTML = state.game.score.toString();
	domElements.scoreTextElement.style.cssText = `
		position: absolute;
		bottom: 5px;
		right: 5px;
		font: 16px Gadget, sans-serif;
	`;
	domElements.gameElement.appendChild(domElements.scoreTextElement);

	state = createPlayer(state);
	state = createEnemies(state);

	return {
		...state,
		game: {
			...state.game,
			gameStarted: true,
		},
	};
};

const resetGame = (state) => {
	for (const bulletId in domElements.bulletElements) {
		if (domElements.bulletElements.hasOwnProperty(bulletId)) {
			domElements.gameElement.removeChild(domElements.bulletElements[bulletId]);
			delete domElements.bulletElements[bulletId];
		}
	}

	for (const enemyId in domElements.enemyElements) {
		if (domElements.enemyElements.hasOwnProperty(enemyId)) {
			domElements.gameElement.removeChild(domElements.enemyElements[enemyId]);
			delete domElements.enemyElements[enemyId];
		}
	}

	domElements.gameElement.removeChild(domElements.playerElement);
	domElements.playerElement = {};

	let newState = createDefaultState();
	
	return {
		...newState,
		stars: state.stars,
		game: {
			...newState.game,
			score: 0,
		},
	};
}

const gameOver = (state) => { 
	domElements.messageElement = document.createElement('p');
	domElements.messageElement.innerHTML = `GAME OVER<br>Score: ${state.game.score}`;
	domElements.messageElement.style.cssText = `
		position: absolute;
		text-align: center;
		top: ${state.game.height/2 - 10}px;
		font: 21px Gadget, sans-serif;
		color: red;
	`;
	document.body.appendChild(domElements.messageElement);
	domElements.gameElement.removeChild(domElements.scoreTextElement);

	return {
		...state,
		game: {
			...state.game,
			gameOver: true,
		},
	};
};

const updateLevels = (state) => {
	const game = {...state.game};
	const enemiesCount = Object.keys(state.enemies).length;

	if (game.gameStarted && !game.gameOver && enemiesCount < 1) {
		game.level++;
		state = createEnemies({
			...state,
			game,
		});
	}

	return {
		...state,
		game,
	};
};

const updateScore = (state) => {
	domElements.scoreTextElement.innerHTML = state.game.score.toString();
	return {...state};
};

//
// Player
//
const createPlayer = (state) => {
	domElements.playerElement = document.createElement('div');
	domElements.playerElement.style.cssText = `
		position: absolute;
		width: 0;
		height: 0;
		border-left: ${state.player.width/2}px solid transparent;
		border-right: ${state.player.width/2}px solid transparent;
		border-bottom: ${state.player.height}px solid white;
		left: ${state.player.x}px;
		top: ${state.player.y}px;
	`;
	domElements.gameElement.appendChild(domElements.playerElement);

	return {...state};
};

const updatePlayer = (state) => {
	const player = {...state.player};

	if (
		player.keyPress.left
		&& player.x - player.speed >= 0
	) {
		player.x = player.x - player.speed;
	}

	if (
		player.keyPress.right
		&& player.x + player.width + player.speed <= state.game.width
	) {
		player.x = player.x + player.speed;
	}

	domElements.playerElement.style.left = `${player.x}px`;

	if (player.keyPress.shoot && player.canShoot) {
		state = createBullet(state);
		player.canShoot = false;
	}

	return {
		...state,
		player,
	};
};

//
// Bullets
//
const createBullet = (state) => {
	const bulletId = state.bulletsFired;
	let bullets = {...state.bullets};

	const newBullet = {
		id: bulletId,
		x: state.player.x,
		y: state.player.y,
		speed: state.bulletConfig.speed,
		width: state.bulletConfig.width,
		height: state.bulletConfig.height,
	};

	const newBulletElement = document.createElement('div');
	newBulletElement.style.cssText = `
		position: absolute;
		background-color: white;
		width: ${newBullet.width}px;
		height: ${newBullet.height}px;
		left: ${newBullet.x}px;
		top: ${newBullet.y}px;
	`;
	domElements.bulletElements[bulletId] = newBulletElement;
	domElements.gameElement.appendChild(newBulletElement);
	bullets[bulletId] = newBullet;

	return {
		...state,
		bullets,
		bulletsFired: state.bulletsFired+1,
	}
}

const updateBullets = (state) => {
	let bullets = {...state.bullets};
	let enemies = {...state.enemies};
	let game = {...state.game};

	for (let bulletId in bullets) {
		if (bullets.hasOwnProperty(bulletId)) {
			let bullet = bullets[bulletId];
			bullet.y = bullet.y - bullet.speed;
			domElements.bulletElements[bulletId].style.top = `${bullet.y}px`;

			if (bullet.y < 0) {
				bullets = removeBullet(bullets, bulletId);
			}

			for (let enemyId in enemies) {
				if (enemies.hasOwnProperty(enemyId)) {
					let enemy = enemies[enemyId];
					
					if (
						(
							(bullet.x <= enemy.x + enemy.width && bullet.x >= enemy.x)
							|| (bullet.x + bullet.width <= enemy.x + enemy.width && bullet.x + bullet.width >= enemy.x)
						) && (
							(bullet.y <= enemy.y + enemy.height && bullet.y >= enemy.y)
							|| (bullet.y + bullet.height <= enemy.y + enemy.height && bullet.y + bullet.height >= enemy.y)	
						)
					) {
						game.score += 10;
						enemies = removeEnemy(enemies, enemyId);
						bullets = removeBullet(bullets, bulletId);
					}
				}
			}
		}
	}

	return {
		...state,
		game,
		enemies,
		bullets,
	}
};

const removeBullet = (bulletsState, bulletId) => {
	const bullets = {...bulletsState};

	if (
		bullets.hasOwnProperty(bulletId)
		&& domElements.bulletElements.hasOwnProperty((bulletId))
	) {
		domElements.gameElement.removeChild(domElements.bulletElements[bulletId]);
		delete domElements.bulletElements[bulletId];
		delete bullets[bulletId];		
	}

	return {...bullets};
}

//
// Main
//
const main = () => {
	//
	// Init state
	//
	let state = createDefaultState();

	// 
	// Init game
	//
	state = initGame(state);

	//
	// Set game loop
	//
	const clock = Rx.Observable
		.interval(25);

	const gameLoop = clock.subscribe(() => {
		state = updateStars(state);
		if (state.game.gameStarted && !state.game.gameOver) {
			state = updatePlayer(state);
			state = updateBullets(state);
			state = updateEnemies(state);
			state = updateLevels(state);
			state = updateScore(state);
		}
	});

	//
	// Handle input
	//
	let anyKeyDown = Rx.Observable.fromEvent(document.body, 'keydown');
	let anyKeyUp = Rx.Observable.fromEvent(document.body, 'keyup');

	anyKeyDown.subscribe((e) => {
		if (!state.game.gameStarted) {
			state = startGame(state);
			return;
		}

		if (state.game.gameOver) {
			state = resetGame(state);
			state = startGame(state);
			return;
		}

		if (e.keyCode === 37) {
			state.player.keyPress.left = true;
		} else if (e.keyCode === 39) {
			state.player.keyPress.right = true;
		} else if (e.keyCode === 32) {
			state.player.keyPress.shoot = true;
		}
	});
	anyKeyUp.subscribe((e) => {
		if (e.keyCode === 37) {
			state.player.keyPress.left = false;
		} else if (e.keyCode === 39) {
			state.player.keyPress.right = false;
		} else if (e.keyCode === 32) {
			state.player.keyPress.shoot = false;
			state.player.canShoot = true;
		}
	});
};

main();
