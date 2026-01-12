
import EventEmitter from "./eventEmitter";

describe("EventEmitter", () => {
    test("subscribes and emits events", () => {
        const emitter = new EventEmitter<any>();
        const callback = jest.fn();

        emitter.add(callback);
        emitter.emit({ data: 1 });

        expect(callback).toHaveBeenCalledWith({ data: 1 });
    });

    test("removes listeners", () => {
        const emitter = new EventEmitter<any>();
        const callback = jest.fn();

        emitter.add(callback);
        emitter.remove(callback);
        emitter.emit({ data: 1 });

        expect(callback).not.toHaveBeenCalled();
    });

    test("handles multiple listeners", () => {
        const emitter = new EventEmitter<any>();
        const cb1 = jest.fn();
        const cb2 = jest.fn();

        emitter.add(cb1);
        emitter.add(cb2);
        emitter.emit({ val: "test" });

        expect(cb1).toHaveBeenCalledWith({ val: "test" });
        expect(cb2).toHaveBeenCalledWith({ val: "test" });
    });
});
