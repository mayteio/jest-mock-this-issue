# How to mock a websocket services for testing, learning caveats of ES6 classes and proxies along the way.

Pusher is a fantastic websocket SaaS product that has a great feature called presence channels. Presence channels make creating realtime functionality like chat rooms an absolute breeze - clients can know who is in a 'channel', including what their name is, where they come from, etc.

Testing them in jest\*, however, is a whole new ball game. Trying to simulate multiple clients connecting to a single service via mocks has been a great challenge. Building on awesome code, I've been working on [`pusher-js-mock`]() jest mock handle presence channels for Pusher so you can achieve this.

<sup>\*I know jest isn't where you'd typically test multi-client functionality, however, our case was unique.</sup>

## What does this have to do with classes and proxies?

I'm getting there. To authorize your clients in Pusher, you do something like the following;

```js
const doThingsToGetAuth = () => Promise.resolve({ myID: "my-id" });

const client = new Pusher({
  authorizer: channel => ({
    authorize: async (socketId, callback) => {
      const auth = await doThingsToGetAuth({ channel, socketId });
      // here's where you identify yourself with the local client.
      callback(false, auth);
    }
  })
});

const channel = client.subscribe("channel-name");
console.log(channel.name); // => "channel-name"
console.log(channel.members.myID); // => "my-id"
```

<sup>_Simplified for brevity_</sup>

**Here's the problem**: how do we mock one instance of a channel that multiple clients have unique properties for, i.e. no two clients should have the same channel property of `channel.members.myID`. Answer: ES6 Proxies.

## How do you mock something like that locally?

Let's mock a super simple Pusher instance. It turns out this is _relatively_ easy to do using ES6 classes and Proxies! Briefly;

- [Classes]() are an ES6 feature that simulate class-like inheritance, supporting useful things like constructors, this, instance and static methods
- [Proxies]() allow you to transparently intercept access to javascript objects and augment their behaviour. Truly awesome when you play with them.

> I'm using JS here to keep things simple, though I highly recommend getting to know TypeScript well as it helps pick up bugs before you save your code!

## Project setup: be a good developer, write a test.

Testing was a tricky thing for me, for a long time, so I want to show you how simple it can be. All you're doing is using the code you build as a developer would (in the case of UI testing you should test as if a user is using it). Then you assert certain conditions. That's it!

Before we even get started, we're going to write our test so we know if we're on the right path. Jest also provides a place for us to quickly iterate our code without spinning up a dev server or anything. We use `babel` so we can have all the fun ES6 features mentioned above.

Let's set up our project, then get jest & babel configured correctly.

```bash
$ mkdir MockPusher
$ cd MockPuser
$ yarn init # run through the script with all defaults
$ yarn add --dev jest babel-jest babel-core @babel/preset-env @babel
$ touch jest.config.js babel.config.js
```

```js
// jest.config.js
module.exports = {
  // we're telling jest to use babel for code transpilation.
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest"
  }
};
```

```js
// babel.config.js
module.exports = {
  // tell babel to use the latest ES6 Goodness, including classes and proxies.
  presets: ["@babel/preset-env"]
};
```

Finally, we need our test. Create a file called `client.test.js` and fill it with the following:

```js
import { MockClient } from "./MockClient";

test("should set channel.membes.myID via proxy", () => {
  const client = new MockClient({
    authorizer: () => ({ authorize: callback => callback(id) })
  });

  const channel = client.subscribe("my-channel");

  // here we assert that the channel has the property channel
  // equal to the channel we passed into the client
  expect(channel.members.myID).toBe("my-id");
});
```

The other awesome thing about writing tests up front is we can define what we want our API to look like and build it out to confirm to that. We know from this test that `MockClient` needs to be initialised with an object, containing an `authorizer` property and so on.

Alright, we're ready to go! You can run the following, and jest will retry the test each time you save a file:

```bash
$ yarn jest --watchAll
```

You should get a failing test 🔴this is a good thing. When testing, you always want your tests to fail up front, then succeed 🟢when you've written your code to conform to your test.

Not to mention the unparalleled satisfaction of seeing that green after a sea of red 😍

```js
 FAIL  ./client.test.js
  ● Test suite failed to run

    Cannot find module './mock-client' from 'client.test.js'

    > 1 | import { MockClient } from "./mock-client";
        | ^
      2 |
      3 | test("should set channel.membes.myID via proxy", () => {
      4 |   const client = new MockClient({
```

We'll get to creating `MockClient` shortly. Let's start building our implementation!

Let's start with a `MockChannel` class:

```js
// mock-channel.js
export class MockChannel {
  constructor(name) {
    this.name = name;
    this.members = {};
  }
}
```

Really simple - just stores its own name. Remember in our example up top, we want to be able to access `channel.members.myID` that is nowhere to be seen here. That's because we're going to use an ES6 proxy shortly to handle that. Hold tight.

Let's create our Pusher instance - this simulates the pusher server **in a very basic way**. It keeps track of channels.

```js
// mock-instance.js
import { MockChannel } from "./mock-channel";

class MockInstance {
  constructor() {
    this.channels = {};
  }

  channel(name) {
    // if the channel doesn't already exist, create one.
    if (!this.channels[name]) {
      this.channels[name] = new MockChannel(name);
    }

    // return the channel.
    return this.channels[name];
  }
}

// by exporting a new instance, it ensures other scripts
// always refer to the same instance of our class.
export const MockPusherInstance = new MockInstance();
```

