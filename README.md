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

Deta Base ORM is a JavaScript/TypeScript library which lets your work with [Deta Base](https://docs.deta.sh/docs/base/about) in a object relational model. It lets you define a schema for your bases and interact with your data in a more functional way. It is heavily inspired by [mongoose](https://mongoosejs.com/docs/index.html) and helps you write high quality, maintainable applications in a more productive way then with the standard [Deta Base SDK](https://docs.deta.sh/docs/base/sdk/) (it uses it under the hood).

## 🚀 Get started

*First be sure you have Node and NPM installed.*

Next install Deta Base ORM from the command line:

```shell
npm install deta-base-orm --save
```

Now say we like kittens and want to record every kitten we ever meet in [Deta Base](https://docs.deta.sh/docs/base/about). The first thing we need to do is include Deta Base ORM in our project:

```ts
import * as DetaOrm from 'deta-base-orm'
```

Then let's define a schema for our kittens:

```ts
type KittenSchema = {
    name: string,
    cuteness: number
}
```

> Defining a schema only works in TypeScript and it is not validated during the runtime

So far so good. We've got a schema with the properties, name, which will be a string and cuteness which will be a number. The next step is creating our Base:

```ts
const Kitten = new DetaOrm.Base<KittenSchema>('Kitten')
```

A base is a class with which we construct documents. In this case, each document will be a kitten with properties and behaviors as declared in our schema. Let's create a kitten document representing the little guy we just met on the sidewalk outside:

```ts
const line = Kitten.create({
    name: 'Line',
    cuteness: 8
})

console.log(line.name) // 'Line'
```

Sweet, but we haven't actually saved anything yet! Each document can be saved to the database by calling its save method:

```ts
await line.save()
```

Say time goes by and we want to display all the kittens we've seen. We can access all of the kitten documents through our Kitten Base:

```ts
const kittens = await Kitten.find()
console.log(kittens) // [{name: 'Line', cuteness: 8}, ...]
```

If we want to filter our kittens by cuteness, we can specify a query:

```ts
const cutest = await Kitten.find({ cuteness: 8 })
console.log(cutest) // [{name: 'Line', cuteness: 8}]
```

<details>
<summary>Here's the complete example.</summary>

```ts
import * as DetaOrm from 'deta-base-orm'

type KittenSchema = {
    name: string,
    cuteness: number
}

const Kitten = new DetaOrm.Base<KittenSchema>('Kitten')

const line = Kitten.create({
    name: 'Line',
    cuteness: 8
})

console.log(line.name) // 'Line'

await line.save()

const kittens = await Kitten.find()
console.log(kittens) // [{name: 'Line', cuteness: 8}, ...]

const cutest = await Kitten.find({ cuteness: 8 })
console.log(cutest) // [{name: 'Line', cuteness: 8}]
```

</details>

Pretty cool right? Congratulations, you now know how almost everything works! 🎉

## 📚 Usage

### Defining a schema

```ts
type KittenSchema = {
    name: string
    age: number
    hungry: boolean
    friends: Array<string>
}
```

### Creating a Base

```ts
const Base = new DetaOrm.Base<Schema>('name')
```

### Creating a new document

```ts
const document = Base.create({
    name: 'Maxi',
    age: 5,
    hungry: true,
    friends: ['Richard']
})
```

### Saving a document

```ts
await document.save()
```

You can also create and save a document in one go:

```ts
const document = Base.save({
    name: 'Maxi',
    age: 5,
    hungry: true,
    friends: ['Richard']
})
```

### Retrieving documents

```ts
const documents = Base.find(query)
```

The query should be a JavaScript object specifing attributes to filter for defined in the schema.

### Retrieving a single document

```ts
const document = Base.findOne(query)
```

The query should be a JavaScript object specifing attributes to filter for defined in the schema.

### Updating a document

```ts
await document.update(changes)
```

The changes should be a JavaScript object defining the changes.

### Deleting a document

```ts
await document.delete()
```

## ⚙️ Options

Here are all the available options:

### Custom Base

If you already have a Deta Base instance you can pass it to Deta Base ORM to reuse:

```ts
const deta = Deta()
const db = deta.Base(name)

const Base = new DetaOrm.Base<Schema>(name, db)
```

## ✨ Planned features

- Reference other basis in your base and [populate](https://mongoosejs.com/docs/populate.html) it
- Sorting and [filtering](https://docs.deta.sh/docs/base/sdk#queries)
- Validating the schema at runtime
- Add custom methods/actions to the schema

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
