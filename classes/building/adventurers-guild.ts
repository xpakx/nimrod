import { BattleActor, HeroRank } from "../battle/actor.js";
import { Building, BuildingInterface } from "../buildings.js";
import { GameState } from "../game-state.js";
import { Action } from "../interface.js";
import { getLogger, Logger } from "../logger.js";
import { Position, Size } from "../map-layer.js";

export class AdventurersGuildInterface extends BuildingInterface {
	heroes: BattleActor[] = [];
	team: BattleActor[] = [];
	teamButtons: HeroButtonRow = new HeroButtonRow();
	allHeroesButtons: HeroButtonPane = new HeroButtonPane([], {x: 0, y: 0}, {width: 0, height: 0}); // TODO
	logger: Logger = getLogger("AdventurersGuildInterface");

	click(position: Position): Action | undefined {
		const teamId = this.teamButtons.buttonAt(position);
		if (teamId >= 0) {
			this.logger.debug(`${teamId} clicked`);
			return {"action": "removeHero", index: teamId};
		}

		const heroId = this.allHeroesButtons.buttonAt(position);
		if (heroId >= 0) {
			this.logger.debug(`${heroId} clicked`);
			return {"action": "addHero", index: heroId};
		}

		return undefined;
	}

	open(state: GameState, building: Building) {
		this.heroes = state.allHeroes;
		this.team = state.team;
		this.preRender(state, building);
		this.prepareTeamButtons();
		this.prepareHeroButtons();
		this.renderInterface(state);
	}

	renderInterface(state: GameState) { 
		super.renderInterface(state);
		this.renderButtons(this.teamButtons);
		this.allHeroesButtons.draw(this.context!);
		this.renderButtons(this.allHeroesButtons);
	}

	prepareTeamButtons() {
		const portraitSize = 60;
		const width = this.size.width;
		const height = this.size.height;
		const x = this.position.x;
		const middleOfMap = this.position.y + (height) / 2;
		const y = middleOfMap + height / 2 - 10 - portraitSize;
		const heroWidth = this.team.length*portraitSize + (this.team.length - 1)*10
		let heroY = y;
		let heroX = x + width/2 - heroWidth/2;
		this.teamButtons.buttons = [];
		for (let hero of this.team) {
			const heroButton = new HeroButton(
				hero.portrait || hero.sprite.image,
				{width: portraitSize, height: portraitSize},
				{x: heroX, y: heroY},
				hero
			);
			this.teamButtons.buttons.push(heroButton);
			heroX += 10 + portraitSize;
		}
	}

	prepareHeroButtons() {
		const portraitSize = 60;
		const width = this.size.width;
		const height = this.size.height;
		const x = this.position.x;
		const y = this.position.y + 40;
		let heroY = y + 10;
		let heroX = x + 150;
		this.allHeroesButtons.position.x = heroX;
		this.allHeroesButtons.position.y = heroY;
		this.allHeroesButtons.size.width = width - 150;
		this.allHeroesButtons.size.height = height - 200; // TODO

		this.allHeroesButtons.buttons = [];
		for (let hero of this.heroes) {
			const heroButton = new HeroButton(
				hero.portrait || hero.sprite.image,
				{width: portraitSize, height: portraitSize},
				{x: 0, y: 0},
				hero
			);
			this.allHeroesButtons.buttons.push(heroButton);
		}

		this.allHeroesButtons.prepareButtons();
	}

	renderButtons(row: HeroButtonRow) {
		if (!this.context) return;
		for (let button of row.buttons) {
			this.context.drawImage(button.image, button.position.x, button.position.y);
			this.context.fillStyle = button.getFillColor();
		}
	}
}

export class HeroButton {
	_image: HTMLImageElement;
	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	hover: boolean = false;
	position: Position;
	size: Size;
	rank: HeroRank;
	hero: BattleActor;
	imagePadding: number = 5;

	constructor(image: HTMLImageElement, size: Size, position: Position, hero: BattleActor) {
		this._image = image;
		this.image = new OffscreenCanvas(size.width, size.height);
		this.context = this.image.getContext("2d")!; // TODO
		this.size = size;
		this.position = position;
		this.rank = hero.rank;
		this.hero = hero;
		this.drawImage();
	}

