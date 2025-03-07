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
		const localPosition = {x: position.x - this.position.x, y: position.y - this.position.y};
		const pageChange = this.allHeroesButtons.navButtonAt(localPosition);
		if (pageChange < 0) {
			this.allHeroesButtons.toPrevPage();
			this.renderInterface()
		} else if (pageChange > 0)  {
			this.allHeroesButtons.toNextPage();
			this.renderInterface()
		}
		const teamHero = this.teamButtons.buttonAt(localPosition);
		if (teamHero) {
			this.logger.debug(`Team hero clicked`, teamHero);
			return {"action": "removeHero", hero: teamHero};
		}

		const hero = this.allHeroesButtons.buttonAt(localPosition);
		if (hero) {
			this.logger.debug(`Hero clicked:`, hero);
			return {"action": "addHero", hero: hero};
		}


		return undefined;
	}

	open(state: GameState, building: Building) {
		this.heroes = state.allHeroes;
		this.team = state.team;
		this.preRender(state, building);
		this.prepareTeamButtons();
		this.prepareHeroButtons();
		this.renderInterface();
	}

	renderInterface() { 
		super.renderInterface();
		this.teamButtons.draw(this.context!);
		this.allHeroesButtons.draw(this.context!);
	}

	prepareTeamButtons() {
		const portraitSize = 60;
		const width = this.size.width;
		const height = this.size.height;
		const y =  height - 10 - portraitSize;
		const heroWidth = this.team.length*portraitSize + (this.team.length - 1)*10
		let heroY = y;
		let heroX = width/2 - heroWidth/2;
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
		const y = 40;
		let heroY = y + 10;
		let heroX = 150;
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

	buttonAt(position: Position): BattleActor | undefined {
		for (let i=0; i<this.buttons.length; i++) {
			if (this.buttons[i].inButton(position)) {
				return this.buttons[i].hero;
			}
		}
		return undefined;
	}

	draw(context: OffscreenCanvasRenderingContext2D) {
		for (let button of this.buttons) {
			context.drawImage(button.image, button.position.x, button.position.y);
		}
	}

}

export class HeroButtonPane {
	buttons: HeroButton[];

	itemOffset: number = 0;
	activeButtons: HeroButton[] = [];

	position: Position;
	size: Size;
	buttonGap: number = 10;

	nextPageButton?: HeroButton;
	prevPageButton?: HeroButton;

	constructor(heroes: HeroButton[], position: Position, size: Size) {
		this.buttons = heroes;
		this.position = position;
		this.size = size;
	}

	hasPrevPage(): boolean {
		return this.itemOffset > 0;
	}

	hasNextPage(): boolean {
		const currentPageSize = this.activeButtons.length;
		const itemOffsetEnd = this.itemOffset + currentPageSize;
		const lastItemIndex = this.buttons.length - 1;
		return itemOffsetEnd < lastItemIndex;
	}

	toPrevPage() {
		if (!this.hasPrevPage()) return;
		const currentPageSize = this.activeButtons.length;
		const prevPageItemOffset = this.itemOffset - currentPageSize;
		this.itemOffset = Math.max(0, prevPageItemOffset);
		this.prepareButtons();
	}

	toNextPage() {
		if (!this.hasNextPage()) return;
		const currentPageSize = this.activeButtons.length;
		const itemOffsetEnd = this.itemOffset + currentPageSize;
		this.itemOffset = Math.min(this.buttons.length - 1, itemOffsetEnd);
		this.prepareButtons();
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
		}
	}

	buttonAt(position: Position): BattleActor | undefined {
		for (let i=0; i<this.activeButtons.length; i++) {
			if (this.activeButtons[i].inButton(position)) {
				return this.activeButtons[i].hero;
			}
		}
		return undefined;
	}

	navButtonAt(position: Position): number {
		if (this.nextPageButton && this.nextPageButton.inButton(position)) {
			return 1;
		}
		if (this.prevPageButton && this.prevPageButton.inButton(position)) {
			return -1;
		}
		return 0;
	}
}
