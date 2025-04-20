# Timberland - Web Controllers <!-- omit in toc --> 
The `web-controllers` package aims at being a more lightweight and modular approach to alternatives like [Alpine](https://github.com/alpinejs/alpine) and [Stimulus](https://github.com/hotwired/stimulus), while leveraging a unique use for web components. Heavily inspired by [h3](https://h3.unjs.io/).

Some key features:
- Turn any piece of HTML into a controller to easily manipulate it and avoid extra querySelectors.
- Built-in reactivity engine
- Modular and extra small: the core size is less than **1kb** minified and gzipped (including the `Emitters`). Use our built-in helpers and custom elements as you need them, allowing for a magnificent tree-shaking. If you were to use the whole library, it would only add **1kb** to the core. 
- Turn dataset attributes into values you can work with in JavaScript in a consistent manner.
- Built-in helpers to make DOM manipulation easier and Utility Web Components for having a declarative experience in your HTML.
- Execute your declarative code lazily for better performance and as a more declarative replacement for the `IntersectionObserver` (which is used behind the scenes).
> [!NOTE]
> The API is still under active development. While it is very usable, breaking changes may come, so use it at your own risk.

## Project status <!-- omit in toc -->
This package is pretty new, pretty niche and hence I don't expect a crazy wild adoption. I will, however, assume the compromise of maintaining and developing this, mainly because I want this to exist. We must try to enrich the JavaScript ecosystem outside of the frameworks land and aim at solutions that integrate well with traditional technologies. Hopefully, to prevent us from having to re-write a whole frontend in <your_framework_here> just because jQuery is not cool anymore.

The API is almost stable, but I cannot guarantee anything until I (or we, if you dear reader decide to join me) hit a v1. There is a lot of testing to be done and so far 0 usage in production applications, so here be dragons. If you encounter anything unexpected, please feel free to open an issue!

## Table of contents <!-- omit in toc --> 
- [Installation](#installation)
- [Example usage](#example-usage)
- [Main concepts](#main-concepts)
  - [Controllers](#controllers)
  - [Context](#context)
  - [Helpers](#helpers)
  - [Special attributes](#special-attributes)
  - [Utility Web Components](#utility-web-components)
- [Reference (API/Usage)](#reference-apiusage)
  - [Core (`@timberland/web-controllers`):](#core-timberlandweb-controllers)
    - [`defineController(name, { values, controller })`](#definecontrollername--values-controller-)
    - [`useElements(...elements)`](#useelementselements)
    - [`context`](#context-1)
    - [`defineGlobals(globals)`](#defineglobalsglobals)
  - [Helpers (`@timberland/web-controllers/helpers`)](#helpers-timberlandweb-controllershelpers)
    - [`values(context)`](#valuescontext)
    - [`mount(context)`](#mountcontext)
    - [`ref(context)`](#refcontext)
    - [`select(context)`](#selectcontext)
    - [`getQueryString(context)`](#getquerystringcontext)
    - [`lifecycle(context)`](#lifecyclecontext)
    - [`viewport(context)`](#viewportcontext)
  - [`new Ref`](#new-ref)
    - [`.one(attributes)`](#oneattributes)
    - [`.all(attributes)`](#allattributes)
    - [`.reset`](#reset)
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
import { defineController } from '@timberland/web-controllers'
```

Export paths are:
- `'@timberland/web-controllers'` for the core (e.g: `defineController`, `useElements`)
- `'@timberland/web-controllers/helpers'` for the helpers (e.g: `values`, `ref`)
- `'@timberland/web-controllers/elements'` for the custom elements (`BaseComponent`, `XOn`, `XInit`)
- 
### With a CDN <!-- omit in toc --> 
```html
<!-- ESM -->
<script type="module">
    import { defineController } from "https://unpkg.com/@timberland/web-controllers/dist/bundled/web-controllers.esm.js"
</script>

<!-- IIFE -->
<script src="https://unpkg.com/@timberland/web-controllers/dist/bundled/web-controllers.iife.js"></script>
<script>
    // Stored under the WebControllers name so we don't pollute the global scope
    const { Application } = window.WebControllers 
</script>

We recommend you use the bundled versions for ease of use. However, if you prefer, you can also find the same equivalents as in the package manager version:
- [cdn_url/package]/dist/index.[format].js (for the core)
- [cdn_url/package]/dist/helpers.[format].js (for the helpers)
- [cdn_url/package]/dist/customElements.[format].js (for the custom elements)
```
> [!CAUTION] 
> These examples should be used for development only. If you plan to use the CDN for production, pin a specific version. For instance: `https://unpkg.com/@timberland/web-controllers@0.0.10/dist/bundled/web-controllers.esm.js`. Check the releases section for getting the latest version.

<br/>

[Back to Index](#table-of-contents-)
<br/>

## Example usage
```html
<article data-controller="main">
    <p data-ref="message">No one said hi...</p>

    <button>
        <x-on :click="sayHi"></x-on>
        Click me!
    </button>
</article>
```
```javascript
import { defineController, useElements } from "@timberland/web-controllers"
import { ref } from "@timberland/web-controllers/helpers"
import { XOn } from "@timberland/web-controllers/elements"

defineController("main", {
    controller: (ctx) => {
        const { message } = ref(ctx)
        return {
            sayHi: () => message.one({ textContent: 'Hi there!' })
        }
    }
})

useElements(XOn)
```

Brief explanation:
1. We are defining a controller with the `defineController` function. As the first argument, we are passing the name of the controller (main), and as the second one we are passing an object that will be used to register all of your controllers' properties. The minimum we must provide is the `controller` method.
2. In the `controller` method, we are receiving a `context` object. By default, this object is super light weight and only has the bare minimum properties and methods for it to work.
3. We are using the `ref` helper. When we pass the `context` to it, it will use the existing properties and add the ones it needs for its magic to work. It will then return a proxy from where we can grab the matching `data-ref` elements scoped to the controller.
4. We are returning an object containing a method that will be used by the `x-on` custom element...
5. ...which we are registering with the `useElements` function.

Let's dive deeper! (Or, in case you are wondering "*what the hell...*", jump straight ahead to know more about [Utility Web Components](#utility-web-components)) 

<br/>

[Back to Index](#table-of-contents-)
<br/>

## Main concepts
### Controllers
Controllers are the basic piece of this library. All the logic we want to perform on the DOM should be registered in the form of a controller. Once registered, it will be automatically initialized or scheduled, in the case you specify a `data-load` attribute.

### Context
The context is a super light-weight object containing the bare minimum properties and methods for our controllers to work. It is passed down as argument for the `controller` method, where we can manipulate either manually or via helpers.

### Helpers
They are high-order functions that read and manipulate the `context` object, returning a function we can use to give our controllers new functionalities. You can think of them like "mixins" in common OOP. By keeping them in this way instead of built-in right into the context, we allow for a better tree-shaking and faster initialization.

### Special attributes
We mostly like to stick to web standards, so all "special" attributes on existing HTML elements are mere dataset attributes. The only two ones are:
- `data-ref`: Special selector for selecting `Ref`s.
- `data-namespace`: Used to access a mounted namespace when referencing the hydration context in the HTML.
- `data-load`: It specifies how we should initialize the controllers. If not present, the controllers will be initialized as soon as possible. It accepts either `lazy` or `visible`.

The approach is a little bit different, however, on the built-in web components. More on that in their [specific section](#custom-elements).

### Utility Web Components
> A brief foreword: I am mentioning libraries such as Alpine, Stimulus and Lit. It goes without saying that I talk about them with my most profound and sincere respect. Those are all libraries I've used, and so do a lot of people in their day-to-day production applications. I love their work, I admire the great minds of the creators and contributors behind them, and I can only dream of having at least a fraction of their intelligence and creativity. 

#### Traditional Web Components approach <!-- omit in toc --> 
I believe in the potential that web components have for the web, but they come with a few tradeoffs. From my point of view, the most relevant ones are:
1. They differ *a lot* from traditional frameworks' components. Trying to compare them to, for instance, React components, will leave you pretty heart-broken. Even though they are components in the sense that they can allow you to abstract and reuse logic and/or pieces of HTML, they are regular DOM elements with almost the same limitations traditional frameworks aim at mitigating.
2. They exist in the DOM, not just in the code base. Most of the times, this creates unnecessary nesting and sacrifices semantics. Typically, you will see a `button` component as `<custom-button><button>I'm a button</button></custom-button>`, just so you can perform some declarative logic on that button. It goes without saying that you couldn't use them, for instance, for list items, or anywhere where semantics are important. It *is* possible to extend existing elements and their semantics, but Safari [doesn't make it easy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/is).
3. Because of all the reasons above, we can definitely argue that web components don't come "for free". They exist in the runtime, so they do take space in your DOM and you application's memory. While this can be useful in some cases, it's often more of a burden if you try to stick to the component model you are used to when utilizing frameworks like React.

They do, however, allow us to achieve pretty neat things. For instance, with the aforementioned `custom-button` example: You don't need to know if the element is present on the DOM or not before the script has been executed. You don't need to wait for the DOM content to be fully loaded. It's kind of CSS but for JavaScript: you define the logic once and the browser will take care of it once it encounters your "selector". Moreover, unlike the component model we see in traditional frameworks, their properties and methods are available in the runtime, so there is really no need for prop drilling. If you want to call a method of a custom element from another one, you merely `querySelect` it and you are good to go.

Broadly speaking, I'd argue that the most exciting part about Web Components is that we can achieve a truly declarative approach in JavaScript without the need for any kind of workarounds, like using the `MutationObserver` API, or having to keep track of every DOM mutation by hand. When the browser detects a `custom-button` tag, it will perform whatever you told it to when it's connected or disconnected from the DOM (similar to `mounted` and `unmounted` lifecycle of other frameworks).

#### Introducing Utility Web Components (UWCs) <!-- omit in toc --> 
With UWCs, I aim at meeting a middle ground between Web-Components-first libraries (like [Lit](https://github.com/lit/lit)) and attributes-first libraries (like [Alpine](https://github.com/alpinejs/alpine) or [Stimulus](https://github.com/hotwired/stimulus)).

I won't dive any deeper into alternatives like Lit, since their target is mainly Client Side Rendered web components. If we were to compare this library, it would be better to do so with Alpine and Stimulus, since I also believe in the power of "traditional" Server Side Rendered apps. Let's have a few words about it.

##### How they succeed at being declarative <!-- omit in toc --> 
With the attributes-first approach, you define some attributes in your HTML and the library will take care of the rest. Elements can exit and enter the DOM without you having to worry about lifecycle events or manually hydrating them. You just declare what you want your HTML to do, and they will handle it for you.

This is nice, but both of them come with a few tradeoffs:
- Alpine requires you to use their mechanisms for manipulating the DOM. Meaning, if you want to conditionally render an element or to have an `@click` action to take place, you cannot manually remove or add elements from the DOM. Your DOM becomes then a strict representation of the state of your application. This is totally fine, but may seem a bit of an overkill for apps where your initial state has been already server-side-rendered.
- Stimulus (and more specifically, the Hotwire stack) follows more of a [HATEOAS](https://htmx.org/essays/hateoas/) approach, meaning that the state of your application is a direct reflection of your DOM. You can freely manipulate your DOM however you like, and Stimulus will make sure to properly handle the logic for everything to work just as you declare it. It does, however, use a `MutationObserver` under the hood. Which is fine, but I think we can achieve better performance and smaller bundle size with custom elements, which are just another mechanism that the web platform exposes to us. Another thing I don't particularly like is its verbosity, both on the HTML and JS sides.

##### The UWCs approach <!-- omit in toc --> 
By using web components, we can make sure the browser handles everything in the way it's supposed to. For initializing controllers, attaching event listeners or performing some logic when the target element is added or removed from the DOM, we can just nest custom elements instead of adding attributes. Picture this:

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

<div data-controller="main">
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
 </div>
```
In this case:
1. We don't know how, why and at which point of the execution of the app this button with an "onclick" handler arrived. But we don't care. The `x-on` custom element takes care of attaching the corresponding event listeners and initializing the closest controller if it hasn't been present in the DOM in its moment of definition.
2. Same with the `p` tag. The `x-init` component is smart enough as to know what to do when it is connected or disconnected from the DOM.

In general, this approach allow us to just "don't give a damn" about how or when the DOM is manipulated. We could still (and are planning to) introduce some reactivity mechanisms, but they can be totally optional and detached from hydration logic. No MutationObserver, no complex tracking mechanisms... nothing.

Of course it may seem weird at first. It did when first designing and developing this API. But it's really easy to get used to it. Surely it comes with a few tradeoffs of its own, but I strongly believe the good outweighs the ugly. 

##### Does it mean I advocate against web components? <!-- omit in toc --> 
Hell, **no**! UWCs are my proposal for addressing these little things other libraries would address via attributes and observers. I still love the idea of web components, specially in form of [HTML Web Components](https://blog.jim-nielsen.com/2023/html-web-components/). They are an amazing way of super-charging traditional HTML elements, and I have a few ideas of my own about things I can build using the Timberland Stack together with web components. Stay tuned for more 🥸.

Thanks a lot for reading and please feel free to share with me any idea about this. Let's now come back to the documentation.
<br/>

[Back to Index](#table-of-contents-)
<br/>

## Reference (API/Usage)
### Core (`@timberland/web-controllers`):
This is the core of the web controllers. The rest of the exports need this core, but it can be used totally independently. It exposes the mechanics the custom elements and helpers are built on: 

#### `defineController(name, { values, controller })`
The first argument is a name that will be used to identify the target `data-controller` element. The second one is an object containing two properties: a `values` schema and `controller` callback. The callback will receive a `context` instance and will be executed when the controller is mea. Optionally, it can return an object containing methods that will be added to the [hydration scope](#contextscopehydrationscope).
The `values` is an object that will be used to map your `data-x-value` on the controller HTML element to usable values in JavaScript. Think of them as "server side props", where you have a fine-grained controller on how to use them. See the [`values`]() section to know more about values.
```html
<div data-controller="app" data-count-value="2"></div>
```
```javascript
defineController("app", {
    values: {
        count: { // name of the value in JavaScript
            transformer: Number, // Function for transforming the value before using it inside your controller
            default: 0 // default value in case no matching data-x-value has been found
        }
    },
    controller: (ctx) => {
        // Anything you write here will run after the context has been initialized
        // Manipulate the DOM inside the controller element however you want!

        // optionally return a hydration scope.
        return {}
    }
})

```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `useElements(...elements)`
Function for registering the built-in custom elements (or your own, as long as they have a `selector` static property). Check out how the `x-on` custom element [is implemented](/src/customElements/x-init/x-init.js).

You can pass them as comma separated arguments, or register them line by line. The only important rule is:

**They must come after registering all your controllers**. Otherwise, they will be registered before your controllers and weird behavior may occur. We might solve it eventually, but for the time being just stick to this rule.

Example usage:
```javascript
import { defineController, useElements } from "@timberland/web-controllers";
import { XOn, XInit } from "@timberland/web-controllers/elements";

// your controllers must come first
defineController(/*...*/)
useElements(XOn, XInit)
useElements(class MyElement extends HTMLElement {
    static selector = "my-element"
})
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `context`
An object that will be passed as an argument to the controller callback. It is meant to be as slim as possible and then will be populated either by you or by the helper functions. By default, it contains the following properties:
- `valuesSchema`: The values object provided in the `defineController` function.
- `rootElement`: The element with the `data-controller` attribute.
- `scope`: The object to be used during hydration. You will typically populate it by returning from the controller callback.

Additionally, it will contain all properties defined in the `defineGlobals` function

#### `defineGlobals(globals)`
Since this library is designed to be modular, all helpers should be declared as per-use in the controller's context. However, if you prefer to have a more "inheritance" approach, you can define global helpers that will automatically be added in all contexts.

```javascript
defineGlobals({
    helpers: {
        "$": ref
    }
})

defineController("app", {
    controller: (ctx) => {
        ctx.$ // defined
        // Would be equivalent to:
        const $ = ref(ctx)
    }
})
```

[Back to Index](#table-of-contents-)
<br/>

### Helpers (`@timberland/web-controllers/helpers`)
Helpers are our proposal for giving you some functionalities for working with your DOM more comfortably without relying on mechanisms like inheritance. They are high order functions that accept the context, setup all needed properties and then return some methods. You can use them directly or add them in the context by yourself.

#### `values(context)`
It returns the mapped values as defined in the values schema used when defining the controller. Under the hood, it will read all your given values and map them to attributes with the format `data-[name]-value` in your controller HTML element.

```html
<!-- This works even better if your values are rendered in the server -->
<div 
    data-controller="app" 
    data-likes-value="33" 
    data-published-on-value="10/10/1995"
></div>
```
```javascript
defineController("app", {
    values: {
        likes: {
            transformer: Number,
            default: 0
        },
        publishedOn: {
            transformer: (val) => new Date(val)
        }
    },
    controller: (ctx) => {
        const { likes, publishedOn } = values(ctx) // they will be of type Number and a Date instance, respectively
    }
})
```

#### `mount(context)`
It returns a function that helps to assign a namespace name to an HTML element. Instead of accessing nested values via dot notation, you can assign a namespace for other elements inside your controller to grab the methods from. For instance:

```html
<div data-controller="app">
    <h1>Count is: <span data-ref="counter"></span></h1>

    <!-- It would be possible via dot notation -->
    <!-- <button namespace="button">
        <x-on :click="_namespaces.button.increment"></x-on>
    </button> -->
    <button data-namespace="button">
        <x-on :click="increment"></x-on>
        Increment
    </button>
</div>
```
```javascript

// It's expecting to receive the context object
const Button = ({ $ }) => {
    let count;
    return {
        increment: $.counter.one({ textContent: ++count})
    }
}

defineController("app", {
    controller: (ctx) => {
        ctx.$ = ref(ctx)
        mount(ctx)('button', Button)
    }
})
```

> [!NOTE]
> It will add the `_namespaces` property to `context.scope`.

#### `ref(context)`
It returns a [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) that will help you dynamically select any element with a matching `data-ref` attribute nested inside the controller element. It will return a `Ref` instance

```html
<div data-controller="app">
    <p data-ref="message"></p>
    <button data-ref="btn"></button>
</div>
```
```javascript
defineController("app", {
    controller: (ctx) => {
        const { message, btn } = ref(ctx)

        message.one() // will return the HTMLParagraphElement with the data-ref of "message"
        btn.one() // will return the HTMLButtonElement with the data-ref of "btn"
    }
})
```
Notice that in the example above, the `one` method is a method of the `Ref` element. Checkout the [`Ref`](#new-ref) section to learn more.

<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `select(context)`
It returns a function equivalent to `querySelector` but implementing cache and scoping inside controllers. When called, it checks if there's a matching element stored in the controller's cache. If so, it will return the element or array of elements instead of performing a query, so it's safe to use it as jQuery's `$` function. It accepts the following options:

- `all` (default: `false`): Control if it should select all matching elements or just one
- `invalidate` (default: `false`): Revalidate the query if needed instead of using the cache

Example usage:
```html
<div data-controller="app">
    <button>I'm scoped to the app controller</button>
    <button>I'm also scoped to the app controller</button>

    <div data-controller="nested">
        <button>I'm scoped to the nested controller</button>
    </div>

</div>
```
```javascript
defineController("app", {
    controller: (ctx) => {
        const $select = select(ctx)
        $select('button', { all: true }) // -> returns an Array with two HTMLButtonElements

        ctx.rootElement.appendChild(
            document.createElement('button')
        )

        $select('button', { all: true }) // -> It will still return an array with the two elements originally on the HTML
        $select('button', { 
            all: true, 
            invalidate: true
        }) // -> It will now include the new button as well
    }
})

defineController("nested", {
    controller: (ctx) => {
        const $select = select(ctx)
        $select('button') // -> defaulting to all: false. It will return the first matching element.
    }
})
```
> [!TIP]
> For manipulating named elements, we recommend using [`ref`](#refcontext) instead

<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `getQueryString(context)`
It returns a function that, given a regular `querySelector`-purposed string, returns the complete query string accounting for nested controllers. Under the hood, this is how the rest of methods achieve encapsulation:

```html
<div data-controller="app">
    <button>I'm scoped to the app controller</button>
    <div data-controller="nested">
        <button>I'm scoped to the nested controller</button>
    </div>
</div>
```
```javascript
// defining them as global so they are available in the context
defineGlobals({
    helpers: {
        $getQueryString: getQueryString
    }
})

defineController("app", {
    controller: ({ $getQueryString }) => {
        $getQueryString('button') // -> button:not( [data-controller="nested"] * )
    }
})

defineController("nested", {
    controller: ({ $getQueryString }) => { 
        $getQueryString('button') // -> button  
    }
})
```
> [!NOTE]
> It is used under the hood by `select` and `ref`. It will add the property `nestedController` to the context.

<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `lifecycle(context)`
It will return two functions accepting a callback that will be used for the `connected` and `disconnected` phases of the controller. Their names are `$connected` and `$disconnected` respectively. If you return another callback from the callback passed to the `$connected` function, it will overwrite the `$disconnected` callback. Example:

```html
<div data-controller="app">
    <x-init></x-init>
</div>
```
```javascript
defineController("app", {
    controller: (ctx) => {
        const { $connected, $disconnected } = lifecycle(ctx)

        $connected(() => {
            console.log("Connected to the DOM")

            // return () => console.log("This will overwrite the $disconnected callback")
        })
        $disconnected(() => {
            console.log("Removed from the DOM")
        })
    }
})
```

> [!NOTICE]
> It will add the `_lifecycleMethods` property to the context.

> [!NOTICE]
> For functions to work, you will need to use an `x-init` element targeting the controller HTML element. Otherwise, we have no way of tracking when an element is disconnected from the DOM.

#### `viewport(context)`
It returns two functions named `$inViewport` and `$offViewport`. They are only useful if combining `data-load` and `data-load-repeat` attributes in your controller. The callbacks provided will be called every time the element enters or exits the viewport, respectively:

```html
 <div data-controller="apply-transition" data-load="visible" data-load-repeat>
        <img 
            src="https://picsum.photos/300/200" 
            alt="Random and meaningless picture from lorem picsum"
            aria-hidden="true"
            class="hidden" />
    </div>
</div>
```
```javascript
defineController('apply-transition', {
    controller: (ctx) => {
        const { $inViewport, $offViewport } = viewport(ctx)

        $inViewport(() => {
            const img = ctx.rootElement.querySelector('img')
            img.classList.remove('hidden')
            img.setAttribute('aria-hidden', "false")
        })

        $offViewport(() => {
            console.log('data-load="visible" is off-viewport')
            const img = ctx.rootElement.querySelector('img')
            img.classList.add('hidden')
            img.setAttribute('aria-hidden', "true")
        })
    }
})
```
> [!NOTICE]
> It will add the `_viewportMethods` property to the context.

### `new Ref`
As stated previously, the `ref` helper will return an instance of the `Ref` class. You should not care about how they are instantiated, since the `$` proxy of the `Context` takes care of it for you. They come with the following methods:

#### `.one(attributes)`
It returns the first element matching the accessed name nested inside the controller. Know that, under the hood, it is using the `select` function, so it will implement a cache mechanism as well. Optionally, you can provide an object with event handlers, attributes and properties that will be automatically assigned to it:

```html
<div data-controller="app">
    <button data-ref="btn">My button</button>
</div>
```
```javascript
defineController("app", {
    controller: (ctx) => {
        // This will be the first time selecting it. Every subsequent time
        // we access it, it will grab it from the cache.
        const { btn } = ref(ctx)

        btn.one().textContent = "My text content changed"
        btn.one().addEventListener('click', doSomething, { once: true })
        btn.one().setAttribute('data-hello', 'world')

        // Can also be done like:
        btn.one({
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
    }
})
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `.all(attributes)`
It returns an array with all matching HTMLElements. Similarly to the `one` method, this also accepts an object with attributes. In this case it's even more useful, since attributes will be applied to all matching refs. You can still manipulate them in a loop if you want.

```html
<div data-controller="app">
    <button data-ref="btn">I'm scoped to the app controller</button>
    <button data-ref="btn" data-message="hello">I'm also scoped to the app controller</button>
</div>
```
```javascript
defineController("app", {
    controller: (ctx) => {
        const { btn } = ref(ctx)
        btn.all() // -> returns an Array with two HTMLButtonElements

        rootElement.appendChild(
            document.createElement('button')
        )

        btn.reset().all() // -> It will now select the new button as well.
        btn.all().forEach(/*...*/)

        btn.all({
            // If we provide a function, it will be called with the current element as argument
            textContent: (buttonElement) => 
                `${buttonElement.dataset.message ?? "Default message"}`,
        })

    }
})
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `.reset`
It would be the equivalent of passing `invalidate: true` to the `$select` helper. It returns the `Ref` itself so we can call `one` or `all` again.

> [!TIP]
> Refs will keep track of their last accessed value. If you access `refName.one()` and later `refName.all()`, it is assumed that you want to invalidate the query, so its not necessary to call `reset` to change from a `one` to an `all`.

<br/>

[Back to Index](#table-of-contents-)
<br/>

### Custom Elements (Utility Web Components)
For the time being, we just provide two built-in custom elements. As stated in the previous sections, they aim at being a more declarative alternative to attributes. 

They both work in the same way: given a set of special attributes, they will look up for their values in their closest controller's hydration scope. There is no JavaScript evaluation whatsoever. If you need to perform any conditional action based on a value (when you would typically pass down as an argument for the event handler), the best approach would be to use a dataset on the target element.

They both share:
- `target`: It specifies the target element the action should be performed on. This is specially useful for void elements that cannot contain any children. It will find the first element of the controller with a matching `data-ref` attribute.

#### `x-on`
Its mission is to attach event listeners to its target. If not specified, the target will be its closest parent element. It will look for methods in its closest controller. Once the events are added to the target element, it will be removed from the DOM.

You can add as many event names as you want as long as they are provided in the `:<event-name>` format. Every attribute starting with a colon (`:`) will be treated as an event name. It can therefore be used for custom events as well. If you want several handlers for the same event, separate them with commas.

```html
<x-controller name="app">
    <!-- It targets the app controller -->
    <x-on :click="handleClick, handleDelegatedClick" :mouseover="logCursorPosition">

    <form>
        <!-- It targets the form element -->
        <x-on :submit="handleSubmit"></x-on>
        <label>Enter your name:
            <!-- It targets the input element-->
            <x-on target="nameInput" :input="validateInput" :focusout="validateInput">
            <input type="text" name="name_input" data-ref="nameInput"/>
        </label>
    </form>
</x-controller>
```
```javascript
defineController("app", {
    controller: () => {
        return {
            // return all methods exactly as written in the HTML
        }
    }
})

useElements(XOn)
```
<br/>

[Back to Index](#table-of-contents-)
<br/>

#### `x-init`
It's used to perform effects when the target element enters and exits the DOM.

The only two attributes are `:connected` and `:disconnected`. As for the `x-on` element, it will look for the callback to execute in the hydration scope.

```html
<div data-controller="app">

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
defineController("app", {
    controller: (ctx) => {
        const { imgInit, tmp } = ref(ctx)
        // This will trigger all the specified callbacks
        imgInit.one().replaceWith(
            tmp.one().content
        )

        return {
            // return all methods exactly as written in the HTML
        }
    }
})

useElements(XInit)
```

> [!NOTE]
> If you paid close attention, you will notice that in the case of the image element, we are actually targeting the `x-init` element for its elimination. When the `x-init` is removed, it will make sure its target gets removed as well. This can get **really weird**, so I'd personally suggest you wrap your element to be deleted inside another non-void element 😅 

<br/>

[Back to Index](#table-of-contents-)
<br/>

## License <!-- omit in toc -->
MIT