Side note: [always name your exports](https://humanwhocodes.com/blog/2019/01/stop-using-default-exports-javascript-module/).

And finally a client to consume this instance:

```js
// mock-client.js
import { MockPusherInstance } from "./mock-instance";

export class MockClient {
  constructor(config) {
    this.config = config;
  }

  setID(id) {
    this.id = id;
  }

  subscribe(name) {
    this.config.authorizer().authorize(this.setID);
    return MockPusherInstance.channel(name);
  }
}
```

From this, we can start to see our API for initialising the mock pusher client. When we call subscribe on our client class, we know we need to pass in some config that includes an `authorizer` property. This needs to return an object with an `authorize` property where we pass it a callback of `this.SetID`, which will store the ID on the client instance.

Now, when you save it you'll the jest failure change:

```js
 FAIL  ./client.test.js
  ✕ should set channel.membes.myID via proxy (2ms)

  ● should set channel.membes.myID via proxy

    TypeError: Cannot set property 'id' of undefined

       7 |
       8 |   setID(id) {
    >  9 |     this.id = id;
         |     ^
      10 |   }
      11 |
      12 |   subscribe(name) {
```

Enter our first lesson about class method and binding `this` context. When inside a class, the `this` keyword points to the current instance. There's a whole 'nother pandora's box around how classes, functions, and arrow functions handle `this` which I won't go into here.

The problem we have though, is that our `setID` class method is creating its own `this` context that no longer refers to the class's `this`.

Easy fix. In your `MockClient` `constructor`, you can reassign properties with this bound to the methods:

```js
// mock-client.js
import { MockPusherInstance } from "./mock-instance";

export class MockClient {
  constructor(config) {
    ...
    this.setID = this.setID.bind(this)
    this.subscribe = this.subscribe.bind(this)
  }

  setID(id) {
    ...
  }

  subscribe(name) {
    ...
  }
}
```

Now, whenever you refer to `this` inside these methods, they will refer to the class rather than the methods themselves.

[You can use arrow functions](https://www.freecodecamp.org/news/learn-es6-the-dope-way-part-ii-arrow-functions-and-the-this-keyword-381ac7a32881/) as class properties to mitigate this, however, I think it's a great lesson in binding, which was a bit of secret sauce for me for a while.

If you save your code, your test will fail again with a new message:

```js
 FAIL  ./client.test.js
  ✕ should set channel.members.myID via proxy (1ms)

  ● should set channel.members.myID via proxy

    expect(received).toBe(expected) // Object.is equality

    Expected: "my-id"
    Received: undefined

      10 |   // here we assert that the channel has the property channel
      11 |   // equal to the channel we passed into the client
    > 12 |   expect(channel.members.myID).toBe("my-id");
         |                                ^
      13 | });
```

We're getting so close now. Remember, we multiple clients to refer to the same channel, however, fill out properties respective to the client. This is where proxies come in handy.

## Proxies

The long and short of proxies is that you transparently ['trap' methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) on functions, classes, objects - really anything in JS. Here's a trivial example where we intercept the `set` method of an object to enforce validation.

Let's say we want to ensure that `person.email` includes an `@`. If not, it should throw an error.

```js
const person = {
  age: 27
};

const proxiedPerson = new Proxy(person, {
  get(originalPerson, key) {
    switch (key) {
      case "personality":
        return "Out of this world!";
      default:
        return (originalPerson[key] = value);
    }
  }
});

person.personality; // undefined
proxiedPerson.personality; // "Out of this world!"
proxiedPerson.age; // 27
```

Understanding this, we can see how if we proxy a channel, we can intercept the `channel.members.myID` to return our own ID for each individual client. Let's create a function that takes the channel and client, and proxies this value out:

```js
// proxyMockChannel.js
export const proxyMockChannel = (channel, client) =>
  new Proxy(channel, {
    get(target, key) {
      switch (key) {
        // intercept the "members" getter
        case "members":
          return {
            ...target.members,
            myID: client.id
          };
        // otherwise just return the normal value
        default:
          return target[key];
      }
    }
  });
```

Now whenever a client subscribes to a channel, we want to wrap the returned channel in this proxy:

```js
// mock-client.js
import { MockPusherInstance } from "./mock-instance";
import { proxyMockChannel } from './proxyMockChannel';

export class MockClient {
  ...
  subscribe(name) {
    this.config.authorizer().authorize(this.setID);
    //
    return proxyMockChannel(
      MockPusherInstance.channel(name),
      // we're passing in `this` (referring to the class) as the client
      this
    );
  }
}
```

Save your file and... BAM! SWEET SWEET GREEN 🟢🟢🟢!

```js
 PASS  ./client.test.js
  ✓ should set channel.members.myID via proxy

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.268s, estimated 1s
Ran all test suites related to changed files.

Watch Usage: Press w to show more.
```

## So, what did you learn?

We've learnt several cool things here:

- The importance of binding class methods in the constructor
- Using proxies to pass through to a reference while augmenting their accessors

## Homework

If you want to take this further, I suggest figuring out how you can;

- `unsubscribe` from channels
- `bind` and `unbind` callbacks to events on channels (hint: `channel.callbacks`)

Feel free to let me know if you have any questions!
