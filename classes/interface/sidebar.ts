import { Position, Size } from "../map-layer";
import { Action } from "./actions";
import { BuildingTab } from "./building-tab";

export interface Sidebar {
	tabs: BuildingTab[];
	tab: number | undefined;

	click(position: Position): Action | undefined;
	draw(context: CanvasRenderingContext2D, mousePosition: Position, deltaTime: number): void;
}

export class BuildingSidebar implements Sidebar {
	tab: number | undefined = undefined;
	tabs: BuildingTab[] = [];
	tabWidth: number;
	canvasSize: Size;
	menuWidth: number;

	constructor(canvasSize: Size, menuWidth: number, tabWidth: number) {
		this.canvasSize = canvasSize;
		this.menuWidth = menuWidth;
		this.tabWidth = tabWidth;
	}

	renderCurrentTab(context: CanvasRenderingContext2D, mousePosition: Position, _deltaTime: number) {
		if (this.tab == undefined) return;
		if (this.tab >= this.tabs.length) return;
		this.tabs[this.tab].draw(context, mousePosition);
	}

	getTabUnderCursor(position: Position): number | undefined {
		for(let i = 0; i<this.tabs.length; i++) {
			if(this.inTab(position, i)) {
				return i;
			}
		}
		return undefined;
	}


	inTab(position: Position, tab: number): boolean {
		const start = 60;
		const x = this.canvasSize.width - this.menuWidth;
		const y = start + tab*this.tabWidth;
		const x2 = x + this.tabWidth;
		const y2 = y + this.tabWidth;
		if(position.x < x || position.x > x2) {
			return false;
		}
		if(position.y < y || position.y > y2) {
			return false;
		}
		return true;
	}

	click(position: Position): Action | undefined {
		const tab = this.getTabUnderCursor(position);
		if (tab != undefined) {
			this.tab = tab;
			return undefined;
		}
		if(this.tab != undefined) {
			const tab = this.tabs[this.tab];
			let result = tab.buttonAt(position);
			if(result != undefined) {
				return result;
			}

			const action = tab.navButtonAt(position);
			if (action && action.action == "page") {
				if (action.argument == "next") {
					tab.toNextPage();
				} else {
					tab.toPrevPage();
				}
			} 
		}

		return undefined;
	}

	drawTabs(context: CanvasRenderingContext2D, mousePosition: Position) {
		const start = 60;
		const tabSize = this.tabWidth;
		for(let i = 0; i<this.tabs.length; i++) {
			const hover = this.inTab(mousePosition, i);
			const currentTab = i == this.tab;
			const tab = this.tabs[i];
			let icon = tab.icon;

			if(hover && currentTab) {
				icon = tab.hoverIcon;
			} else if(hover && !currentTab) {
				icon = tab.inactiveHoverIcon;
			} else if(!currentTab) {
				icon = tab.inactiveIcon;
			} 
			context.drawImage(icon, this.canvasSize.width - this.menuWidth, start + i*tabSize);
		}
	}

	draw(context: CanvasRenderingContext2D, mousePosition: Position, deltaTime: number) {
		context.fillStyle = '#1f1f1f';
		context.fillRect(this.canvasSize.width - this.menuWidth, 0, this.menuWidth, this.canvasSize.height);
		this.drawTabs(context, mousePosition);
		this.renderCurrentTab(context, mousePosition, deltaTime);
	}
}
