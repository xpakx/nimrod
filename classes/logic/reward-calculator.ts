import { getLogger, Logger } from "../logger.js";
import { DropEntry, DropPool, Reward } from "../quest.js";

export class RewardCalculator {
	logger: Logger = getLogger("RewardCalculator");

	calculateRewards(rewards: Reward): DropEntry[] {
		let result: DropEntry[] = [];
		if (rewards.drops) {
			const dropRewards = this.getRewardDrops(rewards.drops);
			result.push(...dropRewards);
		}
		if (rewards.dropPools) {
			const poolRewards = this.getRewardDropPools(rewards.dropPools);
			result.push(...poolRewards);
		}
		return result;
	}

	randomizeChance(entry: ItemWithChance) {
		if (!entry.chance) return true;
		return Math.random() < entry.chance;
	}

	getRewardDrops(rewards: DropEntry[]): DropEntry[] {
		let result: DropEntry[] = [];
		for (let entry of rewards) {
			const applyReward = this.randomizeChance(entry);
			if (applyReward) result.push(entry);
		}
		return result;
	}

	getRewardDropPools(pools: DropPool[]): DropEntry[] {
		let result: DropEntry[] = [];
		for (const pool of pools) {
			const applyPool = this.randomizeChance(pool);
			if (!applyPool) continue;

			const entry = this.selectFromPool(pool.drops);
			if (entry) result.push(entry);
		}
		return result;
	}

	selectFromPool(entries: DropEntry[]): DropEntry | undefined {
		if (entries.length === 0) return; 
		
		const sum = entries.reduce((total, entry) => total + (entry.chance ?? 1.0), 0);
		if (sum <= 0) return;

		let selector = Math.random() * sum;

		for (const entry of entries) {
			const entryChance = entry.chance ?? 1.0;
			if (selector < entryChance) {
				return entry;
			}
			selector -= entryChance;
		}

		// in case of floating-point precision issues (?)
		return entries[entries.length - 1];
	}

	selectNewFromPool(pool: DropPool, ignoreItems: Set<string>): DropEntry | undefined {
		const entries =  pool.drops.filter((x) => !ignoreItems.has(x.id));
		return this.selectFromPool(entries);
	}
}


interface ItemWithChance {
	chance?: number;
}
