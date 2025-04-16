# Timberland - Web Controllers <!-- omit in toc --> 
The `web-controllers` package aims at being a more modern, lightweight and modular approach to alternatives like [jQuery](https://github.com/jquery/jquery) and [Stimulus](https://github.com/hotwired/stimulus).

Some key features:
- Easily select and hydrate elements (`Ref`s) inside and scoped to the controller
- Utility Web Components (more specifically, `CustomElements` API) for having a declarative experience in your HTML, like automatically initializing elements, handling lifecyle events and attaching event listeners
- Execute your declarative code lazily for better performance and as a more declarative replacement for the `IntersectionObserver` (which is used behind scenes)
- Very small bundle size: **1.5kb** minified + gzipped, but can be stripped down if you don't want to use the built-in custom elements.
> [!NOTE]
> The API is still under active development. We can still cut down some code to compensate for new upcoming features, so this shouldn't change much.

## Project status <!-- omit in toc -->
This package is pretty new, pretty niche and hence I don't expect a crazy wild adoption. I will, however, assume the compromise of maintaining and developing this, mainly because I want this to exist. I *need* this to exist. We must try to enrich the JavaScript ecosystem outside of the frameworks land and aim at solutions that integrate well with traditional technologies. Hopefully, to prevent us from having to re-write a whole frontend in <your_famework_here> just because jQuery is not cool anymore.

The API is almost stable, but I cannot guarantee anything until I (or we, if you reader decide to join me) hit a v1. There is a lot of testing to be done and so far 0 usage in production applications, so here be dragons. If you encounter anything unexpected, please feel free to open an issue!

## Table of contents <!-- omit in toc --> 
- [Installation](#installation)
- [Example usage](#example-usage)
- [Main concepts](#main-concepts)
  - [Controllers](#controllers)
  - [Context](#context)
  - [Refs](#refs)
  - [Special attributes](#special-attributes)
  - [Utility Web Components](#utility-web-components)
- [Reference (API/Usage)](#reference-apiusage)
  - [`new App`](#new-app)
    - [`.controller(controllerPrefix, callback)`](#controllercontrollerprefix-callback)
    - [`.use(CustomElementFactory)`](#usecustomelementfactory)
  - [`new Context(rootElement)`](#new-contextrootelement)
    - [`.rootElement`](#rootelement)
    - [`.$scope(hydrationScope)`](#scopehydrationscope)
    - [`.$` proxy](#-proxy)
    - [`.$select(selector, options)`](#selectselector-options)
    - [`.$getQueryString`](#getquerystring)
  - [`new Ref`](#new-ref)
    - [`.one(attributes)`](#oneattributes)
    - [`.all(attributes)`](#allattributes)
    - [`reset`](#reset)
  - [Custom Elements (Utility Web Components)](#custom-elements-utility-web-components)
    - [`x-on`](#x-on)
    - [`x-init`](#x-init)


## Installation
### With a package manager <!-- omit in toc --> 
```bash
pnpm add @timberland/web-controllers
...
```

```javascript
import { App } from '@timberland/web-controllers'
```
### With a CDN <!-- omit in toc --> 
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

<br/>

[Back to Index](#table-of-contents-)
<br/>

## Example usage
```html
<x-controller name="app">
    <p data-ref="message">No one said hi...</p>

    <button>
        <x-on :click="sayHi"></x-on>
        Click me!
    </button>

    <!-- If we prefer to just select the button instead of using the x-on component -->
    <!-- <button data-ref="actionBtn">Click me!</button> -->
</x-controller>
```
```javascript
import { App, XOnFactory } from "@timberland/web-controllers"
const app = new App()

app.controller('app', (ctx) => {
    const { $ } = ctx
    const sayHi = () => $.message.one({ textContent: 'Hi there!' })
    // Optionally: if selecting and hydrating by hand
    // $.actionBtn.one({ onclick: sayHi })

    return { sayHi }
})

app.use(XOnFactory)
```
Brief explanation: 
1. We are creating an instance of the `App` class.
2. We are registering a controller, in which we are receiving a `Context` as the only argument, and using one of its helpers to select and manipulate an existing HTML Element (with the `$` proxy). This controller will be usable in the DOM with the `x-controller` custom element and adding its respective name.
3. We are returning an object from the controller. This object will be the scope in which the custom element will look for the specified methods. Mind that there is no evaluation whatsoever here, its just mere string lookup in the returned object. This is completely optional, as we could simply select and hydrate the button by hand, as illustrated in the commented code.
4. We are nesting an `x-on` custom element inside the button. This will:
    1. Find it closest `x-controller` element.
    2. Check if it has been initialized. If so, it will attach the corresponding event listeners to its target element (the button).
    3. If it hasn't been initialized (for instance, because you want it to be initialized lazily), it will enqueue its `init` method inside the controller, ensuring it only performs its logic once the context is available.
    4. Once it has accomplished its mission, it will be automatically removed from the DOM.

Let's dive deeper! (Or, in case you are wondering "*what the hell...*", jump straight ahead to know more about [Utility Web Components](#utility-web-components)) 

<br/>

[Back to Index](#table-of-contents-)
<br/>

## Main concepts
### Controllers
Controllers are custom elements (`x-controller`) that will look for a callback matching its name attribute. The idea is fairly simple: you register a controller name together with an associated callback that will run during the initialization phase of the element. Said callback will have access to its respective `Context` instance.

### Context
The Context that holds all the utils for making our lives easier and pass it down during the controller's initialization phase. Here we can manipulate the root element, perform queries scoped to the controller itself, access references (or `Ref`s) and exposing methods available for hydration. It will then be merged into the custom element's properties, making it easily accessible for other controllers or your own scripts (one of the advantages of using custom elements for this).

### Refs
`Ref`s are the proporsal for mitigating the pain of `querySelect`ing by hand. Refs can share the same name, and we still have the power to control if we want to affect just one or all of them, as well as manipulating them by providing a hydration object.

### Special attributes
I mostly like to stick to web standards, so all "special" attributes on existing HTML elements are mere dataset attributes. The only two ones are:
- `data-ref`: Special selector for selecting `Ref`s.
- `data-scope`: Used to flatten a nested scope when referencing the hydration context in the HTML.

The approach is a little bit different, however, on the build-in web components. More on that in their [specific section](#custom-elements).

### Utility Web Components
> A foreword: I am mentioning libraries like Alpine, Stimulus and Lit. It goes without saying that I talk about them with my most profound and sincere respect. Those are all libraries I've used, and so do a lot of people in their day-to-day production applications. I love their work, I admire the great minds of creators and contributors behind them, and I can only dream of having at least a fraction of their intelligence and creativity. 

#### Traditional Web Components approach <!-- omit in toc --> 
I believe in the potential that web components have for the web, but they come with a few quirks. From my point of view, the most relevant ones are:
1. They differ *a lot* from traditional frameworks components. Trying to compare them to, for instance, React components, will leave you pretty heart-broken. Even though they are components in the sense that they can allow you to abstract and reuse logic and pieces of HTML, they are regular DOM elements with almost the same limitations traditional frameworks aim at mitigating.
2. They exist in the DOM, not just in the code base, most of the times creating unnecessary nesting and sacrificing semantics. Typically, you will see a `button` component as `<custom-button><button>I'm a button</button></custom-button>`, just so you can perform some declarative logic on that button. It goes without saying that you couldn't use them, for instance, for list items, or anywhere where semantics are important. It *is* possible to extend existing elements and their semantics, but Safari [doens't put it easy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/is).
3. Because of all the reasons above, we can definitely argue that web components don't come "for free". They exist in the runtime, so they do take space in your DOM and you application's memory. While this can be useful in some cases, it's often more of a burden if you try to stick to the components model you are used to when utilizing frameworks like React.

They do, however, allow us to achieve pretty neat things. For instance, with the aforementioned `custom-button` example: You don't need to know if the element is present on the DOM or not before the script has been executed. You don't need to wait for the DOM content to be fully loaded. It's kind of CSS but for JavaScript: you define the logic once and the browser will take care once it encounters your selector. Moreover, unlike the component model we see in traditional frameworks, their properties and methods are available in the runtime, so there is really no need for prop drilling. If you want to call a method of a custom element from another one, you merely `querySelect` it and you are good to go.

Broadly speaking, I'd argue that the most exciting part about Web Components is that we can achieve a truly declarative approach in JavaScript without the need for any kind of workaounds, like using the `MutationObserver` API, or having to keep track of every DOM mutation by hand. When the browser detects a `custom-button` tag, it will perform whatever you told it to when it's connected or disconnected from the DOM (similar to `mounted` and `unmounted` lifecycles of other frameworks).

#### Introducing Utility Web Components (UWCs) <!-- omit in toc --> 
With the concept of UWCs, I aim at meeting a middle ground between Web-Components-first libraries (like [Lit](https://github.com/lit/lit)) and attributes-first libraries (like [Alpine](https://github.com/alpinejs/alpine) or [Stimulus](https://github.com/hotwired/stimulus)).

I won't dive any further into alternatives like Lit, since their target is mainly Client Side Rendered web components. If we were to compare this library, it would be better to do so with Alpine and Stimulus, since I also believe in the power of "traditional" Server Side Rendered apps. Let's have a few words about it.

##### How they succeed at being declarative <!-- omit in toc --> 
With the attributes-first approach, you define some attributes in your HTML and they will take care of the rest. Elements can exit and enter the DOM without you having to worry about lifecycle events or manually hydrating them. You just declare what you want your piece of HTML do, and they will handle it for you.

This is nice, but both of them come with a few tradeoffs:
- Alpine requires you to use their mechanisms for manipulating the DOM. Meaning, if you want to conditionally render an element or to have an `@click` action to take place, you cannot manually remove or add an element from the DOM. Your DOM becomes then a strict representation of the state of your application. This is totally fine, but may seem a bit of an overkill for apps where your initial state has been already server-side-rendered.
- Stimulus (and more specifically, the Hotwire stack) follows more of a [HATEOAS](https://htmx.org/essays/hateoas/) approach, meaning that the state of your application is a direct reflection of your DOM. You can freely manipulate your DOM however you like, and Stimulus will make sure to properly handle the logic for everything to work just as you declare it. It does, however, use a `MutationObserver` under the hood. Which is fine, but we think we can achieve better performance and smaller bundle size with custom elements, which are just another mechanism that the web platform exposes to us. Another thing I don't particulary like is its verbosity, both on the HTML and JS sides.

##### Our approach <!-- omit in toc --> 
By using web components, we can make sure the browser handles everything in the way it's supposed to. For initializing controllers (even lazily when they enter the viewport!), attaching event listeners or performing some logic when the target element is added or removed from the DOM, we can just nest custom elements instead of adding attributes. Picture this:

```html
<!-- An example snippet from Alpine -->
<div x-data="message">
    <button @click="toggleMessage()">
        Click me!
    </button>

    <template x-if="showMessage">
        <p
          x-init="onMessageShown()"
          x-data="{ destroy() { console.log('message destroyed') } }">
          I'm a message
        </p>
    </template>
</div>
```
In this Alpine example, there are a few things going on:
1. The `x-data` can take place because we are manually initializing Alpine, and its then performing a query on the document. This makes it really difficult to execute or load code lazily.
2. Notice how we are actually calling the `toggleMessage` function. Under the hood, Alpine evaluates the in-html-js code by using a `Function` constructor. It is not *dramatic*, but I personally don't like it.
3. When showing the `p` tag inside the `template` element, we need to make sure we hide/show it using the reactive property `showMessage`. Otherwise, Alpine cannot know anything about the element and will not perform any action when it is initialized or destroyed. (This should be fine though, if you are using Alpine you probably don't want to manually manipulate the DOM).

```html
<!-- An example snippet using Web Controllers -->
<x-controller name="message">
    <button>
        <x-on :click="toggleMessage"></x-on>
        Click me!
    </button>

    <!-- 
        We must manually attach or remove it from the DOM, it's not reactive. 
        We add a data-ref to make it easier to manipulate 
    -->
    <template data-ref="messageTemplate">
        <p>
            <x-init :connected="onMessageShown" :disconnected="onMessageDisconnected">
            I'm a message
        </p>
    </template>
 </x-controller>
```
In this case:
1. We don't need to initialize anything. Since the controller is a custom element, the browser knows what to do with it when it encounters it. We can also schedule its initialization to take place when entering the viewport.
2. We don't know how, why and at which point of the execution of the app this button with an "onclick" handler arrived. But we don't care, the `x-on` custom element takes care of attaching the corresponding event listeners.
3. Same with the `p` tag. The `x-init` component is smart enough as to know what to do when it is connected or disconnected from the DOM.

In general, this approach allow us to just "don't give a damn" about how or when the DOM is manipulated. We could still (and are planning to) introduce some reactivity mechanisms, but they can be totally optional and deatached from hydration logic. No MutationObserver, no complex tracking mechanisms... nothing. Bundle size small, me is happy.

Of course it may seem weird at first. It did when first designing and developing this API. But it's really easy to get used to it. Surely it comes with a few tradeoffs of its own, but I strongly believe the good outweights the ugly. You can read more about the quirks [here](to-be-implemented-hehe).

##### Does it mean I advocate against web components? <!-- omit in toc --> 
Hell, **no**! UWCs are my proporsal for addressing these little things other libraries would address via attributes and observers. I still love the idea of web components, specially in form of [HTML Web Components](https://blog.jim-nielsen.com/2023/html-web-components/). They are an amazing way of super-charging traditional HTML elements, and I have a few ideas of my own about things I can build using the Timberland Stack together with web components. Stay tuned for more 🥸.

Thanks a lot for reading and please feel free to share with me any idea about this. Let's now come back to the documentation.
<br/>

[Back to Index](#table-of-contents-)
<br/>

## Reference (API/Usage)
### `new App`
It returns an App instance with the following methods:

#### `.controller(controllerPrefix, callback)`
The first argument is a name that will be used by the corresponding custom element once its initialized. The second one is a callback that will receive a [`Context`](#new-contextrootelement) instance, and will later be merged into the custom element. Optionally, this can return an object containing methods that will be added to the [hydration scope](#contextscopehydrationscope):
```html
<x-controller name="app"></x-controller>
```
```javascript
const app = new App()
app.controller('app', (ctx) => {
    // Anything you write here will run after the context has been initialized
    // Manipulate the DOM inside the controller element however you want!

    // optinally return a hydration context.
    return {}
})
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `.use(CustomElementFactory)`
Method for registering the built-in custom elements (or your own, as log as they extend the `BaseComponent` class). They come in the form of a factory, because we need the `App` instance to make them work. Check out how the `x-on` custom element [is implemented](/src/customElements/x-init/x-init.js).

You can pass them as comma separated arguments, or register them line by line. The only important rule is:

**They must come after registering all your controllers**. Otherwise, they will be registered before your controllers and weird behaviour may occur. I might solve it eventually, but for the time being just stick to this rule.

Example usage:
```javascript
import { App, XOnFactory, XInitFactory } from "@timberland/web-controllers";

const app = new App()
// your controllers must come first
app.controller(...)
app.use(XOnFactory, XInitFactory)
// OR:
// app.use(XOnFactory)
// app.use(XInitFactory)
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

### `new Context(rootElement)`
The `Context` class is used under the hood to perform the custom logic you want on the controllers. You will **rarely** manually use it, but in case you need it, note that this is possible:

```javascript
const someElement = document.querySelector('#some-element')
const ctx = new Context(someElement) // you can access all properties and methods exposed by the context instance 
```

#### `.rootElement`
The HTML Element passed to the `Context` constructor. When registering controller, it will be the custom element itself:
```html
<x-controller name="some-controller"></x-controller>
```
```javascript
const app = new App()
const customElement = document.querySelector('x-controller[name="some-controller"]')

app.controller('some-controller', ({ rootElement }) => {
    expect(rootElement).toBe(customElement)
})
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `.$scope(hydrationScope)`
This accepts an object that will be exposed when hydrating your HTML. You can call it as many times as you need, as it will be performing a merge under the hood:
```html
<x-controller name="hydratable">
    <x-on :click="logToConsole, alertHiOnce"></x-on>
</x-controller>
```
```javascript
const app = new App()
app.controller('hydratable', ({ $scope }) => {
    $scope({
        logToConsole: (e) => console.log(e) 
    })
    $scope({
        alertHiOnce: {
            eventHandler: () => alert('Hi!'),
            options: {
                once: true
            }
        }
    })
})

document.querySelector('x-controller[name="hydratable"]').scope // -> { logToConsole: ..., alertHiOnce: {...}}
```

> [!TIP]
> Notice that the property can be either a method or an object containing an `eventHandler` and `options` property. In case you need to set any options (`once`, `capture`, `bubble`) this is the way to go.

> [!NOTE]
> If you return a hydration context, it will be merged as well. The `$scope` method is just a little helper useful for organizing code inside your controller. It is also used under the hood when returning a hydration context.

> [!WARNING]
> There are only two property names that are reserved: `connected` and `disconnected`. They will be run in the respective lifecycle methods of the controller and then deleted from the scope.
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `.$` proxy
The `$` helper is a [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) instance that will help you dynamically select any element with a `data-ref` attribute scoped inside the controller element. It will return a `Ref` instance:

```html
<x-controller name="app">
    <p data-ref="message"></p>
    <button data-ref="btn"></button>
</x-controller>
```
```javascript
app.controller('app', ({ $ }) => {
    $.message.one() // will return the HTMLParagraphElement with the data-ref of "message"
    $.btn.one() // will return the HTMLButtonElement with the data-ref of "btn"
})
```
Notice that in the example above, the `one` method is a method of the `Ref` element. Checkout the [`Ref`](#new-ref) section to learn more.

<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `.$select(selector, options)`
Equivalent to `querySelector` but implementing cache and scoping inside controllers. When called, it checks if there's a maching element stored in the controller's cache. If so, it will return the element or array of elements instead of performing a query, so it's safe to use it as jQuery's `$` function. It accepts the following options:

- `all` (default: `false`): Controll if it should select all matching elements or just one
- `invalidate` (default: `false`): Revalidate the query if needed instead of using the cache

Example usage:
```html
<x-controller name="app">
    <button>I'm scoped to the app controller</button>
    <button>I'm also scoped to the app controller</button>

    <x-controller name="nested">
        <button>I'm scoped to the nested controller</button>
    </x-controller>

</x-controller>
```
```javascript
const app = new App()

app.controller('app', ({ $select, rootElement }) => {
    $select('button', { all: true }) // -> returns an Array with two HTMLButtonElements

    // appending a new button to the root element
    rootElement.appendChild(
        document.createElement('button')
    )

    $select('button', { all: true }) // -> It will still return an array with the two elements originally on the HTML
    $select('button', { 
        all: true, 
        invalidate: true
    }) // -> It will now include the new button as well
})

app.controller('nested', ({ $select }) => {
    $select('button') // -> defaulting to all: false. It will return the first matching element.
})
```
> [!TIP]
> If you plan to have a lot of elements entering and exiting the DOM, we recommend using [`Ref`](#new-ref) instead
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `.$getQueryString`
Given a regular `querySelector`-purposed string, his method returns the complete query string accounting for nested controllers. Under the hood, this is how the rest of methods achieve encapsulation:

```html
<x-controller name="app">
    <button>I'm scoped to the app controller</button>
    <x-controller name="nested">
        <button>I'm scoped to the nested controller</button>
    </x-controller>
</x-controller>
```
```javascript
const app = new App()

app.controller('app', ({ $getQueryString }) => {
    $getQueryString('button') // -> button:not( x-controller[name="nested"] * )
})

app.controller('nested', ({ $getQueryString }) => {
    $getQueryString('button') // -> button  
})
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

### `new Ref`
As stated previously, the `$` helper inside the `Context` instance will return intances of the `Ref` class. You should not care about how they are instantiated, since the `$` proxy of the `Context` takes care for you. They come with the following methods:

#### `.one(attributes)`
It returns the first element matching the accessed name nested inside the controller. Know that, under the hood, it is using the `$select` method, so it will implement a cache mechanism as well. Optionally, you can provide an object with event handlers, attributes and properties that will be automatically assigned to it:

```html
<x-controller name="app">
    <button data-ref="btn">My button</button>
</x-controller>
```
```javascript
const app = new App()

app.controller('app', ({ $, rootElement }) => {
   // This will be the first time selecting it. Every subsequent time
   // we access to it it will grab it from the cache.
   $.btn.one().textContent = "My text content changed"
   $.btn.one().addEventlistener('click', doSomething, { once: true })
   $.btn.one().setAttribute('data-hello', 'world')

   // Can also be done like:
   $.btn.one({
      textContent: "My text content changed",
      // event handlers must start with "on"
      onclick: {
         eventHandler: doSomething
         options: {
            once: true
         }
      },
      "data-hello": "world"
   })

   
})
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `.all(attributes)`
It returns an array with all matching HTMLElements. Similarly to the `one` method, this also accepts an object with attributes. In this case its even more useful, since attributes will be applied to all matching refs. You can still manipulate them in a loop if you want.

```html
<x-controller name="app">
    <button data-ref="btn">I'm scoped to the app controller</button>
    <button data-ref="btn" data-message="hello">I'm also scoped to the app controller</button>
</x-controller>
```
```javascript
const app = new App()

app.controller('app', ({ $, rootElement }) => {
    $.btn.all() // -> returns an Array with two HTMLButtonElements

    // appending a new button to the root element
    rootElement.appendChild(
        document.createElement('button')
    )

    $.btn.reset().all() // -> It will now select the new button as well.
    $.btn.all().forEach(...)

    $.btn.all({
      // If we provide a function, it will be called passing the current element
      textContent: (btn) => `${btn.dataset.message ?? "Default message"}`,
    })
   
})
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `reset`
It would be the equivalent of passing `invalidate: true` to the `$select` helper. It returns the `Ref` itself so we can call `one` or `all` again.

> [!TIP]
> Refs will keep track of their last accessed value. If you access `$.refName.one()` and later `$.refName.all()`, it is assumed that you want to invalidate the query, so its not necessary to call `reset` to change from a `one` to an `all`.
> <br/>

[Back to Index](#table-of-contents-)
<br/>

### Custom Elements (Utility Web Components)
For the time being, we just provide two built-in custom elements. As stated in the previous sections, they aim at being a more declarative alternative to attributes. 

They both work in the same way: given a set of special attributes, they will look up for them in their closest controller's hydration context (either returned from the controller callback or added via the [`$scope`](#scopehydrationscope) helper). There is no javascript evaluation whatsoever. If you need to perform any conditional action based on a value you would typically pass down as an argument for the event handler, the best approach would be to use a dataset on the target element.

They both share these common attributes:
- `target`: It specifies the target element the action should be performed on. This is specially useful for void elements that cannot contain any children. It will find the first element of the controller with a matching `data-ref` attribute.
- `lazy`: It delays the initialization until the element enters the viewport.

#### `x-on`
Its mission is to attach event listeners to its target. If not specified otherwise, the target will be its closest parent element. It will look for methods in the controller, or for an object with an `eventHandler` and `options` properties. Once the events are added to the target element, it will be removed from the DOM.

You can add as many event names as you want as long as they are provided in the `:<event-name>` format. Every attribute starting with a colon (`:`) will be treated as an event name. It can therefore be used for custom events as well. If you want several handlers for the same event, separate them with commas.

```html
<x-controller name="app">
    <!-- 
        It targets the app controller and will work only 
        after it enters the viewport.
    -->
    <x-on lazy :click="handleClick, handleDelegatedClick" :mouseover="logCursorPosition">

    <form>
        <!-- It targets the form element -->
        <x-on :submit="handleSubmit"></x-on>
        <label>Enter your name:
            <!-- 
                It targets the input element and will work only 
                after it (the input element) enters the viewport 
             -->
            <x-on target="nameInput" :input="validateInput" :focusout="validateInput">
            <input type="text" name="name_input" data-ref="nameInput"/>
        </label>
    </form>
</x-controller>
```
```javascript
import { App, XOnFactory } from "@timberland/web-controllers"
const app = new App()

app.controller('app', () => {
    return {
        // return all methods exactly as written in the HTML
    }
})

app.use(XOnFactory)
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `x-init`
It's used to perform effects when the target element enters and exits the DOM. Since this it can be initialized lazily, it can be also used for detecting when the target element enters the viewport.

The only two attributes are `:connected` and `:disconnected`. As for the `x-on` element, they will look for the callback to execute in the hydration scope.

```html
<x-controller name="app">
    <x-init 
        target="img" 
        data-ref="imgInit" 
        :disconnected="imgDisconnected">
    </x-init>
    <img data-ref="img" src="..." alt="" />

    <template data-ref="tmp">
        <p>
            <x-init :connected="pConnected"></x-init>
        </p>
    </template>
</x-controller>

```
```javascript
import { App, XInitFactory } from "@timberland/web-controllers";
const app = new App()

app.controller('app', ({ $ }) => {
    // This will trigger all the specified callbacks
    $.imgInit.one().replaceWith(
        $.tmp.one().content
    )

    return {
        // return all methods exactly as written in the HTML
    }
})

app.use(XInitFactory)

```

> [!NOTE]
> If you paid close attention, you will notice that in the case of the image element, we are actually targetting the `x-init` element for its elimination. When the `x-init` is removed, it will make sure its target gets removed as well. This can get **really weird**, so I'd personally suggest you wrap your element to be deleted inside another non-void element 😅 

<br/>

[Back to Index](#table-of-contents-)
<br/>

## License <!-- omit in toc -->
MIT
