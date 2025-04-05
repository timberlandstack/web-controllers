import { getEventsMap, resolveProperty } from "../src";

describe("App utils", () => {
  describe("getEventsMap", () => {
    it("should return an object containing the event name and an array of method names", () => {
      const eventsString = "(click): inc, something | (mouseover): inc";
      const referenceEventsMap = {
        click: ["inc", "something"],
        mouseover: ["inc"],
      };
      const eventsMap = getEventsMap(eventsString);
      expect(eventsMap).toEqual(referenceEventsMap);
    });

    it("should accept comma separated events", () => {
      const eventsString = "(click, mouseover): inc | (click): something";
      const referenceEventsMap = {
        click: ["inc", "something"],
        mouseover: ["inc"],
      };
      const eventsMap = getEventsMap(eventsString);
      expect(eventsMap).toEqual(referenceEventsMap);
    });
  });

  describe("resolveProperty", () => {
    it("should resolve a property name based on a given object", () => {
      const propertyName = "inc";
      const mockContext = { inc: "hello" };
      const value = resolveProperty(propertyName, mockContext);
      expect(value).toBe("hello");
    });

    it("should be able to access nested properties via object notation", () => {
      const propertyName = "hello.world.nested";
      const mockContext = {
        hello: {
          world: {
            nested: true,
          },
        },
      };
      const value = resolveProperty(propertyName, mockContext);
      expect(value).toBe(true);
    });
  });
});
