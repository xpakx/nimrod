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

	getRewardDrops(rewards: DropEntry[]): DropEntry[] {
		let result: DropEntry[] = [];
		for (let entry of rewards) {
			let applyReward = false;
			if (!entry.chance) {
				applyReward = true;
			} else {
				const random = Math.random();
				applyReward = random < entry.chance;
			}

			if (applyReward) {
				result.push(entry);
			}
		}
		return result;
	}

	getRewardDropPools(pools: DropPool[]): DropEntry[] {
		let result: DropEntry[] = [];
		for (const pool of pools) {
			let applyPool = false;
			if (!pool.chance) {
				applyPool = true;
			} else {
				const random = Math.random();
				applyPool = random < pool.chance;
			}

			if (applyPool) {
				const entry = this.selectFromPool(pool);
				if (entry) result.push(entry);
			}
		}
		return result;
	}

	selectFromPool(pool: DropPool): DropEntry | undefined {
		const entries = pool.drops;
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
}
