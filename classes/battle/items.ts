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
		hero.resetStats();
		const lines = this.sumArtifactLines(items);
		const statBonuses = new Map<keyof HeroStats, number>();

		for (let [lineName, points] of lines) {
			const line = this.lines.get(lineName);
			if (!line) continue;
			const bonuses = line.getBonusTypes();
			for (let bonus of bonuses) {
				const stat = bonus as keyof HeroStats;
				const base = hero.getBaseStat(stat);
				const bonusPoints = line.getTotalBonus(bonus, base, points);
				const current  = statBonuses.get(stat) || 0;
				statBonuses.set(stat, current + bonusPoints);
			}
		}

		for (let [stat, bonusPoints] of statBonuses) {
			hero.applyBonus(stat, bonusPoints);
		}
	}
}

export class ArtifactLine {
	name: string;
	visibleName: string;
	bonus1: ArtifactBonus;
	pointsForBonus1: number = 6;
	bonus2: ArtifactBonus;
	pointsForBonus2: number = 9;
	bonus3?: ArtifactBonus;
	pointsForBonus3: number = 12;
	passive?: SkillEffect[];
	bonuses: BonusType[];

	constructor(name: string, visibleName: string, bonus1: ArtifactBonus, bonus2: ArtifactBonus, bonus3?: ArtifactBonus, passive?: SkillEffect[]) {
		this.name = name;
		this.visibleName = visibleName;
			
		this.bonus1 = bonus1;
		this.bonus2 = bonus2;
		this.bonus3 = bonus3;
		this.passive = passive;
		this.bonuses = this.calculateBonusTypes();
	}

	private addBonusType(result: ArtifactBonus, toAdd: ArtifactBonus) {
		if (toAdd.constantBonus)  {
			if (!result.constantBonus) result.constantBonus = 0;
			result.constantBonus += toAdd.constantBonus;
		}
		if (toAdd.percentageBonus)  {
			if (!result.percentageBonus) result.percentageBonus = 0;
			result.percentageBonus += toAdd.percentageBonus;
		}
	}

	getStatBonusForPoints(stat: BonusType, artifactPoints: number): ArtifactBonus | undefined {
		const bonus: ArtifactBonus = { bonusType: stat };
		if (artifactPoints >= this.pointsForBonus1 && this.bonus1.bonusType == stat) {
			this.addBonusType(bonus, this.bonus1);
		}
		if (artifactPoints >= this.pointsForBonus2 && this.bonus2.bonusType == stat) {
			this.addBonusType(bonus, this.bonus2);
		}
		if (artifactPoints >= this.pointsForBonus3 && this.bonus3 && this.bonus3.bonusType == stat) {
			this.addBonusType(bonus, this.bonus3);
		}
		if (!bonus.percentageBonus && !bonus.constantBonus) return;
		return bonus;
	}

	calculateBonusTypes(): BonusType[] {
		let bonuses = [this.bonus1.bonusType];
		const bonus2 = this.bonus2.bonusType;
		if (!bonuses.includes(bonus2)) bonuses.push(bonus2);
		if (this.bonus3) {
			const bonus3 = this.bonus3.bonusType;
			if (!bonuses.includes(bonus3)) bonuses.push(bonus3);
		}

		return bonuses;
	}

	getBonusTypes(): BonusType[] {
		return this.bonuses;
	}

	getTotalBonus(type: BonusType, baseValue: number, artifactPoints: number): number {
		const bonus = this.getStatBonusForPoints(type, artifactPoints);
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
