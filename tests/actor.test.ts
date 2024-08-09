import { Actor, ActorSprite } from "../classes/actor";
import { Position, Size } from "../classes/map-layer";

test('Actor is correctly initialized', () => {
    const mockImage = {
        width: 100,
        height: 200,
    } as HTMLImageElement;

    const tileSize: Size = { width: 50, height: 50 };
    const actorSprite = new ActorSprite(mockImage, 1, tileSize);
    const position: Position = { x: 5, y: 10 };

    const actor = new Actor(actorSprite, position);

    expect(actor.sprite).toBe(actorSprite);
    expect(actor.positionSquare.x).toBe(Math.floor(position.x));
    expect(actor.positionSquare.y).toBe(Math.floor(position.y));
    expect(actor.position.x).toBe(position.x + 0.5);
    expect(actor.position.y).toBe(position.y + 0.5);
});
