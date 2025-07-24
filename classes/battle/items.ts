import { BattleActor, HeroStats } from "./actor.js";
import { SkillEffect } from "./skill/skill.js";

type BonusType = "strength" | "agility" | "intelligence" | "defence" |
	"resistance" | "luck" | "speed" | "typeAttackBonus" |
	"typeResistanceBonus" | "vampirism";

export interface ArtifactBonus { 
	bonusType: BonusType;
	percentageBonus?: number; 
	constantBonus?: number;
};

export class ArtifactManager {
	private lines: Map<string, ArtifactLine>;

	constructor() {
		this.lines = new Map();
	}

	registerArtifactLine(line: ArtifactLine) {
		this.lines.set(line.name, line);
	}

	sumArtifactLines(equipment: Artifact[]): Map<string, number> {
		const pointsByLine = new Map<string, number>();
		for (let item of equipment) {
			for (let line of item.artifactLines) {
				let points = pointsByLine.get(line.line) || 0;
				pointsByLine.set(line.line, points + line.points);
			}
		}
		return pointsByLine;
	}

	updateHero(hero: BattleActor, items: Artifact[]) {
		const lines = this.sumArtifactLines(items);

		for (let [lineName, points] of lines) {
			const line = this.lines.get(lineName);
			if (!line) continue;
			const bonuses = line.getBonusTypes();
			for (let bonus of bonuses) {
				const stat = bonus as keyof HeroStats;
				const base = hero.stats[stat];
				const bonusPoints = line.getTotalBonus(bonus, base, points);
				console.log(`${stat}: ${bonusPoints}`);
			}
		}
	}
}

export class ArtifactLine {
	name: string;
	visibleName: string;
	bonus1: ArtifactBonus;
	bonus2: ArtifactBonus;
	bonus3?: ArtifactBonus;
	passive?: SkillEffect[];

	constructor(name: string, visibleName: string, bonus1: ArtifactBonus, bonus2: ArtifactBonus, bonus3?: ArtifactBonus, passive?: SkillEffect[]) {
		this.name = name;
		this.visibleName = visibleName;
			
		this.bonus1 = bonus1;
		this.bonus2 = bonus2;
		this.bonus3 = bonus3;
		this.passive = passive;
	}

	getBonusForPoints(artifactPoints: number): ArtifactBonus | undefined {
		if (artifactPoints < 3) return;
		if (artifactPoints < 6) return this.bonus1;
		if (artifactPoints < 9) return this.bonus2;
		return this.bonus3;
	}

	getBonusTypes(): BonusType[] {
		return [this.bonus1.bonusType, this.bonus2.bonusType]; // TODO
	}

	getTotalBonus(type: BonusType, baseValue: number, artifactPoints: number): number {
		const bonus = this.getBonusForPoints(artifactPoints);
		if (!bonus) return 0;
		if (bonus.bonusType !== type) return 0;

		let total = 0;
		if (bonus.percentageBonus) total += baseValue*bonus.percentageBonus;
		if (bonus.constantBonus) total += bonus.constantBonus;

		return total;
	}
}

export interface ArtifactLineData {
	line: string;
	points: 1 | 2 | 3;
}

export class Artifact {
	artifactLines: ArtifactLineData[];
	name: string;

	constructor(name: string, lines: ArtifactLineData[]) {
		if (lines.length > 3)  {
			throw new Error("Artifact cannot have more than 3 artifact lines");
		}
		this.name = name;
		this.artifactLines = lines;
	}
}
