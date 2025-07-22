import { SkillEffect } from "./skill/skill.js";

type BonusType = "strength" | "agility" | "intelligence" | "defence" |
	"resistance" | "luck" | "speed" | "typeAttackBonus" |
	"typeResistanceBonus" | "vampirism";

export interface ArtifactBonus { 
	bonusType: BonusType;
	percentageBonus?: number; 
	constantBonus?: number;
};

export interface ArtifactLine {
	bonus1: ArtifactBonus;
	bonus2: ArtifactBonus;
	bonus3?: ArtifactBonus;
	passive?: SkillEffect[];
}

export interface ArtifactLineData {
	line: ArtifactLine;
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
