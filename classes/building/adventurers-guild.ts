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
	allHeroesButtons: HeroButtonRow = new HeroButtonRow();
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
		this.prepareTeamButtons(state);
		this.prepareHeroButtons(state);
		super.open(state, building);
	}

	renderInterface(state: GameState) { 
		super.renderInterface(state);
		this.renderButtons(this.teamButtons);
		this.renderButtons(this.allHeroesButtons);
	}

	prepareTeamButtons(state: GameState) {
		const portraitSize = 60;
		const leftMargin = 80;
		const width = state.canvasSize.width - 2 * leftMargin - this.menuWidth;
		const height = 300;
		const x = leftMargin;
		const middleOfMap = (state.canvasSize.height - this.topPanelHeight) / 2  + this.topPanelHeight;
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
				hero.rank
			);
			this.teamButtons.buttons.push(heroButton);
			heroX += 10 + portraitSize;
		}
	}

	prepareHeroButtons(state: GameState) {
		const portraitSize = 60;
		const leftMargin = 80;
		const width = state.canvasSize.width - 2 * leftMargin - this.menuWidth;
		const height = 300;
		const x = leftMargin;
		const middleOfMap = (state.canvasSize.height - this.topPanelHeight) / 2  + this.topPanelHeight;
		const y = middleOfMap - height / 2 + 40;
		let heroY = y + 10;
		let heroX = x + 150;
		this.allHeroesButtons.buttons = [];
		for (let hero of this.heroes) {
			const heroButton = new HeroButton(
				hero.portrait || hero.sprite.image,
				{width: portraitSize, height: portraitSize},
				{x: heroX, y: heroY},
				hero.rank
			);
			this.allHeroesButtons.buttons.push(heroButton);
			heroX += 10 + portraitSize;
		}
	}

	renderButtons(row: HeroButtonRow) {
		if (!this.context) return;
		const imagePadding = 5;
		for (let button of row.buttons) {
			this.context.fillStyle = button.getFillColor();
			this.context.beginPath();
			this.context.arc(button.position.x + button.size.width/2, button.position.y + button.size.width/2, button.size.width/2, 0, 2 * Math.PI);
			this.context.fill();

			this.context.drawImage(button.image, button.position.x + imagePadding, button.position.y + imagePadding, button.size.width - 2*imagePadding, button.size.height - 2*imagePadding);

			this.context.strokeStyle = button.getBorderColor();
			this.context.beginPath();
			this.context.arc(button.position.x + button.size.width/2, button.position.y + button.size.width/2, button.size.width/2, 0, 2 * Math.PI);
			this.context.stroke();
		}
	}
}

export class HeroButton {
	image: HTMLImageElement;
	hover: boolean = false;
	position: Position;
	size: Size;
	rank: HeroRank;

	constructor(image: HTMLImageElement, size: Size, position: Position, rank: HeroRank) {
		this.image = image;
		this.size = size;
		this.position = position;
		this.rank = rank;
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
}

export class HeroButtonRow {
	buttons: HeroButton[] = [];
	y: number = 100;

	buttonAt(position: Position): number {
		for (let i=0; i<this.buttons.length; i++) {
			if (this.buttons[i].inButton(position)) {
				return i;
			}
		}
		return -1;
	}
}
