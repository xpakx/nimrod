export interface Dialogue {
	text: string,
	portrait: HTMLImageElement | undefined,
}

export class DialogueParsed {
	text: string[];
	portrait: HTMLImageElement | undefined;
	line: number = 0;
	letter: number = 0;
	counter: number = 0;
	printed: boolean = false;
	toPrint: string[] = [""];
	
	constructor(text: string[], portrait: HTMLImageElement | undefined) {
		this.text = text;
		this.portrait = portrait;
	}

	updateTime(deltaTime: number) {
		if(this.printed) {
			return;
		}

		this.counter += deltaTime;
		if (this.counter >= 0.05) {
			this.counter = 0;
			if(this.letter < this.text[this.line].length) {
				this.toPrint[this.line] += this.text[this.line][this.letter];
				this.letter += 1;
			} else {
				if(this.line + 1 < this.text.length) {
					this.letter = 0;
					this.line += 1;
					this.toPrint[this.line] += this.text[this.line][this.letter];
				} else {
					this.printed = true;
				}
			}
		}
	}

	skipAnimation() {
		this.toPrint = this.text;
		this.printed = true;
	}
}
