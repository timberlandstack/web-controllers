import { App } from "../../app";
import { BaseComponent } from "./base-component";

const TestFactory = (appInstance) => class Test extends BaseComponent(appInstance) {
    static selector = "x-test"
}

const app = new App()

app.controller('app', () => {
    return {}
})

app.controller('nested-controller', () => {
    return {}
})

app.init([
    TestFactory
])

document.body.innerHTML = /*html*/`
    <div data-controller="app">
        <x-test></x-test>

        <div data-controller="nested-controller">
            <x-test></x-test>
        </div>

        <x-test target="input"></x-test>
        <input type="text" data-ref="input" data-scope="inputComponent">
    </div>
`

const appController = document.querySelector('[data-controller="app"]')
const app_x_test = appController.querySelector('x-test')

const nestedController = appController.querySelector('[data-controller="nested-controller"]')
const nested_x_test = nestedController.querySelector('x-test')

const inputComponent = appController.querySelector('input[data-ref="input"]')
const target_x_test = appController.querySelector('x-test[target="input"]')

describe('BaseComponent properties', () => {
    it('should have a display none style attribute', () => {
        expect(app_x_test.style.display).toBe('none')
    })
    it('should have an appInstance property', () => {
        expect(app_x_test.appInstance).toBeDefined()
        expect(app_x_test.appInstance).toBe(app)
    })
    it('should correctly get the closest controller', () => {
        expect(app_x_test.closestController).toBe(appController)
        expect(nested_x_test.closestController).toBe(nestedController)
        expect(target_x_test.closestController).toBe(appController)
    })
    it('should have the correct target', () => {
        expect(app_x_test.target).toBe(appController)
        expect(nested_x_test.target).toBe(nestedController)
        expect(target_x_test.target).toBe(inputComponent)
    })
    it('should have a namespace if the target has a data-scope attribute', () => {
        expect(app_x_test.namespace).toBeUndefined()
        expect(target_x_test.namespace).toBe('inputComponent')
    })
    it('should initialize the closest controller if it has not been initialized', () => {
        app.controller('later-controller', () => {})
        document.body.insertAdjacentHTML('beforeend', /*html*/`
            <div data-controller="later-controller"></div>
        `)
        const laterController = document.querySelector('[data-controller="later-controller"]')

        expect(app.registry.get(laterController)).toBeUndefined()
        laterController.appendChild(document.createElement('x-test'))
        expect(app.registry.get(laterController)).toBeDefined()
    })
    it('should have the correct context', () => {
        expect(app_x_test.context).toBe(app.registry.get(appController))
        expect(nested_x_test.context).toBe(app.registry.get(nestedController))
        expect(target_x_test.context).toBe(app.registry.get(appController))
    })
})