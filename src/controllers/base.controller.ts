export abstract class BaseController {
    private static instances = new Map<string, BaseController>();

    protected constructor() {
        // Protected constructor to prevent direct construction calls with the `new` operator
    }

    protected static getInstanceInternal<T extends BaseController>(constructor: new () => T): T {
        const className = constructor.name;
        if (!BaseController.instances.has(className)) {
            BaseController.instances.set(className, new constructor());
        }
        return BaseController.instances.get(className) as T;
    }
} 