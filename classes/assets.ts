export type ImageNames = Record<string, string> | string[];

export class Assets {
	constructor() {
		throw new Error('Assets is a static class and cannot be instantiated');
	}

	static async loadImage(url: string): Promise<HTMLImageElement> {
		const image = new Image();
		image.src = url;
		return new Promise((resolve, reject) => {
			image.onload = () => resolve(image);
			image.onerror = reject;
		});
	}

	private static async loadImagesInternal(
		map: ImageNames
	): Promise<(readonly [string, HTMLImageElement])[]> {
		if (Array.isArray(map)) {
			map = Object.fromEntries(map.map(x => [x, x]));
		}
		const entries = await Promise.all(
			Object.entries(map)
				.map(async ([name, url]) => {
					const img = await Assets.loadImage(url);
					return [name, img] as const;
				})
		);
		return entries;
	}

	static async loadImages(
		map: ImageNames
	): Promise<Map<string, HTMLImageElement>> {
		return new Map(await Assets.loadImagesInternal(map));
	}

	static async loadImagesToRecord(
		map: ImageNames
	): Promise<Record<string, HTMLImageElement>> {
		return Object.fromEntries(await Assets.loadImagesInternal(map));
	}

	static async loadImagesToArray(
		map: ImageNames
	): Promise<HTMLImageElement[]> {
		// TODO: reconsider
		return (await Assets.loadImagesInternal(map))
			.map(([_, img]) => img);
	}

	static async loadJSON<T = any>(url: string): Promise<T> {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Failed to load JSON from ${url}`);
		return res.json() as Promise<T>;
	}
}
