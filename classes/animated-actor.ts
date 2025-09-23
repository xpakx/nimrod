import { ActorSprite, Actor } from "./actor.js";
import { Position, Size } from "./map-layer.js";

export type AnimationDirection = "N" | "S" | "E" | "W";

export class Animation {
	animations: { [K in AnimationDirection]?: number[] } = {};

	addForDir(dir: AnimationDirection, seq: number[]) {
		this.animations[dir] = seq;
	}

	getFrame(index: number, dir: AnimationDirection): number {
		const anim = this.animations[dir];
		if (!anim) return 0;
		return anim[index % anim.length];
	}

	getLen(dir: AnimationDirection): number {
		const anim = this.animations[dir];
		if (!anim) return 0;
		return anim.length;
	}

}

export class AnimatedActorSprite implements ActorSprite {
	frames: HTMLImageElement[];
	canvases: OffscreenCanvas[];
	contexts: OffscreenCanvasRenderingContext2D[];

	animations: Record<string, Animation> = {};
	currentAnimation: Animation | undefined;
	frameTime: number = 0;
	currentFrame: number = 0;
	frameDuration: number = 30;
	key: string;

	currentDirection: AnimationDirection = "N";
	baseSize: number;

	constructor(frames: HTMLImageElement[], size: number, tileSize: Size, key: string) {
		this.frames = frames;
		this.key = key;
		this.baseSize = size;

		this.canvases = [];
		this.contexts = [];
		for (let i = 0; i < this.frames.length; i++) {
			const off = new OffscreenCanvas(1, 1);
			const ctx = off.getContext('2d');
			if (!ctx) throw new Error("Couldn't create OffscreenCanvas context");
			this.canvases.push(off);
			this.contexts.push(ctx);
		}
		this.refreshSize(tileSize);
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
		const frame = this.currentAnimation.getFrame(this.currentFrame, this.currentDirection);
		return this.frames[frame];
	}

	getScaledImage(): HTMLImageElement | OffscreenCanvas {
		if (!this.currentAnimation) return this.frames[0];
		const frame = this.currentAnimation.getFrame(this.currentFrame, this.currentDirection);
		return this.canvases[frame];
	}

	toDirection(pos: Position): AnimationDirection {
		if (pos.x === 0 && pos.y > 0) return "N";
		if (pos.x === 0 && pos.y < 0) return "S";
		if (pos.x < 0 && pos.y === 0) return "W";
		if (pos.x > 0 && pos.y === 0) return "E";
		return "N";
	}

	tick(deltaTime: number, actor: Actor) {
		this.currentDirection = this.toDirection(actor.direction);

		if (!this.currentAnimation) {
			this.currentFrame = 0;
			return;
		}
		this.frameTime += deltaTime;
		if (this.frameTime > this.frameDuration) {
			const frames = Math.floor(this.frameTime / this.frameDuration);
			this.currentFrame = (this.currentFrame + frames) % this.currentAnimation.getLen(this.currentDirection);
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
