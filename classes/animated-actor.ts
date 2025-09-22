import { ActorSprite, Actor } from "./actor.js";
import { Size } from "./map-layer.js";

export class AnimatedActorSprite implements ActorSprite {
	frames: HTMLImageElement[];
	animations: Record<string, HTMLImageElement[]> = {};
	currentAnimation: HTMLImageElement[] | undefined;
	frameTime: number = 0;
	currentFrame: number = 0;
	frameDuration: number = 30;
	key: string;

	constructor(frames: HTMLImageElement[], _size: number, tileSize: Size, key: string) {
		this.frames = frames;
		this.refreshSize(tileSize);
		this.key = key;
	}

	registerAnimation(key: string, frames: number[]) {
		let animation: HTMLImageElement[] = [];
		for(let i of frames) {
			if (i >= this.frames.length) throw new Error(`Incorrect index ${i}`);
			animation.push(this.frames[i]);
		}
		this.animations[key] = animation;
	}

	refreshSize(_tileSize: Size) {
		// TODO: rescale
	}

	getImage(): HTMLImageElement {
		if (!this.currentAnimation) return this.frames[0];
		return this.currentAnimation[this.currentFrame];
	}

	getScaledImage(): HTMLImageElement | OffscreenCanvas {
		// TODO: use offscreen canvas
		if (!this.currentAnimation) return this.frames[0];
		return this.currentAnimation[this.currentFrame];
	}

	tick(deltaTime: number, _actor?: Actor) {
		// TODO: direction
		if (!this.currentAnimation) {
			this.currentFrame = 0;
			return;
		}
		this.frameTime += deltaTime;
		if (this.frameTime > this.frameDuration) {
			const frames = Math.floor(this.frameTime / this.frameDuration);
			this.currentFrame = (this.currentFrame + frames) % this.currentAnimation.length;
			this.frameTime = this.frameTime % this.frameDuration;
		}
	}

	startAnimation(key: string): boolean {
		const animation = this.animations[key];
		if (!animation) return false;
		this.currentAnimation = animation;
		this.currentFrame = 0;
		this.frameTime = 0;
		return true;
	}

	getKey(): string {
		return this.key;
	}
}
