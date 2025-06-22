import { BattleActor } from "../battle/actor.js";
import { BattleTab } from "./battle-tab.js";
import { BuildingSidebar } from "./sidebar.js";

export class BattleSidebar extends BuildingSidebar {
	tabs: BattleTab[] = [];

	loadBattle(heroes: BattleActor[], icons: any, tabIcon: any) {
		const icon = icons["kingdom"]; // TODO: add icon
		
		const heroTab = new BattleTab("Heroes", icon, tabIcon);
		heroTab.setHeroes(heroes);
		heroTab.prepareIcon(this.tabWidth);
		this.tabs[0] = heroTab;
		this.updateSize();
		this.tab = 0;
	}
}