	inButton(position: Position): boolean {
		if(position.x < this.position.x || position.x > this.position.x + this.size.width) {
			return false;
		}
		if(position.y < this.position.y || position.y > this.position.y + this.size.height) {
			return false;
		}
		return true;
	}

	getFillColor(): string { 
		if (this.rank == "common") return '#575757';
		else if (this.rank == "rare") return '#676755';
		return '#000';
	}

	getBorderColor(): string { 
		if (this.rank == "common") return '#fff';
		else if (this.rank == "rare") return '#dd1';
		return '#000';
	}

	drawImage() {
		this.context.fillStyle = this.getFillColor();
		this.context.beginPath();
		this.context.arc(this.size.width/2, this.size.width/2, this.size.width/2, 0, 2 * Math.PI);
		this.context.fill();

		this.context.drawImage(this._image, this.imagePadding, this.imagePadding, this.size.width - 2*this.imagePadding, this.size.height - 2*this.imagePadding);

		this.context.strokeStyle = this.getBorderColor();
		this.context.beginPath();
		this.context.arc(this.size.width/2, this.size.width/2, this.size.width/2, 0, 2 * Math.PI);
		this.context.stroke();
	}
}

export class HeroButtonRow {
	buttons: HeroButton[] = [];

	buttonAt(position: Position): number {
		for (let i=0; i<this.buttons.length; i++) {
			if (this.buttons[i].inButton(position)) {
				return i;
			}
		}
		return -1;
	}
}

export class HeroButtonPane {
	buttons: HeroButton[];

	itemOffset: number = 0;
	activeButtons: HeroButton[] = [];

	position: Position;
	size: Size;
	buttonGap: number = 10;

	constructor(heroes: HeroButton[], position: Position, size: Size) {
		this.buttons = heroes;
		this.position = position;
		this.size = size;
	}

	prepareButtons() {
		this.activeButtons = [];

		let xStart = this.position.x;
		let yStart = this.position.y;
		let xMax = this.position.x + this.size.width;
		let yMax = this.position.y + this.size.height;
		let currentYOffset = 0;
		let currentXOffset = 0;

		for(let i = this.itemOffset; i<this.buttons.length; i++) {
			const currentButton = this.buttons[i];
			const buttonWidth = currentButton.size.width;
			const buttonHeight = currentButton.size.height;

			let currentX = xStart + currentXOffset * (buttonWidth + this.buttonGap);
			let currentY = yStart + currentYOffset * (buttonHeight + this.buttonGap);
			if(currentX + buttonWidth >= xMax) {
				currentXOffset = 0;
				currentYOffset += 1;
				currentX = xStart;
				currentY = yStart + currentYOffset * (buttonHeight + this.buttonGap);
				if (currentY >= yMax) {
					return;
				}
			}

			let iconWidth = currentButton.image.width;
			let iconHeight = currentButton.image.height;
			let iconSize = buttonWidth > buttonHeight ? buttonWidth : buttonHeight;
			if(iconWidth > iconHeight) {
				iconHeight = iconHeight*(iconSize/iconWidth);
				iconWidth = iconSize;
			} else {
				iconWidth = iconWidth*(iconSize/iconHeight);
				iconHeight = iconSize;
			}

			currentButton.position.x = currentX;
			currentButton.position.y = currentY;
			// TODO: image size
			
			this.activeButtons.push(currentButton);
			currentXOffset += 1;
		}
	}

	draw(context: OffscreenCanvasRenderingContext2D) {
		for(let button of this.activeButtons) {
			context.drawImage(button.image, button.position.x, button.position.y);
			context.fillStyle = button.getFillColor();
		}
	}

	buttonAt(position: Position): number {
		for (let i=0; i<this.activeButtons.length; i++) {
			if (this.activeButtons[i].inButton(position)) {
				return this.itemOffset + i; // TODO
			}
		}
		return -1;
	}

}
