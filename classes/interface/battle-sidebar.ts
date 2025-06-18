import { BattleActor } from "../battle/actor.js";
import { BattleTab } from "./battle-tab.js";
import { BuildingSidebar } from "./sidebar.js";

export class BattleSidebar extends BuildingSidebar {

	loadBattle(heroes: BattleActor[], icons: any) {
		const icon = icons["kingdom"]; // TODO: add icon
		const tabIcon = icons["tab"];
		
		const heroTab = new BattleTab("Heroes", icon, tabIcon);
		heroTab.setHeroes(heroes);
		this.tabs[0] = heroTab;
		this.updateSize();
		this.tab = 0;
	}
}
