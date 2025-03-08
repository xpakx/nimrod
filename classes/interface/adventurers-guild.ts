import { BattleActor, HeroRank } from "../battle/actor.js";
import { Building, BuildingInterface } from "../building/buildings.js";
import { GameState } from "../game-state.js";
import { Action } from "../interface/interface.js";
import { Button, ButtonContainer, ButtonPane } from "../interface/button.js";
import { getLogger, Logger } from "../logger.js";
import { Position, Size } from "../map-layer.js";

export class AdventurersGuildInterface extends BuildingInterface {
	heroes: BattleActor[] = [];
	team: BattleActor[] = [];
	teamButtons: ButtonContainer = new HeroButtonRow();
	allHeroesButtons: ButtonPane = new HeroButtonPane();
	logger: Logger = getLogger("AdventurersGuildInterface");

	click(position: Position): Action | undefined {
		const localPosition = {x: position.x - this.position.x, y: position.y - this.position.y};
		const action = this.allHeroesButtons.navButtonAt(localPosition);
		if (action && action.action == "page") {
			if (action.argument == "next") {
				this.allHeroesButtons.toNextPage();
			} else {
				this.allHeroesButtons.toPrevPage();
			}
			this.renderInterface()
		} 
		const teamHero = this.teamButtons.buttonAt(localPosition);
		if (teamHero) {
			this.logger.debug(`Team hero clicked`, teamHero);
			return teamHero;
		}

		const hero = this.allHeroesButtons.buttonAt(localPosition);
		if (hero) {
			this.logger.debug(`Hero clicked:`, hero);
			return hero;
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
				hero,
				"delete"
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
		this.allHeroesButtons.size.height = height - 120; // TODO

		this.allHeroesButtons.buttons = [];
		for (let hero of this.heroes) {
			const heroButton = new HeroButton(
				hero.portrait || hero.sprite.image,
				{width: portraitSize, height: portraitSize},
				{x: 0, y: 0},
				hero,
				"add"
			);
			this.allHeroesButtons.buttons.push(heroButton);
		}

		this.allHeroesButtons.prepareButtons();
	}

	drawInterface(context: CanvasRenderingContext2D, _deltaTime: number, state: GameState) {
		const localPosition = {x: state.playerMouse.x - this.position.x, y: state.playerMouse.y - this.position.y};
		if (!this.offscreen) return;
		context.drawImage(this.offscreen, this.position.x, this.position.y);
		this.teamButtons.draw(this.context!, localPosition);
		this.allHeroesButtons.draw(this.context!, localPosition);
	}
}

type HeroActionType = "delete" | "add";

export class HeroButton implements Button {
	_image: HTMLImageElement;
	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	hover: boolean = false;
	position: Position;
	size: Size;
	rank: HeroRank;
	hero: BattleActor;
	imagePadding: number = 5;
	action: HeroActionType;

	constructor(image: HTMLImageElement, size: Size, position: Position, hero: BattleActor, action: HeroActionType) {
		this._image = image;
		this.image = new OffscreenCanvas(size.width, size.height);
		this.context = this.image.getContext("2d")!; // TODO
		this.size = size;
		this.position = position;
		this.rank = hero.rank;
		this.hero = hero;
		this.action = action;
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

	getClickAction(): Action | undefined {
		if (this.action == "delete") {
			return {"action": "removeHero", hero: this.hero};
		}
		if (this.action == "add") {
			return {"action": "addHero", hero: this.hero};
		}
		return undefined;
	}
}

export class HeroButtonRow implements ButtonContainer {
	buttons: Button[] = [];

	buttonAt(position: Position): Action | undefined {
		for (let i=0; i<this.buttons.length; i++) {
			if (this.buttons[i].inButton(position)) {
				return this.buttons[i].getClickAction();
			}
		}
		return undefined;
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, position: Position) {
		for (let button of this.buttons) {
			const hovered = button.inButton(position);
			if (hovered) {
				context.save();
				context.filter = "grayscale(80%)"; 
			}
			context.drawImage(button.image, button.position.x, button.position.y);
			if (hovered) context.restore();
		}
	}
}

export class HeroButtonPane implements ButtonPane {
	buttons: Button[];

	itemOffset: number = 0;
	activeButtons: Button[] = [];

	position: Position;
	size: Size;
	buttonGap: number = 10;

	nextPageButton?: Button;
	prevPageButton?: Button;

	constructor() {
		this.buttons = [];
		this.position = {x: 0, y: 0};
		this.size = {width: 0, height: 0};
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

		this.nextPageButton = new NavButton({x: xMax - 50 - 10, y: yMax - 40}, "prev");
		this.prevPageButton = new NavButton({x: xMax - 20 - 10, y: yMax - 40}, "next");

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
				if (currentY + buttonHeight >= yMax) {
					return;
				}
			}

			currentButton.position.x = currentX;
			currentButton.position.y = currentY;
			
			this.activeButtons.push(currentButton);
			currentXOffset += 1;
		}
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, position: Position) {
		for (let button of this.activeButtons) {
			const hovered = button.inButton(position);
			if (hovered) {
				context.save();
				context.filter = "grayscale(80%)"; 
			}
			context.drawImage(button.image, button.position.x, button.position.y);
			if (hovered) context.restore();
		}
		if (this.prevPageButton) {
			const hovered = this.prevPageButton.inButton(position);
			if (hovered) {
				context.save();
				context.filter = "grayscale(80%)"; 
			}
			context.drawImage(this.prevPageButton.image, this.prevPageButton.position.x, this.prevPageButton.position.y);
			if (hovered) context.restore();
		}
		if (this.nextPageButton) {
			const hovered = this.nextPageButton.inButton(position);
			if (hovered) {
				context.save();
				context.filter = "grayscale(80%)"; 
			}
			context.drawImage(this.nextPageButton.image, this.nextPageButton.position.x, this.nextPageButton.position.y);
			if (hovered) context.restore();
		}
	}

	buttonAt(position: Position): Action | undefined {
		for (let i=0; i<this.activeButtons.length; i++) {
			if (this.activeButtons[i].inButton(position)) {
				return this.activeButtons[i].getClickAction();
			}
		}
		return undefined;
	}

	navButtonAt(position: Position): Action | undefined {
		if (this.nextPageButton && this.nextPageButton.inButton(position)) {
			return this.nextPageButton.getClickAction();
		}
		if (this.prevPageButton && this.prevPageButton.inButton(position)) {
			return this.prevPageButton.getClickAction();
		}
		return undefined;
	}
}

export class NavButton implements Button {
    image: OffscreenCanvas;
    context: OffscreenCanvasRenderingContext2D;
    hover: boolean;
    position: Position;
    size: Size;
    dir: "next" | "prev";

    constructor(position: Position, dir: "next" | "prev") {
	    this.size = {width: 20, height: 20};
	    this.image = new OffscreenCanvas(this.size.width, this.size.height);
	    this.context = this.image.getContext("2d")!; // TODO
	    this.position = position;
	    this.hover = false;
	    this.dir = dir;
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

    drawImage(): void {
	    this.context.fillStyle = '#dfd';
	    this.context.beginPath();
	    this.context.arc(this.size.width/2, this.size.width/2, this.size.width/2, 0, 2 * Math.PI);
	    this.context.fill();
    }

    getClickAction(): Action | undefined {
	    return {
		    "action": "page",
		    "argument": this.dir
	    };
    }
}
