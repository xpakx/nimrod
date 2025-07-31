import { BattleActor } from "../battle/actor.js";
import { Skill } from "../battle/skill/skill.js";
import { Position, Size } from "../map-layer.js";
import { Action } from "./actions.js";
import { HeroButton } from "./adventurers-guild.js";
import { BuildingTab } from "./building-tab.js";
import { Button } from "./button.js";

export class BattleTab extends BuildingTab {
	active: boolean = false;
	itemOffset: number = 0;
	defaultButtonSize = 60;
	buttonSize = this.defaultButtonSize;
	mousePosition: Position = {x: -1, y: -1};

	position: Position = {x: 0, y: 0};
	size: Size = {width: 0, height: 0};
	buttonGap: number = 25;

	buttons: Button[] = [];

	pageSize: number = 1;
	page: number = 0;
	pages: number = 0;

	skillButtons: Button[] = [];
	heroButtons: Button[] = [];

	constructor(name: string, icon: HTMLImageElement, tab: HTMLImageElement) {
		super(name, [], icon, tab);
	}

	setHeroes(heroes: BattleActor[]) {
		this.heroButtons = [];
		for (let hero of heroes) {
			const button = new HeroButtonWithLabel(
				hero.portrait || hero.sprite.image,
				{width: this.buttonSize, height: this.buttonSize},
				{x: 0, y: 0},
				hero
			);
			this.heroButtons.push(button);
		}
		this.switchToHeroMode();
	}

	switchToSkillMode(hero: BattleActor) {
		this.setSkills(hero.skills);
		this.buttons = this.skillButtons;
		this.prepareButtons();
	}

	switchToHeroMode() {
		this.buttons = this.heroButtons;
	}

	setSkills(skills: Skill[]) {
		this.skillButtons = [];
		for (let skill of skills) {
			if (skill.passive) continue;
			const button = new SkillButton(
				skill.icon,
				{width: this.buttonSize, height: this.buttonSize},
				{x: 0, y: 0},
				skill
			);
			this.skillButtons.push(button);
		}
	}

	prepareButtons() {
		let row = 0;
		for(let button of this.buttons) {
			button.size.width = this.buttonSize;
			button.size.height = this.buttonSize;
			button.position.x = this.position.x;
			button.position.y = this.position.y + (this.buttonSize + this.buttonGap) * row;
			row += 1;
		}
	}

	updateButtons() {
		for (let button of this.heroButtons) {
			const heroButton = button as HeroButtonWithLabel;
			heroButton.drawImage();
			heroButton.drawHoverImage()
			heroButton.drawLabel();
		}
	}

	draw(context: CanvasRenderingContext2D, mousePosition: Position) {
		for(let button of this.buttons) {
			const hovered = button.inButton(mousePosition);
			button.draw(context, hovered);
		}
	}

	buttonAt(position: Position): Action | undefined {
		for(let button of this.buttons) {
			if(button.inButton(position)) {
				return button.getClickAction();
			}
		}
		return undefined;
	}
}

class HeroButtonWithLabel extends HeroButton {
	label: OffscreenCanvas;
	labelCtx: OffscreenCanvasRenderingContext2D;

	constructor(image: HTMLImageElement, size: Size, position: Position, hero: BattleActor) {
		super(image, size, position, hero, "select");
		this.label = new OffscreenCanvas(200, 100);
		this.labelCtx = this.label.getContext("2d")!;
		this.drawLabel();
	}

	drawLabel() {
		this.labelCtx.clearRect(0, 0, this.label.width, this.label.height);
		this.labelCtx.font = "13px normal"
		this.labelCtx.fillStyle = "white"
		this.labelCtx.fillText(this.hero.name, 10, 13);
		this.labelCtx.font = "11px normal"
		const hp = this.hero.currentHp;
		const totalHp = this.hero.stats.hp;
		this.labelCtx.fillText(`${hp}/${totalHp}`, 10, 28);
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean) {
		super.draw(context, hovered);
		context.drawImage(this.label, this.position.x + this.size.width, this.position.y);
	}
}

export class SkillButton implements Button {
	_image: HTMLImageElement;
	image: OffscreenCanvas;
	context: OffscreenCanvasRenderingContext2D;
	hoverImage: OffscreenCanvas;
	hoverContext: OffscreenCanvasRenderingContext2D;
	hover: boolean = false;
	position: Position;
	size: Size;
	skill: Skill;
	imagePadding: number = 5;

	constructor(image: HTMLImageElement, size: Size, position: Position, skill: Skill) {
		this._image = image;
		this.image = new OffscreenCanvas(size.width, size.height);
		this.context = this.image.getContext("2d")!;
		this.hoverImage = new OffscreenCanvas(size.width, size.height);
		this.hoverContext = this.hoverImage.getContext("2d")!;
		this.size = size;
		this.position = position;
		this.skill = skill;
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
		return '#000';
	}

	getBorderColor(): string { 
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
		return {"action": "selectSkill", skill: this.skill};
	}

	draw(context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, hovered: boolean): void {
		const image = hovered ? this.hoverImage : this.image;
		context.drawImage(image, this.position.x, this.position.y);
	}
}
