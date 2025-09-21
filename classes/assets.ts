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

	static async loadImages(map: { [name: string]: string }
			       ): Promise<Map<string, HTMLImageElement>> {
		const entries = await Promise.all(
			Object.entries(map)
				.map(async ([name, url]) => {
					const img = await Assets.loadImage(url);
					return [name, img] as const;
				})
		);
		return new Map(entries);
	}

	static async loadImagesToRecord(map: { [name: string]: string }
			       ): Promise<Record<string, HTMLImageElement>> {
		const entries = await Promise.all(
			Object.entries(map)
				.map(async ([name, url]) => {
					const img = await Assets.loadImage(url);
					return [name, img] as const;
				})
		);

		return Object.fromEntries(entries);
	}

	static async loadJSON<T = any>(url: string): Promise<T> {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Failed to load JSON from ${url}`);
		return res.json() as Promise<T>;
	}
}
