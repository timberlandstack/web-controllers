import _App from "../src/main";
import { setDocument } from "./utils/lib";

const App = new _App();
const partialName = "x-init";

describe("XInit custom element", () => {
	setDocument(partialName);

	it("should initialize the component according to its parent selector", () => {
		App.controller("app", ({ $scope, rootElement }) => {
			window.didRun = window.didRun ? false : true;
			$scope({ test: true });

			expect(rootElement).toBeInstanceOf(HTMLElement);
		});

		App.init();
	});

	it("should remove the element from the app registry when it is unmounted", () => {
		const appRoot = document.querySelector("[data-controller='app']");

		expect(window.didRun).toBe(true);
		expect(App.registry.get(appRoot)).toBeDefined();
		document.body.innerHTML = "";
		expect(App.registry.get(appRoot)).toBeUndefined();
	});

	it("should not run twice if the element is already registered", () => {
		setDocument(partialName);
		const appRoot = document.querySelector("[data-controller='app']");

		expect(window.didRun).toBe(false);
		expect(App.registry.get(appRoot)).toBeDefined();
		appRoot.appendChild(document.createElement("x-init"));
		expect(window.didRun).toBe(false);
	});
});
