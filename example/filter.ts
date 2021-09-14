import * as DetaOrm from '../src/index' // import * as DetaOrm from 'deta-base-orm'

const run = async () => {

	// ✨ Define a schema for the kittens
	type KittenSchema = {
		name: string,
		cuteness?: number
	}

	const schema = new DetaOrm.Schema<KittenSchema>({
		name: 'string',
		cuteness: {
			type: 'number',
			default: 0
		}
	})

	// 🛌 Create our Kitten base
	const Kitten = new DetaOrm.Base('Kitten', schema)

	// 🐱 Create a new kitten
	const line = await Kitten.save({
		name: 'Line',
		cuteness: 8
	})
	console.log(line)

	// 🔍 Filter kittens by their name
	const withE = await Kitten.find({
		name: {
			$con: 'e' // All kittens with the letter e in their name
		}
	})
	console.log(withE) // [{name: 'Line', cuteness: 8}]

	// 🧵 Filter kittens by their cuteness
	const higherThan5 = await Kitten.find({
		cuteness: {
			$gt: 5 // All kittens with a cuteness greater than 5
		}
	})
	console.log(higherThan5) // [{name: 'Line', cuteness: 8}]
}

run()