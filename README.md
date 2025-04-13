# Timberland - Web Controllers
The `web-controllers` package aims at being a more modern, lightweight and modular approach to alternatives like [jQuery](https://github.com/jquery/jquery) and [Stimulus](https://github.com/hotwired/stimulus).

Some key features:
- Easily select and hydrate elements (`Ref`s) inside and scoped to the controller
- Optional Utility Web Components (more specifically, `CustomElements` API) for having a declarative experience in your HTML
- Lazy initialize the controllers for better performance and as a more declarative replacement for the `IntersectionObserver` (which is used behind scenes)
- Very small bundle size: **1.5kb** minified + gzipped, but can be stripped down if you don't want to use the built-in custom elements.
> [!NOTE]
> The API is still under active development. We can still cut down some code to compensate for new upcoming features, so this shouldn't change much.

## Project status
This package is pretty new, pretty niche and hence I don't expect a crazy wild adoption. I will, however, assume the compromise of maintaining and developing this, mainly because I want this to exist. I *need* this to exist. We must try to enrich the JavaScript ecosystem outside of the frameworks land and aim at solutions that integrate well with traditional technologies. Hopefully, to prevent us from having to re-write a whole frontend in <your_famework_here> just because jQuery is not cool anymore.

The API is almost stable, but I cannot guarantee anything until I (or we, if you reader decide to join me) hit a v1. There is a lot of testing to be done and so far 0 usage in production applications, so here be dragons. If you encounter anything unexpected, please feel free to open an issue!

## Index

## Installation
### With a package manager
```bash
pnpm add @timberland/web-controllers
...
```

```javascript
import { App } from '@timberland/web-controllers'
```
### With a CDN
```html
<!-- ESM -->
<script type="module">
    import { App } from "https://unpkg.com/@timberland/web-controllers/dist/web-controllers.esm.js"
</script>

<!-- IIFE -->
<script src="https://unpkg.com/@timberland/web-controllers/dist/web-controllers.iife.js"></script>
<script>
    // Stored under the WebControllers name so we don't pollute the global scope
    const { App } = window.WebControllers 
</script>
```
> [!CAUTION] 
> These examples should be used for development only. If you plan to use the CDN for production, pin a specific version. For instance: `https://unpkg.com/@timberland/web-controllers@0.0.9/dist/web-controllers.esm.js`. Check the releases section for getting the latest version.


## Example usage
### Using a more imperative approach
```html
<div data-controller="app">
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
2. We are registering a [controller](#appcontrollercontrollername-callback), in which we are receiving a [`Context`](#new-contextrootelement) and using one of its helpers to select and manipulate an existing HTML Element (with the [`$`](#context-1) proxy)
3. Finally, we are calling the `init` method of the `App` instance so the controller can be initialized as soon as the DOM is ready

<br/>

### Using Utility Web Components
```html
<div data-controller="app">
    <p data-ref="message">No one said hi...</p>
    <button>
        <x-on :click="sayHi"></x-on>
        Click me!
    </button>
</div>
```
```javascript
import { App, XOnFactory } from "@timberland/web-controllers"
const app = new App()

app.controller('app', (ctx) => {
    const { $ } = ctx

    return {
        sayHi: () => $.message.one({ textContent: 'Hi there!' }) 
    }
})

app.use(XOnFactory)
```

Like in the previous example, we are registering a controller that will affect the corresponding HTML Element with the `data-controller` attribute.
However, there are a couple of things to notice:
1. We are returning an object from the controller. This object will be the scope in which the custom element will look for the specified methods. Notice that there is no evaluation whatsoever here, its just mere string lookup in the returned object.
2. The controller will be initialized by the custom element. Meaning, when the `x-on` custom element enters its connected phase, it will:
    1. Find it closest `data-controller` element
    2. Check if it has been initialized
    3. If it hasn't been initialized, it will initialize it and then perform its logic (adding event listeners to its parent element or specified target)
    4. Once it has accomplished its mission, it will be automatically removed, leaving you with a clean, custom-elements-free DOM

Let's dive deeper! (Or, in case you are wondering "*what the hell...*", jump straight ahead to know more about [Utility Web Components](#utility-web-components)) 
<br/>

## Main concepts
### Controllers
These are the preferred way of hydrating your application. The idea is fairly simple: you register a controller name together with an associated callback that will run once your controller is initialized. Said callback will have access to its respective `Context` instance.

### Context
We create a context that holds all the utils for making our lives easier and pass it down during the controller's initialization phase. Here we can manipulate the root element, perform queries scoped to the controller itself, access references (or `Ref`s) and exposing methods available for event handling.

### Refs
`Ref`s are my proporsal for mitigating the pain of `querySelect`ing by hand. Refs can share the same name, and we still have the power to control if we want to affect just one or all of them, as well as performing some nice manipulation by providing a hydration object.

### Special attributes
I mostly like to stick to web standards, so all "special" attributes on existing HTML elements are mere dataset attributes. There are only 3:
- `data-controller`: Identifier for registered controllers.
- `data-ref`: Special selector for selecting `Ref`s.
- `data-scope`: Used to flatten a nested scope when referencing the hydration context in the HTML.

The approach is a little bit different, however, on the build-in web components. More on that in their specific section.

### Utility Web Components
#### Traditional Web Components approach
So here comes the weird part. I believe in the potential that web components have for the web, but it comes with a few quirks. From my point of view, the most relevant ones are:
1. They differ *a lot* from traditional frameworks components. Trying to compare them to, for instance, React components, will leave you pretty heart-broken. Even though they are components in the sense that they can allow you to abstract and reuse logic and pieces of HTML, they are regular DOM elements with almost the same limitations traditional frameworks aimt at mitigating.
2. They exist in the DOM, most of the times creating unnecessary nesting and sacrificing semantics. Typically, you will see a `button` component as `<custom-button><button>I'm a button</button></custom-button>`, just so you can perform some declarative logic on that button. It goes without saying that you couldn't use them, for instance, for list items, or anywhere where semantics are important. It *is* possible to extend existing elements and their semantics, but Safari [doens't put it easy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/is).
3. Because of all the reasons above, we can definitely argue that web components don't come "for free". They exist in the runtime, so they do take space in your DOM and you application's memory. While this can be useful in some cases, it's often more of a burden if you try to stick to the components model you are used to when utilizing frameworks like React.

They do, however, allow us to achieve pretty great things. For instance, with the aforementioned `custom-button` example: You don't need to know if the element is present on the DOM or not before the script has been executed. You don't need to wait for the DOM content to be fully loaded It's kind of CSS but for JavaScript: you define the logic once and the browser will take care once it encounters your selector.

This means that we can achieve a truly declarative approach in JavaScript without the need for any kind of workaounds, like using the `MutationObserver` API. When the browser detects a `custom-button` tag, it will perform whatever you want it to when its connected or disconnected from the DOM (similar to `mounted` and `unmounted` lifecycles of other frameworks).

#### Introducing Utility Web Components (UWCs)
With the concept of UWCs, I aim at meeting a middle ground between Web-Components-first libraries (like [Lit](https://github.com/lit/lit)) and attribute-first libraries (like [Alpine](https://github.com/alpinejs/alpine) or [Stimulus](https://github.com/hotwired/stimulus)).

We won't dive any further into alternatives like Lit, since their target is mainly Client Side Rendered web components. If we were to compare this library, it would be better to do do with Alpine and Stimulus, since we also believe in the power of "traditional" Server Side Rendered apps. Let's have a few words about it.

##### How they succeed at being declarative
They both use an attribute-first approach, meaning that you define some attributes in your HTML and they will take care of the rest. Elements can exit and enter the DOM without you having to worry about lifecycle events or manually hydrating them. You just declare what you want your piece of HTML do, and they will handle it for you.

This is nice, but both of them come with a few tradeoffs:
- Alpine requires you to use their mechanisms for manipulating the DOM. Meaning, if you want to conditionally render an element or to have an `@click` action to take place, you cannot manually remove or add an element from the DOM. Your DOM becomes then a strict representation of the state of your application. This is totally fine, but may seem a bit of an overkill for apps where your initial state has been already server-side-rendered.
- Stimulus (and more specifically, the Hotwire stack) follows more of a [HATEOAS](https://htmx.org/essays/hateoas/) approach, meaning that the state of your application is a direct reflection of your DOM. You can freely manipulate your DOM however you like, and Stimulus will make sure to properly handle the logic for everything to work just as you declare it. It does, however, use a `MutationObserver` under the hood. Which is fine, but we think we can achieve better performance and smaller bundle size with custom elements, which are just another mechanism that the web platform exposes to us.

##### My approach
By using web components, we can make sure the browser handles everything in the way it's supposed to. For initializing controllers (even lazily when they enter the viewport!), attaching event listeners or performing some logic when the target element is added or removed from the DOM, we can just nest custom elements instead of adding attributes. Picture this:

```html
<!-- An example snippet from Alpine -->
<!-- Suppossing we are declaring a component in a .js file -->
<div x-data>
    <button x-on:click="toggleMessage()">
        Click me!
    </button>
    <template x-if="showMessage == true">

        <p
          x-init="onMessageShown()"
          x-data="{ destroy() { console.log('message destroyed') } }">

          I'm a message
        </p>
    </template>
</div>

<!-- An example snippet using timberland web controllers -->
 <div data-controller="message">
    <button>
        <x-on :click="toggleMessage"></x-on>
        Click me!
    </button>

    <!-- We must manually attach or remove it from the DOM, it's not reactive. We add a data-ref to make it easier to manipulate -->
    <template data-ref="messageTemplate">
        <p>
            <x-init connected="onMessageShown" disconnected="onMessageDisconnected">
            I'm a message
        </p>
    </template>
 </div>
```

I'd argue it's not *that* different. Of course it may seem weird at first, it did when first designing and developing this API. But it's really easy to get used to it. It, of course, comes with a few tradeoffs of its own, but I strongly believe the good outweights them.

##### Does it mean we refuse to use web components in the traditional way? 
Hell, **no**! These little UWCs are my proporsal for addressing these little things other libraries would address via attributes and observers. I still love the idea of web components, specially in form of [HTML Web Components](https://blog.jim-nielsen.com/2023/html-web-components/). They are an amazing way of super-charging traditional HTML elements, and I have a few ideas of my own about things I can build using the Timberland Stack together with web components. Stay tuned for more 🥸.

Thanks a lot for reading and please do feel free to share with me any idea about this. Let's now come back to the documentation.


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