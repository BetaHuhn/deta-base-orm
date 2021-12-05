<div align="center">
  
# Deta Base ORM

[![Node CI](https://github.com/BetaHuhn/deta-base-orm/workflows/Node%20CI/badge.svg)](https://github.com/BetaHuhn/deta-base-orm/actions?query=workflow%3A%22Node+CI%22) [![Release CI](https://github.com/BetaHuhn/deta-base-orm/workflows/Release%20CI/badge.svg)](https://github.com/BetaHuhn/deta-base-orm/actions?query=workflow%3A%22Release+CI%22) [![GitHub](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/BetaHuhn/deta-base-orm/blob/master/LICENSE) ![David](https://img.shields.io/david/betahuhn/deta-base-orm)

Basic ORM for Deta Base

</div>

---

**🚧 Under development 🚧**

This project is under heavy development and not yet suitable for production use!

---

## 👋 Introduction

Deta Base ORM is a JavaScript/TypeScript library which lets your work with [Deta Base](https://docs.deta.sh/docs/base/about) in a object relational model. Define a schema for your Base, cross reference items between Bases and interact with your data in a more functional way. It is heavily inspired by [mongoose](https://mongoosejs.com/docs/index.html) and helps you write high quality, maintainable applications in a more productive way then with the standard [Deta Base SDK](https://docs.deta.sh/docs/base/sdk/) (it uses it under the hood). Additionally it features a offline mode which mocks the remote Deta Base and replaces it with a local JSON file for better access during development.

## 🚀 Get started

*First be sure you have Node and NPM installed.*

Next install Deta Base ORM from the command line:

```shell
npm install deta-base-orm --save
```

Then import it into your project:

```ts
import * as DetaOrm from 'deta-base-orm'
```

### Example

Here's a quick example to help you get started!

Imagine we like kittens and want to record every kitten we ever meet in Deta Base: 

```ts
import * as DetaOrm from 'deta-base-orm'

// ✨ Define a schema for the kittens
const KittenSchema = new DetaOrm.Schema({
    name: 'string',
    cuteness: 'number'
})

// 🛌 Create our Kitten base
const Kitten = new DetaOrm.Base('Kitten', KittenSchema)

// 🐱 Create a new kitten
const line = Kitten.create({
    name: 'Line',
    cuteness: 8
})

// 🔖 Access the kittens name
console.log(line.name) // 'Line'

// 💾 Save our kitten to the Deta Base
await line.save()

// 🔍 Find all kittens
const kittens = await Kitten.find()
console.log(kittens) // [{name: 'Line', cuteness: 8}, ...]

// 🔑 Find a kitten by its key
const sameKitten = await Kitten.findByKey(line.key)
console.log(sameKitten) // {name: 'Line', cuteness: 8}

// 🧵 Find a kitten by its cuteness
const cutest = await Kitten.find({ cuteness: 8 })
console.log(cutest) // [{name: 'Line', cuteness: 8}]

// 💘 Delete a kitten
await sameKitten.delete()
```

</details>

Pretty cool right? Congratulations, you now know how almost everything works! 🎉

See below for a more detailed guide.

## 📚 Usage

*Deta Base ORM is a pure ESM package. If you're having trouble importing it in your project, please [read this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).*

### Defining a schema

Before you can properly use the other methods you need to define a schema for your Base. It specifies what values to expect and in what format. You can set a property to required (`false` by default) or specify a default value:

```ts
const schema = new DetaOrm.Schema({
    name: 'string',
    age: {
        type: 'number',
        required: true
    },
    hungry: {
        type: 'boolean',
        default: false
    }
})
```

### Creating a Base

Creating a new Base is similar to how you would do it with the regular [Deta Base SDK](https://docs.deta.sh/docs/base/sdk) except that it also accepts a schema. The schema can either be a instance of the Schema class or an object defining a schema (like above):

```ts
const Base = new DetaOrm.Base('name', schema, options)
```

### Creating a new document

Creating a new document/item in your Base is very easy. Just call the `.create()` method of your Base instance and pass it some new data. Make sure the data matches your schema, else it will throw and error telling you what's wrong.

```ts
const document = Base.create({
    name: 'Maxi',
    age: 5,
    hungry: true
})
```

> Creating a document doesn't save it to Deta Base automatically. It only exists locally until you call `.save()`

### Saving a document

To save a document to your Deta Base, call `.save()`:

```ts
await document.save()
```

You can also create and save a document in one go by calling `.save()` on your Base instance instead of `.create()`:

```ts
const document = await Base.save({
    name: 'Maxi',
    age: 5,
    hungry: true
})
```

### Retrieving documents

There are multiple ways to retrieve documents from your Base:

### Multiple documents

```ts
const documents = await Base.find(query)
```

The query should be a JavaScript object specifing attributes to filter for defined in the schema. See [Filtering](#Filtering) below.

### Retrieving a single document

```ts
const document = await Base.findOne(query)
```

The query should be a JavaScript object specifing attributes to filter for defined in the schema. See [Filtering](#Filtering) below.

### Updating a document

```ts
await document.update(changes)
```

The changes should be a JavaScript object defining the changes.

### Deleting a document

```ts
await document.delete()
```

### Cross referencing

You can cross reference documents from one Base to another:

```js
// 🏃‍♂️ Declare Base for humans
const Human = new DetaOrm.Base('Human', {
    name: 'string'
})

// 🛌 Declare Base for kittens
const Kitten = new DetaOrm.Base('Kitten', {
    name: 'string',
    owner: Human
})

// 👶 Create new human
const human = await Human.save({
    name: 'Maxi'
})

// 🐱 Create new kitten
const cat = await Kitten.save({
    name: 'Line',
    owner: human.key // Reference id of human
})

console.log(cat) // => { name: 'Line', owner: '17be07f6ee7zNXWw' }

// ✨ Replace id of the owner with actual data from another Base
await cat.populate('owner')

console.log(cat) // => { name: 'Line', owner: { name: 'Maxi' } }
```

`.populate()` takes a path to a field in your schema and returns a document matching the value of that path from another Base. It only stores the key of the document in the Base, the acutal data is resolved from the other Base. For this to work you need to define the other Base in your schema:

```js
const Human = new DetaOrm.Base('Human', {
    name: 'string'
})

const Kitten = new DetaOrm.Base('Kitten', {
    name: 'string',
    owner: Human, // This tells the library that this path is a cross reference to another Base

    // Does the same as above
    owner: {
        type: 'base',
        base: Human
    }
})
```

### Filtering

When getting a document from a base with `.find()` and `.findOne()` you can specify a query object or list of queries to filter the documents with. In the object you can select paths from your schema and define filters and queries to match it against:

```js
const Kitten = new DetaOrm.Base('Kitten', {
    name: 'string',
    cuteness: 'number'
})

const garfield = await Kitten.findOne({
    name: 'Garfield' // Name equals value
})

const cutest = await Kitten.find({
    name: {
        $con: 'e' // All kittens with the letter e in their name
    },
    cuteness: {
        $gt: 8 // All kittens with a cuteness greater than 8
    }
})
```

This library supports all of Deta Bases [queries](https://docs.deta.sh/docs/base/sdk#queries):

| Name                  | Property | Description                                      |
|-----------------------|----------|--------------------------------------------------|
| Equal                 | $eq      | Equal to value                                   |
| Not Equal             | $ne      | Not equal to value                               |
| Less Than             | $lt      | Less than number                                 |
| Greater Than          | $gt      | Greater than number                              |
| Less Than Or Equal    | $lte     | Less than or equal to number                     |
| Greater Than Or Equal | $gte     | Greater than or equal to number                  |
| Prefix                | $pfx     | Prefix of value                                  |
| Range                 | $rg      | Range of numbers i.e. [22,30]                    |
| Contains              | $con     | String contains substring or array contains item |
| Not Contains          | $ncon    | Opposite of contains                             |

They can be combined together in one query or used in different queries. All queries in an object are interpreted as `AND`:

```js
await Base.find({
    name: {
        $con: 'repo',
        $pfx: 'gh'
    }
})
```

> Here: name starts with the prefix `gh` AND contains the substring `repo`

Queries in separate objects are treated as `OR`:

```js
await Base.find([
    {
        name: 'Hello'
    },
    {
        cuteness: {
            $gt: 8
        }
    }
])
```

> Here: The name must be `Hello` OR the cuteness greater than `8`

### Paging

Deta Base ORM supports the same paging as the normal Base SDK. Just specify a limit and optionally the key of the last item as parameters: `.find(query, limit, last)`

Example:

```js
const items = await Base.find({ age: 24 }, 5) // Limit number of items to 5

const nextFive = await Base.find({ age: 24 }, 5, last: items[4].key) // Use the key of the last item
```

### Offline Mode

You can optionally enable the offline mode which uses locally stored JSON files instead of the live remote Deta Base service. This is very helpful during development as it allows you to run your queries against a test database and then use the live one in production. And of course, it works offline so you can develop your application with all of the benefits of Base without internet access.

```ts
const OfflineBase = new DetaOrm.Base('name', schema, {
    offline: true
})
```

> It will store the JSON files in a `.deta-base-orm` folder by default

## ⚙️ Options

You can optionally pass a options object to the the Base contructor:

```ts
const options = { /* optional */ }
const Base = new DetaOrm.Base(name, schema, options)
```

Here are all the available options:

### Key generation

By default this library will generate random keys which are in an ascending order, meaning that new documents will always be at the bottom. You can change this by setting `descending` to true. New documents will then be at the top of your Base.

In ascending mode it will use the Unix timestamp and in descending order `maxDateNowValue (8.64e15) - Unix timestamp` to make sure the key is sequential. The key will be appended with a random id to make sure two documents created at the same time do not have the same key. The final key will consist of the sequential timestamp in hex plus a 5 char random id.

> Because the timestamp is in ms, the key is only sequential until a certain point i.e two keys generated in the same ms may not be in the right order

### Offline Mode

Set `offline` to true to enable the offline mode. In offline mode it will use a locally stored JSON files instead of the live remote Deta Base service.

The JSON files will by default be stored in a `.deta-base-orm` directory but this can be changed with the `storagePath` option. For each Base you create, a JSON file with the same name will be created in that folder. E.g the data for a Base with the name Kittens will be stored in `Kittens.json`.

**Important Note:** The offline mode is currently still in development and doesn't yet support everything that is available with the normal Base service. Here are all the things that are missing/don't fully work yet:

- Advanced [query operators](#filtering): The query currently only supports direct matching of values i.e. `{ name: 'Maxi', age: 18 }`
- Limits/paging: Currently all items are returned that match the query
- Cross referencing: Running `.populate()` to cross reference items across Bases doesn't work and returns an error

### Timestamp

This library can optionally add a `createdAt` field to each new document containing the timestamp of when it was created. To enabled this, set `timestamp` to true.

### Custom Base

If you already have a Deta Base instance you can pass it to Deta Base ORM as the `db` option to reuse it:

```ts
const deta = Deta()
const db = deta.Base(name)

const Base = new DetaOrm.Base(name, schema, { db })
```

## 💡 Planned features/To Do

- Add custom methods/actions to the Base
- Make populate work offline
- Add populate as chained command to `find()`
- Populate multiple paths at once
- Fix ESM issues

## 💻 Development

- run `yarn lint` or `npm run lint` to run eslint.
- run `yarn watch` or `npm run watch` to watch for changes.
- run `yarn build` or `npm run build` to produce a compiled version in the `lib` folder.

## ❔ About

This project was developed by me ([@betahuhn](https://github.com/BetaHuhn)) in my free time. If you want to support me:

[![Donate via PayPal](https://img.shields.io/badge/paypal-donate-009cde.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=394RTSBEEEFEE)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F1F81S2RK)

## 📄 License

Copyright 2021 Maximilian Schiller

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
