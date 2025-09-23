import { ActorSprite, Actor } from "./actor.js";
import { Size } from "./map-layer.js";

export type AnimationDirection = "N" | "S" | "E" | "W";

export class Animation {
	animations: { [K in AnimationDirection]?: number[] } = {};

	addForDir(dir: AnimationDirection, seq: number[]) {
		this.animations[dir] = seq;
	}

	getFrame(index: number, dir: AnimationDirection): number {
		const anim = this.animations[dir];
		if (!anim) return 0;
		return anim[index];
	}

	getLen(dir: AnimationDirection): number {
		const anim = this.animations[dir];
		if (!anim) return 0;
		return anim.length;
	}

}

export class AnimatedActorSprite implements ActorSprite {
	frames: HTMLImageElement[];

	animations: Record<string, Animation> = {};
	currentAnimation: Animation | undefined;
	frameTime: number = 0;
	currentFrame: number = 0;
	frameDuration: number = 30;
	key: string;

	constructor(frames: HTMLImageElement[], _size: number, tileSize: Size, key: string) {
		this.frames = frames;
		this.refreshSize(tileSize);
		this.key = key;
	}

	registerAnimation(key: string, frames: number[], dir: AnimationDirection = "N") {
		for(let i of frames) {
			if (i >= this.frames.length) throw new Error(`Incorrect index ${i}`);
		}
		if (!this.animations[key]) this.animations[key] = new Animation();
		const animation = this.animations[key];
		animation.addForDir(dir, [...frames]);
	}

	refreshSize(_tileSize: Size) {
		// TODO: rescale
	}

	getImage(): HTMLImageElement {
		if (!this.currentAnimation) return this.frames[0];
		const frame = this.currentAnimation.getFrame(this.currentFrame, "N");
		return this.frames[frame];
	}

	getScaledImage(): HTMLImageElement | OffscreenCanvas {
		// TODO: use offscreen canvas
		if (!this.currentAnimation) return this.frames[0];
		const frame = this.currentAnimation.getFrame(this.currentFrame, "N");
		return this.frames[frame];
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
			this.currentFrame = (this.currentFrame + frames) % this.currentAnimation.getLen("N");
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
