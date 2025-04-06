# Timberland - Web Controllers
The `web-controllers` package aims at being a more modern, lightweight and ergonomic approach to alternatives like [jQuery](https://github.com/jquery/jquery) and [Stimulus](https://github.com/hotwired/stimulus), projects that have heavily inspired the API of this project.

Some key features:
- Automatically add event listeners as declared in the HTML
- Easily select and hydrate elements (`Ref`s) inside and scoped to the controller
- Add lifecycle methods for elements entering and exiting [TODO] the DOM without the need for any `MutationObserver`
- Web Components (more specifically, `CustomElements` API) for initializing the controllers, giving you more flexibility over how and when these are initialized
- [TODO] Lazy initialize the controllers for better performance and as a more declarative replacement for the `IntersectionObserver` (which is used behind scenes)
- [TODO] Ability to extend the `Context` class for adding your own custom helpers
- [TODO] Ability to add "directives" for performing adding custom behaviours when hydrating `Ref`s
- Very small bundle size: **1.4kb** minified + gzipped
> [!NOTE]
> The API is still under active development. We can still cut down some code to compensate for new upcoming features, so this shouldn't change much.

## Project status
This package is pretty new and we don't expect a crazy wild adoption. The API and the implementation are fairly simple, but please be aware that bugs might appear. If you find anything strange, please let us know by opening an issue.

The API is almost stable, so no crazy changes should be introduced. However, we are still defining and polishing it, as we would like the library to be fully backwards compatible across versions. The design we implement today must be the design we stick to during the whole life of the project.

## Index

## Installation
### With a package manager
```bash
pnpm add @timberland/web-controllers
...
```

```javascript
import { App, Context } from '@timberland/web-controllers'
```
### With a CDN
```html
<!-- ESM -->
<script type="module">
    import { App, Context } from "https://unpkg.com/@timberland/web-controllers/dist/web-controllers.esm.js"
</script>

<!-- IIFE -->
<script src="https://unpkg.com/@timberland/web-controllers/dist/web-controllers.iife.js"></script>
<script>
    // Stored under the WebControllers global name so we don't pollute the global scope
    const { App, Context } = window.WebControllers 
</script>
```
> [!CAUTION] 
> These examples should be used for development only. If you plan to use the CDN for production, pin a specific version. For instance: `https://unpkg.com/@timberland/web-controllers@0.0.9/dist/web-controllers.esm.js`. Check the releases section for getting the latest version.


## Example usage
```html
<div data-controller="app">
    <x-init></x-init>

    <p data-ref="message">No one said hi...</p>
    <button data-ref="btn">
        Click me!
    </button>
</div>
```
```javascript
const app = new App()

app.controller('app', (ctx) => {
    const { $ } = ctx

    $.btn.one({ 
        onclick: () => $.message.one({ textContent: 'Hi there!' }) 
    })
})

app.init()
```
Brief explanation:
1. We are creating an instance of the [`App`](#new-appoptions) class
2. We are registering a [controller](#appcontrollercontrollername-callback), in which:
    1. We are receiving a [`Context`](#new-contextrootelement) and using one of its helpers to select and manipulate an existing HTML Element (with the [`$`](#context-1) proxy)
    2. We are returning a hydration scope with a method that will be attached to the element with the [`data-on`](#usage-with-data-on-attribute) custom attribute
3. Finally, we are [initializing the `App` instance](#appinit) so the controller can be initialized

Let's dive deeper!


## Main concepts
### Controllers
These are the preferred way of hydrating your application. The idea is fairly simple: you register a controller name together with an associated callback that will run once your controller is initialized. Said callback will have access to its respective `Context` instance.

### Context
As opposed to jQuery's elements or Stimulus' inheritance model, we create a context that holds all the utils for making our lives easier and pass it down during the controller's initialization phase. Here we can manipulate the root element, perform queries scoped to the controller itself, access references (or `Ref`s) and exposing methods available for event handling.

### Refs
`Ref`s are our proporsal for mitigating the pain of `querySelect`ing by hand. Refs can share the same name, and we still have the power to control if we want to affect just one or all of them, as well as performing some nice manipulation by providing a hydration object.
### Special attributes

We stick to web standards, so our primary source for performing special computations based on declarative HTML is... well, you guessed it, web standards. All special attributes are mere dataset attributes. There are only 3:
- `data-controller`: Identifier for registered controllers. When the `x-init` custom elements enters the DOM (or it's first registered), it will look up to its closest element with a data-controller attribute to initialize it. This means that as long as you nest an `x-init` tag inside your controller, you can manipulate the HTML however you want and still get the hydration niceties.
- [`data-on`](#usage-with-data-on-attribute): When initializing the controller, we will check if a scope has been provided, by either using the [`Context#$scope`](#contextscopehydrationscope) method or by returning an object from the [controller](#appcontrollercontrollername-callback). It will then automatically add the corresponding event listeners to the element.
- [`data-ref`](#new-ref): Special selector for selecting `Ref`s.

> [!NOTE]
> In the future, we might open the door for new special attributes, and even allowing you to bring your own. Stay tuned ☺️


## Reference (API/Usage)
### `new App(options)`
The app class creates a new App instance. It accetps an options objects with the following properties:
- `initializerElementTag` (defaults to 'x-init'): the tag that will be used for automatically initializing the controllers
- [TODO] `contextClass`: custom class for adding your own helpers to the context. It **MUST** extend the exported `Context` class

#### `App#controller(controllerName, callback)`
This is the primary way of registering controllers in your app instance. It accepts a name (that should correspond to the data-controller name expected in the HTML) and a callback that will receive a [`Context`](#new-contextrootelement) instance. Optionally, this can return an object containing methods that will be added to the [hydration scope](#contextscopehydrationscope):
```html
<div data-controller="app">...</div>
```
```javascript
const app = new App()
app.controller('app', (ctx) => {
    // Anything you write here will run after the context has been initialized
    // you can think of this as the "onInit" method (kind of)
    // Manipulate the DOM inside the data-controller element however you want!

    // optinally return an object, more on that later
    return {}
})
```

#### `App#init`
After you have declared all your controllers, you can call the `init` method, that will take care of registering the initializer custom element:

```javascript
const app = new App()
app.controller('app', () => {...})
app.controller('anotherController', () => {...})
app.init()
```


### `new Context(rootElement)`
The `Context` class is used under the hood to automatically initialize the corresponding controllers. You will **rarely** manually use it, but in case you need a more imperative approach, note that this is possible:

```javascript
const appRoot = document.querySelector('[data-controller=app]')
const ctx = new Context(appRoot) // you can access all properties and methods exposed by the context instance 
```

#### `Context.rootElement`
The HTML Element that had the `data-controller` attribute:
```html
<div data-controller="app"></div>
```
```javascript
console.log(appRoot === ctx.rootElement) // -> true
```

#### `Context#$`

#### `Context#$scope(hydrationScope)`
This accepts an object that will be exposed when hydrating event handlers (more on that later). You can call it as many times as you need, as it will be performing a merge under the hood:

```javascript
...
ctx.$scope({
    logToConsole: (e) => console.log(e) 
})
ctx.$scope({
    alertHiOnce: {
        eventHandler: () => alert('Hi!'),
        options: {
            once: true
        }
    }
})
// At the end of the execution, the scope will be { logToConsole: ..., alertHiOnce: {...}}
```

Notice that the property can be either a method or an object containing an `eventHandler` and `options` property. In case you need to set any options (`once`, `capture`, `bubble`) this is the way to go.

##### Usage with `data-on` attribute:
For the example above, we can imagine the following HTML content:
```html
<button 
    data-on="(click, mouseover): logToConsole | (click): alertHiOnce"
>
    Click or hover me
</button>
```

As you can imagine, when we interact with the button for the first time, it will:
1. Log a MouseEvent (just by placing the mouse over it)
2. Log again a MouseEvent (when we click it)
3. Alert 'Hi!' (also triggered by the click)

Afterwards, the button will still log the events as expected, except for the alert one, as we specified the options with `once` set to true.

There is not much to it, really. It's that simple as: `(event_type [, event_type]): methodName [, method_name]"`. We then separate this clause with `|` if we want to add more handlers to another type. A few examples just to clarify:
- `(click): doSomething` -> will trigger `doSomething` on click
- `(click): doSomething | (mouseover): doSomething` -> will trigger `doSomething` on click and on mouseover
- `(click, mouseover): doSomething` -> same as above, but shorthand
- `(click): method1, method2` -> will trigger `method1` and `method2` on click

#### `Context#$select(selector, options)`
Equivalent to `querySelector` but implementing scoping inside controllers and cache. When called, it checks if there's a maching element stored in the controller's cache. If so, it will return the element or array of elements instead of performing a query, so it's safe to use it as jQuery's `$` function. It accepts the following options:

- `all` (default: `false`): Controll if it should select all matching elements or just one
- `invalidate` (default: `false`): Revalidate the query if needed instead of using the cache

Example usage:
```html
<div data-controller="app">
    <button>I'm scoped to the app controller</button>
    <div data-controller="nested">
        <button>I'm scoped to the nested controller</button>
    </div>
</div>
```
```javascript
const appRoot = document.querySelector('[data-controller=app]')
const nested = document.querySelector('[data-controller=nested]')

const appCtx = new Context(appRoot)
const nestedCtx = new Context(nested)

appCtx.$select('button', { all: true }) // -> returns an Array with all matching elements. In this case, just one because the second button is scoped to the nested controlloer
nestedCtx.$select('button') // -> defaulting to all: false. It will return the matching element.

// appending a new button to the root element
appCtx.rootElement.appendChild(
    document.createElement('button')
)

appCtx.$select('button', { all: true }) // -> It will still return an array with a single element
appCtx.$select('button', { 
    all: true, 
    invalidate: true
}) // -> It will now select the new button as well
```
> [!TIP]
> If you plan to have a lot of elements entering and exiting the DOM, we recommend using [`Ref`](#new-ref) instead

#### `Context#$getQueryString`
Given a regular `querySelector`-purposed string, his method returns the complete query string accounting for nested controllers. Under the hood, this is how the rest of methods achieve encapsulation:

```html
<div data-controller="app">
    <button>I'm scoped to the app controller</button>
    <div data-controller="nested">
        <button>I'm scoped to the nested controller</button>
    </div>
</div>
```
```javascript
const appRoot = document.querySelector('[data-controller=app]')
const nested = document.querySelector('[data-controller=nested]')

const appCtx = new Context(appRoot)
const nestedCtx = new Context(nested)

appCtx.$getQueryString('button') // -> button:not( [data-controller="nested"] * )
nestedCtx.$getQueryString('button') // -> button
```

It returns an instance with the following public properties and methods:

### `new Ref`

> [!WARNING]
> You will most likely notice that there are a few other properties other than the ones described here. These are public for now since they are needed to perform several stuff under the hood by other parts of the library. You will rarely need to use these, and if you do, use at your own risk. We might find a way to correctly hide these from the public API in future versions, although its not a priority at the moment.

## License
MIT