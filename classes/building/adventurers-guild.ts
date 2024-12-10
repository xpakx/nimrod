import { BattleActor } from "../battle/actor.js";
import { BuildingInterface } from "../buildings.js";
import { GameState } from "../game-state.js";
import { Position, Size } from "../map-layer.js";

export class AdventurersGuildInterface extends BuildingInterface {
	heroes: BattleActor[] = [];
	team: BattleActor[] = [];
	teamButtons: HeroButtonRow = new HeroButtonRow();
	width: number = 0;

	click(state: GameState) {
		const teamId = this.teamButtons.buttonAt(state.playerMouse);
		if (teamId >= 0) {
			this.remove(teamId, state);
			return;
		}
	}

	remove(i: number, state: GameState) {
		const actor = this.team[i];
		this.team = this.team.splice(i, 1);
		this.teamButtons.buttons = this.teamButtons.buttons.splice(i, 1);
		state.team = state.team.filter((hero) => hero != actor);
	}

	add(actor: BattleActor, state: GameState) {
		this.team.push(actor);
		this.teamButtons.buttons.push(new HeroButton(actor.sprite.image, {width: 20, height: 20}))
		state.team.push(actor);
	}

	open(state: GameState) {
		this.heroes = state.allHeroes;
		this.team = state.team;
		this.prepareTeamButtons();
	}

	renderInterface(context: CanvasRenderingContext2D, _deltaTime: number, state: GameState) { 
		const width = state.canvasWidth - 200 - this.menuWidth;
		const height = 500;
		const x = 100;
		const y = height/2;

		context.fillStyle = '#444';
		context.fillRect(x, y, width, height);

		context.strokeStyle = '#fff';
		context.strokeRect(x, y, width, height);

		context.fillStyle = '#fff';
		context.font = '16px Arial';
		this.renderTeamButtons();
	}

	prepareTeamButtons() {
		let buttons = this.team.map((hero) => new HeroButton(hero.sprite.image, {width: 20, height: 20}))
		this.teamButtons.buttons = buttons;
	}

	renderTeamButtons() {
	}
}

export class HeroButton {
	image: HTMLImageElement;
	hover: boolean = false;
	position: Position = {x: 0, y: 0};
	size: Size;

	constructor(image: HTMLImageElement, size: Size) {
		this.image = image;
		this.size = size;
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
