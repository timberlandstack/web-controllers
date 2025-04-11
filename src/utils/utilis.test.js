import { getEventsMap, resolveProperty } from ".";

describe("App utils", () => {
  describe("getEventsMap", () => {
    it("should return an object containing the event name and an array of method names", () => {
      document.body.innerHTML = /*html*/ `
        <x-on :click="inc, something" :mouseover="inc" target="shouldNotBeIncluded"></x-on>
      `;

      const elementWithAttributes = document.querySelector("x-on");
      const referenceEventsMap = {
        click: ["inc", "something"],
        mouseover: ["inc"],
      };
      const eventsMap = getEventsMap(elementWithAttributes.attributes);
      expect(eventsMap).toEqual(referenceEventsMap);
    });
  });

  describe("resolveProperty", () => {
    it("should resolve a property name based on a given object", () => {
      const propertyName = "inc";
      const mockContext = { inc: "hello" };
      const value = resolveProperty({ propertyName, context: mockContext });
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
      const value = resolveProperty({ propertyName, context: mockContext });
      expect(value).toBe(true);
    });

    it("should resolve properties based on a namespace", () => {
      const propertyName = "world.nested";
      const mockContext = {
        hello: {
          world: {
            nested: true,
          },
        },
      };
      const value = resolveProperty({
        propertyName,
        context: mockContext,
        namespace: "hello",
      });
      expect(value).toBe(true);
    });

    it("should work with nested namespaces", () => {
      const propertyName = "nested";
      const mockContext = {
        hello: {
          world: {
            nested: true,
          },
        },
      };
      const value = resolveProperty({
        propertyName,
        context: mockContext,
        namespace: "hello.world",
      });
      expect(value).toBe(true);
    });
  });
});
