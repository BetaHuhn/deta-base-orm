import * as DetaOrm from '../src/index'

const run = async () => {

	// ✨ Define a schema for the kittens
	type KittenSchema = {
		name: string,
		cuteness: number
	}

	// 🛌 Create our Kitten base
	const Kitten = new DetaOrm.Base<KittenSchema>('Kitten')

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
}

run()