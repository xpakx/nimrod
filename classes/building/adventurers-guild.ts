import { BattleActor } from "../battle/actor.js";
import { Building, BuildingInterface } from "../buildings.js";
import { GameState } from "../game-state.js";
import { Position, Size } from "../map-layer.js";

export class AdventurersGuildInterface extends BuildingInterface {
	heroes: BattleActor[] = [];
	team: BattleActor[] = [];
	teamButtons: HeroButtonRow = new HeroButtonRow();

	click(state: GameState) {
		const teamId = this.teamButtons.buttonAt(state.playerMouse);
		if (teamId >= 0) {
			this.remove(teamId, state);
			return;
		}
	}

	remove(i: number, state: GameState) {
		this.team = this.team.splice(i, 1);
		this.teamButtons.buttons = this.teamButtons.buttons.splice(i, 1);
		state.team = this.team;
	}

	add(actor: BattleActor, state: GameState) {
		this.team.push(actor);
		this.teamButtons.buttons = [];
		this.prepareTeamButtons(state);
	}

	open(state: GameState, building: Building) {
		this.heroes = state.allHeroes;
		this.team = state.team;
		this.prepareTeamButtons(state);
		super.open(state, building);
	}

	renderInterface(state: GameState) { 
		super.renderInterface(state);
		this.renderTeamButtons();
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
		for (let hero of this.team) {
			const heroButton = new HeroButton(
				hero.sprite.image,
				{width: portraitSize, height: portraitSize},
				{x: heroX, y: heroY}
			);
			this.teamButtons.buttons.push(heroButton);
			heroX += 10 + portraitSize;
		}
	}

	renderTeamButtons() {
		if (!this.context) return;
		const imagePadding = 5;
		for (let button of this.teamButtons.buttons) {
			this.context.fillStyle = '#575757';
			this.context.fillRect(button.position.x, button.position.y, button.size.width, button.size.height);
			this.context.strokeStyle = '#fff';
			this.context.strokeRect(button.position.x, button.position.y, button.size.width, button.size.height);
			this.context.drawImage(button.image, button.position.x + imagePadding, button.position.y + imagePadding, button.size.width - 2*imagePadding, button.size.height - 2*imagePadding);
		}
	}
}

export class HeroButton {
	image: HTMLImageElement;
	hover: boolean = false;
	position: Position;
	size: Size;

	constructor(image: HTMLImageElement, size: Size, position: Position) {
		this.image = image;
		this.size = size;
		this.position = position;
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
