import { BattleActor, HeroRank } from "../battle/actor.js";
import { Building, BuildingInterface } from "../building/buildings.js";
import { GameState } from "../game-state.js";
import { Action } from "../interface/actions.js";
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
		context.save();
		context.translate(this.position.x, this.position.y);
		this.teamButtons.draw(context, localPosition);
		this.allHeroesButtons.draw(context, localPosition);
		context.restore();
	}
}

type HeroActionType = "delete" | "add" | "select";

export class HeroButton implements Button {
	_image: HTMLImageElement;
	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	hoverImage: OffscreenCanvas;
	hoverContext: OffscreenCanvasRenderingContext2D;
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
		this.context = this.image.getContext("2d")!;
		this.hoverImage = new OffscreenCanvas(size.width, size.height);
		this.hoverContext = this.hoverImage.getContext("2d")!;
		this.size = size;
		this.position = position;
		this.rank = hero.rank;
		this.hero = hero;
		this.action = action;
		this.drawImage();
		this.drawHoverImage();
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

	drawHoverImage() {
		this.hoverContext.save();
		this.hoverContext.filter = "grayscale(80%)"; 
		this.hoverContext.fillStyle = this.getFillColor();
		this.hoverContext.beginPath();
		this.hoverContext.arc(this.size.width/2, this.size.width/2, this.size.width/2, 0, 2 * Math.PI);
		this.hoverContext.fill();

		this.hoverContext.drawImage(this._image, this.imagePadding, this.imagePadding, this.size.width - 2*this.imagePadding, this.size.height - 2*this.imagePadding);

		this.hoverContext.strokeStyle = this.getBorderColor();
		this.hoverContext.beginPath();
		this.hoverContext.arc(this.size.width/2, this.size.width/2, this.size.width/2, 0, 2 * Math.PI);
		this.hoverContext.stroke();
		this.hoverContext.restore();
	}

	getClickAction(): Action | undefined {
		if (this.action == "delete") {
			return {"action": "removeHero", hero: this.hero};
		}
		if (this.action == "add") {
			return {"action": "addHero", hero: this.hero};
		}
		if (this.action == "select") {
			return {"action": "selectHero", hero: this.hero};
		}
		return undefined;
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void {
		const image = hovered ? this.hoverImage : this.image;
		context.drawImage(image, this.position.x, this.position.y);
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
			button.draw(context, hovered);
		}
	}
}

export class HeroButtonPane implements ButtonPane {
	buttons: Button[];

	itemOffset: number = 0;

	position: Position;
	size: Size;
	buttonGap: number = 10;
	pageSize: number = 1;
	page: number = 0;

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
		const itemOffsetEnd = this.itemOffset + this.pageSize;
		const lastItemIndex = this.buttons.length - 1;
		return itemOffsetEnd < lastItemIndex;
	}

	toPrevPage() {
		if (!this.hasPrevPage()) return;
		this.page -= 1;
		this.itemOffset = this.pageSize * this.page;
	}

	toNextPage() {
		if (!this.hasNextPage()) return;
		this.page += 1;
		this.itemOffset = this.pageSize * this.page;
	}


	prepareButtons() {
		let xMax = this.position.x + this.size.width;
		let yMax = this.position.y + this.size.height;

		this.nextPageButton = new NavButton({x: xMax - 50 - 10, y: yMax - 40}, "prev");
		this.prevPageButton = new NavButton({x: xMax - 20 - 10, y: yMax - 40}, "next");

		if (this.buttons.length == 0) {
			return;
		}

		const buttonSize = this.buttons[0].size;
		const buttonsPerRow = Math.floor(this.size.width / (buttonSize.width + this.buttonGap));
		const rowsPerPage = Math.floor(this.size.height / (buttonSize.height + this.buttonGap));
		this.pageSize = buttonsPerRow * rowsPerPage;
		
		for(let i = 0; i<this.buttons.length; i++) {
			const currentButton = this.buttons[i];
			const index = i % this.pageSize;
			const column = index % buttonsPerRow;
			const row = Math.floor(index / buttonsPerRow);
			currentButton.position.x = this.position.x + (buttonSize.width + this.buttonGap) * column;
			currentButton.position.y = this.position.y + (buttonSize.height + this.buttonGap) * row;
		}
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, position: Position) {
		const buttonEnd = Math.min(this.itemOffset + this.pageSize, this.buttons.length);
		for (let i = this.itemOffset; i < buttonEnd; i++) {
			const button = this.buttons[i];
			const hovered = button.inButton(position);
			button.draw(context, hovered);
		}
		if (this.prevPageButton) {
			const hovered = this.prevPageButton.inButton(position);
			this.prevPageButton.draw(context, hovered);
		}
		if (this.nextPageButton) {
			const hovered = this.nextPageButton.inButton(position);
			this.nextPageButton.draw(context, hovered);
		}
	}

	buttonAt(position: Position): Action | undefined {
		for (let i = this.itemOffset; i < this.itemOffset + this.pageSize && i < this.buttons.length; i++ ) {
			const button = this.buttons[i];
			if (button.inButton(position)) {
				return button.getClickAction();
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
	    this.context = this.image.getContext("2d")!;
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

    draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void {
		context.drawImage(this.image, this.position.x, this.position.y);
    }
}
